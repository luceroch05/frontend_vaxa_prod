'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Pencil, Trash2, Save, Loader2, AlertTriangle } from '@/components/ui/icon';
import {
  infraAlquileresApi, listInfraEmpresas, estadoVencimiento, diasHasta, fechaCorta,
  type InfraAlquiler, type InfraRecurso, type InfraEmpresaLite,
} from '../../shared/api/infra.admin.api';

const GREEN = '#059669';
const CICLOS = [{ v: 'mensual', l: 'Mensual' }, { v: 'anual', l: 'Anual' }, { v: 'unico', l: 'Pago único' }];
const PAGOS: { v: string; l: string; c: string; bg: string }[] = [
  { v: 'pagado', l: 'Pagado', c: GREEN, bg: '#ECFDF5' },
  { v: 'pendiente', l: 'Pendiente', c: '#B45309', bg: '#FEF3C7' },
  { v: 'vencido', l: 'Vencido', c: '#DC2626', bg: '#FEF2F2' },
];

const fmt = (n: number, moneda = 'PEN') =>
  `${moneda === 'USD' ? '$' : 'S/'} ${(Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AlquileresPanel({ alquileres, recursos, onChange }: {
  alquileres: InfraAlquiler[]; recursos: InfraRecurso[]; onChange: () => void;
}) {
  const [empresas, setEmpresas] = useState<InfraEmpresaLite[]>([]);
  const [modal, setModal] = useState<'nuevo' | number | null>(null);
  const [form, setForm] = useState<Partial<InfraAlquiler>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const editando = typeof modal === 'number';

  useEffect(() => { listInfraEmpresas().then((e) => setEmpresas(Array.isArray(e) ? e : [])).catch(() => {}); }, []);

  const abrirNuevo = () => { setForm({ moneda: 'PEN', ciclo: 'mensual', estado_pago: 'pendiente', activo: 1 }); setModal('nuevo'); setError(null); };
  const abrirEditar = (a: InfraAlquiler) => { setForm({ ...a }); setModal(a.id); setError(null); };
  const cerrar = () => setModal(null);
  const set = (k: keyof InfraAlquiler, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id && !form.cliente?.trim()) { setError('Indica el cliente (empresa o nombre)'); return; }
    setSaving(true); setError(null);
    try {
      const payload: Partial<InfraAlquiler> = {
        cliente: form.empresa_id ? null : (form.cliente?.trim() || null),
        empresa_id: form.empresa_id || null,
        recurso_id: form.recurso_id || null,
        descripcion: form.descripcion?.trim() || null,
        precio: Number(form.precio) || 0, moneda: form.moneda || 'PEN', ciclo: form.ciclo || 'mensual',
        fecha_inicio: form.fecha_inicio || null, proximo_cobro: form.proximo_cobro || null,
        estado_pago: form.estado_pago || 'pendiente', notas: form.notas || null,
        activo: form.activo ? 1 : 0,
      };
      if (editando) await infraAlquileresApi.update(modal as number, payload);
      else await infraAlquileresApi.create(payload);
      cerrar(); onChange();
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  };

  const eliminar = async () => {
    if (delId == null) return;
    try { await infraAlquileresApi.remove(delId); setDelId(null); onChange(); }
    catch (e) { setError((e as Error).message); }
  };

  const registrarCobro = async (a: InfraAlquiler) => {
    try { await infraAlquileresApi.cobrar(a.id); onChange(); }
    catch (e) { setError((e as Error).message); }
  };

  return (
    <div className="sv-card p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Alquileres (lo que cobras)</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Servicios que le cobras a cada cliente, con su próximo cobro.</p>
        </div>
        <button onClick={abrirNuevo} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-white text-[13px]" style={{ background: GREEN }}>
          <Plus size={15} /> Agregar
        </button>
      </div>

      <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        {alquileres.length === 0 ? (
          <div className="text-center py-12 text-[13.5px]" style={{ color: '#9CA3AF' }}>Aún no hay alquileres. Agrega el primero.</div>
        ) : alquileres.map((a, idx) => {
          const cliente = a.empresa_nombre || a.cliente || 'Cliente';
          const est = estadoVencimiento(a.proximo_cobro);
          const d = diasHasta(a.proximo_cobro);
          const col = est === 'vencido' ? '#DC2626' : est === 'por_vencer' ? '#D97706' : '#6B7280';
          const pago = PAGOS.find((p) => p.v === a.estado_pago) ?? PAGOS[1];
          return (
            <div key={a.id} className="flex items-center justify-between px-4 py-3 gap-3" style={{ borderBottom: idx < alquileres.length - 1 ? '1px solid #F1F4F3' : undefined, background: '#fff' }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold truncate" style={{ color: '#0D0E12' }}>{cliente}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: pago.bg, color: pago.c }}>{pago.l}</span>
                </div>
                <p className="text-[12px] mt-0.5 truncate" style={{ color: '#9CA3AF' }}>
                  {a.descripcion || a.recurso_nombre || 'Servicio'} · {fmt(a.precio, a.moneda)} / {a.ciclo}
                </p>
                {a.ultimo_cobro && (
                  <p className="text-[11px] mt-0.5" style={{ color: GREEN }}>✓ Último cobro: {fechaCorta(a.ultimo_cobro)}</p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {a.proximo_cobro && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[12px] font-semibold flex items-center gap-1 justify-end" style={{ color: col }}>
                      {est !== 'vigente' && <AlertTriangle size={12} />}
                      {d! < 0 ? `Venció hace ${Math.abs(d!)} d` : d === 0 ? 'Cobra hoy' : `Cobra en ${d} d`}
                    </p>
                    <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{fechaCorta(a.proximo_cobro)}</p>
                  </div>
                )}
                <button onClick={() => registrarCobro(a)} title="Registrar cobro y correr al siguiente ciclo" className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: '#ECFDF5', color: GREEN, border: '1px solid #A7F3D0' }}>Registrar cobro</button>
                <button onClick={() => abrirEditar(a)} className="p-1.5 rounded-lg" style={{ color: '#64748B' }}><Pencil size={16} /></button>
                <button onClick={() => setDelId(a.id)} className="p-1.5 rounded-lg" style={{ color: '#94A3B8' }}><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {modal !== null && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)', backdropFilter: 'blur(4px)' }} onMouseDown={cerrar}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>{editando ? 'Editar alquiler' : 'Nuevo alquiler'}</h3>
              <button onClick={cerrar} style={{ color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3.5">
              <Campo label="Cliente (empresa del sistema)">
                <EmpresaCombobox empresas={empresas} value={form.empresa_id ?? null} onChange={(id) => set('empresa_id', id)} />
                <p className="text-[11.5px] mt-1" style={{ color: '#9CA3AF' }}>Elige una empresa, o déjalo vacío y escribe el nombre abajo.</p>
              </Campo>
              {!form.empresa_id && (
                <Campo label="Cliente (nombre manual)">
                  <input className="vx-input w-full" value={form.cliente ?? ''} placeholder="Cliente externo" onChange={(e) => set('cliente', e.target.value)} />
                </Campo>
              )}
              <Campo label="Recurso enlazado (para el margen, opcional)">
                <select className="vx-input w-full" value={form.recurso_id ?? ''} onChange={(e) => set('recurso_id', e.target.value ? Number(e.target.value) : null)}>
                  <option value="">— Ninguno —</option>
                  {recursos.map((r) => <option key={r.id} value={r.id}>{r.tipo} · {r.nombre}</option>)}
                </select>
              </Campo>
              <Campo label="Descripción (si no enlazas recurso)">
                <input className="vx-input w-full" value={form.descripcion ?? ''} placeholder="Hosting + dominio" onChange={(e) => set('descripcion', e.target.value)} />
              </Campo>
              <div className="grid grid-cols-3 gap-3">
                <Campo label="Precio">
                  <input type="number" step="0.01" className="vx-input w-full" value={form.precio ?? ''} onChange={(e) => set('precio', e.target.value)} />
                </Campo>
                <Campo label="Moneda">
                  <select className="vx-input w-full" value={form.moneda ?? 'PEN'} onChange={(e) => set('moneda', e.target.value)}>
                    <option value="PEN">S/ PEN</option><option value="USD">$ USD</option>
                  </select>
                </Campo>
                <Campo label="Ciclo">
                  <select className="vx-input w-full" value={form.ciclo ?? 'mensual'} onChange={(e) => set('ciclo', e.target.value)}>
                    {CICLOS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                  </select>
                </Campo>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Inicio">
                  <input type="date" className="vx-input w-full" value={fechaCorta(form.fecha_inicio)} onChange={(e) => set('fecha_inicio', e.target.value)} />
                </Campo>
                <Campo label="Próximo cobro (cuándo cobras)">
                  <input type="date" className="vx-input w-full" value={fechaCorta(form.proximo_cobro)} onChange={(e) => set('proximo_cobro', e.target.value)} />
                </Campo>
              </div>
              <Campo label="Estado de pago">
                <select className="vx-input w-full" value={form.estado_pago ?? 'pendiente'} onChange={(e) => set('estado_pago', e.target.value)}>
                  {PAGOS.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </Campo>
              <Campo label="Notas (opcional)">
                <textarea className="vx-input w-full" rows={2} value={form.notas ?? ''} onChange={(e) => set('notas', e.target.value)} />
              </Campo>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={form.activo !== 0} onChange={(e) => set('activo', e.target.checked ? 1 : 0)} className="w-4 h-4" style={{ accentColor: GREEN }} />
                <span className="text-[13px]" style={{ color: '#374151' }}>Activo</span>
              </label>
              {error && <p className="text-[13px]" style={{ color: '#DC2626' }}>{error}</p>}
              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={cerrar} className="flex-1 py-2.5 rounded-xl font-semibold text-[14px]" style={{ background: '#F1F4F3', color: '#374151' }}>Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white text-[14px] disabled:opacity-50" style={{ background: GREEN }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {delId != null && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.5)', backdropFilter: 'blur(4px)' }} onMouseDown={() => setDelId(null)}>
          <div className="bg-white rounded-2xl max-w-[380px] w-full p-6" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>¿Eliminar alquiler?</h3>
            <p className="text-[13px] mt-1.5 mb-5" style={{ color: '#6B7280' }}>Esta acción no se puede deshacer.</p>
            <div className="flex gap-2.5">
              <button onClick={() => setDelId(null)} className="flex-1 py-2.5 rounded-xl font-semibold text-[14px]" style={{ background: '#F1F4F3', color: '#374151' }}>Cancelar</button>
              <button onClick={eliminar} className="flex-1 py-2.5 rounded-xl font-semibold text-white text-[14px]" style={{ background: '#DC2626' }}>Eliminar</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>{label}</label>
      {children}
    </div>
  );
}

/** Combobox con búsqueda para elegir la empresa cliente. */
function EmpresaCombobox({ empresas, value, onChange }: {
  empresas: InfraEmpresaLite[]; value: number | null; onChange: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = empresas.find((e) => e.id === value) ?? null;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtradas = empresas.filter((e) => e.razon_social.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <input className="vx-input w-full" value={open ? q : (selected?.razon_social ?? '')} placeholder="Buscar empresa…"
        onFocus={() => { setQ(''); setOpen(true); }} onChange={(e) => { setQ(e.target.value); setOpen(true); }} />
      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 rounded-lg overflow-y-auto bg-white" style={{ border: '1px solid #E5E7EB', maxHeight: 220, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)' }}>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(null); setQ(''); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50" style={{ color: '#9CA3AF' }}>— Sin empresa (nombre manual) —</button>
          {filtradas.map((e) => (
            <button key={e.id} type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => { onChange(e.id); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-[13.5px] hover:bg-gray-50" style={{ color: '#0D0E12', background: e.id === value ? '#ECFDF5' : undefined }}>
              {e.razon_social}
            </button>
          ))}
          {filtradas.length === 0 && <div className="px-3 py-3 text-[12.5px] text-center" style={{ color: '#9CA3AF' }}>Sin resultados</div>}
        </div>
      )}
    </div>
  );
}
