'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Pencil, Trash2, Save, Loader2, AlertTriangle } from '@/components/ui/icon';
import { infraRecursosApi, estadoVencimiento, diasHasta, fechaCorta, parseProyectos, type InfraRecurso } from '../../shared/api/infra.admin.api';

const GREEN = '#059669';
const TIPOS = ['VPS', 'Dominio', 'Hosting', 'SSL', 'Correo', 'Otro'];
const CICLOS: { v: string; l: string }[] = [
  { v: 'mensual', l: 'Mensual' }, { v: 'anual', l: 'Anual' }, { v: 'unico', l: 'Pago único' },
];

const fmt = (n: number, moneda = 'PEN') =>
  `${moneda === 'USD' ? '$' : 'S/'} ${(Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function RecursosPanel({ recursos, onChange }: { recursos: InfraRecurso[]; onChange: () => void }) {
  const [modal, setModal] = useState<'nuevo' | number | null>(null);
  const [form, setForm] = useState<Partial<InfraRecurso>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const editando = typeof modal === 'number';

  const abrirNuevo = () => { setForm({ tipo: 'Hosting', moneda: 'PEN', ciclo: 'mensual', activo: 1 }); setModal('nuevo'); setError(null); };
  const abrirEditar = (r: InfraRecurso) => { setForm({ ...r }); setModal(r.id); setError(null); };
  const cerrar = () => setModal(null);
  const set = (k: keyof InfraRecurso, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre?.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true); setError(null);
    try {
      const payload: Partial<InfraRecurso> = {
        tipo: form.tipo || 'Hosting', nombre: form.nombre.trim(),
        proveedor: form.proveedor?.trim() || null, costo: Number(form.costo) || 0,
        moneda: form.moneda || 'PEN', ciclo: form.ciclo || 'mensual',
        fecha_renovacion: form.fecha_renovacion || null,
        proyectos: form.proyectos || null,
        credenciales: form.credenciales || null, notas: form.notas || null,
        activo: form.activo ? 1 : 0,
      };
      if (editando) await infraRecursosApi.update(modal as number, payload);
      else await infraRecursosApi.create(payload);
      cerrar(); onChange();
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  };

  const eliminar = async () => {
    if (delId == null) return;
    try { await infraRecursosApi.remove(delId); setDelId(null); onChange(); }
    catch (e) { setError((e as Error).message); }
  };

  return (
    <div className="sv-card p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Recursos (lo que pagas)</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Tus VPS, dominios y hosting, con su fecha de renovación.</p>
        </div>
        <button onClick={abrirNuevo} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-white text-[13px]" style={{ background: GREEN }}>
          <Plus size={15} /> Agregar
        </button>
      </div>

      <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        {recursos.length === 0 ? (
          <div className="text-center py-12 text-[13.5px]" style={{ color: '#9CA3AF' }}>Aún no hay recursos. Agrega el primero.</div>
        ) : recursos.map((r, idx) => {
          const est = estadoVencimiento(r.fecha_renovacion);
          const d = diasHasta(r.fecha_renovacion);
          const col = est === 'vencido' ? '#DC2626' : est === 'por_vencer' ? '#D97706' : '#6B7280';
          return (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-3" style={{ borderBottom: idx < recursos.length - 1 ? '1px solid #F1F4F3' : undefined, background: '#fff' }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#F1F4F3', color: '#6B7280' }}>{r.tipo}</span>
                  <p className="text-[14px] font-semibold truncate" style={{ color: '#0D0E12' }}>{r.nombre}</p>
                  {r.activo === 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: '#F3F4F6', color: '#9CA3AF' }}>Baja</span>}
                </div>
                <p className="text-[12px] mt-0.5 truncate" style={{ color: '#9CA3AF' }}>
                  {r.proveedor || 'Sin proveedor'} · {fmt(r.costo, r.moneda)} / {r.ciclo}
                </p>
                {parseProyectos(r.proyectos).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {parseProyectos(r.proyectos).map((p) => (
                      <span key={p} className="text-[10.5px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>{p}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {r.fecha_renovacion && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[12px] font-semibold flex items-center gap-1 justify-end" style={{ color: col }}>
                      {est !== 'vigente' && <AlertTriangle size={12} />}
                      {d! < 0 ? `Venció hace ${Math.abs(d!)} d` : d === 0 ? 'Vence hoy' : `Renueva en ${d} d`}
                    </p>
                    <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{fechaCorta(r.fecha_renovacion)}</p>
                  </div>
                )}
                <button onClick={() => abrirEditar(r)} className="p-1.5 rounded-lg" style={{ color: '#64748B' }}><Pencil size={16} /></button>
                <button onClick={() => setDelId(r.id)} className="p-1.5 rounded-lg" style={{ color: '#94A3B8' }}><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {modal !== null && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)', backdropFilter: 'blur(4px)' }} onMouseDown={cerrar}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>{editando ? 'Editar recurso' : 'Nuevo recurso'}</h3>
              <button onClick={cerrar} style={{ color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Tipo">
                  <select className="vx-input w-full" value={form.tipo ?? 'Hosting'} onChange={(e) => set('tipo', e.target.value)}>
                    {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Campo>
                <Campo label="Proveedor">
                  <input className="vx-input w-full" value={form.proveedor ?? ''} placeholder="Hostinger, GoDaddy…" onChange={(e) => set('proveedor', e.target.value)} />
                </Campo>
              </div>
              <Campo label="Nombre">
                <input className="vx-input w-full" value={form.nombre ?? ''} placeholder="vaxasys.com / VPS 8GB" onChange={(e) => set('nombre', e.target.value)} />
              </Campo>
              <div className="grid grid-cols-3 gap-3">
                <Campo label="Costo">
                  <input type="number" step="0.01" className="vx-input w-full" value={form.costo ?? ''} onChange={(e) => set('costo', e.target.value)} />
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
              <Campo label="Fecha de renovación (cuándo pagas)">
                <input type="date" className="vx-input w-full" value={fechaCorta(form.fecha_renovacion)} onChange={(e) => set('fecha_renovacion', e.target.value)} />
              </Campo>
              <Campo label="Proyectos alojados (uno por línea)">
                <textarea className="vx-input w-full" rows={3} value={form.proyectos ?? ''} placeholder={'siefo.com.pe\nvaxasys.com\ncliente-x.com'} onChange={(e) => set('proyectos', e.target.value)} />
              </Campo>
              <Campo label="Credenciales / accesos (opcional)">
                <textarea className="vx-input w-full" rows={2} value={form.credenciales ?? ''} placeholder="Panel, usuario… (no guardes contraseñas sensibles)" onChange={(e) => set('credenciales', e.target.value)} />
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
            <h3 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>¿Eliminar recurso?</h3>
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
