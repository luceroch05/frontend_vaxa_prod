import { TenantConfig } from '@/lib/tenants';

interface DashboardProps {
  tenantId: string;
  tenant: TenantConfig;
}

export default function TechProDashboard({
  tenantId,
  tenant,
}: DashboardProps) {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">
          Dashboard TechPro
        </h2>
        <p className="text-gray-600 text-lg">
          Panel de control personalizado para <strong>{tenant.name}</strong>
        </p>
      </div>

      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold opacity-90">Usuarios Activos</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold">0</p>
          <p className="text-sm opacity-75 mt-2">Total registrados</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold opacity-90">Sesiones Hoy</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-4xl font-bold">0</p>
          <p className="text-sm opacity-75 mt-2">Programadas</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold opacity-90">Ingresos</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold">$0</p>
          <p className="text-sm opacity-75 mt-2">Este mes</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold opacity-90">Eficiencia</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-4xl font-bold">0%</p>
          <p className="text-sm opacity-75 mt-2">Tasa de éxito</p>
        </div>
      </div>

      {/* Sección de actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Actividad Reciente
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Sistema iniciado</p>
                <p className="text-xs text-gray-500">Hace unos momentos</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-indigo-50 rounded-lg">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Dashboard personalizado cargado</p>
                <p className="text-xs text-gray-500">Vista exclusiva de TechPro</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Estado del Sistema
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-800">Sistema Operativo</span>
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">Activo</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-800">Base de Datos</span>
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">Conectado</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-800">Módulo Dashboard</span>
              <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">Personalizado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Información del tenant */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-2xl font-bold mb-4">Información del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm opacity-90 mb-1">Nombre de la Empresa</p>
            <p className="text-lg font-semibold">{tenant.name}</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Tenant ID</p>
            <p className="text-lg font-semibold font-mono">{tenantId}</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Color Primario</p>
            <p className="text-lg font-semibold capitalize">{tenant.primaryColor}</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Módulo</p>
            <p className="text-lg font-semibold">Dashboard Personalizado</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <p className="text-sm">
            <strong>Nota:</strong> Este es un dashboard completamente personalizado para TechPro, 
            ubicado en <code className="bg-white/20 px-2 py-1 rounded text-xs">/modules/extensions/empresa-techpro/modules/Dashboard</code>
          </p>
        </div>
      </div>
    </div>
  );
}
