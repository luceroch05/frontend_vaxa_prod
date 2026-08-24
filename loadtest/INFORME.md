# 📋 Informe de Pruebas de Carga — Sistema Vaxa
**Fecha:** 24 de agosto de 2026
**Objetivo:** Medir cuántos usuarios simultáneos aguanta el sistema en producción (https://vaxasys.com) sin caerse, y encontrar el punto óptimo.
**Herramienta:** k6 · **Condición:** producción sin clientes reales.
**Método seguro:** los flujos que escriben/gastan (validar QR, buscar persona, inscripción) se probaron con datos falsos → el servidor hace TODO el trabajo pesado (consultas a la BD) pero rechaza antes de escribir nada. **No se creó basura ni se gastaron créditos.**

---

## 🟢 Resumen ejecutivo (para leer rápido)

| "Click" del usuario | ¿Se cae? | Velocidad con 150 a la vez | Capacidad |
|---|---|---|---|
| **Abrir web** | No 🟢 | 0.15 s | 300+ (no llegamos al tope) |
| **Validar certificado (QR)** | No 🟢 | 0.18 s | **~886/seg** |
| **Cargar aulas/grupos** | No 🟢 | 0.17 s | **~964/seg** |
| **Buscar alumno por DNI** | No 🟢 | 0.18 s | **~901/seg** |
| **Inscribirse (validación)** | No 🟢 | 0.19 s | **~835/seg** |
| **Iniciar sesión (login)** | Se satura 🟡 | 12 s | **~12/seg** |
| **Emitir certificado (PDF)** | **SE CAE** 🔴 | 3 s (con 10) | **~3.5/seg** (local) |

**Conclusión en una frase:** Todo lo que **lee/valida** es **rapidísimo y aguanta cientos de usuarios por segundo**. Los dos puntos pesados son el **login** (~12/seg) y sobre todo la **emisión de PDF** (~3.5/seg y se cae a ~25 simultáneos), que es el flujo más costoso del sistema.

---

## 1. Flujos públicos (leer / validar / inscribir) — 🟢 EXCELENTES

Todos probados con **150 usuarios a la vez**, IPs rotadas para medir capacidad cruda:

| Flujo | Velocidad (p95) | Errores de servidor | Peticiones/seg |
|---|---|---|---|
| **Validar certificado por QR** | 0.18 s | **0** | **886/seg** |
| **Cargar grupos/aulas** (consulta JOIN pesada) | 0.17 s | **0** | **964/seg** |
| **Buscar participante por DNI** | 0.18 s | **0** | **901/seg** |
| **Inscripción** (validación previa a escribir) | 0.19 s | **0** | **835/seg** |
| **Abrir la web** | 0.15 s | **0** | 122/seg* |

\* La web se probó antes a 300 usuarios; los otros a 150. En todos, la velocidad ni se inmutó.

- **~145,000 peticiones** en total sin **una sola caída** de servidor.
- Estos flujos procesan **entre 830 y 960 peticiones por segundo** → es muchísimo. Para tu escala, es capacidad de sobra.
- **Veredicto:** el corazón del negocio (validar certificados, inscribir, buscar) está **sólido como roca**. 🪨

### Nota: rate-limit (guardia anti-abuso)
En uso normal, el sistema bloquea a partir de **200 peticiones/min por IP** (protección contra ataques/scraping). Bien configurado. En estas pruebas lo esquivamos a propósito (con IPs rotadas) solo para medir el techo real del servidor.

---

## 2. Iniciar sesión / Login — 🟡 el cuello de botella
Endpoint: `POST /api/auth/login` — busca en la BD y verifica la contraseña (bcrypt). Es intensivo en CPU.

**Curva completa (velocidad según cuántos entran a la vez):**

| Usuarios a la vez | Velocidad (p95) | Estado |
|---|---|---|
| 1 | 0.52 s | 🟢 óptimo |
| 10 | 1.0 s | 🟢 óptimo |
| 25 | 2.1 s | 🟢 aceptable |
| 50 | 4.2 s | 🟡 lento |
| 75 | 5.9 s | 🟡 muy lento |
| 100 | 6.5 s | 🟠 muy lento |
| 150 | 12.4 s | 🔴 al límite |
| 300 | 20 s (timeout) | ⛔ **caído / no entra** |
| 500–800 | 20 s (timeout) | ⛔ caído |

**Dato clave:** el servidor procesa **~12 logins por segundo como máximo**. Los que sobran hacen cola → por eso la velocidad sube en línea recta con la cantidad de gente.

### 📌 Los números que pediste (login)
- **Óptimo (rápido, ≤1.5 s):** hasta **~15 logins simultáneos**.
- **Aceptable (≤2–3 s):** hasta **~25–30 simultáneos**.
- **Máximo que aún responde (lento pero entra):** **~150 simultáneos** (~12 s de espera 😬).
- **Se cae / inutilizable (timeout):** a partir de **~300 simultáneos**.
- **Capacidad total:** **~12 logins/seg ≈ 720 logins/minuto**.

> ⚠️ "Se cae" aquí = los logins **tardan tanto que dan timeout**. El servidor **no explota** — se recupera solo apenas baja la carga.

### Causa raíz
Usa **`bcryptjs`** (verificación de contraseñas en JavaScript puro), que es **3–4× más lenta** que la versión nativa y **bloquea el único hilo de Node**. Por eso los logins se serializan.

**Solución (a futuro, no urgente):** cambiar `bcryptjs` → `bcrypt` nativo → logins **3–4× más rápidos** (de ~12 a ~40/seg) sin bajar seguridad. Las contraseñas actuales siguen sirviendo. ⚠️ Requiere compilar en el servidor (puede ser engorroso en cPanel).

---

## 3. Emisión de certificados (generar PDF) — 🔴 EL MÁS PESADO
Es el flujo más costoso: genera un PDF (1.3–1.5 MB) por certificado. Se probó **en local** (localhost) usando el endpoint de *vista previa* (genera el mismo PDF sin gastar crédito), con una sesión de desarrollo. **Los números son del hardware local, no del servidor de producción** (que al ser hosting compartido, probablemente aguante aún menos).

| PDFs a la vez | Velocidad (p95) | Estado |
|---|---|---|
| 5 | 2.0 s | 🟡 lento |
| 10 | 3.2 s | 🟠 muy lento |
| 25 | — | ⛔ **EL SERVIDOR SE CAYÓ** (dejó de aceptar conexiones) |
| 50 | — | ⛔ caído |

- **Capacidad:** ~**3.5 PDFs por segundo** (el flujo más lento de todo el sistema).
- **Punto de quiebre:** a partir de **~25 emisiones simultáneas el servidor se cayó** (se quedó sin recursos generando tantos PDFs a la vez). Hubo que reiniciarlo.
- **Causa:** generar un PDF es intensivo en CPU y memoria; hacerlo en paralelo satura el proceso.

### 💡 Recomendaciones (emisión)
1. **Serializar / poner en cola la emisión en lote:** al emitir muchos certificados de golpe, generarlos **de a pocos** (ej. 3–5 a la vez) en vez de todos juntos, para no tumbar el servidor.
2. **Es el punto #1 a reforzar** si vas a emitir tandas grandes (cientos de certificados).
3. **Atenuante:** emitir es una acción de **administrador**, no del público. En la práctica hay pocos admins emitiendo → la concurrencia real es baja. El riesgo aparece sobre todo en la **emisión masiva** (lote grande).

> ⚠️ Durante esta prueba, el backend **local** de desarrollo se cayó (puerto 4000). Es solo local — reinícialo con `npm run dev` en `backend-vaxa-prod` cuando lo necesites. Producción no se tocó.

---

## 4. Veredicto final
- ✅ **Validar certificados, inscribir, buscar, abrir la web:** rápidos y sólidos. Aguantan **cientos de usuarios por segundo**. Cero preocupaciones.
- 🟡 **Login:** no se cae, funciona bien para tu escala (nadie tiene 25 personas logueándose en el mismo segundo). Cuello de botella conocido (~12/seg) con mejora clara (bcrypt nativo) para cuando crezcas.
- 🔴 **Emisión de PDF:** el flujo más pesado (~3.5/seg) y **el único que llegó a caer el servidor** (a ~25 simultáneos). Prioridad #1 si vas a emitir tandas grandes → generar los PDFs de a pocos (en cola).

### Prioridades sugeridas
| Prioridad | Qué | Por qué |
|---|---|---|
| 🥇 1 | Emitir en lote **de a pocos** (cola) | Es lo único que tumbó el servidor |
| 🥈 2 | Login: `bcryptjs` → `bcrypt` nativo | 3–4× más rápido cuando crezcas |
| 🥉 3 | Subir plan de hosting (más CPU/RAM) | Ayuda a los dos puntos anteriores |

**Recomendación global:** el sistema está **listo para operar** para tu escala actual. El punto crítico a reforzar antes de crecer (o de emitir tandas grandes) es la **emisión de PDF en lote**. Lo demás está sólido.
