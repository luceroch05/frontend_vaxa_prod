import { useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, GraduationCap, ArrowRight } from '@/components/ui/icon';
import { useAuth } from '../../shared/hooks/useAuth';
import { useBranding } from '../../shared/components/CertificadosLayout';

export default function AdminLogin() {
  const { empresa }  = useParams<{ empresa: string }>();
  const { login, loading, error } = useAuth(empresa!);
  const { slug, razonSocial, logoUrl } = useBranding();
  const marca = razonSocial ?? slug;

  const [correo,     setCorreo]    = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPass,   setShowPass]   = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login(correo, contrasena);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#F4F2EC' }}>
      <div className="w-full max-w-[400px]">
        <div
          className="rounded-[20px] overflow-hidden page-enter"
          style={{ background: '#FFFFFF', border: '1px solid #EAE7DF', boxShadow: '0 18px 50px rgba(13,14,18,0.10)' }}
        >
          {/* Cabecera con el logo de la institución */}
          <div className="px-9 pt-9 pb-7 text-center" style={{ borderBottom: '1px solid #F2F0EA' }}>
            {logoUrl ? (
              <img src={logoUrl} alt={marca ?? 'Logo'} className="h-16 mx-auto object-contain" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: '#0D0E12' }}>
                <GraduationCap size={30} style={{ color: '#C9962C' }} />
              </div>
            )}
            <p className={`mt-4 text-[16px] font-bold leading-tight ${razonSocial ? '' : 'capitalize'}`} style={{ color: '#0D0E12' }}>
              {marca}
            </p>
            <p className="text-[10px] font-semibold mt-1" style={{ color: '#C9962C', letterSpacing: '0.22em' }}>CERTIFICADOS</p>
          </div>

          {/* Acceso */}
          <div className="px-9 py-8">
            <h1 className="text-[21px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Bienvenido de nuevo</h1>
            <p className="text-[13px] mt-1 mb-6" style={{ color: '#9CA3AF' }}>Ingresa con tus credenciales de operador.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898' }} />
                  <input
                    type="email" required value={correo}
                    onChange={e => setCorreo(e.target.value)}
                    placeholder="operador@empresa.com"
                    className="vx-input vx-input-icon"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>
                  Contraseña
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898' }} />
                  <input
                    type={showPass ? 'text' : 'password'} required value={contrasena}
                    onChange={e => setContrasena(e.target.value)}
                    placeholder="••••••••"
                    className="vx-input vx-input-icon"
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:text-gray-600"
                    style={{ color: '#B0A898' }}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px]"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
                >
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="vx-btn vx-btn-primary w-full py-3 mt-1">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <>Ingresar <ArrowRight size={15} /></>}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[11px] mt-5" style={{ color: '#B7B1A6' }}>
          © {new Date().getFullYear()} · Sistema de Certificados Vaxa
        </p>
      </div>
    </div>
  );
}
