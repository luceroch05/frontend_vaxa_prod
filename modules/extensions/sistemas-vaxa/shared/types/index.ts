// Tipos para sistemas-vaxa

export interface Empresa {
  id: string;
  nombre: string;
  ruc: string; // RUC o NIF
  email: string;
  telefono: string;
  direccion: string;
  pais: string;
  slug: string; // slug único para la empresa
  tipo: 'certificados' | 'medico' | 'inventario';
  estado: 'activo' | 'inactivo' | 'suspendido';
  planId: string;
  logoUrl?: string;
  logoSubidoPor?: string; // email del usuario que subió
  logoFechaSubida?: string;
  logoBloqueado: boolean;
  firmas: Firma[];
  usuariosActivos: number;
  certificadosGenerados: number;
  fechaCreacion: string;
  fechaUltimaActividad: string;
  contactoPrincipal: {
    nombre: string;
    email: string;
    cargo: string;
  };
}

export interface Firma {
  id: string;
  nombre: string;
  cargo: string;
  url: string;
  subidoPor?: string;
  fechaSubida?: string;
  bloqueado: boolean;
}

// Mantener Sistema para compatibilidad (deprecado)
export interface Sistema extends Empresa {}


export interface UsuarioEmpresa {
  id: string;
  empresaId: string;
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  rol: 'admin' | 'operador' | 'usuario';
  estado: 'activo' | 'inactivo';
  fechaCreacion: string;
  ultimoAcceso?: string;
  creadoPor?: string; // email del admin de vaxa que lo creó
}

// Alias para compatibilidad
export interface UsuarioSistema extends UsuarioEmpresa {
  sistemaId: string;
}

export interface ConfiguracionSistema {
  sistemaId: string;
  logo: {
    url: string;
    bloqueado: boolean;
    fechaBloqueo?: string;
  };
  firmas: Array<{
    id: string;
    nombre: string;
    cargo: string;
    url: string;
    bloqueado: boolean;
    fechaBloqueo?: string;
  }>;
  colores: {
    primario: string;
    secundario: string;
  };
}

export interface Plan {
  id: string;
  nombre: string;
  precio: number;
  usuariosMax: number;
  certificadosMax: number; // -1 = ilimitado
  features: string[];
}
