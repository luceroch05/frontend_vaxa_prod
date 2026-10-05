import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Loader2, Plus, Pencil, Save, Trash2, ClipboardList, Clock } from '@/components/ui/icon';
import { terapApi, type Motivo, type MotivoTipo, type Servicio } from '../../shared/api/terapeutico.api';
import { Overlay, Cabecera, Campo } from '../../shared/finanzas';

const TEAL = '#0F766E';
const soles = (n: number | string) => `S/ ${Number(n || 0).toFixed(2)}`;
const CARD: React.CSSProperties = { border: '1px solid #EAEFEE', boxShadow: '0 1px 2px rgba(16,48,44,.04), 0 12px 32px -14px rgba(16,48,44,.16)' };

/** Catálogo de tipos de motivo, con su etiqueta y color de badge. */
const TIPOS: { v: MotivoTipo; label: string; bg: string; fg: string }[] = [
  { v: 'sesion',     label: 'Sesión',     bg: '#CCFBF1', fg: '#0F766E' },
  { v: 'grupal',     label: 'Grupal',     bg: '#DBEAFE', fg: '#1D4ED8' },
  { v: 'evaluacion', label: 'Evaluación', bg: '#FEF3C7', fg: '#B45309' },
  { v: 'informe',    label: 'Informe',    bg: '#F3E8FF', fg: '#7E22CE' },
  { v: 'otro',       label: 'Otro',       bg: '#F1F5F4', fg: '#475569' },
];
const tipoInfo = (t: string) => TIPOS.find(x => x.v === t) ?? TIPOS[4];

/**
 * Motivos de cita por servicio (Evaluación, Sesión individual, Informe…), cada uno
 * con su precio y duración. Es el nivel intermedio entre el ÁREA (servicio) y la
 * tarifa: al agendar/vender se elige un motivo. Vive dentro de la página de Servicios.
 */
export default function MotivosCentro({ slug, servicios }: { slug: string; servicios: Servicio[] }) {
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editar, setEditar] = useState<Motivo | null>(null);
  const [crear, setCrear] = useState(false);

  const cargar = () => {
    setLoading(true);
    terapApi.listMotivos(slug, undefined, true).then(setMotivos).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(cargar, [slug]);

  // Agrupa los motivos por servicio, respetando el orden de los servicios activos.
  const grupos = useMemo(() => servicios
    .filter(s => s.activo)
    .map(s => ({ servicio: s, items: motivos.filter(m => m.servicio_id === s.id) }))
    .filter(g => g.items.length > 0), [servicios, motivos]);

  const tras = (m: Motivo) => { setMotivos(prev => prev.some(x => x.id === m.id) ? prev.map(x => x.id === m.id ? m : x) : [...prev, m]); };
  const toggle = async (m: Motivo) => { tras(await terapApi.updateMotivo(slug, m.id, { activo: !m.activo })); };
  const borrar = async (m: Motivo) => {
    if (!confirm(`¿Eliminar el motivo "${m.nombre}"? Si ya tiene citas o ventas, se desactivará en vez de borrarse.`)) return;
    const r = await terapApi.deleteMotivo(slug, m.id);
    if (r.modo === 'eliminado') setMotivos(prev => prev.filter(x => x.id !== m.id));
    else tras({ ...m, activo: 0 });
  };

  return (
    <div className="rounded-2xl bg-white p-5" style={CARD}>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#CCFBF1', color: TEAL }}>
            <ClipboardList size={16} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: '#0E1A1A' }}>Motivos de cita</h2>
            <p className="text-[12px]" style={{ color: '#6B7280' }}>Tipos de atención por servicio, cada uno con su precio y duración</p>
          </div>
        </div>
        <button onClick={() => setCrear(true)} disabled={servicios.filter(s => s.activo).length === 0}
          className="px-4 py-2 rounded-xl text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50" style={{ background: TEAL }}>
          <Plus size={14} /> Agregar motivo
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 size={20} className="animate-spin" style={{ color: TEAL }} /></div>
      ) : servicios.filter(s => s.activo).length === 0 ? (
        <p className="text-[12.5px]" style={{ color: '#94A3B8' }}>Primero crea un servicio (área) arriba; luego podrás darle sus motivos de cita.</p>
      ) : grupos.length === 0 ? (
        <p className="text-[12.5px]" style={{ color: '#94A3B8' }}>Aún no hay motivos. Agrega el primero (ej. «Evaluación», «Sesión individual», «Informe»).</p>
      ) : (
        <div className="space-y-4">
          {grupos.map(({ servicio, items }) => (
            <div key={servicio.id}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>{servicio.nombre}</p>
              <ul className="space-y-2">
                {items.map(m => {
                  const ti = tipoInfo(m.tipo);
                  return (
                    <li key={m.id} className="flex items-center justify-between gap-3 pl-0 pr-3 py-2.5 rounded-xl"
                      style={{ background: '#fff', border: '1px solid #EAEFEE', boxShadow: '0 6px 18px -14px rgba(16,48,44,.25)', opacity: m.activo ? 1 : 0.55 }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-1.5 self-stretch rounded-full" style={{ background: m.activo ? ti.fg : '#D4D4D4', minHeight: 32 }} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13.5px] font-semibold truncate" style={{ color: m.activo ? '#0E1A1A' : '#9CA3AF' }}>{m.nombre}</span>
                            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: ti.bg, color: ti.fg }}>{ti.label.toUpperCase()}</span>
                            {!m.consume_saldo && <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ background: '#F1F5F4', color: '#64748B' }}>no consume saldo</span>}
                          </div>
                          {m.descripcion && <p className="text-[11.5px] truncate" style={{ color: '#6B7280' }}>{m.descripcion}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: '#F1F5F4', color: '#475569' }}><Clock size={11} /> {m.duracion_min} min</span>
                        <span className="text-[14px] font-extrabold tabular-nums" style={{ color: TEAL }}>{soles(m.precio)}</span>
                        <button onClick={() => setEditar(m)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[#F1F5F4] transition-colors" style={{ color: '#64748B' }} title="Editar"><Pencil size={14} /></button>
                        <button onClick={() => toggle(m)} title={m.activo ? 'Activo' : 'Inactivo'}
                          className="relative inline-block h-6 w-11 rounded-full shrink-0 transition-colors" style={{ background: m.activo ? TEAL : '#D4D2CA' }}>
                          <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: m.activo ? '22px' : '2px' }} />
                        </button>
                        <button onClick={() => borrar(m)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[#FEF2F2] transition-colors" style={{ color: '#DC2626' }} title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {(crear || editar) && (
        <ModalMotivo
          slug={slug} servicios={servicios.filter(s => s.activo)} motivo={editar}
          onClose={() => { setCrear(false); setEditar(null); }}
          onSaved={m => { tras(m); setCrear(false); setEditar(null); }}
        />
      )}
    </div>
  );
}

/** Modal para crear / editar un motivo de cita. */
function ModalMotivo({ slug, servicios, motivo, onClose, onSaved }: {
  slug: string; servicios: Servicio[]; motivo: Motivo | null; onClose: () => void; onSaved: (m: Motivo) => void;
}) {
  const [servicioId, setServicioId] = useState(String(motivo?.servicio_id ?? servicios[0]?.id ?? ''));
  const [nombre, setNombre] = useState(motivo?.nombre ?? '');
  const [desc, setDesc] = useState(motivo?.descripcion ?? '');
  const [tipo, setTipo] = useState<MotivoTipo>(motivo?.tipo ?? 'sesion');
  const [precio, setPrecio] = useState(String(motivo?.precio ?? ''));
  const [dur, setDur] = useState(String(motivo?.duracion_min ?? 45));
  const [consume, setConsume] = useState(motivo ? !!motivo.consume_saldo : true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!servicioId) { setError('Elige el servicio (área) del motivo.'); return; }
    setSaving(true); setError(null);
    try {
      const data = {
        servicio_id: Number(servicioId), nombre: nombre.trim(), descripcion: desc || null,
        tipo, precio: Number(precio) || 0, duracion_min: Number(dur) || 45, consume_saldo: consume,
      };
      const m = motivo ? await terapApi.updateMotivo(slug, motivo.id, data) : await terapApi.createMotivo(slug, data);
      onSaved(m);
    } catch (err: any) { setError(err?.message ?? 'No se pudo guardar'); setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <Cabecera icon={<ClipboardList size={16} color="#fff" />} titulo={motivo ? 'Editar motivo' : 'Nuevo motivo de cita'} onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-4">
        <Campo label="Servicio (área) *">
          <select className="vx-input" value={servicioId} onChange={e => setServicioId(e.target.value)}>
            {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="Nombre del motivo *">
          <input className="vx-input" value={nombre} onChange={e => setNombre(e.target.value)} autoFocus placeholder="Ej. Evaluación, Sesión individual, Informe…" />
        </Campo>
        <Campo label="Descripción (opcional)">
          <input className="vx-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="¿Qué incluye?" />
        </Campo>
        <Campo label="Tipo">
          <div className="flex flex-wrap gap-2">
            {TIPOS.map(t => (
              <button key={t.v} type="button" onClick={() => setTipo(t.v)}
                className="text-[12.5px] px-3 py-1 rounded-full font-semibold transition"
                style={tipo === t.v ? { background: t.fg, color: '#fff' } : { background: t.bg, color: t.fg }}>
                {t.label}
              </button>
            ))}
          </div>
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Precio">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold" style={{ color: TEAL }}>S/</span>
              <input className="vx-input" style={{ paddingLeft: '2.2rem' }} type="number" min={0} step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" />
            </div>
          </Campo>
          <Campo label="Duración (min)">
            <input className="vx-input" type="number" min={5} step="5" value={dur} onChange={e => setDur(e.target.value)} placeholder="45" />
          </Campo>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <button type="button" onClick={() => setConsume(v => !v)} title={consume ? 'Consume saldo' : 'No consume saldo'}
            className="relative inline-block h-6 w-11 rounded-full shrink-0 transition-colors" style={{ background: consume ? TEAL : '#D4D2CA' }}>
            <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: consume ? '22px' : '2px' }} />
          </button>
          <span className="text-[12.5px]" style={{ color: '#374151' }}>Una cita de este motivo <b>descuenta saldo</b> de sesiones (desactívalo para evaluaciones/informes sueltos).</span>
        </label>
        {error && <p className="text-[12.5px] px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors hover:bg-[#E9EDEC]" style={{ background: '#F1F5F4', color: '#374151' }}>Cancelar</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: TEAL }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {motivo ? 'Guardar cambios' : 'Crear motivo'}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
