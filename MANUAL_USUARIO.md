# Manual de Usuario — Sistema de Certificados Vaxa

Bienvenido al **Sistema de Certificados Vaxa**, la plataforma con la que tu institución
gestiona programas, inscribe estudiantes, controla aprobaciones y emite **certificados
digitales verificables** con código único y código QR.

Este manual te explica, paso a paso, cómo funciona todo: desde los requisitos hasta la
emisión y validación de certificados.

---

## Índice

1. [Requisitos](#1-requisitos)
2. [Conceptos básicos](#2-conceptos-básicos)
3. [Acceso al sistema](#3-acceso-al-sistema)
4. [El panel de administración](#4-el-panel-de-administración)
5. [Programas y aulas](#5-programas-y-aulas)
6. [Inscripción de estudiantes](#6-inscripción-de-estudiantes)
7. [Aprobaciones (con y sin notas)](#7-aprobaciones-con-y-sin-notas)
8. [Diseño del certificado (Configuración)](#8-diseño-del-certificado-configuración)
9. [Emisión de certificados](#9-emisión-de-certificados)
10. [Validación pública de certificados](#10-validación-pública-de-certificados)
11. [Links para compartir](#11-links-para-compartir)
12. [Planes y facturación](#12-planes-y-facturación)
13. [Usuarios del sistema](#13-usuarios-del-sistema)
14. [Preguntas frecuentes](#14-preguntas-frecuentes)
15. [Soporte](#15-soporte)

---

## 1. Requisitos

Para usar el sistema solo necesitas:

- **Conexión a internet.**
- Un **navegador web moderno**: Google Chrome, Microsoft Edge, Firefox o Safari
  (de preferencia actualizado).
- Una **computadora, laptop, tablet o celular**. El sistema se adapta a la pantalla,
  aunque para el trabajo administrativo (emitir, configurar) se recomienda una laptop o PC.
- Tus **datos de acceso** (usuario o correo + contraseña), que te entrega Vaxa.
- La **dirección (URL) de tu institución**, que tiene esta forma:

  ```
  https://vaxasys.com/TU-EMPRESA/certificados
  ```

  Donde `TU-EMPRESA` es el identificador (slug) de tu institución. Por ejemplo, para la
  empresa "Cueto" sería `https://vaxasys.com/cueto/certificados`.

> **No necesitas instalar nada.** Todo funciona desde el navegador.

---

## 2. Conceptos básicos

Antes de empezar, conviene entender cómo se organiza la información:

- **Programa**: el curso, taller, diplomado o capacitación que certificas
  (ej. "Excel Avanzado", "Primeros Auxilios"). Define el nombre, el tipo, las horas
  académicas y la descripción.
- **Aula (grupo)**: una edición/horario concreto de un programa. Un mismo programa puede
  tener varias aulas (ej. "Turno noche - Lun/Mié/Vie"). Los estudiantes se inscriben a un aula.
- **Estudiante / Participante**: la persona que se inscribe y, al aprobar, recibe el certificado.
- **Inscripción**: el vínculo entre un estudiante y un aula, con un **estado**
  (Inscrito, En curso, Aprobado, Desaprobado, Retirado, Rechazado).
- **Certificado**: el documento PDF que se emite a un estudiante **Aprobado**. Lleva un
  **código único** y un **código QR** para verificar su autenticidad.
- **Plan**: tu suscripción mensual, que define cuántos certificados puedes emitir al mes
  (cupo) y el precio de los adicionales.

---

## 3. Acceso al sistema

El sistema tiene **dos caras**:

### 3.1. Cara pública (para tus estudiantes)
No requiere usuario ni contraseña:

- **Inscripción:** `https://vaxasys.com/TU-EMPRESA/certificados`
- **Validación de certificados:** `https://vaxasys.com/TU-EMPRESA/certificados/validar`

### 3.2. Cara administrativa (para tu institución)
Requiere iniciar sesión:

- **Login:** `https://vaxasys.com/TU-EMPRESA/certificados/login`

**Para iniciar sesión:**

1. Ingresa a la dirección de login de tu empresa.
2. Escribe tu **usuario o correo** (puedes acceder con cualquiera de los dos).
3. Escribe tu **contraseña**.
4. Pulsa **Ingresar**.

> 🔒 **Sesión única:** por seguridad, una misma cuenta no puede estar activa en dos
> dispositivos a la vez. Si inicias sesión en otro lado, la sesión anterior se cierra.

---

## 4. El panel de administración

Al iniciar sesión llegas al **Panel**. Desde el menú lateral accedes a:

| Sección | Para qué sirve |
|---|---|
| **Inicio (Dashboard)** | Resumen general: estudiantes, programas, certificados emitidos y tu consumo del mes. |
| **Programas** | Crear y administrar tus cursos, sus aulas y su evaluación. |
| **Estudiantes** | Ver y administrar las personas registradas. |
| **Inscripciones** | Ver inscritos por aula, cambiar estados y **aprobar**. |
| **Certificados** | Emitir, ver, descargar (incluido **ZIP**) y anular certificados. |
| **Plan** | Ver tu plan, tu cupo del mes y el consumo. |
| **Configuración** | Diseñar cómo se ve el certificado (logos, firmas, texto, plantilla). |

---

## 5. Programas y aulas

### 5.1. Crear un programa
1. Entra a **Programas → Nuevo programa**.
2. Completa: **nombre**, **tipo de programa**, **horas académicas** y **descripción**.
3. Guarda.

### 5.2. Crear aulas (horarios)
Dentro del detalle de un programa, en la pestaña **Aulas**:
1. Pulsa **Nueva aula**.
2. Define **modalidad**, **fechas de inicio y fin** y, si aplica, **días y horario**.
3. Guarda.

Cada aula es donde los estudiantes se inscriben. Desde la fila de cada aula puedes:
- Ver sus **Inscritos**.
- **Copiar el link de inscripción** directo a esa aula (ver [sección 11](#11-links-para-compartir)).

### 5.3. Evaluación (¿el programa lleva notas?)
En la pestaña **Evaluación** del programa defines si el curso se aprueba **por notas** o no:

- **Sin unidades de notas** → es un programa **por asistencia/finalización**: tú decides
  manualmente quién aprueba (ver [sección 7](#7-aprobaciones-con-y-sin-notas)).
- **Con unidades de notas** → defines las unidades y la nota mínima; la aprobación la
  calcula el sistema automáticamente según el promedio.

---

## 6. Inscripción de estudiantes

Hay dos formas de inscribir:

### 6.1. Que el estudiante se inscriba solo (recomendado)
Comparte el **link público de inscripción** de tu empresa o de un programa/aula
(ver [sección 11](#11-links-para-compartir)). El estudiante:
1. Elige el **programa** y el **horario (aula)**.
2. Ingresa su **documento** (DNI, CE, etc.). Si ya estuvo registrado antes, sus datos se
   autocompletan.
3. Completa sus datos (nombres, apellidos y, opcionalmente, correo y teléfono).
4. Envía el formulario. Queda **Inscrito**.

> Los nombres y apellidos se guardan con formato de "Título" (Primera Letra En Mayúscula)
> automáticamente, para que los certificados salgan prolijos.

### 6.2. Inscripción manual (desde el panel)
También puedes registrar estudiantes desde la sección de administración.

---

## 7. Aprobaciones (con y sin notas)

Para emitir un certificado, el estudiante debe estar en estado **Aprobado**.

Ve a **Inscripciones**, elige el aula y verás la lista de inscritos. Cada uno tiene un
selector de estado: *Inscrito, En curso, Aprobado, Desaprobado, Retirado, Rechazado*.

### 7.1. Programas SIN notas (por asistencia)
Son los cursos que se aprueban solo por completar/asistir.

- Puedes cambiar cada estudiante a **Aprobado** manualmente, **o**
- Usar el botón **"Aprobar todos"** (barra verde): marca como **Aprobados** de una sola vez
  a todos los que estén pendientes en lo que tengas filtrado (por aula o por búsqueda).
  Ideal para aprobar un grupo completo en segundos. ✅

### 7.2. Programas CON notas
- La aprobación **no es manual**: ve a la pestaña **Notas**, registra las notas por unidad
  de cada estudiante y el sistema calcula automáticamente quién queda **Aprobado** o
  **Desaprobado** según la nota mínima.
- En estos programas, el certificado incluye además un **acta de notas** como segunda página.

---

## 8. Diseño del certificado (Configuración)

En **Configuración** defines cómo se verá el certificado de cada programa:

- **Plantilla / fondo** del certificado.
- **Logos** (hasta tres, con su orden).
- **Firmas** (con nombre de la autoridad y cargo).
- **Texto personalizado** del cuerpo del certificado.
- **Variables insertables**: puedes insertar datos automáticos (nombre del participante,
  programa, horas, fechas, etc.) haciendo clic en el texto. Hay una **vista previa en vivo**
  para ver cómo va quedando.

> Puedes tener una configuración general por programa y, si lo necesitas, una específica
> por aula.

Todos los certificados incluyen, además, un **código QR** y un **código único** para su
verificación, y al pie la leyenda **"Certificado generado por Vaxa"**.

---

## 9. Emisión de certificados

Ve a la sección **Certificados**. Verás tres pestañas:

- **Pendientes:** estudiantes **Aprobados** que aún no tienen su certificado.
- **Emitidos:** certificados ya generados (válidos).
- **Anulados:** certificados anulados.

### 9.1. Vista previa antes de emitir
Antes de emitir, el sistema te muestra una **vista previa real** del certificado (cómo
saldrá con logos, firmas y diseño). La vista previa **no gasta cupo** y lleva una marca de
agua para que no se use como documento válido.

### 9.2. Emitir
- Puedes emitir **uno por uno**, **todo un grupo** o **una selección**.
- Al confirmar, se descuenta el cupo correspondiente de tu plan (ver [sección 12](#12-planes-y-facturación)).
- Cada certificado emitido queda disponible para **ver** y **descargar** en PDF.

### 9.3. Descargar en ZIP (varios a la vez)
En la pestaña **Emitidos**, filtra por **aula** o por **nombre/documento** y usa el botón
**ZIP (n)** para descargar de una sola vez **todos los certificados que tengas filtrados**.
El archivo se nombra según el filtro, para que lo reconozcas fácilmente.

### 9.4. Anular y eliminar
- **Anular:** invalida un certificado emitido (queda en "Anulados"). Un certificado anulado
  ya no figura como válido en la verificación pública.
- **Eliminar** (desde Anulados): borra el certificado por completo y **devuelve el cupo**.

---

## 10. Validación pública de certificados

Cualquier persona puede verificar la autenticidad de un certificado:

1. Escanea el **código QR** del certificado, **o**
2. Entra a `https://vaxasys.com/TU-EMPRESA/certificados/validar` e ingresa el **código único**.

El sistema mostrará los datos del certificado (participante, programa, horas, fechas,
estado y empresa emisora) si es auténtico.

> 🔐 **Seguridad por empresa:** la validación está **acotada a tu institución**. Un código
> emitido por tu empresa solo es válido en **tu** dirección de validación; no se puede
> verificar desde el portal de otra empresa. El QR de cada certificado ya apunta
> directamente a la dirección correcta.

---

## 11. Links para compartir

Para facilitar el envío a tus estudiantes, dentro del **detalle de cada programa** tienes
una sección **"Links para compartir"** con botones de **copiar**:

- **Link de inscripción del programa:** abre el formulario con ese programa ya elegido.
  ```
  https://vaxasys.com/TU-EMPRESA/certificados?programa=ID
  ```
- **Link de inscripción por aula:** desde la fila de cada aula, copia el link que abre la
  inscripción directamente a ese horario.
  ```
  https://vaxasys.com/TU-EMPRESA/certificados?grupo=ID
  ```
- **Link de validación:** para que tus egresados verifiquen su certificado.
  ```
  https://vaxasys.com/TU-EMPRESA/certificados/validar
  ```

Solo haz clic en **Copiar** y pégalo en WhatsApp, correo, tu web, etc.

---

## 12. Planes y facturación

Tu suscripción define un **cupo mensual** de certificados. Al superarlo, cada certificado
**adicional** se cobra aparte.

### 12.1. Planes disponibles

| Plan | Precio mensual | Cupo de certificados/mes | Adicional (c/u) |
|---|---|---|---|
| **Básico** | S/ 300 | 100 | S/ 3.00 |
| **Profesional** | S/ 480 | 300 | S/ 1.60 |
| **Avanzado** | S/ 750 | 600 | S/ 1.25 |
| **Corporativo / API** | S/ 1000 | A medida (ilimitado) | A convenir |

> 💡 **El precio del certificado adicional es proporcional al plan**: se calcula como
> *precio mensual ÷ cupo*. Por ejemplo, en el Básico: S/ 300 ÷ 100 = **S/ 3.00** por
> certificado adicional. Así, cada extra cuesta lo mismo por unidad que tu plan.

**Funciones por plan (referenciales):**
- **Básico:** funciones base (emisión, código único, validación pública, PDF).
- **Profesional:** lo anterior + verificación pública mejorada.
- **Avanzado:** lo anterior + **diseño personalizado**, **dominio/subdominio propio**,
  **carga masiva**, **API**, **métricas** y **auditoría**.
- **Corporativo / API:** todo incluido, cupo a medida y acceso por API.

### 12.2. Ciclos de pago (mensual, semestral, anual)

Puedes pagar por distintos ciclos y **ahorrar**:

| Ciclo | Pagas | Recibes | Ejemplo (Plan Básico) | Ahorro |
|---|---|---|---|---|
| **Mensual** | 1 mes | 1 mes | S/ 300 | — |
| **Semestral** | 5 meses | 6 meses | S/ 1 500 | S/ 300 (1 mes gratis) |
| **Anual** | 10 meses | 12 meses | S/ 3 000 | S/ 600 (2 meses gratis) |

El total es `precio mensual × meses que pagas`. Al registrar tu empresa, el sistema te
muestra el **total exacto según el plan y el ciclo** que elijas, junto con el ahorro.

### 12.3. Consumo del mes
En la sección **Plan** ves tu cupo, cuántos certificados llevas emitidos y cuántos
**excedentes** (adicionales) acumulas en el mes con su monto a cobrar.

> Si **eliminas** un certificado, el cupo se devuelve al mes.

---

## 13. Usuarios del sistema

Tu institución puede tener uno o varios usuarios operadores.

- Cada usuario ingresa con su **usuario o correo** y su contraseña.
- El acceso es **por empresa y por producto**: un usuario creado para tu certificado no
  puede entrar a otros sistemas.
- Rige la **sesión única**: una cuenta activa en un solo dispositivo a la vez.

> La creación y administración de usuarios la realiza Vaxa o el administrador habilitado.

---

## 14. Preguntas frecuentes

**¿Necesito instalar algo?**
No. Todo funciona desde el navegador.

**¿Puedo entrar con un nombre de usuario en vez de correo?**
Sí. El campo de acceso admite **usuario o correo**.

**Olvidé mi contraseña.**
Contacta a Vaxa para restablecerla.

**El estudiante no aparece para certificar.**
Verifica que su inscripción esté en estado **Aprobado**. Si el programa es por asistencia,
usa **"Aprobar todos"**.

**¿Un certificado de otra empresa se puede validar en mi portal?**
No. La validación está acotada a cada empresa por su identificador (slug).

**¿La vista previa gasta cupo?**
No. Solo la emisión real descuenta del cupo.

**¿Qué pasa si supero mi cupo mensual?**
Puedes seguir emitiendo; cada certificado adicional se cobra al precio proporcional de tu plan.

**¿Puedo descargar varios certificados juntos?**
Sí. En **Certificados → Emitidos**, filtra y usa el botón **ZIP**.

---

## 15. Soporte

Para soporte, cambios de plan, alta de usuarios o cualquier consulta, contacta a **Vaxa**:

- 📧 Correo: **vaxa.sac@gmail.com**
- 🌐 Web: **vaxasys.com**

---

*Sistema de Certificados — desarrollado y operado por **Vaxa**.*
