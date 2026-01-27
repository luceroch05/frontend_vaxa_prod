import { notFound } from 'next/navigation';
import { getTenantConfig } from '@/lib/tenants';
import { loadModule } from '@/lib/module-loader';

interface LoginPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { tenant: tenantId } = await params;
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    notFound();
  }

  // Si el tenant no tiene login habilitado, redirigir
  if (!tenant.hasLogin) {
    notFound();
  }

  // Intentar cargar módulo Login personalizado, si no existe, usar genérico
  let LoginModule;
  try {
    LoginModule = await loadModule('Login', tenantId);
  } catch (error) {
    // Si no hay módulo Login personalizado, mostrar error o redirigir
    notFound();
  }

  return <LoginModule params={params} />;
}
