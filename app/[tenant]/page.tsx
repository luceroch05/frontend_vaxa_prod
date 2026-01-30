import { notFound, redirect } from 'next/navigation';
import { getTenantConfig } from '@/lib/tenants';
import { loadModule } from '@/lib/module-loader';
import AuthGuard from './AuthGuard';

interface TenantPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { tenant: tenantId } = await params;
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    notFound();
  }

  // Para sistemas-vaxa, redirigir directamente a /sistemas
  if (tenantId === 'sistemas-vaxa') {
    redirect(`/${tenantId}/sistemas`);
  }

  // Si solo tiene dashboard habilitado, redirigir al dashboard
  const enabledModules = Object.entries(tenant.modules).filter(([_, enabled]) => enabled);
  if (enabledModules.length === 1 && tenant.modules.dashboard) {
    redirect(`/${tenantId}/dashboard`);
  }

  // Cargar módulo Home dinámicamente
  const HomeModule = await loadModule('Home', tenantId);

  return (
    <AuthGuard tenantId={tenantId}>
      <HomeModule tenantId={tenantId} tenant={tenant} />
    </AuthGuard>
  );
}

