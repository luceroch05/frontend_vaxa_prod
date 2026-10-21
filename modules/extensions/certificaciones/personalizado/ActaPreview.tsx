/* ────────────────────────────────────────────────────────────────
 * <ActaPreview> — réplica del acta que el backend dibuja (pintarActa).
 * Dos secciones SEPARADAS: NOTAS (ítems tipo 'nota') y CRÉDITOS (tipo 'credito').
 * Posiciones calculadas en secuencia (espacio 1122×794 px).
 * ──────────────────────────────────────────────────────────────── */
import { LIENZO_W as W, LIENZO_H as H } from './layout';
import type { ActaConfig } from '../shared/types';

interface ActaUnidad { id: number; nombre: string; creditos?: number; tipo?: string }

interface Props {
  unidades: ActaUnidad[];
  programa?: string;
  participante?: string;
  documento?: string;
  grupo?: string;
  periodo?: string;
  notaMinima?: number;
  mostrarQr?: boolean;
  /** Sin notas (temario). */
  esTemario?: boolean;
  /** Lleva créditos → sección CRÉDITOS. */
  esCreditos?: boolean;
  acta?: ActaConfig | null;
  notas?: Record<number, number>;
}

const NAVY = '#12294d';
const LEFT = 60, RIGHT = 1062, CONTENT_W = 1002;
const NOTA_EJEMPLO = 16;
const colNum = 60, colVal = 100, colUni = CONTENT_W - colNum - colVal;

export default function ActaPreview({
  unidades, programa, participante, documento, grupo, periodo, notaMinima = 11, mostrarQr = true, esTemario = false, esCreditos = false, acta, notas = {},
}: Props) {
  const conNotas = !esTemario;
  const notaItems = unidades.filter(u => (u.tipo ?? 'nota') !== 'credito');
  const credItems = unidades.filter(u => (u.tipo ?? 'nota') === 'credito');
  // Ejemplos si no hay ítems reales de esa clase.
  const notaFilas = notaItems.length ? notaItems : [{ id: -1, nombre: 'Examen parcial' }, { id: -2, nombre: 'Trabajo final' }];
  const credFilas = credItems.length ? credItems : [{ id: -3, nombre: 'Soporte Técnico', creditos: 1.5 }, { id: -4, nombre: 'Desarrollo Web', creditos: 2 }];

  const hayNotas = Object.keys(notas).length > 0;
  const notaDe = (u: ActaUnidad) => hayNotas ? (notas[u.id] != null ? Number(notas[u.id]).toFixed(2) : '—') : NOTA_EJEMPLO.toFixed(2);
  const notasVals = notaFilas.map(u => notas[u.id]).filter((v): v is number => v != null);
  const promedio = hayNotas && notasVals.length ? notasVals.reduce((a, b) => a + b, 0) / notasVals.length : NOTA_EJEMPLO;
  const aprobado = promedio >= notaMinima;
  const totalCred = credFilas.reduce((s, u) => s + Number(u.creditos ?? 0), 0);

  const a = acta ?? {};
  mostrarQr = mostrarQr && a.mostrarQr !== false;
  const titulo = (a.titulo && a.titulo.trim()) || ((conNotas && esCreditos) ? 'ACTA DE NOTAS Y CRÉDITOS' : conNotas ? 'ACTA DE NOTAS' : (esCreditos ? 'ACTA DE CRÉDITOS' : 'TEMARIO DEL PROGRAMA'));
  const dosSecciones = conNotas && esCreditos;

  const infos: [string, string][] = [
    ['Participante:', participante || 'Ana María Torres López'],
    ...(a.mostrarDocumento !== false ? [['Documento:', documento || '12345678'] as [string, string]] : []),
    ['Programa:',     programa || 'Nombre del programa'],
    ...(a.mostrarGrupo !== false ? [['Grupo:', grupo || 'Grupo 2026 - 1'] as [string, string]] : []),
    ...(a.mostrarPeriodo !== false ? [['Periodo:', periodo || '—'] as [string, string]] : []),
  ];

  // Construcción secuencial de elementos (y en px).
  const el: JSX.Element[] = [];
  let y = 106 + infos.length * 16 + 16;   // tras el bloque de datos
  const rowH = 32;

  const seccion = (titulo: string | null, colLabel: string, filas: ActaUnidad[], valueHeader: string, valueFn: ((u: ActaUnidad) => string) | null) => {
    if (titulo) {
      el.push(<div key={`t${y}`} style={{ position: 'absolute', left: LEFT, top: y, fontSize: 13, fontWeight: 700, color: NAVY }}>{titulo}</div>);
      y += 18;
    }
    el.push(
      <div key={`h${y}`} style={{ position: 'absolute', left: LEFT, top: y, width: CONTENT_W, height: rowH, background: NAVY }}>
        <span style={{ position: 'absolute', left: 14, top: 9, fontSize: 12, fontWeight: 700, color: '#fff' }}>N°</span>
        <span style={{ position: 'absolute', left: colNum + 14, top: 9, fontSize: 12, fontWeight: 700, color: '#fff' }}>{colLabel}</span>
        {valueFn && <span style={{ position: 'absolute', left: colNum + colUni, top: 9, width: colVal - 14, fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'right' }}>{valueHeader}</span>}
      </div>,
    );
    y += rowH;
    filas.forEach((u, i) => {
      el.push(
        <div key={`r${u.id}-${y}`} style={{ position: 'absolute', left: LEFT, top: y, width: CONTENT_W, height: rowH, background: i % 2 === 0 ? '#fff' : '#f6f8fb' }}>
          <span style={{ position: 'absolute', left: 14, top: 8, fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{i + 1}</span>
          <span style={{ position: 'absolute', left: colNum + 14, top: 8, width: colUni - 28, fontSize: 13, color: '#0f172a' }}>{u.nombre}</span>
          {valueFn && <span style={{ position: 'absolute', left: colNum + colUni, top: 8, width: colVal - 14, fontSize: 13, fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>{valueFn(u)}</span>}
        </div>,
      );
      y += rowH;
    });
  };

  if (conNotas) {
    seccion(dosSecciones ? 'NOTAS' : null, 'EVALUACIÓN', notaFilas, 'NOTA', notaDe);
    y += 14;
    el.push(<div key={`pm${y}`} style={{ position: 'absolute', left: LEFT, top: y, fontSize: 13, color: '#0f172a' }}>Promedio final: <b>{promedio.toFixed(2)}</b></div>);
    el.push(<div key={`nm${y}`} style={{ position: 'absolute', left: LEFT, top: y + 16, fontSize: 11, color: '#94a3b8' }}>(Nota mínima de aprobación: {notaMinima.toFixed(2)} · escala 0–20)</div>);
    el.push(<div key={`cd${y}`} style={{ position: 'absolute', left: LEFT, top: y + 32, fontSize: 15, fontWeight: 700, color: aprobado ? '#15803d' : '#b91c1c' }}>Condición: {aprobado ? 'APROBADO' : 'DESAPROBADO'}</div>);
    y += 56;
  } else {
    seccion(dosSecciones ? 'TEMARIO' : null, 'DETALLE', notaFilas, '', null);
    y += 10;
  }

  if (esCreditos) {
    seccion(dosSecciones ? 'CRÉDITOS' : null, 'CURSO / MÓDULO', credFilas, 'CRÉD.', u => String(Number(u.creditos ?? 0)));
    y += 12;
    el.push(<div key={`tc${y}`} style={{ position: 'absolute', left: LEFT, top: y, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Total de créditos: {totalCred}</div>);
    y += 24;
  }

  return (
    <div style={{ position: 'absolute', inset: 0, width: W, height: H, background: '#fff', fontFamily: 'Helvetica, Arial, sans-serif', color: '#0f172a', pointerEvents: 'none' }}>
      {/* Título */}
      <div style={{ position: 'absolute', left: LEFT, top: 46, width: CONTENT_W, textAlign: 'center', fontSize: 26, fontWeight: 700, color: NAVY, letterSpacing: 0.5 }}>{titulo}</div>
      <div style={{ position: 'absolute', left: LEFT, top: 88, width: CONTENT_W, borderTop: '1px solid #d7dde5' }} />

      {mostrarQr && (
        <div style={{ position: 'absolute', left: RIGHT - 80, top: 106, width: 80, height: 80, background: '#eef2f7', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#94a3b8', fontFamily: '"Courier New", monospace' }}>QR</div>
      )}

      {/* Datos */}
      {infos.map(([label, value], i) => (
        <div key={i} style={{ position: 'absolute', left: LEFT, top: 106 + i * 16, width: CONTENT_W, height: 16 }}>
          <span style={{ position: 'absolute', left: 0, top: 0, width: 133, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{label}</span>
          <span style={{ position: 'absolute', left: 157, top: 0, width: mostrarQr ? 749 : 845, fontSize: 13, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
        </div>
      ))}

      {el}

      {/* Texto extra */}
      {a.textoExtra && a.textoExtra.trim() && (
        <div style={{ position: 'absolute', left: LEFT, top: y + 10, width: CONTENT_W, fontSize: 11, color: '#475569' }}>{a.textoExtra.trim()}</div>
      )}
    </div>
  );
}
