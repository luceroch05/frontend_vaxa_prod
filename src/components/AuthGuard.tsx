import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';

interface AuthGuardProps {
  tenantId: string;
  children: React.ReactNode;
}

export default function AuthGuard({ tenantId, children }: AuthGuardProps) {
  const navigate = useNavigate();
  const tenant = getTenantConfig(tenantId);
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (tenant?.hasLogin) {
      const authStatus = localStorage.getItem(`auth_${tenantId}`) === 'true';
      setIsAuthenticated(authStatus);
      if (!authStatus) {
        navigate(tenantPath(tenantId, '/login'));
      }
    } else {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, [tenantId, tenant, navigate]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (tenant?.hasLogin && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
