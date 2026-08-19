import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Loader2, X, Pencil, Trash2, Save } from '@/components/ui/icon';
import { imgUrl } from '@/lib/api/client';
import { fileToBase64 } from '../../shared/api/web.api';

const TEAL = '#0F766E';

export interface CampoLista {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image';
  placeholder?: string;
}

export interface CrudApi<T> {
  list: (empresa: string) => Promise<T[]>;
  create: (empresa: string, data: Partial<T>) => Promise<T>;
  update: (empresa: string, id: number, data: Partial<T>) => Promise<T>;
  remove: (empresa: string, id: number) => Promise<void>;
}

interface Item { id: number; activo?: number; [k: string]: any; }

/**
 * Lista editable genérica para las secciones de tipo lista de la web
 * (servicios, staff, alianzas). Recibe los campos a editar y las funciones API.
 */
export default function CrudLista<T extends Item>({
  empresa, titulo, descripcion, campos, api, primaryKey,
}: {
  empresa: string; titulo: string; descripcion?: string;
  campos: CampoLista[]; api: CrudApi<T>; primaryKey: string;
}) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'nuevo' | number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState<number | null>(null);

  const editando = typeof modal === 'number';

  const cargar = useCallback(async () => {
    setError(null); setItems(null);
    try { setItems(await api.list(empresa)); }
    catch (e) { setError((e as Error).message); }
  }, [empresa, api]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => { setForm({ activo: true }); setModal('nuevo'); setError(null); };
  const abrirEditar = (it: T) => {
    const f: Record<string, any> = { activo: it.activo !== 0 };
    campos.forEach((c) => { f[c.key] = it[c.key] ?? ''; });
    setForm(f); setModal(it.id); setError(null);
  };
  const cerrar = () => setModal(null);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const onFile = async (k: string, file?: File | null) => { if (file) set(k, await fileToBase64(file)); };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const payload: Record<string, any> = { activo: form.activo };
      campos.forEach((c) => { payload[c.key] = form[c.key] ?? null; });
      if (editando) {
        const up = await api.update(empresa, modal as number, payload as Partial<T>);
        setItems((prev) => (prev ?? []).map((x) => (x.id === up.id ? up : x)));
      } else {
        const nuevo = await api.create(empresa, payload as Partial<T>);
        setItems((prev) => [...(prev ?? []), nuevo]);
      }
      cerrar();
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  };

  const eliminar = async () => {
    if (delId == null) return;
    try { await api.remove(empresa, delId); setItems((prev) => (prev ?? []).filter((x) => x.id !== delId)); setDelId(null); }
    catch (e) { setError((e as Error).message); }
  };

  const imgKey = campos.find((c) => c.type === 'image')?.key;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[16px] font-bold" style={{ color: '#0E1A1A' }}>{titulo}</h3>
        <button onClick={abrirNuevo} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-white text-[13px]" style={{ background: TEAL }}>
          <Plus size={15} /> Agregar
        </button>
      </div>
      {descripcion && <p className="text-[13px] mb-5" style={{ color: '#8A9A98' }}>{descripcion}</p>}

      {error && !modal && <div className="mb-4 px-4 py-2.5 rounded-xl text-[13px]" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>{error}</div>}

      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #E5E9E7' }}>
        {!items ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: '#CBD5D1' }} /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-[14px]" style={{ color: '#9CA3AF' }}>Aún no hay nada. Agrega el primero.</div>
        ) : items.map((it, idx) => (
          <div key={it.id} className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: idx < items.length - 1 ? '1px solid #F1F4F3' : undefined }}>
            <div className="flex items-center gap-3 min-w-0">
              {imgKey && (
                it[imgKey]
                  ? <img src={imgUrl(it[imgKey])} alt="" className="h-11 w-11 rounded-lg object-contain bg-white flex-shrink-0" style={{ border: '1px solid #E5E9E7' }} />
                  : <div className="h-11 w-11 rounded-lg flex-shrink-0" style={{ background: '#F1F4F3' }} />
              )}
              <div className="min-w-0">
                <p className="text-[14px] font-semibold truncate" style={{ color: '#0E1A1A' }}>
                  {String(it[campos[0].key] ?? it[campos[1]?.key] ?? '—')}
                </p>
                {campos[1] && <p className="text-[12px] truncate" style={{ color: '#9CA3AF' }}>{String(it[campos[1].key] ?? '')}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {it.activo === 0 && <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded" style={{ background: '#F3F4F6', color: '#6B7280' }}>Oculto</span>}
              <button onClick={() => abrirEditar(it)} className="p-1.5 rounded-lg" style={{ color: '#64748B' }}><Pencil size={16} /></button>
              <button onClick={() => setDelId(it.id)} className="p-1.5 rounded-lg" style={{ color: '#94A3B8' }}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {modal !== null && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,26,26,0.45)', backdropFilter: 'blur(4px)' }} onMouseDown={cerrar}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold" style={{ color: '#0E1A1A' }}>{editando ? 'Editar' : 'Agregar'}</h3>
              <button onClick={cerrar} style={{ color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3.5">
              {campos.map((c) => (
                <div key={c.key}>
                  <label className="block text-[12px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4B5563' }}>{c.label}</label>
                  {c.type === 'textarea' && (
                    <textarea value={form[c.key] ?? ''} onChange={(e) => set(c.key, e.target.value)} placeholder={c.placeholder}
                      rows={3} className="w-full rounded-xl px-3.5 py-2.5 text-[14px]" style={{ border: '1px solid #E2E8E6', background: '#F8FAFA' }} />
                  )}
                  {c.type === 'text' && (
                    <input type="text" value={form[c.key] ?? ''} onChange={(e) => set(c.key, e.target.value)} placeholder={c.placeholder}
                      className="w-full rounded-xl px-3.5 py-2.5 text-[14px]" style={{ border: '1px solid #E2E8E6', background: '#F8FAFA' }} />
                  )}
                  {c.type === 'image' && (
                    <div className="flex items-center gap-3">
                      {form[c.key]
                        ? <img src={imgUrl(form[c.key])} alt="" className="h-14 w-14 rounded-xl object-contain bg-white" style={{ border: '1px solid #E2E8E6' }} />
                        : <div className="h-14 w-14 rounded-xl flex items-center justify-center text-[10px]" style={{ border: '1px dashed #CBD5D1', color: '#9CA3AF' }}>sin img</div>}
                      <label className="text-[13px] font-semibold cursor-pointer px-3 py-1.5 rounded-lg" style={{ background: '#EFF6F5', color: TEAL }}>
                        Subir<input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(c.key, e.target.files?.[0])} />
                      </label>
                      {form[c.key] && <button type="button" onClick={() => set(c.key, '')} className="text-[13px]" style={{ color: '#DC2626' }}>Quitar</button>}
                    </div>
                  )}
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={form.activo !== false} onChange={(e) => set('activo', e.target.checked)} className="w-4 h-4 accent-teal-700" />
                <span className="text-[13px]" style={{ color: '#374151' }}>Mostrar en la web</span>
              </label>
              {error && <p className="text-[13px]" style={{ color: '#DC2626' }}>{error}</p>}
              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={cerrar} className="flex-1 py-2.5 rounded-xl font-semibold text-[14px]" style={{ background: '#F1F4F3', color: '#374151' }}>Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white text-[14px] disabled:opacity-50" style={{ background: TEAL }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {delId != null && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,26,26,0.5)', backdropFilter: 'blur(4px)' }} onMouseDown={() => setDelId(null)}>
          <div className="bg-white rounded-2xl max-w-[380px] w-full p-6" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold" style={{ color: '#0E1A1A' }}>¿Eliminar?</h3>
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
