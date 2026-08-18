/* ────────────────────────────────────────────────────────────────
 * Modo "Diseño Personalizado (Lienzo)" — tipos y utilidades (frontend).
 *
 * Aislado del resto del módulo de certificaciones. Describe el layout a
 * medida (fondo del cliente + campos dinámicos por coordenadas) que se
 * guarda como JSON en la config. Espejo de la forma que dibuja el backend
 * (personalizado/lienzo.service.ts). Coordenadas en el viewport 1122×794.
 * ──────────────────────────────────────────────────────────────── */

export interface CampoTexto {
  on?:        boolean;
  /** Nombre visible del campo en el editor (ej. "Nombre del participante"). */
  label?:     string;
  /** Plantilla con variables: {nombre} {programa} {fecha} {horas} {creditos} {codigo}… */
  text?:      string;
  x?:         number;   // px (borde izquierdo de la caja)
  y?:         number;   // px (borde superior)
  w?:         number;   // px (ancho de la caja; el align actúa dentro)
  size?:      number;   // px
  color?:     string;   // #hex
  align?:     'left' | 'center' | 'right';
  bold?:      boolean;
  italic?:    boolean;
  uppercase?: boolean;
  /** Familia tipográfica. Default 'sans'. 'bebas'=Bebas Neue (títulos MAYÚS),
   *  'barlow'=Barlow Condensed, 'poppins'=Poppins (moderna), 'vibes'=Great Vibes
   *  (manuscrita), 'cardo'=Cardo (serif formal), 'lobster'=Lobster (script títulos). */
  font?:      'sans' | 'serif' | 'bebas' | 'barlow' | 'poppins' | 'vibes' | 'cardo' | 'lobster'
            | 'pacifico' | 'sacramento' | 'allura' | 'alexbrush' | 'tangerine' | 'parisienne'
            | 'cinzel' | 'abril' | 'crimson';
  /** Peso Montserrat/Barlow: 400/500/600/700/800. Si no, usa bold?700:400. */
  weight?:    400 | 500 | 600 | 700 | 800;
  /** Espaciado entre letras en px (para el look "alargado"). */
  tracking?:  number;
  /** Si true, el tamaño se ENCOGE solo para que el texto entre en una línea dentro de `w`. */
  autoFit?:   boolean;
}

/** Familia CSS para la vista previa según el `font` del campo.
 *  'sans'=Montserrat, 'serif'=Times/Georgia, 'bebas'=Bebas Neue, 'barlow'=Barlow Condensed,
 *  'poppins'=Poppins, 'vibes'=Great Vibes, 'cardo'=Cardo, 'lobster'=Lobster. */
export function fontFamilyCss(font?: string): string {
  if (font === 'serif')      return 'Georgia, "Times New Roman", serif';
  if (font === 'bebas')      return "'Bebas Neue', 'Montserrat', sans-serif";
  if (font === 'barlow')     return "'Barlow Condensed', 'Oswald', 'Montserrat', sans-serif";
  if (font === 'poppins')    return "'Poppins', 'Montserrat', Helvetica, Arial, sans-serif";
  if (font === 'vibes')      return "'Great Vibes', 'Segoe Script', cursive";
  if (font === 'cardo')      return "'Cardo', Georgia, 'Times New Roman', serif";
  if (font === 'lobster')    return "'Lobster', 'Segoe Script', cursive";
  if (font === 'pacifico')   return "'Pacifico', 'Segoe Script', cursive";
  if (font === 'sacramento') return "'Sacramento', 'Segoe Script', cursive";
  if (font === 'allura')     return "'Allura', 'Segoe Script', cursive";
  if (font === 'alexbrush')  return "'Alex Brush', 'Segoe Script', cursive";
  if (font === 'tangerine')  return "'Tangerine', 'Segoe Script', cursive";
  if (font === 'parisienne') return "'Parisienne', 'Segoe Script', cursive";
  if (font === 'cinzel')     return "'Cinzel Decorative', Georgia, serif";
  if (font === 'abril')      return "'Abril Fatface', Georgia, serif";
  if (font === 'crimson')    return "'Crimson Text', Georgia, 'Times New Roman', serif";
  return "'Montserrat', Helvetica, Arial, sans-serif";
}

export interface CampoQR {
  on?:         boolean;
  x?:          number;  // px
  y?:          number;  // px
  size?:       number;  // px (lado)
  showCodigo?: boolean;
}

/** Slot de logo: la imagen sale de los logos seleccionados en la config (por orden).
 *  logo1→1er logo, logo2→2do, logo3→3ro. Caja cuadrada, imagen "contain". */
export interface CampoLogo {
  on?:   boolean;
  x?:    number;  // px
  y?:    number;  // px
  size?: number;  // px (lado de la caja)
}

/** Slot de firma: jala la firma seleccionada (firma1→1ª, firma2→2ª) y dibuja el
 *  bloque completo = imagen del garabato + nombre + cargo (los datos salen de la
 *  sección Firmas; acá solo se posiciona). */
export interface CampoFirma {
  on?: boolean;
  x?:  number;  // px (izquierda del bloque)
  y?:  number;  // px (arriba)
  w?:  number;  // px (ancho del bloque; el nombre/cargo se centran en él)
  h?:  number;  // px (alto de la imagen de la firma; debajo van nombre y cargo)
}

/** Línea decorativa horizontal (ej. el subrayado de "PARTICIPANTE"). */
export interface CampoLinea {
  on?:        boolean;
  x?:         number;  // px (inicio)
  y?:         number;  // px
  w?:         number;  // px (largo)
  thickness?: number;  // px (grosor)
  color?:     string;  // #hex
  /** Si apunta a la clave de un campo de texto, la línea toma el ANCHO y el centro
   *  horizontal de ese texto (subrayado que se adapta a "nombre", "calidad"…). Se
   *  ignoran x/w cuando está puesto. */
  sigueA?:    string;
}

export interface LayoutLienzo {
  activo?: boolean;
  campos?: Record<string, CampoTexto | CampoQR | CampoLogo | CampoFirma | CampoLinea>;
}

/** Tipo de un campo según su clave. */
export function tipoCampo(key: string): 'texto' | 'qr' | 'logo' | 'firma' | 'linea' {
  if (key === 'qr') return 'qr';
  if (/^logo\d+$/i.test(key))  return 'logo';
  if (/^firma\d+$/i.test(key)) return 'firma';   // firma1/firma2 (con dígito) = imagen; firmaIzq/firmaDer = texto
  if (/^linea/i.test(key))     return 'linea';   // linea1, linea_xxx…
  return 'texto';
}

/** Índice (0-based) del logo/firma seleccionado que usa un slot 'logoN'/'firmaN'. */
export function indiceLogo(key: string): number {
  return Math.max(0, Number(key.replace(/\D/g, '')) - 1);
}
export const indiceFirma = indiceLogo;

/** Clave del slot de logo para un índice 0-based (0 → 'logo1'). */
export function logoKey(index: number): string { return `logo${index + 1}`; }

/**
 * Asegura que el logo OBLIGATORIO de la empresa (el que Vaxa sube en sistemas-vaxa,
 * es_default) tenga SIEMPRE su slot en el lienzo y esté visible: lo crea si falta y
 * lo fuerza a on. El cliente puede moverlo/redimensionarlo pero no ocultarlo ni
 * borrarlo (eso lo bloquea el inspector). Devuelve los campos y si hubo cambios.
 */
export function sincronizarLogoObligatorio(
  campos: Record<string, any>, defaultIndex: number | null | undefined,
): { campos: Record<string, any>; changed: boolean } {
  if (defaultIndex == null || defaultIndex < 0) return { campos, changed: false };
  const key = logoKey(defaultIndex);
  const actual = campos[key];
  if (actual && actual.on !== false) return { campos, changed: false };
  const next = { ...campos };
  next[key] = actual
    ? { ...actual, on: true }                               // estaba oculto → forzar visible
    : { on: true, x: 972, y: 30, size: 110 };               // no existía → crearlo (esquina sup. der.)
  return { campos: next, changed: true };
}

/** Dimensiones del viewport del lienzo (coincide con el PDF). */
export const LIENZO_W = 1122, LIENZO_H = 794;

/** Caja rectangular (en coords del viewport 1122×794) que ocupa un campo.
 *  La usa el lienzo interactivo para dibujar el área agarrable/arrastrable.
 *  Para el texto la altura es aproximada (tamaño × líneas); alcanza para agarrarlo. */
export interface Box { x: number; y: number; w: number; h: number; }
export function campoBox(
  key: string,
  campo: CampoTexto & CampoQR & CampoLogo & CampoFirma & CampoLinea,
): Box {
  const x = campo.x ?? 0, y = campo.y ?? 0;
  switch (tipoCampo(key)) {
    case 'logo': {
      const s = campo.size ?? 100;
      return { x, y, w: s, h: s };
    }
    case 'firma': {
      const w = campo.w ?? 260, h = campo.h ?? 58;
      return { x, y, w, h: h + 46 };   // imagen + línea + nombre + cargo
    }
    case 'qr': {
      const s = campo.size ?? 90;
      return { x, y, w: s, h: s + (campo.showCodigo !== false ? 16 : 0) };
    }
    case 'linea': {
      const w = campo.w ?? 200, th = campo.thickness ?? 1.5;
      return { x, y: y - 5, w, h: Math.max(th, 4) + 10 };  // engorda el alto para poder agarrarla
    }
    default: {
      const w = campo.w ?? 400, size = campo.size ?? 20;
      const lineas = (campo.text ?? '').split('\n').length || 1;
      return { x, y, w, h: size * 1.3 * lineas };
    }
  }
}

/** Resultado del snap: posición ajustada + líneas-guía a dibujar (coords del viewport). */
export interface SnapResult { x: number; y: number; vLines: number[]; hLines: number[]; }

/**
 * Alineación tipo Canva/Figma. Dada la caja propuesta del campo que se arrastra y
 * las cajas de los demás, "pega" la posición cuando un borde/centro del arrastrado
 * cae a `threshold` px de un borde/centro de otro (o del centro del lienzo) y
 * devuelve las líneas-guía a pintar. Función pura → fácil de testear/reusar.
 */
export function snapToGuides(proposed: Box, others: Box[], threshold = 6): SnapResult {
  // Objetivos: bordes/centros de los demás + centro del lienzo en cada eje.
  const vTargets: number[] = [LIENZO_W / 2];
  const hTargets: number[] = [LIENZO_H / 2];
  for (const b of others) {
    vTargets.push(b.x, b.x + b.w / 2, b.x + b.w);
    hTargets.push(b.y, b.y + b.h / 2, b.y + b.h);
  }
  // Anclas del arrastrado como offset respecto de su x/y: izq/centro/der · arriba/medio/abajo.
  const vAnchors = [0, proposed.w / 2, proposed.w];
  const hAnchors = [0, proposed.h / 2, proposed.h];

  let x = proposed.x, y = proposed.y;
  const vLines: number[] = [], hLines: number[] = [];

  let bestV: { d: number; t: number; off: number } | null = null;
  for (const t of vTargets) for (const off of vAnchors) {
    const d = Math.abs(proposed.x + off - t);
    if (d <= threshold && (!bestV || d < bestV.d)) bestV = { d, t, off };
  }
  if (bestV) { x = Math.round(bestV.t - bestV.off); vLines.push(bestV.t); }

  let bestH: { d: number; t: number; off: number } | null = null;
  for (const t of hTargets) for (const off of hAnchors) {
    const d = Math.abs(proposed.y + off - t);
    if (d <= threshold && (!bestH || d < bestH.d)) bestH = { d, t, off };
  }
  if (bestH) { y = Math.round(bestH.t - bestH.off); hLines.push(bestH.t); }

  return { x, y, vLines, hLines };
}

/** Etiqueta legible para un campo (usa su `label`, o el key con un nombre bonito). */
export function labelCampo(key: string, campo: CampoTexto | CampoQR | CampoLogo): string {
  const l = (campo as CampoTexto).label;
  if (l) return l;
  if (key === 'qr') return 'Código QR de validación';
  if (tipoCampo(key) === 'logo')  return `Logo ${indiceLogo(key) + 1} (el que seleccionaste)`;
  if (tipoCampo(key) === 'firma') return `Firma ${indiceFirma(key) + 1} (imagen + nombre + cargo)`;
  if (tipoCampo(key) === 'linea') return 'Línea decorativa';
  return key;
}

/** Variables insertables en los campos de texto del lienzo. */
export const VARIABLES_LIENZO: { token: string; desc: string }[] = [
  { token: '{nombre}',      desc: 'Nombre completo del participante' },
  { token: '{nombreCorto}', desc: 'Un nombre + los dos apellidos (ej. Ana Torres López)' },
  { token: '{calidad}',     desc: 'Calidad de participación (Participante, Organizador, Ponente…)' },
  { token: '{tipoDocumento}', desc: 'Tipo de documento (DNI, CE…)' },
  { token: '{documento}',   desc: 'Número de documento del participante' },
  { token: '{tipo}',        desc: 'Tipo de programa (Curso, Taller, Diplomado…)' },
  { token: '{programa}',    desc: 'Nombre del programa' },
  { token: '{fecha}',       desc: 'Fecha de emisión (día completo)' },
  { token: '{mesEmision}',  desc: 'Mes y año de emisión (ej. septiembre 2026)' },
  { token: '{fechaInicio}', desc: 'Fecha de inicio' },
  { token: '{fechaFin}',    desc: 'Fecha de fin (vacía si el curso es de un solo día)' },
  { token: '{periodo}',     desc: 'Periodo ya redactado: "el 22 de agosto de 2026", "los días 22, 23 y 24…" o "del X al Y". Úsalo en vez de "{fechaInicio} al {fechaFin}".' },
  { token: '{horas}',       desc: 'Horas académicas' },
  { token: '{creditos}',    desc: 'Créditos' },
  { token: '{codigo}',      desc: 'Código único del certificado' },
];

/** Layout inicial razonable al activar el modo (el admin luego ajusta X/Y). */
export function layoutPorDefecto(): LayoutLienzo {
  return {
    activo: true,
    campos: {
      nombre:  { on: true, label: 'Nombre del participante', text: '{nombre}',     x: 61,  y: 360, w: 1000, size: 40, color: '#0f172a', align: 'center', bold: true },
      calidad: { on: true, label: 'Calidad / rol',           text: 'PARTICIPANTE', x: 61,  y: 470, w: 1000, size: 18, color: '#1e293b', align: 'center', bold: true, uppercase: true },
      fecha:   { on: true, label: 'Fecha',                   text: '{fecha}',      x: 61,  y: 540, w: 1000, size: 14, color: '#334155', align: 'center' },
      logo1:   { on: true, x: 40,  y: 30, size: 110 },
      logo2:   { on: true, x: 972, y: 30, size: 110 },
      logo3:   { on: true, x: 506, y: 24, size: 110 },
      qr:      { on: true, x: 980, y: 640, size: 90, showCodigo: true },
    },
  };
}

/**
 * Preset "FAP" — posiciones calculadas a partir de la imagen de referencia del
 * cliente (Constancia FAP), mapeadas al viewport 1122×794. El fondo vacío se sube
 * como plantilla y estos campos caen ya ubicados; el admin solo afina si hace falta.
 * Los textos fijos del evento vienen rellenados; solo {nombre} y {fecha} cambian.
 */
export function presetFAP(): LayoutLienzo {
  return {
    activo: true,
    campos: {
      titulo:       { on: true, label: 'Título del evento (cinta)', text: 'III JORNADA ACADÉMICA CIENTÍFICA INTERNACIONAL\nDE MEDICINA FÍSICA', x: 253, y: 56, w: 660, size: 27, color: '#15366e', align: 'center', bold: true, weight: 700, font: 'barlow' },
      subtitulo:    { on: true, label: 'Subtítulo',                 text: 'HOSPITAL CENTRAL FAP',        x: 61,  y: 197, w: 1000, size: 20, color: '#15366e', align: 'center', bold: true, weight: 700, font: 'barlow' },
      tipo:         { on: true, label: 'Tipo (placa azul)',         text: 'CONSTANCIA DE PARTICIPACIÓN', x: 61,  y: 246, w: 1000, size: 46, color: '#ffffff', align: 'center', bold: true, weight: 700, tracking: 3, font: 'barlow' },
      otorgado:     { on: true, label: '"Otorgado a:"',             text: 'Otorgado a:',                 x: 61,  y: 338, w: 1000, size: 20, color: '#334155', align: 'center', font: 'barlow' },
      nombre:       { on: true, label: 'Nombre del participante',   text: '{nombreCorto}',               x: 61,  y: 364, w: 940, size: 46, color: '#15366e', align: 'center', bold: true, uppercase: true, weight: 700, tracking: 1, autoFit: true, font: 'barlow' },
      calidadLabel: { on: true, label: '"En calidad de:"',          text: 'Por su asistencia en calidad de:', x: 250, y: 470, w: 240, size: 14, color: '#334155', align: 'left', font: 'barlow' },
      linea1:       { on: true, x: 470, y: 494, w: 400, thickness: 1.5, color: '#c9a24b' },
      calidad:      { on: true, label: 'Calidad de participación',   text: '{calidad}',                   x: 490, y: 462, w: 360,  size: 20, color: '#15366e', align: 'center', bold: true, uppercase: true, font: 'barlow' },
      cuerpo:       { on: true, label: 'Cuerpo',                    text: 'Por su participación en la modalidad virtual,\nrealizada el {fechaInicio}.', x: 61, y: 516, w: 1000, size: 22, color: '#15366e', align: 'center', bold: true, font: 'barlow' },
      lugarFecha:   { on: true, label: 'Lugar y fecha',             text: 'Miraflores, {mesEmision}.', x: 560, y: 582, w: 430,  size: 18, color: '#15366e', align: 'right', italic: true, font: 'barlow' },
      firma1:       { on: true, x: 350, y: 615, w: 280, h: 58 },  // firma izquierda (imagen+nombre+cargo)
      firma2:       { on: true, x: 630, y: 615, w: 280, h: 58 },  // firma derecha
      logo1:        { on: true, x: 58,  y: 612, size: 135 },      // escudo abajo-izquierda (1º)
      logo2:        { on: true, x: 202, y: 612, size: 135 },      // escudo abajo-izquierda (2º)
      logo3:        { on: true, x: 928, y: 604, size: 150 },      // sello abajo-derecha
      qr:           { on: true, x: 90,  y: 470, size: 80, showCodigo: true },  // izquierda (a la derecha tapaba el edificio)
    },
  };
}

/** Presets disponibles en el editor (plantillas ya posicionadas). */
export const PRESETS_LIENZO: { key: string; label: string; make: () => LayoutLienzo }[] = [
  { key: 'fap',     label: 'Constancia FAP (posicionado)', make: presetFAP },
  { key: 'basico',  label: 'Básico (nombre + fecha + QR)', make: layoutPorDefecto },
];

/** Crea un campo de texto nuevo en blanco (para el botón "Agregar campo"). */
export function nuevoCampoTexto(n: number): { key: string; campo: CampoTexto } {
  return {
    key: `campo_${Date.now().toString(36)}`,
    campo: { on: true, label: `Campo ${n}`, text: 'Texto', x: 61, y: 300, w: 1000, size: 18, color: '#0f172a', align: 'center' },
  };
}

/** Crea una línea decorativa nueva (para el botón "Agregar línea"). */
export function nuevaLinea(): { key: string; campo: CampoLinea } {
  return {
    key: `linea_${Date.now().toString(36)}`,
    campo: { on: true, x: 300, y: 300, w: 520, thickness: 1.5, color: '#c9a24b' },
  };
}

/** Máximo de firmas en un certificado (mismo tope que la selección de la config). */
export const MAX_FIRMAS = 3;

/** Crea el siguiente slot de firma libre (firma1 → firma2 → firma3).
 *  Devuelve null si ya hay 3 firmas colocadas (tope del certificado).
 *  Cada slot jala su imagen+nombre+cargo de las firmas seleccionadas en la config (por orden). */
export function nuevaFirma(campos: Record<string, unknown>): { key: string; campo: CampoFirma } | null {
  for (let n = 1; n <= MAX_FIRMAS; n++) {
    const key = `firma${n}`;
    if (!campos[key]) {
      return { key, campo: { on: true, x: 300 + (n - 1) * 260, y: 615, w: 260, h: 58 } };
    }
  }
  return null;
}

/** Cantidad de slots de firma (firmaN) ya colocados en el lienzo. */
export function contarFirmas(campos: Record<string, unknown>): number {
  return Object.keys(campos).filter(k => /^firma\d+$/i.test(k)).length;
}

/**
 * Sincroniza los espacios de firma del lienzo con las firmas ELEGIDAS en la
 * configuración: crea firma1..firmaN (conservando posiciones ya puestas) y quita
 * las sobrantes. Así no hay que "agregar firma" a mano en el editor — salen solas
 * según lo seleccionado. Devuelve los campos y si hubo cambios.
 */
export function sincronizarFirmas(
  campos: Record<string, any>, numFirmas: number,
): { campos: Record<string, any>; changed: boolean } {
  const n = Math.max(0, Math.min(numFirmas, MAX_FIRMAS));
  const next = { ...campos };
  let changed = false;
  // Quita las sobrantes (más slots que firmas seleccionadas).
  for (let i = n + 1; i <= MAX_FIRMAS; i++) {
    if (next[`firma${i}`]) { delete next[`firma${i}`]; changed = true; }
  }
  // Agrega las que faltan, con una posición por defecto (el usuario luego las mueve).
  for (let i = 1; i <= n; i++) {
    const key = `firma${i}`;
    if (!next[key]) { next[key] = { on: true, x: 300 + (i - 1) * 260, y: 615, w: 260, h: 58 }; changed = true; }
  }
  return { campos: next, changed };
}

/** true si el layout está activo y con al menos un campo → se usa el lienzo. */
export function layoutActivo(l: LayoutLienzo | null | undefined): boolean {
  return !!(l && l.activo && l.campos && Object.keys(l.campos).length > 0);
}

/** Parseo seguro del JSON guardado en config.layout_personalizado. */
export function parseLayout(raw: string | null | undefined): LayoutLienzo | null {
  if (!raw) return null;
  try {
    const l = JSON.parse(raw);
    return l && typeof l === 'object' ? (l as LayoutLienzo) : null;
  } catch {
    return null;
  }
}

/** Reemplaza {variable} por su valor (case-insensitive). Desconocidas → "". */
export function expandirLienzo(txt: string, vars: Record<string, string>): string {
  return txt.replace(/\{(\w+)\}/g, (_, k) => {
    const key = Object.keys(vars).find(v => v.toLowerCase() === String(k).toLowerCase());
    return key ? vars[key] : '';
  });
}

/* ── Negrita parcial: **texto** dentro de un campo de texto ──────
   Permite poner en negrita solo una parte (ej. "Otorgado a **{nombre}**").
   Espejo del backend (personalizado/lienzo.service.ts). */

/** Divide un texto en tramos normales / en negrita según las marcas **. */
export function segmentosBold(txt: string): { text: string; bold: boolean }[] {
  const out: { text: string; bold: boolean }[] = [];
  const re = /\*\*([\s\S]+?)\*\*/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(txt))) {
    if (m.index > last) out.push({ text: txt.slice(last, m.index), bold: false });
    out.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < txt.length) out.push({ text: txt.slice(last), bold: false });
  return out.length ? out : [{ text: txt, bold: false }];
}

/** Quita las marcas ** (para medir el texto en el auto-ajuste). */
export function quitarBold(txt: string): string {
  return txt.replace(/\*\*([\s\S]+?)\*\*/g, '$1');
}
