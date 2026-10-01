import { useEffect, useState, FormEvent } from 'react';
import { Loader2, Plus, Pencil, Save, Users, Activity, Layers } from '@/components/ui/icon';
import { authStorage } from '@/lib/auth';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import { terapApi, type Servicio, type Terapeuta } from '../../shared/api/terapeutico.api';
import { Overlay, Cabecera, Campo } from '../../shared/finanzas';

const TEAL = '#0F766E';
const gestiona = (rol?: string) => ['ADMINISTRADOR', 'ADMISION'].includes((rol ?? '').toUpperCase());

export default function Servicios() {
  const slug = useEmpresaSlug()!;
  const rol = authStorage.getUser(slug)?.rol;
  const puede = gestiona(rol);

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    Promise.all([
      terapApi.listServicios(slug, true),
      terapApi.listTerapeutas(slug),
    ]).then(([s, t]) => { setServicios(s); setTerapeutas(t); }).finally(() => setLoading(false));
  };
  useEffect(cargar, [slug]);

  if (!puede) return <p className="text-[13.5px]" style={{ color: '#6B7280' }}>No tienes permiso para gestionar servicios.</p>;
  if (loading) return <div className="p-10 flex justify-center"><Loader2 size={22} className="animate-spin" style={{ color: TEAL }} /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#0F766E,#14B8A6)', boxShadow: '0 8px 20px -6px rgba(15,118,110,0.5)' }}>
          <Activity size={20} color="#fff" />
        </div>
        <div>
          <h1 className="text-[21px] font-bold leading-tight" style={{ color: '#0E1A1A' }}>Servicios del centro</h1>
          <p className="text-[12.5px]" style={{ color: '#6B7280' }}>Define qué ofrece el centro y qué brinda cada terapeuta</p>
        </div>
      </div>

      <CatalogoServicios slug={slug} servicios={servicios} onChange={setServicios} />
      <TerapeutasServicios slug={slug} servicios={servicios.filter(s => s.activo)} terapeutas={terapeutas} />
    </div>
  );
}

/** Estilo de tarjeta premium reusado en esta página (borde claro + sombra suave). */
const CARD: React.CSSProperties = { border: '1px solid #EAEFEE', boxShadow: '0 1px 2px rgba(16,48,44,.04), 0 12px 32px -14px rgba(16,48,44,.16)' };

// ── Catálogo de servicios ──────────────────────────────────────────────────────
function CatalogoServicios({ slug, servicios, onChange }: {
  slug: string; servicios: Servicio[]; onChange: (s: Servicio[]) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [desc, setDesc] = useState('');
  const [precio, setPrecio] = useState('');
  const [dur, setDur] = useState('45');
  const [saving, setSaving] = useState(false);
  const [editar, setEditar] = useState<Servicio | null>(null);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);
    const s = await terapApi.createServicio(slug, { nombre, descripcion: desc || null, precio: Number(precio) || 0, duracion_min: Number(dur) || 45 });
    onChange([...servicios, s]); setNombre(''); setDesc(''); setPrecio(''); setDur('45'); setSaving(false);
  };
  const toggle = async (s: Servicio) => {
    const upd = await terapApi.updateServicio(slug, s.id, { activo: !s.activo });
    onChange(servicios.map(x => x.id === s.id ? upd : x));
  };

  return (
    <div className="space-y-5">
      {/* Panel para AGREGAR (blanco + acento en el chip, sin lavar de color) */}
      <div className="rounded-2xl bg-white p-5" style={CARD}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#14B8A6,#0F766E)', boxShadow: '0 6px 14px -6px rgba(15,118,110,0.6)' }}>
            <Plus size={16} color="#fff" />
          </div>
          <h2 className="text-[14px] font-bold" style={{ color: '#0E1A1A' }}>Agregar un servicio</h2>
        </div>
        <form onSubmit={crear} className="flex items-end gap-2 flex-wrap">
          <label className="flex-1 min-w-[160px]">
            <span className="block text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>Nombre *</span>
            <input className="vx-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Terapia de lenguaje" />
          </label>
          <label className="flex-1 min-w-[160px]">
            <span className="block text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>Descripción (opcional)</span>
            <input className="vx-input" value={desc} onChange={e => setDesc(e.target.value)} />
          </label>
          <label className="w-[110px]">
            <span className="block text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>Precio (S/)</span>
            <input className="vx-input" type="number" min={0} step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" />
          </label>
          <label className="w-[110px]">
            <span className="block text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>Duración (min)</span>
            <input className="vx-input" type="number" min={5} step="5" value={dur} onChange={e => setDur(e.target.value)} placeholder="45" />
          </label>
          <button type="submit" disabled={saving || !nombre.trim()} className="px-5 py-2 rounded-xl text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50" style={{ background: TEAL }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Agregar
          </button>
        </form>
      </div>

      {/* Lista de servicios */}
      <div className="rounded-2xl bg-white p-5" style={CARD}>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>Servicios · {servicios.length}</p>
        {servicios.length === 0 ? (
          <p className="text-[12.5px]" style={{ color: '#94A3B8' }}>Aún no hay servicios. Agrega el primero arriba.</p>
        ) : (
          <ul className="space-y-2.5">
            {servicios.map(s => (
              <li key={s.id} className="flex items-center justify-between gap-3 pl-0 pr-3.5 py-3 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                style={{ background: '#fff', border: '1px solid #EAEFEE', boxShadow: '0 6px 18px -12px rgba(16,48,44,.25)', opacity: s.activo ? 1 : 0.6 }}>
                {/* Barra de acento a la izquierda */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1.5 self-stretch rounded-full" style={{ background: s.activo ? 'linear-gradient(180deg,#14B8A6,#0F766E)' : '#D4D4D4' }} />
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#ECFDF5', color: TEAL }}>
                    <Layers size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold truncate" style={{ color: s.activo ? '#0E1A1A' : '#9CA3AF' }}>{s.nombre}</p>
                    {s.descripcion && <p className="text-[12px] truncate" style={{ color: '#6B7280' }}>{s.descripcion}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F1F5F4', color: '#475569' }}>{s.duracion_min ?? 45} min</span>
                  <span className="text-[15px] font-extrabold" style={{ color: TEAL }}>S/ {Number(s.precio).toFixed(2)}</span>
                  <button onClick={() => setEditar(s)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[#F1F5F4] transition-colors" style={{ color: '#64748B' }} title="Editar">
                    <Pencil size={15} />
                  </button>
                  {/* Interruptor Activo/Inactivo */}
                  <button onClick={() => toggle(s)} title={s.activo ? 'Activo' : 'Inactivo'}
                    className="relative inline-block h-6 w-11 rounded-full shrink-0 transition-colors"
                    style={{ background: s.activo ? TEAL : '#D4D2CA' }}>
                    <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: s.activo ? '22px' : '2px' }} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editar && (
        <ModalEditarServicio
          slug={slug} servicio={editar}
          onClose={() => setEditar(null)}
          onSaved={upd => { onChange(servicios.map(x => x.id === upd.id ? upd : x)); setEditar(null); }}
        />
      )}
    </div>
  );
}

/** Modal para editar un servicio: nombre, descripción y precio. */
function ModalEditarServicio({ slug, servicio, onClose, onSaved }: {
  slug: string; servicio: Servicio; onClose: () => void; onSaved: (s: Servicio) => void;
}) {
  const [nombre, setNombre] = useState(servicio.nombre);
  const [desc, setDesc] = useState(servicio.descripcion ?? '');
  const [precio, setPrecio] = useState(String(servicio.precio ?? 0));
  const [dur, setDur] = useState(String(servicio.duracion_min ?? 45));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true); setError(null);
    try {
      const upd = await terapApi.updateServicio(slug, servicio.id, {
        nombre: nombre.trim(), descripcion: desc || null, precio: Number(precio) || 0, duracion_min: Number(dur) || 45,
      });
      onSaved(upd);
    } catch (err: any) { setError(err?.message ?? 'No se pudo guardar'); setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <Cabecera icon={<Layers size={16} color="#fff" />} titulo="Editar servicio" onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-4">
        <Campo label="Nombre del servicio *"><input className="vx-input" value={nombre} onChange={e => setNombre(e.target.value)} autoFocus placeholder="Ej. Terapia de lenguaje" /></Campo>
        <Campo label="Descripción (opcional)">
          <textarea className="vx-input" rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="¿Qué incluye este servicio?" />
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
        {error && <p className="text-[12.5px] px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors hover:bg-[#E9EDEC]" style={{ background: '#F1F5F4', color: '#374151' }}>Cancelar</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: TEAL }}>
            {saving && <Loader2 size={14} className="animate-spin" />} <Save size={14} /> Guardar cambios
          </button>
        </div>
      </form>
    </Overlay>
  );
}

// ── Servicios por terapeuta ────────────────────────────────────────────────────
function TerapeutasServicios({ slug, servicios, terapeutas }: {
  slug: string; servicios: Servicio[]; terapeutas: Terapeuta[];
}) {
  return (
    <div className="rounded-2xl bg-white p-5" style={CARD}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#CCFBF1', color: TEAL }}>
          <Users size={16} />
        </div>
        <h2 className="text-[15px] font-bold" style={{ color: '#0E1A1A' }}>Servicios por terapeuta</h2>
      </div>
      {terapeutas.length === 0 ? (
        <p className="text-[12.5px]" style={{ color: '#94A3B8' }}>No hay terapeutas registrados en el centro.</p>
      ) : (
        <div className="space-y-3">
          {terapeutas.map(t => <FilaTerapeuta key={t.id} slug={slug} terapeuta={t} servicios={servicios} />)}
        </div>
      )}
    </div>
  );
}

function FilaTerapeuta({ slug, terapeuta, servicios }: { slug: string; terapeuta: Terapeuta; servicios: Servicio[] }) {
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [orig, setOrig] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    terapApi.getServiciosDeTerapeuta(slug, terapeuta.id).then(rows => {
      const ids = new Set(rows.map(r => r.id));
      setSel(ids); setOrig(new Set(ids));
    }).catch(() => {});
  }, [slug, terapeuta.id]);

  const toggle = (id: number) => setSel(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const dirty = sel.size !== orig.size || [...sel].some(id => !orig.has(id));

  const guardar = async () => {
    setSaving(true);
    await terapApi.setServiciosTerapeuta(slug, terapeuta.id, [...sel]);
    setOrig(new Set(sel)); setSaving(false);
  };

  return (
    <div className="rounded-xl p-3" style={{ background: '#F6FAF9', border: '1px solid #E5E9E7' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13.5px] font-semibold" style={{ color: '#0E1A1A' }}>{terapeuta.nombre}</p>
        {dirty && (
          <button onClick={guardar} disabled={saving} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5" style={{ background: TEAL }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
          </button>
        )}
      </div>
      {servicios.length === 0 ? (
        <p className="text-[12px]" style={{ color: '#94A3B8' }}>Crea servicios primero.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {servicios.map(s => {
            const on = sel.has(s.id);
            return (
              <button key={s.id} onClick={() => toggle(s.id)}
                className="text-[12.5px] px-3 py-1 rounded-full font-medium transition"
                style={on ? { background: TEAL, color: '#fff' } : { background: '#fff', color: '#475569', border: '1px solid #E5E9E7' }}>
                {s.nombre}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
