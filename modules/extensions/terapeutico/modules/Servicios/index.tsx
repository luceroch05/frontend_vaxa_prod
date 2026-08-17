import { useEffect, useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Plus, Save, Pencil, Users, Activity } from '@/components/ui/icon';
import { authStorage } from '@/lib/auth';
import { terapApi, type Servicio, type Terapeuta } from '../../shared/api/terapeutico.api';

const TEAL = '#0F766E';
const gestiona = (rol?: string) => ['ADMINISTRADOR', 'ADMISION'].includes((rol ?? '').toUpperCase());

export default function Servicios() {
  const { empresa } = useParams<{ empresa: string }>();
  const slug = empresa!;
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
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: '#CCFBF1' }}>
          <Activity size={18} style={{ color: TEAL }} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: '#0E1A1A' }}>Servicios del centro</h1>
          <p className="text-[12.5px]" style={{ color: '#6B7280' }}>Define qué ofrece el centro y qué brinda cada terapeuta</p>
        </div>
      </div>

      <CatalogoServicios slug={slug} servicios={servicios} onChange={setServicios} />
      <TerapeutasServicios slug={slug} servicios={servicios.filter(s => s.activo)} terapeutas={terapeutas} />
    </div>
  );
}

// ── Catálogo de servicios ──────────────────────────────────────────────────────
function CatalogoServicios({ slug, servicios, onChange }: {
  slug: string; servicios: Servicio[]; onChange: (s: Servicio[]) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);
    const s = await terapApi.createServicio(slug, { nombre, descripcion: desc || null });
    onChange([...servicios, s]); setNombre(''); setDesc(''); setSaving(false);
  };
  const toggle = async (s: Servicio) => {
    const upd = await terapApi.updateServicio(slug, s.id, { activo: !s.activo });
    onChange(servicios.map(x => x.id === s.id ? upd : x));
  };
  const guardarNombre = async (s: Servicio) => {
    const upd = await terapApi.updateServicio(slug, s.id, { nombre: editNombre });
    onChange(servicios.map(x => x.id === s.id ? upd : x));
    setEditId(null);
  };

  return (
    <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #E5E9E7' }}>
      <form onSubmit={crear} className="flex items-end gap-2 mb-4 flex-wrap">
        <label className="flex-1 min-w-[160px]">
          <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>Nuevo servicio</span>
          <input className="vx-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Terapia de lenguaje" />
        </label>
        <label className="flex-1 min-w-[160px]">
          <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>Descripción (opcional)</span>
          <input className="vx-input" value={desc} onChange={e => setDesc(e.target.value)} />
        </label>
        <button type="submit" disabled={saving || !nombre.trim()} className="px-4 py-2 rounded-xl text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50" style={{ background: TEAL }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Agregar
        </button>
      </form>

      {servicios.length === 0 ? (
        <p className="text-[12.5px]" style={{ color: '#94A3B8' }}>Aún no hay servicios.</p>
      ) : (
        <ul className="space-y-1.5">
          {servicios.map(s => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg" style={{ background: '#F6FAF9' }}>
              {editId === s.id ? (
                <input className="vx-input flex-1 mr-2" value={editNombre} onChange={e => setEditNombre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && guardarNombre(s)} autoFocus />
              ) : (
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold" style={{ color: s.activo ? '#0E1A1A' : '#9CA3AF' }}>{s.nombre}</p>
                  {s.descripcion && <p className="text-[12px] truncate" style={{ color: '#6B7280' }}>{s.descripcion}</p>}
                </div>
              )}
              <div className="flex items-center gap-2 shrink-0">
                {editId === s.id ? (
                  <button onClick={() => guardarNombre(s)} className="text-[12px] font-semibold flex items-center gap-1" style={{ color: TEAL }}><Save size={13} /> Guardar</button>
                ) : (
                  <button onClick={() => { setEditId(s.id); setEditNombre(s.nombre); }} style={{ color: '#94A3B8' }}><Pencil size={14} /></button>
                )}
                <button onClick={() => toggle(s)} className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={s.activo ? { background: '#CCFBF1', color: TEAL } : { background: '#F1F5F4', color: '#9CA3AF' }}>
                  {s.activo ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Servicios por terapeuta ────────────────────────────────────────────────────
function TerapeutasServicios({ slug, servicios, terapeutas }: {
  slug: string; servicios: Servicio[]; terapeutas: Terapeuta[];
}) {
  return (
    <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #E5E9E7' }}>
      <div className="flex items-center gap-2 mb-4">
        <Users size={17} style={{ color: TEAL }} />
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
