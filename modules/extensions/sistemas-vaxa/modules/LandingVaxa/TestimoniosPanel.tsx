'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Loader2, X, Pencil, Trash2, Save, Star } from '@/components/ui/icon';
import { imgUrl } from '@/lib/api/client';
import {
  testimoniosAdminApi, alianzasAdminApi,
  type VaxaTestimonio, type VaxaAlianza,
} from '../../shared/api/landing.admin.api';

const GREEN = '#059669';

/**
 * Administra los testimonios reales de clientes que salen en la landing pública.
 * El testimonio NO lleva foto de la persona: se enlaza a una alianza (empresa
 * cliente) y reutiliza su logo. Así el comentario aparece con el logo de la
 * empresa a la que pertenece quien lo dio.
 */
export default function TestimoniosPanel() {
  const [items, setItems] = useState<VaxaTestimonio[] | null>(null);
  const [alianzas, setAlianzas] = useState<VaxaAlianza[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'nuevo' | number | null>(null);
  const [form, setForm] = useState<Partial<VaxaTestimonio>>({});
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState<number | null>(null);

  const editando = typeof modal === 'number';

  const cargar = useCallback(async () => {
    setError(null); setItems(null);
    try {
      const [t, a] = await Promise.all([testimoniosAdminApi.list(), alianzasAdminApi.list().catch(() => [])]);
      setItems(t); setAlianzas(a);
    } catch (e) { setError((e as Error).message); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const alianzaDe = (id?: number | null) => alianzas.find((a) => a.id === id);

  const abrirNuevo = () => { setForm({ activo: 1, calificacion: 5 }); setModal('nuevo'); setError(null); };
  const abrirEditar = (t: VaxaTestimonio) => {
    setForm({
      comentario: t.comentario, autor: t.autor, cargo: t.cargo ?? '',
      empresa: t.empresa ?? '', alianza_id: t.alianza_id ?? null,
      calificacion: t.calificacion ?? 5, activo: t.activo ?? 1,
    });
    setModal(t.id); setError(null);
  };
  const cerrar = () => setModal(null);
  const set = (k: keyof VaxaTestimonio, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.comentario?.trim()) { setError('El comentario es requerido'); return; }
    if (!form.autor?.trim()) { setError('El nombre de la persona es requerido'); return; }
    setSaving(true); setError(null);
    try {
      const payload: Partial<VaxaTestimonio> = {
        comentario: form.comentario.trim(),
        autor: form.autor.trim(),
        cargo: form.cargo?.trim() || null,
        empresa: form.empresa?.trim() || null,
        alianza_id: form.alianza_id || null,
        calificacion: form.calificacion ?? 5,
        activo: form.activo ? 1 : 0,
      };
      if (editando) {
        const up = await testimoniosAdminApi.update(modal as number, payload);
        setItems((prev) => (prev ?? []).map((x) => (x.id === up.id ? up : x)));
      } else {
        const nuevo = await testimoniosAdminApi.create(payload);
        setItems((prev) => [...(prev ?? []), nuevo]);
      }
      cerrar();
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  };

  const eliminar = async () => {
    if (delId == null) return;
    try { await testimoniosAdminApi.remove(delId); setItems((prev) => (prev ?? []).filter((x) => x.id !== delId)); setDelId(null); }
    catch (e) { setError((e as Error).message); }
  };

  return (
    <div className="sv-card p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Testimonios de clientes</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Comentarios reales que salen en la landing. Se muestran con el logo de la empresa (alianza).</p>
        </div>
        <button onClick={abrirNuevo} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-white text-[13px]" style={{ background: GREEN }}>
          <Plus size={15} /> Agregar
        </button>
      </div>

      {error && !modal && <div className="mt-3 px-3.5 py-2.5 rounded-lg text-[13px]" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>{error}</div>}

      <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        {!items ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: '#CBD5D1' }} /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-[13.5px]" style={{ color: '#9CA3AF' }}>Aún no hay testimonios. Agrega el primero.</div>
        ) : items.map((t, idx) => {
          const al = alianzaDe(t.alianza_id);
          const logo = t.logo_url || al?.logo_url;
          const empresa = t.empresa || al?.nombre;
          return (
            <div key={t.id} className="flex items-start justify-between px-4 py-3 gap-3" style={{ borderBottom: idx < items.length - 1 ? '1px solid #F1F4F3' : undefined, background: '#fff' }}>
              <div className="flex items-start gap-3 min-w-0">
                {logo
                  ? <img src={imgUrl(logo)} alt="" className="h-10 w-10 rounded-lg object-contain bg-white flex-shrink-0" style={{ border: '1px solid #E5E7EB' }} />
                  : <div className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-bold" style={{ background: '#F1F4F3', color: '#9CA3AF' }}>{(empresa || t.autor)?.[0]}</div>}
                <div className="min-w-0">
                  <p className="text-[13.5px] truncate" style={{ color: '#374151' }}>“{t.comentario}”</p>
                  <p className="text-[12px] mt-0.5 truncate" style={{ color: '#9CA3AF' }}>
                    {t.autor}{t.cargo ? ` · ${t.cargo}` : ''}{empresa ? ` — ${empresa}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {t.activo === 0 && <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded" style={{ background: '#F3F4F6', color: '#6B7280' }}>Oculto</span>}
                <button onClick={() => abrirEditar(t)} className="p-1.5 rounded-lg" style={{ color: '#64748B' }}><Pencil size={16} /></button>
                <button onClick={() => setDelId(t.id)} className="p-1.5 rounded-lg" style={{ color: '#94A3B8' }}><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {modal !== null && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)', backdropFilter: 'blur(4px)' }} onMouseDown={cerrar}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>{editando ? 'Editar testimonio' : 'Nuevo testimonio'}</h3>
              <button onClick={cerrar} style={{ color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Comentario</label>
                <textarea className="vx-input w-full" rows={3} value={form.comentario ?? ''} placeholder="Lo que dijo el cliente…"
                  onChange={(e) => set('comentario', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Persona</label>
                  <input className="vx-input w-full" value={form.autor ?? ''} placeholder="Nombre y apellido"
                    onChange={(e) => set('autor', e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Cargo</label>
                  <input className="vx-input w-full" value={form.cargo ?? ''} placeholder="CEO, Coordinador…"
                    onChange={(e) => set('cargo', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Empresa (alianza)</label>
                <AlianzaCombobox alianzas={alianzas} value={form.alianza_id ?? null} onChange={(id) => set('alianza_id', id)} />
                <p className="text-[11.5px] mt-1" style={{ color: '#9CA3AF' }}>Busca y elige la alianza: se reutiliza su logo. Si no eliges, escribe el nombre abajo.</p>
              </div>
              {!form.alianza_id && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Nombre de empresa (manual)</label>
                  <input className="vx-input w-full" value={form.empresa ?? ''} placeholder="Ej. Centro de Terapias Crecemos"
                    onChange={(e) => set('empresa', e.target.value)} />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B7280' }}>Calificación</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => set('calificacion', n)} className="p-0.5">
                      <Star size={22} style={{ color: GREEN, fill: (form.calificacion ?? 5) >= n ? GREEN : 'transparent' }} />
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={form.activo !== 0} onChange={(e) => set('activo', e.target.checked ? 1 : 0)} className="w-4 h-4" style={{ accentColor: GREEN }} />
                <span className="text-[13px]" style={{ color: '#374151' }}>Mostrar en la landing</span>
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
            <h3 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>¿Eliminar testimonio?</h3>
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

/**
 * Combobox con búsqueda para elegir la alianza (empresa) del testimonio.
 * Escribes para filtrar, muestra el logo, y "Sin alianza" limpia la selección.
 */
function AlianzaCombobox({ alianzas, value, onChange }: {
  alianzas: VaxaAlianza[]; value: number | null; onChange: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = alianzas.find((a) => a.id === value) ?? null;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtradas = alianzas.filter((a) => a.nombre.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <input
        className="vx-input w-full"
        value={open ? q : (selected?.nombre ?? '')}
        placeholder="Buscar empresa…"
        onFocus={() => { setQ(''); setOpen(true); }}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
      />
      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 rounded-lg overflow-y-auto bg-white"
          style={{ border: '1px solid #E5E7EB', maxHeight: 220, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)' }}>
          <button type="button" onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onChange(null); setQ(''); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50" style={{ color: '#9CA3AF' }}>
            — Sin alianza (usar nombre manual) —
          </button>
          {filtradas.map((a) => (
            <button key={a.id} type="button" onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(a.id); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-[13.5px] hover:bg-gray-50 flex items-center gap-2"
              style={{ color: '#0D0E12', background: a.id === value ? '#ECFDF5' : undefined }}>
              {a.logo_url
                ? <img src={imgUrl(a.logo_url)} alt="" className="h-6 w-6 rounded object-contain bg-white flex-shrink-0" style={{ border: '1px solid #F1F4F3' }} />
                : <span className="h-6 w-6 rounded flex-shrink-0" style={{ background: '#F1F4F3' }} />}
              <span className="truncate">{a.nombre}</span>
            </button>
          ))}
          {filtradas.length === 0 && (
            <div className="px-3 py-3 text-[12.5px] text-center" style={{ color: '#9CA3AF' }}>Sin resultados</div>
          )}
        </div>
      )}
    </div>
  );
}
