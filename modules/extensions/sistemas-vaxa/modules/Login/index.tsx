'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { Mail, Lock, LogIn, AlertCircle } from '@/components/ui/icon';
import { api, ApiError } from '@/lib/api/client';
import { authStorage, type AuthUser } from '@/lib/auth';

interface LoginProps {
  tenantId: string;
  tenant: TenantConfig;
}

/** Tenant raíz cuyo JWT autoriza la administración de créditos (ver requireRootTenant). */
const ROOT_TENANT = 'vaxa';
/** Producto interno de administración de Vaxa (no facturable; ver tabla `productos`). */
const PRODUCTO_SISTEMAS_VAXA = 'sistemas-vaxa';

export default function LoginSistemasVaxa({ tenantId, tenant }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login real contra el backend como admin de la empresa raíz `vaxa`.
      // El JWT resultante (guardado como vaxa_jwt_vaxa) autoriza /api/admin/creditos/*.
      const { token, usuario } = await api.post<{ token: string; usuario: AuthUser }>(
        '/api/auth/login',
        { correo: email, contrasena: password, empresa: ROOT_TENANT, producto: PRODUCTO_SISTEMAS_VAXA },
      );
      authStorage.setSession(ROOT_TENANT, token, usuario);

      // Mantener el guard del module-loader (booleano) que usan las pantallas de sistemas-vaxa.
      localStorage.setItem(`auth_${tenantId}`, 'true');
      localStorage.setItem(`auth_user_${tenantId}`, JSON.stringify({
        email: usuario.correo,
        nombre: `${usuario.nombres} ${usuario.apellidos}`.trim(),
        role: usuario.rol,
      }));

      navigate(`/${tenantId}/certificaciones`);
    } catch (err) {
      if (err instanceof ApiError) setError(err.status === 401 ? 'Email o contraseña incorrectos' : err.message);
      else setError('Error de conexión con el servidor');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#F4F2EC' }}>
      <div className="w-full max-w-[400px]">
        {/* Glows decorativos */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-[26rem] h-[26rem] rounded-full blur-3xl" style={{ background: 'rgba(5,150,105,0.07)' }} />
          <div className="absolute -bottom-32 -right-20 w-[24rem] h-[24rem] rounded-full blur-3xl" style={{ background: 'rgba(5,150,105,0.05)' }} />
        </div>

        <div className="relative rounded-[20px] overflow-hidden page-enter" style={{ background: '#FFFFFF', border: '1px solid #EAE7DF', boxShadow: '0 18px 50px rgba(13,14,18,0.10)' }}>
          {/* Cabecera */}
          <div className="px-9 pt-9 pb-7 text-center" style={{ borderBottom: '1px solid #F2F0EA' }}>
            <img src="/vaxa.png" alt="Vaxa" className="h-24 w-auto object-contain mx-auto" style={{ maxWidth: 260 }} />
            <p className="text-[10px] font-semibold mt-2" style={{ color: '#059669', letterSpacing: '0.22em' }}>ADMINISTRACIÓN</p>
          </div>

          <div className="px-9 py-8">
            <h2 className="text-[20px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Bienvenido</h2>
            <p className="text-[13px] mt-1 mb-6" style={{ color: '#9CA3AF' }}>Ingresa al panel de administración.</p>

            {error && (
              <div className="mb-5 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 text-[13px]" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Usuario o correo</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] pointer-events-none" style={{ color: '#B0A898' }} />
                  <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario o admin@vaxa.com" required className="sv-input" style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] pointer-events-none" style={{ color: '#B0A898' }} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="sv-input" style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>

              <button type="submit" disabled={loading || !email.trim() || !password} className="sv-btn sv-btn-primary w-full py-3 mt-1">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Ingresando…</>
                ) : (
                  <><LogIn className="w-4 h-4" /> Ingresar</>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="relative text-center text-[11px] mt-5" style={{ color: '#B7B1A6' }}>
          © {new Date().getFullYear()} · Sistemas Vaxa
        </p>
      </div>
    </div>
  );
}
