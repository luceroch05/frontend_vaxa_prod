'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTenantConfig } from '@/lib/tenants';

interface AuthGuardProps {
  tenantId: string;
  children: React.ReactNode;
}

export default function AuthGuard({ tenantId, children }: AuthGuardProps) {
  const router = useRouter();
  const tenant = getTenantConfig(tenantId);
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (tenant?.hasLogin) {
      // Verificar si está autenticado (solo en cliente)
      const authStatus = localStorage.getItem(`auth_${tenantId}`) === 'true';
      setIsAuthenticated(authStatus);
      
      if (!authStatus) {
        // Redirigir al login
        router.push(`/${tenantId}/login`);
      }
    } else {
      // Si no requiere login, permitir acceso
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, [tenantId, tenant, router]);

  // Mostrar loading mientras verifica
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  // Si tiene login y no está autenticado, no renderizar (está redirigiendo)
  if (tenant?.hasLogin && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
