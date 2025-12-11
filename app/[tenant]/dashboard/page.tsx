import { notFound } from 'next/navigation';
import { getTenantConfig } from '@/lib/tenants';
import { loadModule } from '@/lib/module-loader';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantId } = await params;
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    notFound();
  }

  // Cargar módulo Dashboard dinámicamente
  // Si empresa-demo tiene custom, carga ese; si no, carga el core
  const DashboardModule = await loadModule('Dashboard', tenantId);

  return <DashboardModule tenantId={tenantId} tenant={tenant} />;
}

