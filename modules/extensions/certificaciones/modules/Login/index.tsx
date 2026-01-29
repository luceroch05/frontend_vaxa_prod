'use client';

// Módulo Login personalizado para empresa-techpro
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getTenantConfig } from '@/lib/tenants';
import Image from 'next/image';
import { Mail, Lock, Building2, Eye, EyeOff, AlertCircle, Loader2 } from '@/components/ui/icon';
import { TENANT_CONFIG } from '../../shared/constants';

interface LoginProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function TechProLogin({ params }: LoginProps) {
  const { tenant: tenantId } = use(params);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    return null;
  }

  // Si el tenant no tiene login habilitado, redirigir
  if (!tenant.hasLogin) {
    router.push(`/${tenantId}`);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Datos estáticos para autenticación (full frontend)
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

      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Validar credenciales
      const usuario = USUARIOS_ESTATICOS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!usuario) {
        setError('Credenciales incorrectas. Intenta con admin@tecpro.com / 123456');
        setIsLoading(false);
        return;
      }

      // Login exitoso - guardar sesión en localStorage
      localStorage.setItem(`auth_${tenantId}`, 'true');
      localStorage.setItem(`auth_user_${tenantId}`, JSON.stringify({
        email: usuario.email,
        nombre: usuario.nombre,
        role: usuario.role
      }));

      console.log('✅ Login exitoso:', usuario.nombre);

      // Redirigir al dashboard
      router.push(`/${tenantId}`);
      router.refresh();
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión. Por favor, intente nuevamente.');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center lg:p-8"
      style={{
        background: `linear-gradient(135deg, ${TENANT_CONFIG.PRIMARY_COLOR}15, ${TENANT_CONFIG.SECONDARY_COLOR}15)`
      }}
    >
      <div className="w-full h-full lg:h-auto lg:max-w-4xl">
        <div className="bg-white lg:rounded-2xl shadow-2xl overflow-hidden h-full lg:h-auto animate-[scaleIn_0.5s_ease-out]">
          <div className="grid lg:grid-cols-2 gap-0 h-full lg:h-auto">
            {/* Panel izquierdo - Logo y marca */}
            <div
              className="hidden lg:flex flex-col items-center justify-center p-8 animate-[slideLeft_0.6s_ease-out_0.2s_both]"
              style={{
                background: `linear-gradient(135deg, ${TENANT_CONFIG.PRIMARY_COLOR}, ${TENANT_CONFIG.SECONDARY_COLOR})`
              }}
            >
              <div className="text-center">
                {TENANT_CONFIG.LOGO ? (
                  <Image
                    src={TENANT_CONFIG.LOGO}
                    alt={TENANT_CONFIG.NAME}
                    width={140}
                    height={140}
                    className="mx-auto rounded-xl object-cover shadow-xl mb-6 border-4 border-white"
                  />
                ) : (
                  <div className="w-32 h-32 mx-auto rounded-xl flex items-center justify-center shadow-xl mb-6 border-4 border-white bg-white/10 backdrop-blur-sm">
                    <Building2 className="w-16 h-16 text-white" />
                  </div>
                )}
                <h1 className="text-3xl font-bold text-white mb-3">
                  {TENANT_CONFIG.NAME}
                </h1>
                <p className="text-white/90 text-base">
                  Sistema de Gestión de Certificados
                </p>
              </div>
            </div>

            {/* Panel derecho - Formulario */}
            <div className="p-6 lg:p-8 flex flex-col justify-center overflow-y-auto animate-[fadeIn_0.8s_ease-out_0.3s_both]">
              {/* Logo móvil */}
              <div className="lg:hidden text-center mb-6">
                {TENANT_CONFIG.LOGO ? (
                  <Image
                    src={TENANT_CONFIG.LOGO}
                    alt={TENANT_CONFIG.NAME}
                    width={80}
                    height={80}
                    className="mx-auto rounded-xl object-cover shadow-lg mb-4 border-3 border-white"
                  />
                ) : (
                  <div
                    className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center shadow-lg mb-4 border-3 border-white"
                    style={{
                      background: `linear-gradient(135deg, ${TENANT_CONFIG.PRIMARY_COLOR}, ${TENANT_CONFIG.SECONDARY_COLOR})`
                    }}
                  >
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                )}
                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                  {TENANT_CONFIG.NAME}
                </h1>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  Bienvenido
                </h2>
                <p className="text-gray-600 text-sm">Inicia sesión para continuar</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm"
                      style={{
                        '--tw-ring-color': TENANT_CONFIG.PRIMARY_COLOR
                      } as React.CSSProperties}
                      placeholder="tu@email.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-10 pr-11 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-sm"
                      style={{
                        '--tw-ring-color': TENANT_CONFIG.PRIMARY_COLOR
                      } as React.CSSProperties}
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2.5 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs">{error}</span>
                  </div>
                )}

                {/* Botón */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${TENANT_CONFIG.PRIMARY_COLOR}, ${TENANT_CONFIG.SECONDARY_COLOR})`
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="text-center mt-6 text-xs text-gray-500">
                <p>Powered by <strong>VAXA</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
