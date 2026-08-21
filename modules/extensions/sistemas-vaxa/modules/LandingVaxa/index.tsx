'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import { Loader2, Save, Globe } from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import { VAXA_CONFIG } from '../../shared/constants';
import { landingAdminApi, type VaxaLanding } from '../../shared/api/landing.admin.api';

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

/** Campos editables: clave, etiqueta y ayuda. */
const CAMPOS: { key: keyof VaxaLanding; label: string; ph: string }[] = [
  { key: 'facebook',  label: 'Facebook',   ph: 'https://facebook.com/vaxa' },
  { key: 'instagram', label: 'Instagram',  ph: 'https://instagram.com/vaxa' },
  { key: 'tiktok',    label: 'TikTok',     ph: 'https://tiktok.com/@vaxa' },
  { key: 'youtube',   label: 'YouTube',    ph: 'https://youtube.com/@vaxa' },
  { key: 'linkedin',  label: 'LinkedIn',   ph: 'https://linkedin.com/company/vaxa' },
  { key: 'whatsapp',  label: 'WhatsApp',   ph: 'Solo números, ej. 51924600490' },
  { key: 'email',     label: 'Correo',     ph: 'info@vaxa.com.pe' },
  { key: 'telefono',  label: 'Teléfono',   ph: '+51 924 600 490' },
];

export default function LandingVaxa({ tenantId }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [form, setForm] = useState<VaxaLanding>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    const authData = localStorage.getItem(`auth_${tenantId}`);
    const userData = localStorage.getItem(`auth_user_${tenantId}`);
    if (authData !== 'true') { navigate(tenantPath(tenantId, '/login')); return; }
    if (userData) { try { setUsuario(JSON.parse(userData)); } catch { navigate(tenantPath(tenantId, '/login')); return; } }
    landingAdminApi.get().then(setForm).catch(e => setError((e as Error).message)).finally(() => setLoading(false));
  }, [tenantId, navigate]);

  const set = (k: keyof VaxaLanding, v: string) => { setForm(f => ({ ...f, [k]: v })); setOk(false); };

  const guardar = async () => {
    setSaving(true); setError(null); setOk(false);
    try { setForm(await landingAdminApi.save(form)); setOk(true); }
    catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  if (!usuario) return null;

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa tenantId={tenantId} usuario={usuario}
        config={{ name: VAXA_CONFIG.NAME, primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }} />

      <main className="max-w-2xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        <div className="mb-6 page-enter flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: '#ECFDF5' }}>
            <Globe size={18} style={{ color: '#059669' }} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Redes de la landing</h1>
            <p className="text-[13px] mt-0.5" style={{ color: '#9CA3AF' }}>Enlaces y contacto que se muestran en la página principal de Vaxa. Deja vacío lo que no uses.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#059669' }} /></div>
        ) : (
          <div className="sv-card p-5 space-y-3.5">
            {CAMPOS.map(c => (
              <label key={c.key} className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>{c.label}</span>
                <input className="vx-input w-full" value={(form[c.key] as string) ?? ''} placeholder={c.ph}
                  onChange={e => set(c.key, e.target.value)} />
              </label>
            ))}

            {error && <p className="text-[12.5px] font-semibold px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>{error}</p>}
            {ok && <p className="text-[12.5px] font-semibold px-3 py-2 rounded-lg" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>Guardado ✓</p>}

            <div className="flex justify-end pt-1">
              <button onClick={guardar} disabled={saving}
                className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{ background: '#059669' }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
