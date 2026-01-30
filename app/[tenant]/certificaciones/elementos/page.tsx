import { use } from 'react';
import { getTenantConfig } from '@/lib/tenants';
import { redirect } from 'next/navigation';
import ElementosSistema from '@/modules/extensions/sistemas-vaxa/modules/ElementosSistema';

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function CertificacionesElementosPage({ params }: PageProps) {
  const { tenant: tenantId } = use(params);
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    redirect('/');
  }

  if (tenantId !== 'sistemas-vaxa') {
    redirect(`/${tenantId}`);
  }

  return <ElementosSistema tenantId={tenantId} tenant={tenant} sistemaSlug="certificaciones" />;
}
