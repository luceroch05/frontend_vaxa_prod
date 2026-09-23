'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Loader2, X, Pencil, Trash2, Save, Upload } from '@/components/ui/icon';
import { imgUrl } from '@/lib/api/client';
import { alianzasAdminApi, fileToBase64, type VaxaAlianza } from '../../shared/api/landing.admin.api';

const GREEN = '#059669';

/**
 * Administra las alianzas/convenios (logos de aliados) que salen en la landing
 * pública de Vaxa. El logo se sube como archivo (el backend lo guarda como PNG en
 * /uploads/vaxa; en la BD solo queda la ruta, nunca base64).
 */
export default function AlianzasPanel() {
  const [items, setItems] = useState<VaxaAlianza[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'nuevo' | number | null>(null);
  const [form, setForm] = useState<Partial<VaxaAlianza>>({});
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState<number | null>(null);

  const editando = typeof modal === 'number';

  const cargar = useCallback(async () => {
    setError(null); setItems(null);
    try { setItems(await alianzasAdminApi.list()); }
    catch (e) { setError((e as Error).message); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => { setForm({ activo: 1 }); setModal('nuevo'); setError(null); };
  const abrirEditar = (a: VaxaAlianza) => {
    setForm({ nombre: a.nombre, logo_url: a.logo_url ?? '', link: a.link ?? '', activo: a.activo ?? 1 });
    setModal(a.id); setError(null);
  };
  const cerrar = () => setModal(null);
  const set = (k: keyof VaxaAlianza, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const onFile = async (file?: File | null) => { if (file) set('logo_url', await fileToBase64(file)); };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre?.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true); setError(null);
    try {
      const payload: Partial<VaxaAlianza> = {
        nombre: form.nombre.trim(),
        logo_url: form.logo_url ?? null,
        link: form.link ?? null,
        activo: form.activo ? 1 : 0,
      };
      if (editando) {
        const up = await alianzasAdminApi.update(modal as number, payload);
        setItems((prev) => (prev ?? []).map((x) => (x.id === up.id ? up : x)));
      } else {
        const nuevo = await alianzasAdminApi.create(payload);
        setItems((prev) => [...(prev ?? []), nuevo]);
      }
      cerrar();
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  };

  const eliminar = async () => {
    if (delId == null) return;
    try { await alianzasAdminApi.remove(delId); setItems((prev) => (prev ?? []).filter((x) => x.id !== delId)); setDelId(null); }
    catch (e) { setError((e as Error).message); }
  };

  return (
    <div className="sv-card p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Alianzas y convenios</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Logos de aliados que se muestran en la página principal de Vaxa.</p>
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
          <div className="text-center py-12 text-[13.5px]" style={{ color: '#9CA3AF' }}>Aún no hay alianzas. Agrega la primera.</div>
        ) : items.map((a, idx) => (
          <div key={a.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: idx < items.length - 1 ? '1px solid #F1F4F3' : undefined, background: '#fff' }}>
            <div className="flex items-center gap-3 min-w-0">
              {a.logo_url
                ? <img src={imgUrl(a.logo_url)} alt="" className="h-10 w-10 rounded-lg object-contain bg-white flex-shrink-0" style={{ border: '1px solid #E5E7EB' }} />
                : <div className="h-10 w-10 rounded-lg flex-shrink-0" style={{ background: '#F1F4F3' }} />}
              <div className="min-w-0">
                <p className="text-[14px] font-semibold truncate" style={{ color: '#0D0E12' }}>{a.nombre}</p>
                {a.link && <p className="text-[12px] truncate" style={{ color: '#9CA3AF' }}>{a.link}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {a.activo === 0 && <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded" style={{ background: '#F3F4F6', color: '#6B7280' }}>Oculta</span>}
              <button onClick={() => abrirEditar(a)} className="p-1.5 rounded-lg" style={{ color: '#64748B' }}><Pencil size={16} /></button>
              <button onClick={() => setDelId(a.id)} className="p-1.5 rounded-lg" style={{ color: '#94A3B8' }}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {modal !== null && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)', backdropFilter: 'blur(4px)' }} onMouseDown={cerrar}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>{editando ? 'Editar alianza' : 'Nueva alianza'}</h3>
              <button onClick={cerrar} style={{ color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Nombre</label>
                <input className="vx-input w-full" value={form.nombre ?? ''} placeholder="Nombre del aliado"
                  onChange={(e) => set('nombre', e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Sitio web (opcional)</label>
                <input className="vx-input w-full" value={form.link ?? ''} placeholder="https://..."
                  onChange={(e) => set('link', e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Logo (PNG)</label>
                <div className="flex items-center gap-3">
                  {form.logo_url
                    ? <img src={imgUrl(form.logo_url)} alt="" className="h-14 w-14 rounded-xl object-contain bg-white" style={{ border: '1px solid #E5E7EB' }} />
                    : <div className="h-14 w-14 rounded-xl flex items-center justify-center text-[10px]" style={{ border: '1px dashed #CBD5D1', color: '#9CA3AF' }}>sin img</div>}
                  <label className="inline-flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer px-3 py-1.5 rounded-lg" style={{ background: '#ECFDF5', color: GREEN }}>
                    <Upload size={14} /> Subir<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                  </label>
                  {form.logo_url && <button type="button" onClick={() => set('logo_url', '')} className="text-[13px]" style={{ color: '#DC2626' }}>Quitar</button>}
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
            <h3 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>¿Eliminar alianza?</h3>
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
