import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Loader2, Plus, Pencil, Save, Trash2, Layers } from '@/components/ui/icon';
import { terapApi, type Paquete, type Motivo, type Servicio } from '../../shared/api/terapeutico.api';
import { Overlay, Cabecera, Campo } from '../../shared/finanzas';

const TEAL = '#0F766E';
const soles = (n: number | string) => `S/ ${Number(n || 0).toFixed(2)}`;
const CARD: React.CSSProperties = { border: '1px solid #EAEFEE', boxShadow: '0 1px 2px rgba(16,48,44,.04), 0 12px 32px -14px rgba(16,48,44,.16)' };

/** Línea en edición dentro del modal (motivo × cantidad). */
interface LineaEdit { key: string; motivo_id: number; cantidad: number; }

/**
 * Paquetes y combos: una tarifa vendible = N líneas (motivo × cantidad) a un precio total
 * especial. El descuento sale solo (suma de líneas a precio normal vs. el precio del paquete).
 * Vender un paquete carga el saldo de sesiones de cada motivo. Vive en la página de Servicios.
 */
export default function PaquetesCentro({ slug, servicios }: { slug: string; servicios: Servicio[] }) {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editar, setEditar] = useState<Paquete | null>(null);
  const [crear, setCrear] = useState(false);

  const cargar = () => {
    setLoading(true);
    Promise.all([
      terapApi.listPaquetes(slug, true),
      terapApi.listMotivos(slug),
    ]).then(([p, m]) => { setPaquetes(p); setMotivos(m); }).finally(() => setLoading(false));
  };
  useEffect(cargar, [slug]);

  const tras = (p: Paquete) => setPaquetes(prev => prev.some(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]);
  const toggle = async (p: Paquete) => tras(await terapApi.updatePaquete(slug, p.id, { activo: !p.activo }));
  const borrar = async (p: Paquete) => {
    if (!confirm(`¿Eliminar el paquete "${p.nombre}"? Si ya se vendió, se desactivará en vez de borrarse.`)) return;
    const r = await terapApi.deletePaquete(slug, p.id);
    if (r.modo === 'eliminado') setPaquetes(prev => prev.filter(x => x.id !== p.id));
    else tras({ ...p, activo: 0 });
  };

  // Valor "de lista" del paquete (suma de líneas a precio normal), para mostrar el descuento.
  const listaDe = (p: Paquete) => p.lineas.reduce((s, l) => s + (Number(l.motivo_precio) || 0) * (Number(l.cantidad) || 1), 0);

  const hayMotivos = motivos.length > 0;

  return (
    <div className="rounded-2xl bg-white p-5" style={CARD}>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#CCFBF1', color: TEAL }}>
            <Layers size={16} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: '#0E1A1A' }}>Paquetes y combos</h2>
            <p className="text-[12px]" style={{ color: '#6B7280' }}>Tarifas a precio especial (ej. 8 sesiones) o combos de varios motivos</p>
          </div>
        </div>
        <button onClick={() => setCrear(true)} disabled={!hayMotivos}
          className="px-4 py-2 rounded-xl text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50" style={{ background: TEAL }}>
          <Plus size={14} /> Agregar paquete
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 size={20} className="animate-spin" style={{ color: TEAL }} /></div>
      ) : !hayMotivos ? (
        <p className="text-[12.5px]" style={{ color: '#94A3B8' }}>Primero crea motivos de cita arriba; los paquetes se arman con ellos.</p>
      ) : paquetes.length === 0 ? (
        <p className="text-[12.5px]" style={{ color: '#94A3B8' }}>Aún no hay paquetes. Crea el primero (ej. «Paquete 8 sesiones» o un combo de evaluación).</p>
      ) : (
        <ul className="space-y-2.5">
          {paquetes.map(p => {
            const lista = listaDe(p);
            const ahorro = +(lista - Number(p.precio_total)).toFixed(2);
            return (
              <li key={p.id} className="flex items-start justify-between gap-3 pl-0 pr-3.5 py-3 rounded-2xl"
                style={{ background: '#fff', border: '1px solid #EAEFEE', boxShadow: '0 6px 18px -12px rgba(16,48,44,.25)', opacity: p.activo ? 1 : 0.55 }}>
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-1.5 self-stretch rounded-full" style={{ background: p.activo ? 'linear-gradient(180deg,#14B8A6,#0F766E)' : '#D4D4D4' }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-bold" style={{ color: p.activo ? '#0E1A1A' : '#9CA3AF' }}>{p.nombre}</span>
                      {p.servicio_nombre && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#F1F5F4', color: '#475569' }}>{p.servicio_nombre}</span>}
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: '#6B7280' }}>
                      {p.lineas.map(l => `${l.motivo_nombre} ×${l.cantidad}`).join('  ·  ') || 'Sin líneas'}
                    </p>
                    {ahorro > 0 && (
                      <p className="text-[11px] mt-0.5" style={{ color: '#B45309' }}>
                        Lista {soles(lista)} → ahorro {soles(ahorro)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[15px] font-extrabold tabular-nums" style={{ color: TEAL }}>{soles(p.precio_total)}</span>
                  <button onClick={() => setEditar(p)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[#F1F5F4] transition-colors" style={{ color: '#64748B' }} title="Editar"><Pencil size={14} /></button>
                  <button onClick={() => toggle(p)} title={p.activo ? 'Activo' : 'Inactivo'}
                    className="relative inline-block h-6 w-11 rounded-full shrink-0 transition-colors" style={{ background: p.activo ? TEAL : '#D4D2CA' }}>
                    <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: p.activo ? '22px' : '2px' }} />
                  </button>
                  <button onClick={() => borrar(p)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[#FEF2F2] transition-colors" style={{ color: '#DC2626' }} title="Eliminar"><Trash2 size={14} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {(crear || editar) && (
        <ModalPaquete
          slug={slug} servicios={servicios.filter(s => s.activo)} motivos={motivos} paquete={editar}
          onClose={() => { setCrear(false); setEditar(null); }}
          onSaved={p => { tras(p); setCrear(false); setEditar(null); }}
        />
      )}
    </div>
  );
}

/** Modal para crear / editar un paquete o combo. */
function ModalPaquete({ slug, servicios, motivos, paquete, onClose, onSaved }: {
  slug: string; servicios: Servicio[]; motivos: Motivo[]; paquete: Paquete | null;
  onClose: () => void; onSaved: (p: Paquete) => void;
}) {
  const [nombre, setNombre] = useState(paquete?.nombre ?? '');
  const [servicioId, setServicioId] = useState(String(paquete?.servicio_id ?? ''));
  const [desc, setDesc] = useState(paquete?.descripcion ?? '');
  const [precio, setPrecio] = useState(String(paquete?.precio_total ?? ''));
  const [lineas, setLineas] = useState<LineaEdit[]>(
    paquete?.lineas.length
      ? paquete.lineas.map((l, i) => ({ key: `l${i}`, motivo_id: l.motivo_id, cantidad: l.cantidad }))
      : [{ key: 'l0', motivo_id: motivos[0]?.id ?? 0, cantidad: 1 }],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const motivoDe = (id: number) => motivos.find(m => m.id === id);
  const lista = useMemo(() => lineas.reduce((s, l) => s + (Number(motivoDe(l.motivo_id)?.precio) || 0) * (Number(l.cantidad) || 0), 0), [lineas, motivos]);
  const ahorro = +(lista - (Number(precio) || 0)).toFixed(2);

  const addLinea = () => setLineas(prev => [...prev, { key: `l${Date.now()}`, motivo_id: motivos[0]?.id ?? 0, cantidad: 1 }]);
  const setLinea = (i: number, patch: Partial<LineaEdit>) => setLineas(prev => prev.map((l, j) => j === i ? { ...l, ...patch } : l));
  const delLinea = (i: number) => setLineas(prev => prev.filter((_, j) => j !== i));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('Ponle un nombre al paquete.'); return; }
    const lns = lineas.filter(l => l.motivo_id && (Number(l.cantidad) || 0) > 0).map(l => ({ motivo_id: l.motivo_id, cantidad: Math.max(1, Math.round(Number(l.cantidad) || 1)) }));
    if (!lns.length) { setError('Agrega al menos una línea (motivo × cantidad).'); return; }
    setSaving(true); setError(null);
    try {
      const data = {
        nombre: nombre.trim(), servicio_id: servicioId ? Number(servicioId) : null,
        descripcion: desc || null, precio_total: Number(precio) || 0, lineas: lns,
      };
      const p = paquete ? await terapApi.updatePaquete(slug, paquete.id, data) : await terapApi.createPaquete(slug, data);
      onSaved(p);
    } catch (err: any) { setError(err?.message ?? 'No se pudo guardar'); setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <Cabecera icon={<Layers size={16} color="#fff" />} titulo={paquete ? 'Editar paquete' : 'Nuevo paquete / combo'} onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-4">
        <Campo label="Nombre *">
          <input className="vx-input" value={nombre} onChange={e => setNombre(e.target.value)} autoFocus placeholder="Ej. Paquete 8 sesiones, Evaluación Integral…" />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Área (opcional)">
            <select className="vx-input" value={servicioId} onChange={e => setServicioId(e.target.value)}>
              <option value="">— Sin área / combo —</option>
              {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </Campo>
          <Campo label="Descripción (opcional)">
            <input className="vx-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="¿Qué incluye?" />
          </Campo>
        </div>

        {/* Líneas: motivo × cantidad */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>Incluye</span>
            <button type="button" onClick={addLinea} className="text-[12px] font-semibold flex items-center gap-1" style={{ color: TEAL }}><Plus size={13} /> Agregar línea</button>
          </div>
          <div className="space-y-2">
            {lineas.map((l, i) => (
              <div key={l.key} className="flex items-center gap-2">
                <select className="vx-input flex-1" value={l.motivo_id || ''} onChange={e => setLinea(i, { motivo_id: Number(e.target.value) })}>
                  <option value="">Elige un motivo…</option>
                  {motivos.map(m => <option key={m.id} value={m.id}>{m.servicio_nombre} · {m.nombre} ({soles(m.precio)})</option>)}
                </select>
                <div className="flex items-center gap-1">
                  <span className="text-[12px]" style={{ color: '#94A3B8' }}>×</span>
                  <input type="number" min={1} step={1} value={l.cantidad || ''} onChange={e => setLinea(i, { cantidad: Number(e.target.value) })}
                    className="w-16 text-center text-[13px] rounded-md py-1.5" style={{ border: '1px solid #E5E9E7' }} />
                </div>
                {lineas.length > 1 && <button type="button" onClick={() => delLinea(i)} style={{ color: '#DC2626' }}><Trash2 size={15} /></button>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <Campo label="Precio del paquete *">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold" style={{ color: TEAL }}>S/</span>
              <input className="vx-input" style={{ paddingLeft: '2.2rem' }} type="number" min={0} step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" />
            </div>
          </Campo>
          <div className="rounded-xl px-3 py-2 text-[12px]" style={{ background: '#F6FAF9', border: '1px solid #E5E9E7' }}>
            <div className="flex justify-between"><span style={{ color: '#64748B' }}>Precio lista</span><span className="font-semibold tabular-nums" style={{ color: '#0E1A1A' }}>{soles(lista)}</span></div>
            <div className="flex justify-between mt-0.5"><span style={{ color: '#64748B' }}>Ahorro</span><span className="font-semibold tabular-nums" style={{ color: ahorro >= 0 ? '#B45309' : '#B91C1C' }}>{soles(ahorro)}</span></div>
          </div>
        </div>

        {error && <p className="text-[12.5px] px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors hover:bg-[#E9EDEC]" style={{ background: '#F1F5F4', color: '#374151' }}>Cancelar</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: TEAL }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {paquete ? 'Guardar cambios' : 'Crear paquete'}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
