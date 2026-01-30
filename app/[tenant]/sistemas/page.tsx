import { notFound } from 'next/navigation';
import { getTenantConfig } from '@/lib/tenants';
import { loadModule } from '@/lib/module-loader';
import AuthGuard from '../AuthGuard';

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function SistemasPage({ params }: PageProps) {
  const { tenant: tenantId } = await params;
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    notFound();
  }

  // Intentar cargar el módulo Sistemas
  let SistemasModule;
  try {
    SistemasModule = await loadModule('Sistemas', tenantId);
  } catch (error) {
    notFound();
  }

  return (
    <AuthGuard tenantId={tenantId}>
      <SistemasModule tenantId={tenantId} tenant={tenant} />
    </AuthGuard>
  );
}
