import { notFound } from 'next/navigation';
import { getTenantConfig } from '@/lib/tenants';
import { loadModule } from '@/lib/module-loader';

export default async function CitasPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantId } = await params;
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    notFound();
  }

  // Cargar módulo Citas dinámicamente
  const CitasModule = await loadModule('Citas', tenantId);

  return <CitasModule tenantId={tenantId} tenant={tenant} />;
}

