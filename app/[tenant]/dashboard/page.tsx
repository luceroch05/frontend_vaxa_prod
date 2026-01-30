import { notFound, redirect } from 'next/navigation';
import { getTenantConfig } from '@/lib/tenants';
import { loadModule } from '@/lib/module-loader';
import AuthGuard from '../AuthGuard';

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

  // Para sistemas-vaxa, redirigir a /sistemas
  if (tenantId === 'sistemas-vaxa') {
    redirect(`/${tenantId}/sistemas`);
  }

  // Cargar módulo Dashboard dinámicamente
  // Si empresa-techpro tiene custom, carga ese; si no, carga el core
  const DashboardModule = await loadModule('Dashboard', tenantId);

  return (
    <AuthGuard tenantId={tenantId}>
      <DashboardModule tenantId={tenantId} tenant={tenant} />
    </AuthGuard>
  );
}

