import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTenantConfig } from '@/lib/tenants';

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Tenant */}
      <header className={`${headerColor} text-white shadow-md`}>
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <p className="text-sm opacity-90">ID: {tenant.id}</p>
        </div>
      </header>

      {/* Navegación */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-6">
            <Link
              href={`/${tenantId}`}
              className="py-4 px-2 border-b-2 border-blue-500 text-blue-600 font-medium"
            >
              Inicio
            </Link>
            <Link
              href={`/${tenantId}/dashboard`}
              className="py-4 px-2 text-gray-600 hover:text-blue-600"
            >
              Dashboard
            </Link>
            <Link
              href={`/${tenantId}/pacientes`}
              className="py-4 px-2 text-gray-600 hover:text-blue-600"
            >
              Pacientes
            </Link>
            <Link
              href={`/${tenantId}/citas`}
              className="py-4 px-2 text-gray-600 hover:text-blue-600"
            >
              Citas
            </Link>
            <Link
              href={`/${tenantId}/terapeutas`}
              className="py-4 px-2 text-gray-600 hover:text-blue-600"
            >
              Terapeutas
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

