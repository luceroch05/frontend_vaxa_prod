// Módulo Pacientes para empresa-techpro
// Ejemplo de cómo usar los recursos compartidos

import { TenantConfig } from '@/lib/tenants';
import { formatDate } from '../../shared/utils';
import { TENANT_CONFIG } from '../../shared/constants';
import PageTransition from '@/components/shared/PageTransition';
// Si necesitas servicios específicos de pacientes:
// import { pacientesService } from '../../shared/services';

interface PacientesProps {
  tenantId: string;
  tenant: TenantConfig;
}

export default function Pacientes({ tenantId, tenant }: PacientesProps) {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">
          Pacientes - {TENANT_CONFIG.NAME}
        </h2>
        <p className="text-gray-600 text-lg">
          Gestión de pacientes para <strong>{tenant.name}</strong>
        </p>
      </div>

      {/* Aquí iría el contenido del módulo Pacientes */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-gray-600">
          Módulo Pacientes usando recursos compartidos del tenant.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Puede usar: shared/constants, shared/types, shared/services, shared/hooks, shared/utils, shared/components
        </p>
      </div>
      </div>
    </PageTransition>
  );
}
