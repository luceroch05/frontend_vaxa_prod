import { notFound } from 'next/navigation';
import { getTenantConfig } from '@/lib/tenants';
import { loadModule } from '@/lib/module-loader';

export default async function PacientesPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantId } = await params;
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    notFound();
  }

  // Cargar módulo Pacientes dinámicamente
  const PacientesModule = await loadModule('Pacientes', tenantId);

  return <PacientesModule tenantId={tenantId} tenant={tenant} />;
}

