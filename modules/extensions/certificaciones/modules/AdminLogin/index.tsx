import { useEffect, useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, GraduationCap, ArrowRight } from '@/components/ui/icon';
import { useAuth } from '../../shared/hooks/useAuth';
import { useBranding } from '../../shared/components/CertificadosLayout';

export default function AdminLogin() {
  const { empresa }  = useParams<{ empresa: string }>();
  const { login, loading, error } = useAuth(empresa!);
  const { slug, razonSocial, logoUrl, activo } = useBranding();
  const marca = razonSocial ?? slug;

  const [correo,     setCorreo]    = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [sesionCerrada, setSesionCerrada] = useState(false);

  // Si llegamos aquí por una sesión revocada (login en otro dispositivo),
  // mostramos el aviso una sola vez y limpiamos el flag.
  useEffect(() => {
    if (sessionStorage.getItem('vaxa_session_revoked')) {
      setSesionCerrada(true);
      sessionStorage.removeItem('vaxa_session_revoked');
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!activo) return;   // empresa desactivada: no se permite el acceso
    login(correo, contrasena);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10" style={{ background: '#F4F2EC' }}>
      <div className="w-full max-w-[1040px] grid lg:grid-cols-2 gap-10 lg:gap-24 items-center">

        {/* ── Columna izquierda · marca / logo (solo desktop) ───────── */}
        <div className="hidden lg:flex flex-col items-center text-center page-enter">
          {/* Tarjeta con borde para el logo */}
          <div
            className="rounded-[28px] p-8 mb-6 bg-white"
            style={{ border: '1px solid #EAE7DF', boxShadow: '0 18px 50px rgba(13,14,18,0.08)' }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={marca ?? 'Logo'} className="h-36 w-36 object-contain" />
            ) : (
              <div className="w-36 h-36 rounded-[2rem] flex items-center justify-center" style={{ background: '#0D0E12' }}>
                <GraduationCap size={56} style={{ color: '#C9962C' }} />
              </div>
            )}
          </div>
          <h1 className={`text-[30px] font-bold tracking-tight leading-tight ${razonSocial ? '' : 'capitalize'}`} style={{ color: '#0D0E12' }}>
            {marca}
          </h1>
          <div className="h-px w-16 my-4" style={{ background: '#D8D3C7' }} />
          <p className="text-[11px] font-semibold" style={{ color: '#C9962C', letterSpacing: '0.28em' }}>
            SISTEMA DE CERTIFICADOS
          </p>
        </div>

        {/* ── Columna derecha · formulario ──────────────────────────── */}
        <div className="w-full max-w-[400px] mx-auto">
          <div
            className="rounded-[20px] overflow-hidden page-enter"
            style={{ background: '#FFFFFF', border: '1px solid #EAE7DF', boxShadow: '0 18px 50px rgba(13,14,18,0.10)' }}
          >
            {/* Logo de la institución (solo móvil, ya que en desktop está a la izquierda) */}
            <div className="lg:hidden px-9 pt-9 pb-7 text-center" style={{ borderBottom: '1px solid #F2F0EA' }}>
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

              {!activo && (
                <div
                  className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-[12.5px] mb-5"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
                >
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  Esta empresa está desactivada. El acceso al sistema está suspendido; la validación de certificados sigue disponible. Contacta con Vaxa para reactivarla.
                </div>
              )}

              {sesionCerrada && (
                <div
                  className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-[12.5px] mb-5"
                  style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}
                >
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  Tu sesión se cerró porque se inició sesión con esta cuenta en otro dispositivo.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>
                    Usuario o correo
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898' }} />
                    <input
                      type="text" required value={correo}
                      onChange={e => setCorreo(e.target.value)}
                      placeholder="usuario o correo@empresa.com"
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

                <button type="submit" disabled={loading || !activo || !correo.trim() || !contrasena} className="vx-btn vx-btn-primary w-full py-3 mt-1">
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
    </div>
  );
}
