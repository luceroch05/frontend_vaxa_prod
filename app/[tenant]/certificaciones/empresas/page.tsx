import { use } from 'react';
import { getTenantConfig } from '@/lib/tenants';
import { redirect } from 'next/navigation';
import EmpresasCertificaciones from '@/modules/extensions/sistemas-vaxa/modules/EmpresasCertificaciones';

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function EmpresasPage({ params }: PageProps) {
  const { tenant: tenantId } = use(params);
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    redirect('/');
  }

  if (tenantId !== 'sistemas-vaxa') {
    redirect(`/${tenantId}`);
  }

  return <EmpresasCertificaciones tenantId={tenantId} tenant={tenant} />;
}
