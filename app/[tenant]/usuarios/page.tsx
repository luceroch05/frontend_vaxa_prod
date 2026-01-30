import { use } from 'react';
import { getTenantConfig } from '@/lib/tenants';
import { redirect } from 'next/navigation';
import UsuariosSistemasVaxa from '@/modules/extensions/sistemas-vaxa/modules/UsuariosSistemasVaxa';

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function UsuariosPage({ params }: PageProps) {
  const { tenant: tenantId } = use(params);
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    redirect('/');
  }

  if (tenantId !== 'sistemas-vaxa') {
    redirect(`/${tenantId}`);
  }

  return <UsuariosSistemasVaxa tenantId={tenantId} tenant={tenant} />;
}
