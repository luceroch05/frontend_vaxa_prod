import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTenantConfig } from '@/lib/tenants';
import LoginWrapper from './LoginWrapper';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenant: tenantId } = await params;
  const tenant = getTenantConfig(tenantId);

  if (!tenant) {
    notFound();
  }

  // Mapeo de colores para evitar clases dinámicas de Tailwind
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600',
  };

  const headerColor = colorClasses[tenant.primaryColor] || 'bg-blue-600';

  const header = (
    <header className={`${headerColor} text-white shadow-md`}>
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <p className="text-sm opacity-90">ID: {tenant.id}</p>
      </div>
    </header>
  );

  // Construir navegación basada en módulos habilitados
  const navItems = [
    { href: `/${tenantId}`, label: 'Inicio', alwaysShow: true },
    { href: `/${tenantId}/dashboard`, label: 'Dashboard', module: 'dashboard' },
    // Agregar más módulos aquí cuando se habiliten:
    // { href: `/${tenantId}/pacientes`, label: 'Pacientes', module: 'pacientes' },
    // { href: `/${tenantId}/citas`, label: 'Citas', module: 'citas' },
    // { href: `/${tenantId}/terapeutas`, label: 'Terapeutas', module: 'terapeutas' },
  ];

  const navigation = (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex space-x-6">
          {navItems.map((item) => {
            const shouldShow = item.alwaysShow || tenant.modules[item.module as keyof typeof tenant.modules];
            if (!shouldShow) return null;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="py-4 px-2 text-gray-600 hover:text-blue-600"
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );

  // Para empresa-techpro, no usar el layout general (es independiente)
  if (tenantId === 'certificaciones') {
    return <>{children}</>;
  }

   // Para empresa-techpro, no usar el layout general (es independiente)
  if (tenantId === 'sistemas-vaxa') {
    return <>{children}</>;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <LoginWrapper header={header} navigation={navigation}>
        <main className="container mx-auto px-4 py-8">{children}</main>
      </LoginWrapper>
    </div>
  );
}

