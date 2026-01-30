import { use } from 'react';
import { getTenantConfig } from '@/lib/tenants';
import { redirect } from 'next/navigation';
import DashboardCertificaciones from '@/modules/extensions/sistemas-vaxa/modules/DashboardCertificaciones';

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function CertificacionesPage({ params }: PageProps) {
  const { tenant: tenantId } = use(params);
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    redirect('/');
  }

  if (tenantId !== 'sistemas-vaxa') {
    redirect(`/${tenantId}`);
  }

  return <DashboardCertificaciones tenantId={tenantId} tenant={tenant} />;
}
