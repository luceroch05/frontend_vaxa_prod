import { notFound } from 'next/navigation';
import { getTenantConfig } from '@/lib/tenants';
import { loadModule } from '@/lib/module-loader';

export default async function TerapeutasPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantId } = await params;
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    notFound();
  }

  // Cargar módulo Terapeutas dinámicamente
  const TerapeutasModule = await loadModule('Terapeutas', tenantId);

  return <TerapeutasModule tenantId={tenantId} tenant={tenant} />;
}

