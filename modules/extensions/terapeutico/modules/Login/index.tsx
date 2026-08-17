import { useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, Activity, ArrowRight } from '@/components/ui/icon';
import { authStorage } from '@/lib/auth';
import { terapPath } from '@/lib/paths';
import { ApiError } from '@/lib/api/client';
import { terapAuthApi } from '../../shared/api/terapeutico.api';
import { useBranding } from '../../shared/TerapLayout';

const TEAL = '#0F766E';

export default function TerapLogin() {
  const { empresa } = useParams<{ empresa: string }>();
  const navigate = useNavigate();
  const { slug, razonSocial, logoUrl, activo } = useBranding();
  const marca = razonSocial ?? slug;

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activo) return;
    setLoading(true); setError(null);
    try {
      const { token, usuario } = await terapAuthApi.login(empresa!, correo, contrasena);
      authStorage.setSession(empresa!, token, usuario);
      navigate(terapPath(empresa!, '/panel'));
    } catch (err) {
      setError(err instanceof ApiError ? (err.status === 401 ? 'Credenciales incorrectas' : err.message) : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10" style={{ background: '#F2F4F3' }}>
      <div className="w-full max-w-[1040px] grid lg:grid-cols-2 gap-10 lg:gap-24 items-center">

        {/* Marca (desktop) */}
        <div className="hidden lg:flex flex-col items-center text-center">
          <div className="rounded-[28px] p-8 mb-6 bg-white" style={{ border: '1px solid #E2E8E6', boxShadow: '0 18px 50px rgba(13,26,26,0.08)' }}>
            {logoUrl
              ? <img src={logoUrl} alt={marca} className="h-36 w-36 object-contain" />
              : <div className="w-36 h-36 rounded-[2rem] flex items-center justify-center" style={{ background: '#0E1A1A' }}><Activity size={56} style={{ color: '#5EEAD4' }} /></div>}
          </div>
          <h1 className={`text-[30px] font-bold tracking-tight ${razonSocial ? '' : 'capitalize'}`} style={{ color: '#0E1A1A' }}>{marca}</h1>
          <div className="h-px w-16 my-4" style={{ background: '#CBD5D1' }} />
          <p className="text-[11px] font-semibold" style={{ color: TEAL, letterSpacing: '0.28em' }}>HISTORIAS CLÍNICAS</p>
        </div>

        {/* Formulario */}
        <div className="w-full max-w-[400px] mx-auto">
          <div className="rounded-[20px] overflow-hidden bg-white" style={{ border: '1px solid #E2E8E6', boxShadow: '0 18px 50px rgba(13,26,26,0.10)' }}>
            <div className="lg:hidden px-9 pt-9 pb-7 text-center" style={{ borderBottom: '1px solid #EEF2F1' }}>
              {logoUrl
                ? <img src={logoUrl} alt={marca} className="h-16 mx-auto object-contain" />
                : <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: '#0E1A1A' }}><Activity size={30} style={{ color: '#5EEAD4' }} /></div>}
              <p className={`mt-4 text-[16px] font-bold ${razonSocial ? '' : 'capitalize'}`} style={{ color: '#0E1A1A' }}>{marca}</p>
            </div>

            <div className="px-9 py-8">
              <h1 className="text-[21px] font-bold tracking-tight" style={{ color: '#0E1A1A' }}>Bienvenido</h1>
              <p className="text-[13px] mt-1 mb-6" style={{ color: '#9CA3AF' }}>Ingresa con tus credenciales.</p>

              {!activo && (
                <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-[12.5px] mb-5" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  Este centro está desactivado. Contacta con Vaxa para reactivarlo.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Usuario o correo</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                    <input type="text" required value={correo} onChange={e => setCorreo(e.target.value)} placeholder="correo@centro.com" className="vx-input vx-input-icon" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Contraseña</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                    <input type={showPass ? 'text' : 'password'} required value={contrasena} onChange={e => setContrasena(e.target.value)} placeholder="••••••••" className="vx-input vx-input-icon" style={{ paddingRight: '2.75rem' }} />
                    <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px]" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
                    <AlertCircle size={14} className="flex-shrink-0" /> {error}
                  </div>
                )}

                <button type="submit" disabled={loading || !activo || !correo.trim() || !contrasena}
                  className="w-full py-3 mt-1 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: TEAL }}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <>Ingresar <ArrowRight size={15} /></>}
                </button>
              </form>
            </div>
          </div>
          <p className="text-center text-[11px] mt-5" style={{ color: '#94A3B8' }}>© {new Date().getFullYear()} · Vaxa · Historias Clínicas</p>
        </div>
      </div>
    </div>
  );
}
