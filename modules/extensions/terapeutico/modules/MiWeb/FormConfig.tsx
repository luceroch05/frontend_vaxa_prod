import { useEffect, useState } from 'react';
import { Loader2, Save } from '@/components/ui/icon';
import { imgUrl } from '@/lib/api/client';
import { webApi, fileToBase64, type WebConfig } from '../../shared/api/web.api';

const TEAL = '#0F766E';

export interface CampoConfig {
  key: keyof WebConfig;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'color' | 'image';
  placeholder?: string;
}

/**
 * Formulario genérico sobre web_config (fila única del tenant). Cada pestaña
 * (Portada, Redes, Contacto) le pasa SOLO sus campos; al guardar manda ese
 * subconjunto (el backend actualiza solo lo enviado).
 */
export default function FormConfig({
  empresa, titulo, descripcion, campos,
}: { empresa: string; titulo: string; descripcion?: string; campos: CampoConfig[] }) {
  const [form, setForm] = useState<Partial<WebConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    webApi.getConfig(empresa)
      .then((c) => { if (vivo) { setForm(c ?? {}); setLoading(false); } })
      .catch(() => { if (vivo) setLoading(false); });
    return () => { vivo = false; };
  }, [empresa]);

  const set = (k: keyof WebConfig, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const onFile = async (k: keyof WebConfig, file?: File | null) => {
    if (!file) return;
    set(k, await fileToBase64(file));
  };

  const guardar = async () => {
    setSaving(true); setMsg(null);
    try {
      const payload: Partial<WebConfig> = {};
      campos.forEach((c) => { (payload as any)[c.key] = (form as any)[c.key] ?? null; });
      const saved = await webApi.saveConfig(empresa, payload);
      setForm((f) => ({ ...f, ...saved }));
      setMsg('Cambios guardados ✓');
    } catch (e) { setMsg((e as Error).message || 'No se pudo guardar'); }
    finally { setSaving(false); setTimeout(() => setMsg(null), 2800); }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: TEAL }} /></div>;
  }

  return (
    <div>
      <h3 className="text-[16px] font-bold" style={{ color: '#0E1A1A' }}>{titulo}</h3>
      {descripcion && <p className="text-[13px] mb-5" style={{ color: '#8A9A98' }}>{descripcion}</p>}

      <div className="space-y-4 max-w-[620px]">
        {campos.map((c) => {
          const val = (form as any)[c.key] ?? '';
          return (
            <div key={String(c.key)}>
              <label className="block text-[12px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4B5563' }}>{c.label}</label>

              {c.type === 'textarea' && (
                <textarea value={val} onChange={(e) => set(c.key, e.target.value)} placeholder={c.placeholder}
                  rows={3} className="w-full rounded-xl px-3.5 py-2.5 text-[14px]" style={{ border: '1px solid #E2E8E6', background: '#F8FAFA' }} />
              )}

              {(c.type === 'text' || c.type === 'url') && (
                <input type="text" value={val} onChange={(e) => set(c.key, e.target.value)} placeholder={c.placeholder}
                  className="w-full rounded-xl px-3.5 py-2.5 text-[14px]" style={{ border: '1px solid #E2E8E6', background: '#F8FAFA' }} />
              )}

              {c.type === 'color' && (
                <div className="flex items-center gap-3">
                  <input type="color" value={val || '#0F766E'} onChange={(e) => set(c.key, e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer" style={{ border: '1px solid #E2E8E6' }} />
                  <input type="text" value={val} onChange={(e) => set(c.key, e.target.value)} placeholder="#0F766E"
                    className="flex-1 rounded-xl px-3.5 py-2.5 text-[14px]" style={{ border: '1px solid #E2E8E6', background: '#F8FAFA' }} />
                </div>
              )}

              {c.type === 'image' && (
                <div className="flex items-center gap-4">
                  {val
                    ? <img src={imgUrl(val)} alt="" className="h-16 w-16 rounded-xl object-contain bg-white" style={{ border: '1px solid #E2E8E6' }} />
                    : <div className="h-16 w-16 rounded-xl flex items-center justify-center text-[11px]" style={{ border: '1px dashed #CBD5D1', color: '#9CA3AF' }}>sin imagen</div>}
                  <label className="text-[13px] font-semibold cursor-pointer px-3.5 py-2 rounded-lg" style={{ background: '#EFF6F5', color: TEAL }}>
                    Subir imagen
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(c.key, e.target.files?.[0])} />
                  </label>
                  {val && <button type="button" onClick={() => set(c.key, '')} className="text-[13px]" style={{ color: '#DC2626' }}>Quitar</button>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button onClick={guardar} disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-[14px] disabled:opacity-50" style={{ background: TEAL }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar
        </button>
        {msg && <span className="text-[13px] font-semibold" style={{ color: msg.includes('✓') ? '#059669' : '#DC2626' }}>{msg}</span>}
      </div>
    </div>
  );
}
