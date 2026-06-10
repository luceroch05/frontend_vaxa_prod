import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  GraduationCap, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff,
  FileBadge, Shield, Zap,
} from '@/components/ui/icon';
import { useAuth } from '../../shared/hooks/useAuth';
import { publicApi } from '../../shared/api/public.api';

export default function AdminLogin() {
  const { empresa }  = useParams<{ empresa: string }>();
  const { login, loading, error } = useAuth(empresa!);
  const [correo,     setCorreo]    = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPass,   setShowPass]   = useState(false);

  // Branding de la empresa (logo + razón social) subido al registrarla.
  const [logo,   setLogo]   = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    publicApi.existeEmpresa(empresa!)
      .then((r) => { if (activo) { setLogo(r.logo_url ?? null); setNombre(r.razon_social ?? null); } })
      .catch(() => { /* sin branding, se usa el default */ });
    return () => { activo = false; };
  }, [empresa]);

  const marca = nombre ?? empresa;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login(correo, contrasena);
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F4F0' }}>

      {/* ── Panel izquierdo ─────────────────────────────────── */}
      <div
        className="hidden lg:flex w-[420px] flex-shrink-0 flex-col justify-between p-10"
        style={{ background: '#0D0E12' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          {logo ? (
            <img src={logo} alt={marca ?? 'Logo'} className="w-9 h-9 rounded-[10px] object-contain bg-white p-0.5" />
          ) : (
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
              <GraduationCap size={15} style={{ color: '#D97706' }} />
            </div>
          )}
          <div>
            <p className="text-[13px] font-bold" style={{ color: '#F1F5F9' }}>{marca}</p>
            <p className="text-[10px]" style={{ color: '#64748B', letterSpacing: '0.04em' }}>Certificados</p>
          </div>
        </div>

        {/* Hero */}
        <div className="space-y-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}
          >
            <FileBadge size={26} style={{ color: '#D97706' }} />
          </div>

          <div>
            <h1 className="text-[30px] font-bold leading-snug" style={{ color: '#F8FAFC' }}>
              Gestión de<br />Certificados
            </h1>
            <p className="text-[14px] leading-relaxed mt-3" style={{ color: '#475569' }}>
              Administra programas, grupos e inscripciones.<br />
              Emite certificados en segundos.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { Icon: Shield,   text: 'Acceso seguro y encriptado' },
              { Icon: Zap,      text: 'Emisión de certificados en segundos' },
              { Icon: FileBadge,text: 'Validación pública con código QR' },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(254,243,199,0.12)', border: '1px solid rgba(253,230,138,0.2)' }}
                >
                  <Icon size={14} style={{ color: '#D97706' }} />
                </div>
                <span className="text-[13px]" style={{ color: '#475569' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px]" style={{ color: '#1E293B' }}>
          © {new Date().getFullYear()} Vaxa · Sistema de Certificados
        </p>
      </div>

      {/* ── Panel derecho: formulario ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-[380px] rounded-2xl p-8"
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEECE6',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FEF3C7' }}>
              <GraduationCap size={14} style={{ color: '#D97706' }} />
            </div>
            <span className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>Vaxa Certificados</span>
          </div>

          <div className="mb-7">
            <h2 className="text-[22px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>
              Ingresar al panel
            </h2>
            <p className="text-[13px] mt-1.5" style={{ color: '#9CA3AF' }}>
              Usa tus credenciales de operador
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898' }} />
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  placeholder="operador@empresa.com"
                  className="vx-input vx-input-icon"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>
                Contraseña
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={contrasena}
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

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px]"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
              >
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="vx-btn vx-btn-primary w-full py-3 mt-1"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Ingresando...' : 'Ingresar al panel'}
            </button>
          </form>

          <p className="text-center text-[11px] mt-6" style={{ color: '#D1D5DB' }}>
            Vaxa · Sistema de Certificados
          </p>
        </div>
      </div>
    </div>
  );
}
