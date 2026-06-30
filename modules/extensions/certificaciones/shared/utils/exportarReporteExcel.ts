import ExcelJS from 'exceljs';
import type {
  ReporteResumen, FilaPorPrograma, FilaCertificado, RangoFechas,
  Comparativo, AprobacionPrograma, Productividad,
} from '../api/reportes.api';
import { publicApi } from '../api/public.api';

const MARCA      = 'FF0D0E12';   // negro de marca (encabezados de tabla)
const MARCA_SUAVE= 'FFFAF8F4';   // crema (filas zebra)
const ORO        = 'FFB0832B';   // dorado (acentos)
const BLANCO     = 'FFFFFFFF';
const GRIS       = 'FF64748B';
const BORDE      = 'FFE5E1D8';

const fmtFechaLarga = (s: string) =>
  new Date(`${s}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });

const colLetra = (n: number) => String.fromCharCode(64 + n);   // 1→A, 7→G

const bordeFino: Partial<ExcelJS.Borders> = {
  top:    { style: 'thin', color: { argb: BORDE } },
  bottom: { style: 'thin', color: { argb: BORDE } },
  left:   { style: 'thin', color: { argb: BORDE } },
  right:  { style: 'thin', color: { argb: BORDE } },
};

/** Lee las dimensiones naturales de una imagen (para no deformarla). */
function medirImagen(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve({ w: img.naturalWidth || 150, h: img.naturalHeight || 48 });
    img.onerror = () => resolve({ w: 150, h: 48 });
    img.src = src;
  });
}

/** Logo ya registrado en el workbook + su tamaño escalado (respeta proporción). */
interface LogoCargado { id: number; ext: { width: number; height: number }; }

/** Descarga el logo (URL o data:), lo registra en el workbook y calcula su tamaño
 *  dentro de una caja (máx 180×56) respetando la proporción. null si falla. */
async function cargarLogo(wb: ExcelJS.Workbook, logoUrl: string | null | undefined): Promise<LogoCargado | null> {
  if (!logoUrl) return null;
  try {
    let id: number;
    let src: string;   // para medir dimensiones
    if (logoUrl.startsWith('data:')) {
      const ext = (logoUrl.substring(5, logoUrl.indexOf(';')).split('/')[1] || 'png') as 'png' | 'jpeg' | 'gif';
      id = wb.addImage({ base64: logoUrl, extension: ext });
      src = logoUrl;
    } else {
      const base = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
      const url  = /^https?:\/\//.test(logoUrl) ? logoUrl : `${base}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
      const res  = await fetch(url);
      if (!res.ok) return null;
      const buf  = await res.arrayBuffer();
      const ct   = res.headers.get('content-type') ?? '';
      const ext  = (ct.includes('png') ? 'png' : ct.includes('gif') ? 'gif' : 'jpeg') as 'png' | 'jpeg' | 'gif';
      id = wb.addImage({ buffer: buf, extension: ext });
      src = URL.createObjectURL(new Blob([buf], { type: ct || 'image/png' }));
    }

    const { w, h } = await medirImagen(src);
    if (src.startsWith('blob:')) URL.revokeObjectURL(src);
    const MAX_W = 180, MAX_H = 56;
    const escala = Math.min(MAX_W / w, MAX_H / h, 1);
    return { id, ext: { width: Math.round(w * escala), height: Math.round(h * escala) } };
  } catch {
    return null;
  }
}

/** Escribe el encabezado institucional APILADO (logo arriba, luego empresa /
 *  título / periodo, sin solaparse) y devuelve la fila donde arranca la tabla. */
function escribirEncabezado(
  ws: ExcelJS.Worksheet, ncols: number, empresaNombre: string, subtitulo: string, rango: RangoFechas, logo: LogoCargado | null,
): number {
  const ultima = colLetra(ncols);
  let fila = 1;

  // 1) Banda del logo (filas propias, no se mezcla con el texto).
  if (logo) {
    const filasLogo = Math.max(2, Math.ceil(logo.ext.height / 18));   // ~18px por fila
    for (let i = 1; i <= filasLogo; i++) ws.getRow(i).height = Math.ceil(logo.ext.height / filasLogo) + 2;
    ws.addImage(logo.id, {
      tl: { col: 0.05, row: 0.15 } as ExcelJS.Anchor,
      ext: logo.ext,
      editAs: 'oneCell',
    });
    fila = filasLogo + 1;
  }

  // 2) Nombre de la empresa.
  ws.mergeCells(`A${fila}:${ultima}${fila}`);
  const cNombre = ws.getCell(`A${fila}`);
  cNombre.value = empresaNombre.toUpperCase();
  cNombre.font = { bold: true, size: 15, color: { argb: MARCA } };
  cNombre.alignment = { vertical: 'middle' };
  ws.getRow(fila).height = 22;
  fila++;

  // 3) Título del reporte.
  ws.mergeCells(`A${fila}:${ultima}${fila}`);
  const cSub = ws.getCell(`A${fila}`);
  cSub.value = subtitulo;
  cSub.font = { bold: true, size: 11, color: { argb: ORO } };
  fila++;

  // 4) Periodo + fecha de generación.
  ws.mergeCells(`A${fila}:${ultima}${fila}`);
  const cPer = ws.getCell(`A${fila}`);
  cPer.value = `Periodo: ${fmtFechaLarga(rango.desde)} al ${fmtFechaLarga(rango.hasta)}    |    Generado: ${fmtFechaLarga(new Date().toLocaleDateString('en-CA'))}`;
  cPer.font = { size: 10, color: { argb: GRIS } };
  fila++;

  // 5) Línea dorada divisoria + espacio.
  ws.mergeCells(`A${fila}:${ultima}${fila}`);
  ws.getCell(`A${fila}`).border = { bottom: { style: 'medium', color: { argb: ORO } } };
  ws.getRow(fila).height = 6;
  fila += 2;   // deja una fila en blanco antes de la tabla

  return fila;
}

/** Aplica estilo de encabezado de tabla (negro/blanco) a una fila. */
function estilarHead(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: BLANCO }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MARCA } };
    cell.alignment = { vertical: 'middle' };
    cell.border = bordeFino;
  });
  row.height = 20;
}

/** Aplica borde + zebra a las filas de datos [desde, hasta]. */
function estilarCuerpo(ws: ExcelJS.Worksheet, desde: number, hasta: number) {
  for (let i = desde; i <= hasta; i++) {
    const row = ws.getRow(i);
    const zebra = (i - desde) % 2 === 1;
    row.eachCell((cell) => {
      cell.border = bordeFino;
      cell.alignment = { vertical: 'middle', ...(cell.alignment ?? {}) };
      if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MARCA_SUAVE } };
    });
  }
}

/**
 * Genera y descarga un Excel FORMAL del reporte, con la marca de la empresa
 * cliente (nombre + logo), periodo y 3 hojas: Resumen, Por programa y el Detalle
 * de certificados. Acotado a esa empresa (los datos ya vienen filtrados por tenant).
 */
export async function exportarReporteExcel(opts: {
  empresa: string;
  rango: RangoFechas;
  resumen: ReporteResumen;
  porPrograma: FilaPorPrograma[];
  certificados: FilaCertificado[];
  comparativo?: Comparativo;
  aprobacionPorPrograma?: AprobacionPrograma[];
  productividad?: Productividad[];
}): Promise<void> {
  const { empresa, rango, resumen, porPrograma, certificados, comparativo, aprobacionPorPrograma, productividad } = opts;

  // Marca de la empresa cliente (nombre + logo).
  let empresaNombre = empresa;
  let logoUrl: string | null = null;
  try {
    const info = await publicApi.existeEmpresa(empresa);
    empresaNombre = info.razon_social || empresa;
    logoUrl = info.logo_url ?? null;
  } catch { /* sin branding → se usa el slug */ }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Vaxa Certificados';
  wb.company = empresaNombre;
  wb.created = new Date();
  const logo = await cargarLogo(wb, logoUrl);

  // ── Hoja 1: Resumen ──────────────────────────────────────
  const s1 = wb.addWorksheet('Resumen', { views: [{ showGridLines: false }] });
  s1.columns = [{ width: 40 }, { width: 22 }];
  let fila = escribirEncabezado(s1, 2, empresaNombre, 'REPORTE DE CERTIFICACIONES — RESUMEN', rango, logo);

  const head1 = s1.getRow(fila); head1.values = ['Indicador', 'Valor']; estilarHead(head1);
  const indicadores: Array<[string, number | string]> = [
    ['Certificados emitidos', resumen.certificados_emitidos],
    ['Certificados vigentes', resumen.certificados_vigentes],
    ['Certificados anulados', resumen.certificados_anulados],
    ['Inscripciones nuevas', resumen.inscripciones_nuevas],
    ['Estudiantes nuevos', resumen.estudiantes_nuevos],
    ['Aprobados', resumen.aprobados],
    ['Desaprobados', resumen.desaprobados],
    ['Tasa de aprobación', `${resumen.tasa_aprobacion}%`],
    ['Créditos consumidos', resumen.creditos_consumidos],
    ['Programas activos', resumen.programas_activos],
    ['Aulas activas', resumen.aulas_activas],
  ];
  const inicio1 = fila + 1;
  indicadores.forEach(([k, v]) => {
    const r = s1.addRow([k, v]);
    r.getCell(1).font = { color: { argb: GRIS } };
    r.getCell(2).font = { bold: true, color: { argb: MARCA } };
    r.getCell(2).alignment = { horizontal: 'right' };
  });
  estilarCuerpo(s1, inicio1, inicio1 + indicadores.length - 1);

  // ── Hoja 2: Por programa ─────────────────────────────────
  const s2 = wb.addWorksheet('Por programa', { views: [{ showGridLines: false }] });
  s2.columns = [{ width: 50 }, { width: 22 }];
  fila = escribirEncabezado(s2, 2, empresaNombre, 'CERTIFICADOS EMITIDOS POR PROGRAMA', rango, logo);
  const head2 = s2.getRow(fila); head2.values = ['Programa', 'Certificados emitidos']; estilarHead(head2);
  const inicio2 = fila + 1;
  porPrograma.forEach(p => {
    const r = s2.addRow([p.programa, p.emitidos]);
    r.getCell(2).alignment = { horizontal: 'right' };
    r.getCell(2).font = { bold: true };
  });
  if (porPrograma.length) {
    estilarCuerpo(s2, inicio2, inicio2 + porPrograma.length - 1);
    const tot = s2.addRow(['TOTAL', porPrograma.reduce((a, p) => a + p.emitidos, 0)]);
    tot.eachCell(c => { c.font = { bold: true, color: { argb: MARCA } }; c.border = { top: { style: 'medium', color: { argb: ORO } } }; });
    tot.getCell(2).alignment = { horizontal: 'right' };
  }

  // ── Hoja 3: Detalle de certificados ──────────────────────
  const cols3 = ['Código', 'Estudiante', 'Documento', 'Programa', 'Aula', 'Fecha emisión', 'Estado'];
  const s3 = wb.addWorksheet('Certificados', { views: [{ showGridLines: false }] });
  s3.columns = [{ width: 18 }, { width: 30 }, { width: 16 }, { width: 34 }, { width: 24 }, { width: 16 }, { width: 14 }];
  fila = escribirEncabezado(s3, cols3.length, empresaNombre, 'DETALLE DE CERTIFICADOS EMITIDOS', rango, logo);
  const head3 = s3.getRow(fila); head3.values = cols3; estilarHead(head3);
  s3.views = [{ showGridLines: false, state: 'frozen', ySplit: fila }];
  s3.autoFilter = { from: { row: fila, column: 1 }, to: { row: fila, column: cols3.length } };
  const inicio3 = fila + 1;
  certificados.forEach(c => {
    const r = s3.addRow([c.codigo, c.alumno, c.documento, c.programa, c.aula, fmtFechaLarga(c.fecha_emision), c.estado]);
    r.getCell(1).font = { bold: true, color: { argb: MARCA } };
  });
  if (certificados.length) estilarCuerpo(s3, inicio3, inicio3 + certificados.length - 1);
  else s3.addRow(['Sin certificados emitidos en el periodo.']);

  // ── Hoja 4: Comparativo vs periodo anterior ──────────────
  if (comparativo) {
    const s4 = wb.addWorksheet('Comparativo', { views: [{ showGridLines: false }] });
    s4.columns = [{ width: 24 }, { width: 16 }, { width: 18 }, { width: 14 }];
    const f = escribirEncabezado(s4, 4, empresaNombre, 'COMPARATIVO VS PERIODO ANTERIOR', rango, logo);
    estilarHead(s4.getRow(f)); s4.getRow(f).values = ['Concepto', 'Actual', 'Periodo anterior', 'Δ%'];
    const i = f + 1;
    s4.addRow(['Certificados',  comparativo.certificados.actual,  comparativo.certificados.anterior,  `${comparativo.certificados.pct}%`]);
    s4.addRow(['Inscripciones', comparativo.inscripciones.actual, comparativo.inscripciones.anterior, `${comparativo.inscripciones.pct}%`]);
    estilarCuerpo(s4, i, i + 1);
  }

  // ── Hoja 5: Aprobación por programa ──────────────────────
  if (aprobacionPorPrograma && aprobacionPorPrograma.length) {
    const s5 = wb.addWorksheet('Aprobación x programa', { views: [{ showGridLines: false }] });
    s5.columns = [{ width: 44 }, { width: 14 }, { width: 14 }, { width: 14 }];
    const f = escribirEncabezado(s5, 4, empresaNombre, 'TASA DE APROBACIÓN POR PROGRAMA', rango, logo);
    estilarHead(s5.getRow(f)); s5.getRow(f).values = ['Programa', 'Inscritos', 'Aprobados', 'Tasa'];
    const i = f + 1;
    aprobacionPorPrograma.forEach(a => s5.addRow([a.programa, a.inscritos, a.aprobados, `${a.tasa}%`]));
    estilarCuerpo(s5, i, i + aprobacionPorPrograma.length - 1);
  }

  // ── Hoja 6: Productividad por operador ───────────────────
  if (productividad && productividad.length) {
    const s6 = wb.addWorksheet('Productividad', { views: [{ showGridLines: false }] });
    s6.columns = [{ width: 40 }, { width: 18 }];
    const f = escribirEncabezado(s6, 2, empresaNombre, 'PRODUCTIVIDAD POR OPERADOR', rango, logo);
    estilarHead(s6.getRow(f)); s6.getRow(f).values = ['Operador', 'Certificados emitidos'];
    const i = f + 1;
    productividad.forEach(p => s6.addRow([p.operador, p.emitidos]));
    estilarCuerpo(s6, i, i + productividad.length - 1);
  }

  // ── Descargar ────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte-certificaciones-${empresa}-${rango.desde}_a_${rango.hasta}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
