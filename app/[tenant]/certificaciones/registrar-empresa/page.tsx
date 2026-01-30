import { use } from 'react';
import { getTenantConfig } from '@/lib/tenants';
import { redirect } from 'next/navigation';
import RegistrarEmpresaCertificaciones from '@/modules/extensions/sistemas-vaxa/modules/RegistrarEmpresaCertificaciones';

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function RegistrarEmpresaPage({ params }: PageProps) {
  const { tenant: tenantId } = use(params);
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    redirect('/');
  }

  if (tenantId !== 'sistemas-vaxa') {
    redirect(`/${tenantId}`);
  }

  return <RegistrarEmpresaCertificaciones tenantId={tenantId} tenant={tenant} />;
}
