import { TenantConfig } from '@/lib/tenants';

interface DashboardProps {
  tenantId: string;
  tenant: TenantConfig;
}

export default function CustomDashboard({
  tenantId,
  tenant,
}: DashboardProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Dashboard Personalizado
        </h2>
        <p className="text-gray-600">
          Vista especial para <strong>{tenant.name}</strong>
        </p>
      </div>

      {/* Diseño completamente diferente al core */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">Vista Especial</h3>
          <p className="text-blue-100 mb-4">
            Este es un dashboard completamente personalizado para esta empresa.
          </p>
          <div className="bg-white/20 rounded p-4">
            <p className="text-2xl font-bold">Diseño Custom</p>
            <p className="text-sm text-blue-100">Solo para empresa-demo</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">Métricas Avanzadas</h3>
          <p className="text-green-100 mb-4">
            Gráficos y estadísticas personalizadas.
          </p>
          <div className="bg-white/20 rounded p-4">
            <p className="text-2xl font-bold">Custom Analytics</p>
            <p className="text-sm text-green-100">Vista exclusiva</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Características Especiales</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Dashboard con diseño completamente diferente</li>
          <li>Métricas y gráficos personalizados</li>
          <li>Vista exclusiva para {tenant.name}</li>
          <li>Este módulo sobrescribe el Dashboard core</li>
        </ul>
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p className="text-sm text-blue-700">
            <strong>Nota:</strong> Este es un módulo custom ubicado en{' '}
            <code className="bg-blue-100 px-2 py-1 rounded">
              /modules/extensions/empresa-demo/Dashboard
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}

