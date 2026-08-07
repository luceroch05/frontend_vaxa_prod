export interface TenantConfig {
  id: string;
  name: string;
  primaryColor: string;
  logo?: string;
  modules: {
    dashboard: boolean;
    pacientes: boolean;
    citas: boolean;
    terapeutas: boolean;
    facturacion?: boolean;
    participantes?: boolean;
  };
  hasLogin?: boolean;
  customModules?: string[];
  /** Habilita el módulo SaaS de certificados en /:id/certificados/ */
  hasCertificados?: boolean;
}

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
      participantes: true,
    },
    customModules: ['Dashboard', 'Login', 'Participantes', 'HistorialLotes', 'Certificados', 'Validacion'],
  },

  'sistemas-vaxa': {
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
      participantes: true,
    },
    customModules: [
      'Login',
      'Sistemas',
      'UsuariosSistemasVaxa',
      'DashboardCertificaciones',
      'EmpresasCertificaciones',
      'RegistrarEmpresaCertificaciones',
      'PerfilEmpresa',
      'CobranzaCertificaciones',
      'FacturacionCertificaciones',
      'TarifarioCertificaciones',
      'CotizacionesCertificaciones',
      'ReclamosCertificaciones',
    ],
  },

  // ── Empresas cliente del SaaS de certificados ──────────────────────────────
  // Para onboardear un cliente nuevo: agrega su tenant_slug aquí con hasCertificados: true
  // URL pública:  /:id/certificados/
  // URL panel:    /:id/certificados/panel/  (login en /:id/certificados/login)
  'vaxa': {
    id: 'vaxa',
    name: 'VAXA SISTEMAS',
    primaryColor: '#4f46e5',
    hasLogin: false,
    hasCertificados: true,
    modules: {
      dashboard: false,
      pacientes: false,
      citas: false,
      terapeutas: false,
    },
  },
};

export function getTenantConfig(tenantId: string): TenantConfig | null {
  return tenants[tenantId] ?? null;
}

export function tenantExists(tenantId: string): boolean {
  return tenantId in tenants;
}

export function getAllTenants(): TenantConfig[] {
  return Object.values(tenants);
}
