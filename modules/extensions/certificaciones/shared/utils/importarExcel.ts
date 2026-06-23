import ExcelJS from 'exceljs';
import type { TipoDocumento } from '../types';
import type { ImportarFila } from '../api/inscripciones.api';

/* ──────────────────────────────────────────────────────────────────────────
 *  Carga masiva de participantes por Excel.
 *  - generarPlantilla(): crea una plantilla .xlsx formal (con estilos, anchos,
 *    lista desplegable para el tipo de documento e instrucciones).
 *  - parsearArchivo(): lee el .xlsx/.csv que sube el cliente y devuelve las
 *    filas mapeadas + validadas para previsualizar antes de confirmar.
 * ────────────────────────────────────────────────────────────────────────── */

/** Fila ya parseada y validada (para la previsualización). */
export interface FilaParseada extends ImportarFila {
  fila: number;            // número de fila en el Excel (1 = encabezado)
  tipo_texto: string;      // lo que escribió el cliente en "Tipo de documento"
  valido: boolean;
  motivo?: string;         // por qué no es válida
}

const HEADERS = ['Tipo de documento', 'Número de documento', 'Nombres', 'Apellidos', 'Email', 'Teléfono'] as const;
const norm = (s: unknown) => String(s ?? '').trim().toUpperCase();

/**
 * Normaliza un nombre/apellido a "Título": cada palabra con la primera letra en
 * mayúscula y el resto en minúscula. Colapsa espacios y respeta guion/apóstrofo.
 * (Misma regla que el backend, para que la previsualización ya se vea limpia
 * aunque el cliente escriba "jUAN  carlos" o "PEREZ gomez".)
 * Ej: "jUAN  carlos PÉREZ-gómez" → "Juan Carlos Pérez-Gómez"
 */
function aTitulo(s: string): string {
  if (!s) return '';
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es')
    .replace(/(^|[\s\-'’])([a-zñáéíóúü])/g, (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase('es'));
}

/** Convierte el valor de una celda (texto, número, hipervínculo, fórmula…) a string. */
function celdaTexto(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    const o = v as unknown as Record<string, unknown>;
    if ('text' in o) return String(o.text ?? '');
    if ('result' in o) return String(o.result ?? '');
    if ('hyperlink' in o) return String(o.text ?? o.hyperlink ?? '');
    return '';
  }
  return String(v);
}

/* ── Generar plantilla ──────────────────────────────────────────────────── */
export async function generarPlantilla(
  tiposDocumento: TipoDocumento[],
  contexto: { programa: string; aula: string },
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Vaxa';
  wb.created = new Date();

  /* Hoja principal */
  const ws = wb.addWorksheet('Participantes', {
    views: [{ state: 'frozen', ySplit: 1 }],   // congela el encabezado
  });

  ws.columns = [
    { key: 'tipo',     width: 22 },
    { key: 'doc',      width: 22 },
    { key: 'nombres',  width: 26 },
    { key: 'apellidos',width: 26 },
    { key: 'email',    width: 30 },
    { key: 'telefono', width: 18 },
  ];

  // Encabezado con estilo (oscuro + texto dorado, en negrita).
  const header = ws.addRow(HEADERS as unknown as string[]);
  header.height = 24;
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D0E12' } };
    cell.font = { bold: true, color: { argb: 'FFC9962C' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFC9962C' } } };
  });

  // Filas de ejemplo (en gris, para que el cliente vea el formato).
  const ejemplos = [
    ['DNI', '45211078', 'Juan', 'Pérez Quispe', 'juan@correo.com', '+51 999 888 777'],
    ['DNI', '70123456', 'María', 'Gómez Torres', '', ''],
  ];
  ejemplos.forEach((e) => {
    const r = ws.addRow(e);
    r.font = { italic: true, color: { argb: 'FF9AA0A6' }, size: 10 };
  });

  // Lista desplegable para "Tipo de documento" (filas 2..1000).
  // Inline list de Excel: requiere comillas y < 255 caracteres → usamos los códigos.
  const opciones = tiposDocumento.map((t) => t.codigo).join(',');
  if (opciones && opciones.length < 250) {
    for (let row = 2; row <= 1000; row++) {
      ws.getCell(`A${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${opciones}"`],
        showErrorMessage: true,
        errorTitle: 'Tipo de documento',
        error: `Elige uno: ${tiposDocumento.map((t) => t.codigo).join(', ')}`,
      };
    }
  }

  /* Hoja de instrucciones */
  const inst = wb.addWorksheet('Instrucciones');
  inst.columns = [{ width: 90 }];
  const lineas: Array<{ t: string; bold?: boolean; color?: string }> = [
    { t: 'CARGA MASIVA DE PARTICIPANTES — VAXA', bold: true, color: 'FF0D0E12' },
    { t: '' },
    { t: `Programa: ${contexto.programa}`, bold: true },
    { t: `Aula: ${contexto.aula}`, bold: true },
    { t: '' },
    { t: 'Cómo llenar esta plantilla:', bold: true },
    { t: '1. Escribe un participante por fila en la hoja "Participantes".' },
    { t: '2. Borra las dos filas de ejemplo antes de subir el archivo.' },
    { t: '3. Columnas obligatorias: Tipo de documento, Número de documento, Nombres y Apellidos.' },
    { t: '4. Email y Teléfono son opcionales.' },
    { t: `5. Tipo de documento: usa uno de estos códigos → ${tiposDocumento.map((t) => `${t.codigo} (${t.nombre})`).join('  ·  ')}` },
    { t: '6. No cambies los títulos de las columnas ni el orden.' },
    { t: '' },
    { t: 'Al subir el archivo verás una vista previa con el estado de cada fila antes de confirmar.', color: 'FF15803D' },
  ];
  lineas.forEach((l) => {
    const r = inst.addRow([l.t]);
    r.font = { bold: !!l.bold, color: { argb: l.color ?? 'FF374151' }, size: l.bold ? 12 : 11 };
    r.alignment = { wrapText: true, vertical: 'middle' };
  });

  /* Descargar */
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Plantilla participantes — ${contexto.aula || 'aula'}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Parsear archivo subido ─────────────────────────────────────────────── */
export async function parsearArchivo(
  file: File,
  tiposDocumento: TipoDocumento[],
): Promise<FilaParseada[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.getWorksheet('Participantes') ?? wb.worksheets[0];
  if (!ws) return [];

  // Mapa para resolver el tipo de documento por código o por nombre (sin importar mayúsculas).
  const tipoPorTexto = new Map<string, TipoDocumento>();
  tiposDocumento.forEach((t) => {
    tipoPorTexto.set(norm(t.codigo), t);
    tipoPorTexto.set(norm(t.nombre), t);
  });

  const filas: FilaParseada[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;   // encabezado

    const tipoTexto  = celdaTexto(row.getCell(1).value).trim();
    const doc        = celdaTexto(row.getCell(2).value).trim();
    // Nombres/apellidos se limpian a "Título" (corrige MAYÚSCULAS, minúsculas y mezclas).
    const nombres    = aTitulo(celdaTexto(row.getCell(3).value));
    const apellidos  = aTitulo(celdaTexto(row.getCell(4).value));
    const email      = celdaTexto(row.getCell(5).value).trim();
    const telefono   = celdaTexto(row.getCell(6).value).trim();

    // Fila totalmente vacía → se ignora.
    if (!tipoTexto && !doc && !nombres && !apellidos && !email && !telefono) return;

    const tipo = tipoPorTexto.get(norm(tipoTexto));
    let valido = true;
    let motivo: string | undefined;

    if (!tipo)            { valido = false; motivo = `Tipo de documento inválido ("${tipoTexto || '—'}")`; }
    else if (!doc)        { valido = false; motivo = 'Falta el número de documento'; }
    else if (!nombres)    { valido = false; motivo = 'Faltan los nombres'; }
    else if (!apellidos)  { valido = false; motivo = 'Faltan los apellidos'; }

    filas.push({
      fila: rowNumber,
      tipo_documento_id: tipo?.id ?? 0,
      tipo_texto: tipoTexto,
      numero_documento: doc,
      nombres,
      apellidos,
      email: email || undefined,
      telefono: telefono || undefined,
      valido,
      motivo,
    });
  });

  return filas;
}
