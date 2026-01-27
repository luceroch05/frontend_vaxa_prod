// Utilidades para manejar tenants (empresas/centros)

export interface TenantConfig {
  id: string;
  name: string;
  primaryColor: string;
  logo?: string;

  // Módulos habilitados para este tenant
  modules: {
    dashboard: boolean;
    pacientes: boolean;
    citas: boolean;
    terapeutas: boolean;
    facturacion?: boolean;
  };

  // Indica si este tenant utiliza inicio de sesión
  hasLogin?: boolean;

  // Módulos custom que sobrescriben los core
  customModules?: string[];
}

// Base de datos simulada de tenants (luego vendrá del backend)
const tenants: Record<string, TenantConfig> = {
  'empresa-techpro': {
    id: 'empresa-techpro',
    name: 'Empresa TechPro',
    primaryColor: 'purple',
    hasLogin: true,
    modules: {
      dashboard: true,
      pacientes: false,
      citas: false,
      terapeutas: false,
      facturacion: false,
    },
    customModules: ['Dashboard', 'Login'], // Dashboard y Login personalizados para esta empresa
  },
};

/**
 * Obtiene la configuración de un tenant por su ID
 */
export function getTenantConfig(tenantId: string): TenantConfig | null {
  return tenants[tenantId] || null;
}

/**
 * Valida si un tenant existe
 */
export function tenantExists(tenantId: string): boolean {
  return tenantId in tenants;
}

/**
 * Obtiene todos los tenants disponibles (para desarrollo)
 */
export function getAllTenants(): TenantConfig[] {
  return Object.values(tenants);
}

