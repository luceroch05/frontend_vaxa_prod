// Constantes para sistemas-vaxa (panel de administración)

export const VAXA_CONFIG = {
  NAME: 'Sistemas Vaxa',
  PRIMARY_COLOR: '#059669', // Emerald
  SECONDARY_COLOR: '#047857',
  LOGO: '/vaxa-logo.png', // Logo del panel admin
};

// Tipos de sistemas que se pueden gestionar
export const TIPOS_SISTEMAS = {
  CERTIFICADOS: 'certificados',
  MEDICO: 'medico',
  INVENTARIO: 'inventario',
  // Agregar más tipos según se vayan creando
} as const;

// Estados de sistemas
export const ESTADOS_SISTEMA = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  SUSPENDIDO: 'suspendido',
} as const;

// Roles de usuarios en sistemas
export const ROLES_USUARIO = {
  ADMIN: 'admin',
  OPERADOR: 'operador',
  USUARIO: 'usuario',
} as const;

// Planes disponibles (se cobra por usuario, plan define límite de certificados)
export const PLANES = {
  BASICO: {
    id: 'basico',
    nombre: 'Básico',
    precioPorUsuario: 15, // USD por usuario/mes
    certificadosMax: 100, // límite de certificados totales
    features: ['100 certificados totales', 'Soporte por email', '2 firmas digitales', 'Logo personalizado'],
  },
  INTERMEDIO: {
    id: 'intermedio',
    nombre: 'Intermedio',
    precioPorUsuario: 25, // USD por usuario/mes
    certificadosMax: 300,
    features: ['300 certificados totales', 'Soporte prioritario', '5 firmas digitales', 'Logo personalizado', 'API access'],
  },
  AVANZADO: {
    id: 'avanzado',
    nombre: 'Avanzado',
    precioPorUsuario: 40, // USD por usuario/mes
    certificadosMax: -1, // ilimitado
    features: ['Certificados ilimitados', 'Soporte 24/7', 'Firmas ilimitadas', 'Logo personalizado', 'API ilimitado', 'Personalización avanzada', 'Servidor dedicado'],
  },
} as const;
