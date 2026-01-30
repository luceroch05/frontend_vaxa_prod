import { use } from 'react';
import { getTenantConfig } from '@/lib/tenants';
import { redirect } from 'next/navigation';
import PlanSistema from '@/modules/extensions/sistemas-vaxa/modules/PlanSistema';

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default function CertificacionesPlanPage({ params }: PageProps) {
  const { tenant: tenantId } = use(params);
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    redirect('/');
  }

  if (tenantId !== 'sistemas-vaxa') {
    redirect(`/${tenantId}`);
  }

  return <PlanSistema tenantId={tenantId} tenant={tenant} sistemaSlug="certificaciones" />;
}
