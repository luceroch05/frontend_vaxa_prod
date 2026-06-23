'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Shield, ArrowRight } from '@/components/ui/icon';
import { TENANT_CONFIG } from '../../shared/constants';

interface LoginProps {
  tenantId: string;
  tenant: TenantConfig;
}

export default function CertificacionesLogin({ tenantId, tenant }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const USUARIOS_ESTATICOS = [
        {
          email: 'admin@tecpro.com',
          password: '123456',
          nombre: 'Administrador TechPro',
          role: 'admin'
        },
        {
          email: 'usuario@tecpro.com',
          password: '123456',
          nombre: 'Usuario Demo',
          role: 'user'
        }
      ];

      await new Promise((resolve) => setTimeout(resolve, 800));

      const usuario = USUARIOS_ESTATICOS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!usuario) {
        setError('Credenciales incorrectas');
        setIsLoading(false);
        return;
      }

      localStorage.setItem(`auth_${tenantId}`, 'true');
      localStorage.setItem(`auth_user_${tenantId}`, JSON.stringify({
        email: usuario.email,
        nombre: usuario.nombre,
        role: usuario.role
      }));

      navigate(`/${tenantId}/dashboard`);
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión. Por favor, intente nuevamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="grid lg:grid-cols-2 gap-0 min-h-screen">

            {/* Columna izquierda - Branding */}
            <div 
              className="hidden lg:flex flex-col justify-between p-8 relative overflow-hidden"
              style={{
                backgroundColor: TENANT_CONFIG.PRIMARY_COLOR
              }}
            >
              {/* Grid pattern futurista */}
              <div className="absolute inset-0 opacity-[0.04]">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
                  `,
                  backgroundSize: '80px 80px'
                }}></div>
              </div>

              {/* Gradiente radial sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10"></div>

              {/* Elementos flotantes minimalistas */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 -left-20 w-80 h-80 bg-black/[0.05] rounded-full blur-3xl"></div>
              </div>

              {/* Contenido */}
              <div className="relative z-10 flex flex-col justify-center flex-1 space-y-12">
                
                {/* Logo central grande */}
                <div className="flex justify-center">
                  {TENANT_CONFIG.LOGO ? (
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-white/5 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      <img
                        src={TENANT_CONFIG.LOGO}
                        alt={TENANT_CONFIG.NAME}
                        width={160}
                        height={160}
                        className="relative rounded-[2rem] object-cover w-40 h-40"
                      />
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-white/5 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      <div className="relative w-40 h-40 bg-white/5 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/10">
                        <Shield className="w-20 h-20 text-white/90" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Texto principal */}
                <div className="text-center space-y-4 px-6">
                  <div className="space-y-3">
                    <h1 className="text-5xl font-bold text-white tracking-tight leading-none">
                      {TENANT_CONFIG.NAME}
                    </h1>
                    <div className="h-px w-20 bg-white/20 mx-auto"></div>
                    <p className="text-base text-white/60 font-light tracking-wide">
                      Sistema de Gestión de Certificados
                    </p>
                  </div>
                </div>

                {/* Features minimalistas en línea */}
                <div className="flex items-center justify-center gap-6 px-6">
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <div className="w-1 h-1 rounded-full bg-white/50"></div>
                    <span className="font-light">Seguro</span>
                  </div>
                  <div className="w-px h-4 bg-white/20"></div>
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <div className="w-1 h-1 rounded-full bg-white/50"></div>
                    <span className="font-light">Rápido</span>
                  </div>
                  <div className="w-px h-4 bg-white/20"></div>
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <div className="w-1 h-1 rounded-full bg-white/50"></div>
                    <span className="font-light">Moderno</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Columna derecha - Formulario */}
            <div className="p-8 lg:p-12 flex flex-col justify-center bg-white">

              {/* Logo móvil */}
              <div className="lg:hidden text-center mb-8">
                <div className="flex justify-center mb-3">
                  {TENANT_CONFIG.LOGO ? (
                    <img
                      src={TENANT_CONFIG.LOGO}
                      alt={TENANT_CONFIG.NAME}
                      width={56}
                      height={56}
                      className="rounded-2xl object-cover shadow-lg w-14 h-14"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{
                        backgroundColor: TENANT_CONFIG.PRIMARY_COLOR
                      }}
                    >
                      <Shield className="w-7 h-7 text-white" />
                    </div>
                  )}
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  {TENANT_CONFIG.NAME}
                </h1>
                <p className="text-xs text-gray-500 font-light">
                  Sistema de Gestión de Certificados
                </p>
              </div>

              {/* Título del formulario */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                  Bienvenido
                </h2>
                <p className="text-gray-500 font-light">
                  Ingresa tus credenciales para continuar
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div className="space-y-2">
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-medium text-gray-900"
                  >
                    Usuario o correo
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-hover:text-gray-500 transition-colors" />
                    </div>
                    <input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 hover:border-gray-400 transition-colors text-base"
                      placeholder="nombre@empresa.com"
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-medium text-gray-900"
                  >
                    Contraseña
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-hover:text-gray-500 transition-colors" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 hover:border-gray-400 transition-colors text-base"
                      placeholder="••••••••"
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                {/* Botón */}
                <button
                  type="submit"
                  disabled={isLoading || !email.trim() || !password}
                  className="w-full text-white py-3.5 rounded-xl font-medium text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group relative overflow-hidden shadow-sm hover:shadow-md"
                  style={{
                    backgroundColor: isLoading ? '#9ca3af' : TENANT_CONFIG.PRIMARY_COLOR
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <>
                        <span>Iniciar Sesión</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  {!isLoading && (
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500 font-light">
                  © {new Date().getFullYear()} <span className="font-semibold">VAXA</span> · Todos los derechos reservados
                </p>
              </div>

            </div>

          </div>
    </div>
  );
}