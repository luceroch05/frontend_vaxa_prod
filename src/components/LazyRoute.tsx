import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getTenantConfig } from '@/lib/tenants';
import { getHostMode } from '@/lib/host';
import { loadModule } from '@/lib/module-loader';
import AuthGuard from './AuthGuard';

interface LazyRouteProps {
  module: string;
  paramKey?: 'loteId' | 'empresaId';
}

export default function LazyRoute({ module: moduleName, paramKey }: LazyRouteProps) {
  const params = useParams<{ tenantId: string; loteId?: string; empresaId?: string }>();
  const host = getHostMode();
  // En el subdominio `sistemas.` el tenant es fijo y NO viene en la URL.
  const tenantId = host.modo === 'sistemas' ? host.tenant : params.tenantId!;
  const tenant = getTenantConfig(tenantId);
  const [Module, setModule] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadModule(moduleName, tenantId)
      .then((Comp) => {
        if (!cancelled) setModule(() => Comp);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Módulo no encontrado');
      });
    return () => { cancelled = true; };
  }, [moduleName, tenantId]);

  if (!tenant) return null;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!Module) return <div className="flex items-center justify-center min-h-screen text-gray-600">Cargando...</div>;

  const extraProps: Record<string, string> = {};
  if (paramKey === 'loteId' && params.loteId) extraProps.loteId = params.loteId;
  if (paramKey === 'empresaId' && params.empresaId) extraProps.empresaId = params.empresaId;

  const content = <Module tenantId={tenantId} tenant={tenant} {...extraProps} />;

  // Login no debe ir envuelto en AuthGuard (sino nunca se muestra el formulario)
  if (moduleName === 'Login') {
    return content;
  }

  return <AuthGuard tenantId={tenantId}>{content}</AuthGuard>;
}
