import { use } from 'react';
import { getTenantConfig } from '@/lib/tenants';
import { redirect } from 'next/navigation';
import UsuariosSistema from '@/modules/extensions/sistemas-vaxa/modules/UsuariosSistema';

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function CertificacionesUsuariosPage({ params }: PageProps) {
  const { tenant: tenantId } = use(params);
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    redirect('/');
  }

  if (tenantId !== 'sistemas-vaxa') {
    redirect(`/${tenantId}`);
  }

  return <UsuariosSistema tenantId={tenantId} tenant={tenant} sistemaSlug="certificaciones" />;
}
