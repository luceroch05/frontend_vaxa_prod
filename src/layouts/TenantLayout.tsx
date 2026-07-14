import { Outlet, useParams, Navigate } from 'react-router-dom';
import { getTenantConfig } from '@/lib/tenants';
import { getHostMode } from '@/lib/host';

export default function TenantLayout() {
  const { tenantId: paramTenant } = useParams<{ tenantId: string }>();
  const { modo, tenant: hostTenant } = getHostMode();
  // En el subdominio `sistemas.` el tenant es fijo y NO viene en la URL.
  const tenantId = modo === 'sistemas' ? hostTenant : paramTenant;
  const tenant = tenantId ? getTenantConfig(tenantId) : null;

  if (!tenantId || !tenant) {
    return <Navigate to="/" replace />;
  }

  // certificaciones y sistemas-vaxa tienen su propio layout en cada módulo
  return <Outlet />;
}
