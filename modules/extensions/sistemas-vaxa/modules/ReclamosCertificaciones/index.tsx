'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import {
  BookOpen, Loader2, CheckCircle, CheckCircle2, AlertCircle, AlertTriangle, Clock, Download, Eye, X, ClipboardList, FileText,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import BotonVolver from '../../shared/components/BotonVolver';
import Pager from '../../shared/components/Pager';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';
import { ApiError, imgUrl } from '@/lib/api/client';
import { reclamosApi, type Reclamo, type EstadoReclamo, type ReclamoHito, type ReclamoAdjunto, REC_ESTADO } from '../../shared/api/reclamos.admin.api';

const fmtHito = (s: string | null) =>
  (s ? new Date(s.replace(' ', 'T')).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

const DOC_LABEL: Record<string, string> = { '1': 'DNI', '4': 'C.E.', '7': 'Pasaporte' };

const fmt = (s: string | null) =>
  (s ? new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const ESTADO_STYLE: Record<EstadoReclamo, { bg: string; fg: string }> = {
  PENDIENTE:  { bg: '#FFFBEB', fg: '#B45309' },
  EN_PROCESO: { bg: '#EFF6FF', fg: '#1D4ED8' },
  ATENDIDO:   { bg: '#ECFDF5', fg: '#047857' },
  CERRADO:    { bg: '#F1F5F9', fg: '#475569' },
};

const ESTADOS: EstadoReclamo[] = ['PENDIENTE', 'EN_PROCESO', 'ATENDIDO', 'CERRADO'];
// Tope de la respuesta oficial: calibrado para que entre en la caja del PDF
// (Hoja de Reclamación). La observación de avance va a la línea de tiempo
// (columna nota VARCHAR(500)), así que se limita a 500 para no truncar en BD.
const MAX_RESPUESTA = 450;
const MAX_NOTA = 500;
const cap = (e: string) => e.charAt(0) + e.slice(1).toLowerCase().replace('_', ' ');

/** ¿Está vencido el plazo de respuesta (15 días hábiles) y aún no se responde? */
const vencido = (r: Reclamo) =>
  !r.respondido_at && !!r.fecha_limite && new Date(`${r.fecha_limite}T23:59:59`) < new Date();

export default function ReclamosCertificaciones({ tenantId }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [filas, setFilas] = useState<Reclamo[]>([]);
  const [filtro, setFiltro] = useState<EstadoReclamo | 'TODOS'>('TODOS');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState<Reclamo | null>(null);
  const [pdfCargando, setPdfCargando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setFilas(await reclamosApi.list());
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        authStorage.clearAllSessions(); navigate(tenantPath(tenantId, '/login'));
      }
    } finally { setLoading(false); }
  }, [tenantId, navigate]);

  useEffect(() => {
    if (localStorage.getItem(`auth_${tenantId}`) !== 'true' || !authStorage.getToken('vaxa')) {
      navigate(tenantPath(tenantId, '/login')); return;
    }
    try { setUsuario(JSON.parse(localStorage.getItem(`auth_user_${tenantId}`) ?? 'null')); } catch { /* noop */ }
    cargar();
  }, [tenantId, navigate, cargar]);

  const verPdf = async (r: Reclamo) => {
    if (pdfCargando) return;
    setPdfCargando(r.id);
    try {
      const blob = await reclamosApi.pdfBlob(r.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch { /* noop */ } finally { setPdfCargando(null); }
  };

  if (!usuario) return null;

  const pendientes = filas.filter(f => f.estado === 'PENDIENTE').length;
  const vencidos = filas.filter(vencido).length;
  const visibles = filtro === 'TODOS' ? filas : filas.filter(f => f.estado === filtro);

  const POR_PAGINA = 12;
  const pages = Math.max(1, Math.ceil(visibles.length / POR_PAGINA));
  const pageSafe = Math.min(page, pages);
  const filasPagina = visibles.slice((pageSafe - 1) * POR_PAGINA, pageSafe * POR_PAGINA);

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa tenantId={tenantId} usuario={usuario}
        config={{ name: 'Sistemas Vaxa', primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }} />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        <BotonVolver to={tenantPath(tenantId, '/certificaciones')} />

        <div className="mb-6 flex items-end justify-between gap-4 page-enter">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>INDECOPI</p>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Libro de Reclamaciones</h1>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>
              {pendientes} pendiente{pendientes === 1 ? '' : 's'} · {filas.length} en total
              {vencidos > 0 && <span style={{ color: '#B91C1C' }}> · {vencidos} fuera de plazo</span>}
            </p>
          </div>
        </div>

        {/* Filtro por estado */}
        <div className="flex gap-2 mb-4 flex-wrap page-enter">
          {(['TODOS', ...ESTADOS] as const).map((e) => (
            <button key={e} onClick={() => { setFiltro(e); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
              style={filtro === e
                ? { background: '#0D0E12', color: '#fff' }
                : { background: '#fff', color: '#64748B', border: '1px solid #EEECE6' }}>
              {e === 'TODOS' ? 'Todos' : cap(e)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="rounded-2xl overflow-hidden page-enter" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
            {visibles.length === 0 ? (
              <div className="py-16 text-center">
                <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
                <p className="text-[13px]" style={{ color: '#9CA3AF' }}>No hay reclamos {filtro !== 'TODOS' ? `en estado "${cap(filtro)}"` : 'registrados'}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>
                      <th className="text-left px-5 py-3">N° Hoja</th>
                      <th className="text-left py-3">Consumidor</th>
                      <th className="text-left py-3">Tipo</th>
                      <th className="text-left py-3">Fecha</th>
                      <th className="text-left py-3">Vence</th>
                      <th className="text-left py-3 pl-4">Estado</th>
                      <th className="text-right px-5 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasPagina.map((r) => {
                      const st = ESTADO_STYLE[r.estado];
                      const fueraPlazo = vencido(r);
                      return (
                        <tr key={r.id} style={{ borderTop: '1px solid #F2F0EA' }}>
                          <td className="px-5 py-3">
                            <p className="font-semibold tabular-nums" style={{ color: '#0D0E12' }}>{r.numero}</p>
                          </td>
                          <td className="py-3">
                            <p className="truncate max-w-[200px]" style={{ color: '#374151' }}>{r.consumidor_nombre}</p>
                            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                              {DOC_LABEL[r.consumidor_tipo_doc] ?? 'Doc.'} {r.consumidor_num_doc}
                            </p>
                          </td>
                          <td className="py-3">
                            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                              style={r.tipo === 'RECLAMO' ? { background: '#FEF2F2', color: '#B91C1C' } : { background: '#FFF7ED', color: '#C2410C' }}>
                              {r.tipo_nombre}
                            </span>
                          </td>
                          <td className="py-3 tabular-nums" style={{ color: '#64748B' }}>{fmt(r.created_at)}</td>
                          <td className="py-3 tabular-nums" style={{ color: fueraPlazo ? '#B91C1C' : '#64748B' }}>
                            <span className="inline-flex items-center gap-1">
                              {fueraPlazo && <AlertTriangle className="w-3.5 h-3.5" />}{fmt(r.fecha_limite)}
                            </span>
                          </td>
                          <td className="py-3 pl-4">
                            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.fg }}>
                              {r.estado_nombre}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-3 flex-wrap">
                              <button onClick={() => setDetalle(r)} title="Ver y responder"
                                className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70" style={{ color: '#059669' }}>
                                <Eye className="w-3.5 h-3.5" /> {r.respondido_at ? 'Ver' : 'Responder'}
                              </button>
                              <button onClick={() => verPdf(r)} disabled={pdfCargando === r.id} title="Ver PDF"
                                className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70 disabled:opacity-50" style={{ color: '#B45309' }}>
                                {pdfCargando === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-5 pb-1">
                  <Pager page={pageSafe} pages={pages} total={visibles.length} onPage={setPage} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {detalle && (
        <DetalleModal reclamo={detalle} onClose={() => setDetalle(null)} onDone={() => { setDetalle(null); cargar(); }} />
      )}
    </div>
  );
}

/** Modal: ve el detalle completo del reclamo y registra la respuesta del proveedor. */
function DetalleModal({ reclamo, onClose, onDone }: {
  reclamo: Reclamo; onClose: () => void; onDone: () => void;
}) {
  const [estado, setEstado] = useState<EstadoReclamo>(reclamo.estado);
  const [texto, setTexto] = useState(reclamo.respuesta ?? '');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);
  const [hitos, setHitos] = useState<ReclamoHito[]>([]);
  const [adjuntos, setAdjuntos] = useState<ReclamoAdjunto[]>([]);

  useEffect(() => { reclamosApi.historial(reclamo.id).then(setHitos).catch(() => setHitos([])); }, [reclamo.id]);
  useEffect(() => { reclamosApi.get(reclamo.id).then(r => setAdjuntos(r.adjuntos ?? [])).catch(() => setAdjuntos([])); }, [reclamo.id]);

  // Cuando el estado elegido es final (Atendido/Cerrado), el campo de texto ES la
  // respuesta oficial (va al PDF). En estados de avance es solo una observación.
  const esFinal = estado === 'ATENDIDO' || estado === 'CERRADO';
  const cambioEstado = estado !== reclamo.estado;

  const guardar = async () => {
    if (enviando) return;
    if (esFinal && !texto.trim()) { setResultado({ ok: false, msg: 'Escribe la respuesta oficial para el consumidor.' }); return; }
    if (!esFinal && !cambioEstado && !texto.trim()) { setResultado({ ok: false, msg: 'Cambia el estado o escribe una observación.' }); return; }
    setEnviando(true); setResultado(null);
    try {
      if (esFinal) await reclamosApi.responder(reclamo.id, texto.trim(), REC_ESTADO[estado]);
      else await reclamosApi.cambiarEstado(reclamo.id, REC_ESTADO[estado], texto.trim() || undefined);
      setResultado({ ok: true, msg: 'Actualizado.' });
      setTimeout(onDone, 900);
    } catch (e) {
      setResultado({ ok: false, msg: (e as Error).message });
    } finally { setEnviando(false); }
  };

  const Campo = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#B0A898' }}>{label}</p>
      <p className="text-[13px]" style={{ color: '#0D0E12' }}>{children}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)' }}>
      <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[94vh] overflow-y-auto" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>{reclamo.numero}</h2>
            <p className="text-[12px]" style={{ color: '#9CA3AF' }}>
              {reclamo.tipo_nombre} · {reclamo.bien_tipo_nombre} · registrado el {fmt(reclamo.created_at)}
            </p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#9CA3AF' }} /></button>
        </div>

        {/* Datos del consumidor y del bien */}
        <div className="grid grid-cols-2 gap-3 mt-4 p-4 rounded-xl" style={{ background: '#FAFAF8', border: '1px solid #F2F0EA' }}>
          <Campo label="Consumidor">{reclamo.consumidor_nombre}</Campo>
          <Campo label="Documento">{(DOC_LABEL[reclamo.consumidor_tipo_doc] ?? 'Doc.')} {reclamo.consumidor_num_doc}</Campo>
          <Campo label="Teléfono">{reclamo.consumidor_telefono || '—'}</Campo>
          <Campo label="Correo">{reclamo.consumidor_email || '—'}</Campo>
          <div className="col-span-2"><Campo label="Domicilio">{reclamo.consumidor_domicilio || '—'}</Campo></div>
          {reclamo.es_menor && (
            <div className="col-span-2"><Campo label="Apoderado (menor de edad)">
              {reclamo.apoderado_nombre || '—'}{reclamo.apoderado_num_doc ? ` — ${reclamo.apoderado_num_doc}` : ''}
            </Campo></div>
          )}
          <Campo label={reclamo.bien_tipo_nombre}>{reclamo.bien_descripcion || '—'}</Campo>
          <Campo label="Monto reclamado">{reclamo.bien_monto != null ? `S/ ${reclamo.bien_monto.toFixed(2)}` : '—'}</Campo>
        </div>

        {/* Detalle y pedido */}
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#B0A898' }}>Detalle</p>
            <p className="text-[13px] whitespace-pre-wrap p-3 rounded-xl" style={{ color: '#374151', background: '#FAFAF8', border: '1px solid #F2F0EA' }}>{reclamo.detalle}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#B0A898' }}>Pedido del consumidor</p>
            <p className="text-[13px] whitespace-pre-wrap p-3 rounded-xl" style={{ color: '#374151', background: '#FAFAF8', border: '1px solid #F2F0EA' }}>{reclamo.pedido}</p>
          </div>
        </div>

        {/* Adjuntos que envió el consumidor (pruebas/evidencia) */}
        <div className="mt-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#B0A898' }}>
            Archivos adjuntos (pruebas del consumidor){adjuntos.length > 0 ? ` · ${adjuntos.length}` : ''}
          </p>
          {adjuntos.length === 0 ? (
            <p className="text-[12px] p-3 rounded-xl" style={{ color: '#9CA3AF', background: '#FAFAF8', border: '1px solid #F2F0EA' }}>
              El consumidor no adjuntó archivos.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {adjuntos.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-xl" style={{ background: '#FAFAF8', border: '1px solid #F2F0EA' }}>
                  <span className="text-[12.5px] truncate flex items-center gap-2" style={{ color: '#374151' }}>
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#059669' }} /> {a.nombre}
                  </span>
                  <a href={imgUrl(a.ruta)} target="_blank" rel="noopener noreferrer"
                    className="text-[12px] font-semibold flex items-center gap-1 flex-shrink-0 hover:opacity-70" style={{ color: '#1D4ED8' }}>
                    <Eye className="w-3.5 h-3.5" /> Ver
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Plazo */}
        <div className="mt-4 flex items-center gap-2 text-[12px]" style={{ color: vencido(reclamo) ? '#B91C1C' : '#64748B' }}>
          <Clock className="w-4 h-4" />
          {reclamo.respondido_at
            ? `Respondido el ${fmt(reclamo.respondido_at)}`
            : `Plazo de respuesta (15 días hábiles): vence el ${fmt(reclamo.fecha_limite)}${vencido(reclamo) ? ' — FUERA DE PLAZO' : ''}`}
        </div>

        {/* Línea de tiempo (registro de cada estado con su observación) */}
        {hitos.length > 0 && (
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid #EEECE6' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#B0A898' }}>Línea de tiempo</p>
            <div className="relative pl-6">
              {hitos.map((h, i) => {
                const ultimo = i === hitos.length - 1;
                return (
                  <div key={i} className="relative pb-4 last:pb-0">
                    {!ultimo && <span className="absolute left-[-14px] top-4 bottom-0 w-px" style={{ background: '#E5E7EB' }} />}
                    <span className="absolute left-[-20px] top-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                      style={{ background: ultimo ? '#059669' : '#D1D5DB' }}>
                      {ultimo && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </span>
                    <p className="text-[13px] font-semibold" style={{ color: '#0D0E12' }}>{h.estado_nombre}</p>
                    {h.nota && <p className="text-[12px]" style={{ color: '#6B7280' }}>{h.nota}</p>}
                    <p className="text-[11px] tabular-nums" style={{ color: '#9CA3AF' }}>{fmtHito(h.fecha)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gestión del reclamo — TODO en un solo lugar (elegir estado + su texto). */}
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid #EEECE6' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#B0A898' }}>Actualizar reclamo</p>

          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#374151' }}>Estado</label>
          <select value={estado} onChange={e => setEstado(e.target.value as EstadoReclamo)} className="sv-input w-full text-[13px]">
            {ESTADOS.map(es => <option key={es} value={es}>{cap(es)}</option>)}
          </select>

          <label className="block text-[11px] font-semibold mt-3 mb-1.5" style={{ color: '#374151' }}>
            {esFinal ? 'Respuesta oficial al consumidor' : 'Observación'}
            <span className="font-normal" style={{ color: '#9CA3AF' }}>{esFinal ? ' (aparece en el PDF)' : ' (opcional, queda en la línea de tiempo)'}</span>
          </label>
          <textarea value={texto} onChange={e => setTexto(e.target.value.slice(0, esFinal ? MAX_RESPUESTA : MAX_NOTA))} rows={esFinal ? 4 : 3}
            maxLength={esFinal ? MAX_RESPUESTA : MAX_NOTA}
            placeholder={esFinal ? 'Describe la respuesta y las acciones adoptadas…' : 'Ej: se encargó el caso al área de soporte, se está evaluando…'}
            className="sv-input w-full text-[13px]" style={{ resize: 'vertical' }} />
          <p className="text-[11px] text-right mt-1" style={{ color: texto.length >= (esFinal ? MAX_RESPUESTA : MAX_NOTA) ? '#DC2626' : '#9CA3AF' }}>{texto.length}/{esFinal ? MAX_RESPUESTA : MAX_NOTA}</p>
          {esFinal && <p className="text-[10.5px] mt-1" style={{ color: '#059669' }}>Esta respuesta se le comunica al consumidor y figura en el PDF de la Hoja de Reclamación.</p>}

          {resultado && (
            <div className="mt-4 p-3 rounded-xl flex items-center gap-2 text-[12.5px]"
              style={resultado.ok ? { background: '#ECFDF5', color: '#047857' } : { background: '#FEF2F2', color: '#B91C1C' }}>
              {resultado.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {resultado.msg}
            </div>
          )}

          <button onClick={guardar} disabled={enviando} className="sv-btn sv-btn-primary w-full py-2.5 mt-4">
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {enviando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
