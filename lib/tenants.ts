

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
    participantes?: boolean;
  };

  // Indica si este tenant utiliza inicio de sesión
  hasLogin?: boolean;

  // Módulos custom que sobrescriben los core
  customModules?: string[];
}

// Base de datos simulada de tenants (luego vendrá del backend)
const tenants: Record<string, TenantConfig> = {
   'certificaciones': {
    id: 'certificaciones',
    name: 'Certificaciones',
    primaryColor: 'purple',
    hasLogin: true,
    modules: {
      dashboard: true,
      pacientes: false,
      citas: false,
      terapeutas: false,
      facturacion: false,
      participantes: true, // Habilitar participantes
    },
    customModules: ['Dashboard', 'Login', 'Participantes', 'HistorialLotes', 'Certificados', 'Validacion'],
  },
  'sistemas-vaxa':{
    id: 'sistemas-vaxa',
    name: 'Sistemas Vaxa',
    primaryColor: 'indigo',
    hasLogin: true,
    modules: {
      dashboard: true,
      pacientes: false,
      citas: false,
      terapeutas: false,
      facturacion: false,
      participantes: true ,
      
      

    },
    customModules: ['Dashboard', 'Login', 'Sistemas', 'Usuarios', 'Configuracion', 'Planes','GestionSistema'],
  }
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

