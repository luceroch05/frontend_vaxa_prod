import Link from 'next/link';
import { TenantConfig } from '@/lib/tenants';

interface PacientesProps {
  tenantId: string;
  tenant: TenantConfig;
}

export default function Pacientes({ tenantId, tenant }: PacientesProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Pacientes</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Nuevo Paciente
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">
          Lista de pacientes del centro <strong>{tenant.name}</strong>.
        </p>
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500">
            Aquí se mostrará la tabla de pacientes cuando esté conectado al
            backend.
          </p>
        </div>
      </div>
    </div>
  );
}

