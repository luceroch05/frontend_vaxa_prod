import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, TrendingUp, Calendar, Activity, Home, CheckCircle } from '@/components/ui/icon';
import { imgUrl } from '@/lib/api/client';
import { terapApi, type PortalData, type PortalObjetivo, type PortalTarea } from '../../shared/api/terapeutico.api';

const TEAL = '#0F766E';

/* Portal PÚBLICO del apoderado (sin login). El token del enlace es la credencial. */
export default function PortalPadres() {
  const { token } = useParams<{ empresa: string; token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [tareas, setTareas] = useState<PortalTarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    terapApi.portalData(token)
      .then(d => { setData(d); setTareas(d.tareas ?? []); })
      .catch((e: any) => setError(e?.message ?? 'No se pudo cargar el portal'))
      .finally(() => setLoading(false));
  }, [token]);

  const marcarTarea = async (t: PortalTarea) => {
    const nuevo = !t.cumplida;
    setTareas(prev => prev.map(x => x.id === t.id ? { ...x, cumplida: nuevo ? 1 : 0 } : x));  // optimista
    try { await terapApi.portalMarcarTarea(token!, t.id, nuevo); }
    catch { setTareas(prev => prev.map(x => x.id === t.id ? { ...x, cumplida: nuevo ? 0 : 1 } : x)); }  // revierte si falla
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F4F3' }}><Loader2 size={26} className="animate-spin" style={{ color: TEAL }} /></div>;

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: '#F2F4F3' }}>
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#FEE2E2', color: '#B91C1C' }}>✕</div>
        <p className="text-[15px] font-bold" style={{ color: '#0E1A1A' }}>Enlace no disponible</p>
        <p className="text-[13px] mt-1 max-w-xs" style={{ color: '#6B7280' }}>Este enlace no es válido o fue desactivado. Pídele al centro uno nuevo.</p>
      </div>
    );
  }

  const { centro, paciente, objetivos, citas_proximas } = data;
  const nombre = `${paciente.nombres.split(' ')[0]} ${paciente.apellidos.split(' ')[0]}`;
  const logradas = objetivos.filter(o => o.estado_codigo === 'LOGRADO').length;

  return (
    <div className="min-h-screen" style={{ background: '#F2F4F3' }}>
      {/* Cabecera del centro */}
      <header className="px-4 pt-6 pb-8" style={{ background: TEAL, color: '#fff' }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          {centro.logo_url
            ? <img src={imgUrl(centro.logo_url)} alt={centro.razon_social ?? ''} className="h-11 w-11 rounded-xl object-contain bg-white p-1" />
            : <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}><Activity size={20} /></div>}
          <div className="leading-tight">
            <p className="text-[11px] tracking-widest" style={{ color: '#A7F3D0' }}>PORTAL DE SEGUIMIENTO</p>
            <p className="text-[15px] font-bold capitalize">{centro.razon_social ?? 'Centro terapéutico'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 -mt-4 pb-12">
        {/* Tarjeta del niño */}
        <div className="rounded-2xl bg-white p-4 mb-3 shadow-sm" style={{ border: '1px solid #E5E9E7' }}>
          <p className="text-[12px]" style={{ color: '#6B7280' }}>Progreso de</p>
          <p className="text-[20px] font-bold" style={{ color: '#0E1A1A' }}>{nombre}</p>
          {objetivos.length > 0 && (
            <p className="text-[12.5px] mt-1" style={{ color: TEAL }}>
              {logradas > 0 ? `🎉 ${logradas} objetivo${logradas > 1 ? 's' : ''} logrado${logradas > 1 ? 's' : ''} · ` : ''}
              {objetivos.length} objetivo{objetivos.length > 1 ? 's' : ''} en seguimiento
            </p>
          )}
        </div>

        {/* Objetivos + progreso */}
        <SectionTitle icon={<TrendingUp size={15} />} text="Avance del tratamiento" />
        {objetivos.length === 0 ? (
          <EmptyCard text="Aún no hay objetivos de seguimiento. El terapeuta los irá registrando." />
        ) : (
          <div className="space-y-3 mb-5">
            {objetivos.map(o => <ObjetivoPortal key={o.id} o={o} />)}
          </div>
        )}

        {/* Tareas para casa */}
        {tareas.length > 0 && (
          <>
            <SectionTitle icon={<Home size={15} />} text="Tareas para casa" />
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden mb-5" style={{ border: '1px solid #E5E9E7' }}>
              {tareas.map((t, i) => {
                const hecha = !!t.cumplida;
                const audio = (t.adjunto_mime ?? '').startsWith('audio');
                const imagen = (t.adjunto_mime ?? '').startsWith('image');
                return (
                  <div key={t.id} className="flex items-start gap-3 p-3" style={{ borderTop: i === 0 ? 'none' : '1px solid #F1F5F4' }}>
                    <button onClick={() => marcarTarea(t)} className="shrink-0 mt-0.5" title="Marcar/desmarcar">
                      {hecha
                        ? <CheckCircle size={22} style={{ color: '#15803D' }} />
                        : <span className="inline-block h-[22px] w-[22px] rounded-full" style={{ border: '2px solid #CBD5D1' }} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <button onClick={() => marcarTarea(t)} className="text-left w-full">
                        <p className="text-[14px] font-semibold" style={{ color: hecha ? '#94A3B8' : '#0E1A1A', textDecoration: hecha ? 'line-through' : 'none' }}>{t.descripcion}</p>
                        {t.detalle && <p className="text-[12.5px]" style={{ color: '#6B7280' }}>{t.detalle}</p>}
                        {t.fecha_limite && <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>Para el {new Date(t.fecha_limite).toLocaleDateString()}</p>}
                      </button>
                      {t.adjunto_ruta && (
                        <div className="mt-2">
                          {audio
                            ? <audio controls src={imgUrl(t.adjunto_ruta)} style={{ height: 36, width: '100%', maxWidth: 280 }} />
                            : imagen
                              ? <a href={imgUrl(t.adjunto_ruta)} target="_blank" rel="noopener noreferrer"><img src={imgUrl(t.adjunto_ruta)} alt="" className="rounded-lg max-h-40" style={{ border: '1px solid #E5E9E7' }} /></a>
                              : <a href={imgUrl(t.adjunto_ruta)} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-semibold" style={{ color: TEAL }}>📎 {t.adjunto_nombre}</a>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Próximas citas */}
        <SectionTitle icon={<Calendar size={15} />} text="Próximas citas" />
        {citas_proximas.length === 0 ? (
          <EmptyCard text="No hay próximas citas agendadas." />
        ) : (
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
            {citas_proximas.map((c, i) => {
              const d = new Date(c.inicio);
              return (
                <div key={i} className="flex items-center gap-3 p-3" style={{ borderTop: i === 0 ? 'none' : '1px solid #F1F5F4' }}>
                  <div className="h-11 w-11 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ background: '#CCFBF1', color: TEAL }}>
                    <span className="text-[15px] font-bold leading-none">{d.getDate()}</span>
                    <span className="text-[9px] uppercase">{d.toLocaleDateString(undefined, { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold" style={{ color: '#0E1A1A' }}>
                      {d.toLocaleDateString(undefined, { weekday: 'long' })} · {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[12px] truncate" style={{ color: '#6B7280' }}>
                      {c.servicio_nombre ?? 'Terapia'}{c.terapeuta_nombre ? ` · ${c.terapeuta_nombre}` : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-[11px] mt-8" style={{ color: '#9CA3AF' }}>
          Seguimiento provisto por <b style={{ color: '#6B7280' }} className="capitalize">{centro.razon_social ?? 'el centro'}</b><br />
          con la plataforma <b style={{ color: TEAL }}>VAXA</b>
        </p>
      </main>
    </div>
  );
}

function ObjetivoPortal({ o }: { o: PortalObjetivo }) {
  const meta = Number(o.meta) || 0;
  const actual = o.ultimo_valor != null ? Number(o.ultimo_valor) : null;
  const pct = actual != null && meta > 0 ? Math.min(100, Math.round((actual / meta) * 100)) : 0;
  const logrado = o.estado_codigo === 'LOGRADO';

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: '1px solid #E5E9E7' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[13.5px] font-semibold" style={{ color: '#0E1A1A' }}>{o.descripcion}</p>
        {logrado && <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: '#DCFCE7', color: '#15803D' }}>Logrado ✓</span>}
      </div>
      <div className="flex items-center gap-3 mb-1">
        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#EEF2F1' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#0F766E,#10B981)' }} />
        </div>
        <span className="text-[12px] font-bold shrink-0" style={{ color: '#0E1A1A' }}>{pct}%</span>
      </div>
      {o.avances.length > 1 && <MiniCurva puntos={o.avances} meta={meta} />}
    </div>
  );
}

/** Curva simple de avance (móvil) construida con los puntos reales. */
function MiniCurva({ puntos, meta }: { puntos: { valor: number; fecha: string }[]; meta: number }) {
  const W = 300, H = 90, padT = 8, padB = 6, padX = 4;
  const vals = puntos.map(p => Number(p.valor));
  const maxY = Math.max(meta, ...vals) * 1.05 || 1;
  const x = (i: number) => padX + (i / (puntos.length - 1)) * (W - padX * 2);
  const y = (v: number) => padT + (1 - v / maxY) * (H - padT - padB);
  const linea = puntos.map((p, i) => `${x(i)},${y(Number(p.valor))}`).join(' ');
  const area = `${x(0)},${H - padB} ${linea} ${x(puntos.length - 1)},${H - padB}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="mt-2">
      {meta <= maxY && <line x1={padX} y1={y(meta)} x2={W - padX} y2={y(meta)} stroke="#10B981" strokeDasharray="4 4" opacity="0.6" />}
      <polygon points={area} fill="#0F766E" opacity="0.08" />
      <polyline fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinejoin="round" points={linea} />
      {puntos.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(Number(p.valor))} r={i === puntos.length - 1 ? 4 : 2.5}
          fill="#0F766E" stroke="#fff" strokeWidth={i === puntos.length - 1 ? 2 : 0} />
      ))}
    </svg>
  );
}

function SectionTitle({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2 mt-1 px-1" style={{ color: '#475569' }}>
      <span style={{ color: TEAL }}>{icon}</span>
      <span className="text-[12px] font-bold uppercase tracking-wider">{text}</span>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return <div className="rounded-2xl bg-white p-5 text-center text-[12.5px] shadow-sm mb-5" style={{ border: '1px solid #E5E9E7', color: '#94A3B8' }}>{text}</div>;
}
