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
  
  // Módulos custom que sobrescriben los core
  customModules?: string[];
}

// Base de datos simulada de tenants (luego vendrá del backend)
const tenants: Record<string, TenantConfig> = {
  'empresa-demo': {
    id: 'empresa-demo',
    name: 'Centro de Terapia Demo',
    primaryColor: 'blue',
    modules: {
      dashboard: true,
      pacientes: true,
      citas: true,
      terapeutas: true,
      facturacion: false,
    },
    customModules: ['Dashboard', 'Home'], // Dashboard y Home son custom para esta empresa
  },
  'centro-abc': {
    id: 'centro-abc',
    name: 'Centro ABC',
    primaryColor: 'green',
    modules: {
      dashboard: true,
      pacientes: true,
      citas: true,
      terapeutas: true,
      facturacion: true, // Este centro sí tiene facturación
    },
    customModules: [], // Usa todos los módulos core
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

