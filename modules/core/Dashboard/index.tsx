import { TenantConfig } from '@/lib/tenants';

interface DashboardProps {
  tenantId: string;
  tenant: TenantConfig;
}

export default function Dashboard({ tenantId, tenant }: DashboardProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Total Pacientes
          </h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Citas Hoy
          </h3>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Terapeutas Activos
          </h3>
          <p className="text-3xl font-bold text-purple-600">0</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Resumen del Centro</h3>
        <p className="text-gray-600">
          Aquí irá el resumen y estadísticas del centro de terapia{' '}
          <strong>{tenant.name}</strong>.
        </p>
        <p className="text-sm text-gray-500 mt-2">Tenant ID: {tenantId}</p>
      </div>
    </div>
  );
}

