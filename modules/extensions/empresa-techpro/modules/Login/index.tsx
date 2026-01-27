'use client';

// Módulo Login personalizado para empresa-techpro
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getTenantConfig } from '@/lib/tenants';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
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
    setError('');
    setIsLoading(true);

    try {
      // TODO: Implementar llamada real a la API de autenticación
      // Por ahora simulamos un login exitoso
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Guardar sesión (por ahora en localStorage, luego será con cookies/backend)
      localStorage.setItem(`auth_${tenantId}`, 'true');
      localStorage.setItem(`auth_user_${tenantId}`, email);

      // Redirigir al dashboard o página principal
      router.push(`/${tenantId}`);
      router.refresh();
    } catch (err) {
      setError('Credenciales incorrectas. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {TENANT_CONFIG.NAME}
          </h2>
          <p className="mt-2 text-sm text-gray-600">Inicia sesión en tu cuenta</p>
        </div>

        <Card className="shadow-2xl border-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                <p className="font-medium">{error}</p>
              </div>
            )}

            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-purple-600 hover:text-purple-500">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all"
            >
              Iniciar sesión
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              Login personalizado de <strong>{TENANT_CONFIG.NAME}</strong>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
