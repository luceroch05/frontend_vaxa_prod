import { useParams, Navigate } from 'react-router-dom';
import { getTenantConfig } from '@/lib/tenants';
import { getHostMode } from '@/lib/host';
import { tenantPath } from '@/lib/paths';

export default function TenantRedirect() {
  const { tenantId: paramTenant } = useParams<{ tenantId: string }>();
  const { modo, tenant: hostTenant } = getHostMode();
  const tenantId = modo === 'sistemas' ? hostTenant : paramTenant;
  const tenant = tenantId ? getTenantConfig(tenantId) : null;

  if (!tenantId || !tenant) {
    return <Navigate to="/" replace />;
  }

  if (tenantId === 'sistemas-vaxa') {
    return <Navigate to={tenantPath(tenantId, '/sistemas')} replace />;
  }
  if (tenantId === 'certificaciones') {
    return <Navigate to={tenantPath(tenantId, '/login')} replace />;
  }

  return <Navigate to={tenantPath(tenantId, '/dashboard')} replace />;
}
