import Link from 'next/link';
import { TenantConfig } from '@/lib/tenants';

interface HomeProps {
  tenantId: string;
  tenant: TenantConfig;
}

export default function Home({ tenantId, tenant }: HomeProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Bienvenido a2222 {tenant.name}
        </h2>
        <p className="text-gray-600 mb-4">
          Esta es la página principal del centro de terapia.
        </p>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-700">
            <strong>Tenant ID:</strong> {tenant.id}
          </p>
          <p className="text-sm text-blue-700">
            <strong>Color primario:</strong> {tenant.primaryColor}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Dashboard</h3>
          <p className="text-gray-600 mb-4">
            Vista general del centro con estadísticas y resumen.
          </p>
          <Link
            href={`/${tenantId}/dashboard`}
            className="text-blue-600 hover:underline"
          >
            Ir al Dashboard →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Pacientes</h3>
          <p className="text-gray-600 mb-4">
            Gestiona la información de los pacientes del centro.
          </p>
          <Link
            href={`/${tenantId}/pacientes`}
            className="text-blue-600 hover:underline"
          >
            Ver Pacientes →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Citas</h3>
          <p className="text-gray-600 mb-4">
            Administra las citas y horarios de terapia.
          </p>
          <Link
            href={`/${tenantId}/citas`}
            className="text-blue-600 hover:underline"
          >
            Ver Citas →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Terapeutas</h3>
          <p className="text-gray-600 mb-4">
            Gestiona el equipo de terapeutas del centro.
          </p>
          <Link
            href={`/${tenantId}/terapeutas`}
            className="text-blue-600 hover:underline"
          >
            Ver Terapeutas →
          </Link>
        </div>
      </div>
    </div>
  );
}

