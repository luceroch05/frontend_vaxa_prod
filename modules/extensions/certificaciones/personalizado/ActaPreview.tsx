/* ────────────────────────────────────────────────────────────────
 * <ActaPreview> — RÉPLICA EXACTA del "ACTA DE NOTAS" que el backend dibuja
 * (pintarActa en pdf.service.ts). Mismas coordenadas absolutas (espacio de
 * diseño 1122×794 px = A4 landscape × PX) para que lo que ves en la config
 * sea IGUAL a lo que sale en el PDF. Se usa de fondo de la Hoja 2 en el editor,
 * para colocar cositas (QR movible, logos de convenios…) encima.
 * Datos de ejemplo + unidades REALES del programa.
 * ──────────────────────────────────────────────────────────────── */
import { LIENZO_W as W, LIENZO_H as H } from './layout';
import type { ActaConfig } from '../shared/types';

interface ActaUnidad { id: number; nombre: string; creditos?: number }

interface Props {
  unidades: ActaUnidad[];
  programa?: string;
  participante?: string;
  documento?: string;
  grupo?: string;
  periodo?: string;
  notaMinima?: number;
  /** Dibuja el QR fijo del acta (arriba-derecha). Se apaga si moviste el QR a la hoja 2. */
  mostrarQr?: boolean;
  /** Modo temario: solo la lista de temas, sin columna de nota ni resumen (programa sin evaluación). */
  esTemario?: boolean;
  /** Config del acta: título propio, qué datos muestra y texto extra. */
  acta?: ActaConfig | null;
  /** Notas REALES por unidad (unidadId → nota) de la muestra. Vacío = valor de ejemplo. */
  notas?: Record<number, number>;
}

const NAVY = '#12294d';
const LEFT = 60, RIGHT = 1062, CONTENT_W = 1002;   // = backend left/right/contentW en px
const NOTA_EJEMPLO = 16;

export default function ActaPreview({
  unidades, programa, participante, documento, grupo, periodo, notaMinima = 11, mostrarQr = true, esTemario = false, acta, notas = {},
}: Props) {
  const filas = unidades.length ? unidades : [{ id: 0, nombre: 'Unidad de ejemplo' }];
  // Notas REALES de la muestra si las hay; si no, un valor de ejemplo.
  const hayNotas = Object.keys(notas).length > 0;
  const notaDe = (u: ActaUnidad): string =>
    hayNotas ? (notas[u.id] != null ? Number(notas[u.id]).toFixed(2) : '—') : NOTA_EJEMPLO.toFixed(2);
  const notasVals = filas.map(u => notas[u.id]).filter((v): v is number => v != null);
  const promedio = hayNotas && notasVals.length ? notasVals.reduce((a, b) => a + b, 0) / notasVals.length : NOTA_EJEMPLO;
  const aprobado = promedio >= notaMinima;
  // Config del acta: oculta datos, cambia título y QR, agrega texto extra.
  const a = acta ?? {};
  mostrarQr = mostrarQr && a.mostrarQr !== false;
  const titulo = (a.titulo && a.titulo.trim()) || (esTemario ? 'TEMARIO DEL PROGRAMA' : 'ACTA DE NOTAS');

  const infoY = 106, rowGap = 16;                    // info arranca en y=106 (= backend `y`)
  const infos: [string, string][] = [
    ['Participante:', participante || 'Ana María Torres López'],
    ...(a.mostrarDocumento !== false ? [['Documento:', documento || '12345678'] as [string, string]] : []),
    ['Programa:',     programa || 'Nombre del programa'],
    ...(a.mostrarGrupo !== false ? [['Grupo:', grupo || 'Grupo 2026 - 1'] as [string, string]] : []),
    ...(a.mostrarPeriodo !== false ? [['Periodo:', periodo || '—'] as [string, string]] : []),
  ];
  const tableY = infoY + infos.length * rowGap + 16; // 202
  const rowH = 32, colNum = 60, colValor = esTemario ? 0 : 140;
  const colUni = CONTENT_W - colNum - colValor;      // temario: ocupa todo
  const notaX = colNum + colUni;                     // 862 (relativo a la caja de la fila/header)
  const sumY = tableY + rowH + filas.length * rowH + 18;

  return (
    <div style={{
      position: 'absolute', inset: 0, width: W, height: H, background: '#fff',
      fontFamily: 'Helvetica, Arial, sans-serif', color: '#0f172a', pointerEvents: 'none',
    }}>
      {/* Título */}
      <div style={{ position: 'absolute', left: LEFT, top: 46, width: CONTENT_W, textAlign: 'center', fontSize: 26, fontWeight: 700, color: NAVY, letterSpacing: 0.5 }}>
        {titulo}
      </div>
      {/* Línea */}
      <div style={{ position: 'absolute', left: LEFT, top: 88, width: CONTENT_W, borderTop: '1px solid #d7dde5' }} />

      {/* QR fijo (si no se movió a la hoja 2). 80px: alineado al bloque de datos, con margen a la tabla. */}
      {mostrarQr && (
        <div style={{ position: 'absolute', left: RIGHT - 80, top: infoY, width: 80, height: 80,
          background: '#eef2f7', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 10, color: '#94a3b8', fontFamily: '"Courier New", monospace' }}>QR</div>
      )}

      {/* Datos */}
      {infos.map(([label, value], i) => (
        <div key={i} style={{ position: 'absolute', left: LEFT, top: infoY + i * rowGap, width: CONTENT_W, height: rowGap }}>
          <span style={{ position: 'absolute', left: 0, top: 0, width: 133, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{label}</span>
          <span style={{ position: 'absolute', left: 157, top: 0, width: mostrarQr ? 749 : 845, fontSize: 13, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
        </div>
      ))}

      {/* Header tabla */}
      <div style={{ position: 'absolute', left: LEFT, top: tableY, width: CONTENT_W, height: rowH, background: NAVY }}>
        <span style={{ position: 'absolute', left: 14, top: 9, fontSize: 12, fontWeight: 700, color: '#fff' }}>N°</span>
        <span style={{ position: 'absolute', left: colNum + 14, top: 9, fontSize: 12, fontWeight: 700, color: '#fff' }}>UNIDAD</span>
        {!esTemario && (
          <span style={{ position: 'absolute', left: colNum + colUni, top: 9, width: colValor - 14, fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'right' }}>NOTA</span>
        )}
      </div>

      {/* Filas */}
      {filas.map((u, i) => (
        <div key={u.id} style={{ position: 'absolute', left: LEFT, top: tableY + rowH + i * rowH, width: CONTENT_W, height: rowH, background: i % 2 === 0 ? '#fff' : '#f6f8fb' }}>
          <span style={{ position: 'absolute', left: 14, top: 8, fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{i + 1}</span>
          <span style={{ position: 'absolute', left: colNum + 14, top: 8, width: colUni - 28, fontSize: 13, color: '#0f172a' }}>{u.nombre}</span>
          {!esTemario && (
            <span style={{ position: 'absolute', left: notaX, top: 8, width: colValor - 14, fontSize: 13, fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>{notaDe(u)}</span>
          )}
        </div>
      ))}

      {/* Resumen — el temario no lleva promedio ni condición */}
      {!esTemario && (
        <>
          <div style={{ position: 'absolute', left: LEFT, top: sumY, fontSize: 13, color: '#0f172a' }}>
            Promedio final: <b>{promedio.toFixed(2)}</b>
          </div>
          <div style={{ position: 'absolute', left: LEFT, top: sumY + 16, fontSize: 11, color: '#94a3b8' }}>
            (Nota mínima de aprobación: {notaMinima.toFixed(2)} · escala 0–20)
          </div>
          <div style={{ position: 'absolute', left: LEFT, top: sumY + 32, fontSize: 15, fontWeight: 700, color: aprobado ? '#15803d' : '#b91c1c' }}>
            Condición: {aprobado ? 'APROBADO' : 'DESAPROBADO'}
          </div>
        </>
      )}

      {/* Texto extra (al pie) */}
      {a.textoExtra && a.textoExtra.trim() && (
        <div style={{ position: 'absolute', left: LEFT, top: (esTemario ? tableY + rowH + filas.length * rowH + 18 : sumY + 58), width: CONTENT_W, fontSize: 11, color: '#475569' }}>
          {a.textoExtra.trim()}
        </div>
      )}
    </div>
  );
}
