import { use } from 'react';
import { getTenantConfig } from '@/lib/tenants';
import { redirect } from 'next/navigation';
import PerfilEmpresa from '@/modules/extensions/sistemas-vaxa/modules/PerfilEmpresa';

interface PageProps {
  params: Promise<{
    tenant: string;
    empresaId: string;
  }>;
}

export default function EmpresaPerfilPage({ params }: PageProps) {
  const { tenant: tenantId, empresaId } = use(params);
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    redirect('/');
  }

  if (tenantId !== 'sistemas-vaxa') {
    redirect(`/${tenantId}`);
  }

  return <PerfilEmpresa tenantId={tenantId} tenant={tenant} empresaId={empresaId} />;
}
