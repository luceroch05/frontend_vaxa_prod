import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

const ROOT_TENANT = 'vaxa';

/** Opciones con el JWT del admin de Vaxa (empresa raíz). */
const opts = () => ({
  tenantId: ROOT_TENANT,
  token: authStorage.getToken(ROOT_TENANT) ?? undefined,
});

export interface EmpresaCreditos {
  id: number;
  razon_social: string;
  tenant_slug: string;
  dominio: string | null;
  ruc: string | null;
  logo_url: string | null;
  activo: number;
  creditos_disponibles: number;
  creditos_asignados_total: number;
  creditos_consumidos: number;
}

export interface MovimientoCredito {
  id: number;
  tipo: 'asignacion' | 'recarga' | 'consumo' | 'devolucion' | 'ajuste';
  cantidad: number;
  saldo_resultante: number;
  certificado_id: number | null;
  descripcion: string | null;
  created_at: string;
}

/** ── Planes (modelo de suscripción) ────────────────────────── */
export interface PlanCatalogo {
  id: number;
  slug: string;
  nombre: string;
  precio_mensual: number;
  limite_certificados_mes: number;
  precio_certificado_adicional: number;
  setup_inicial: number;
  permite_diseno: boolean;
  permite_subdominio: boolean;
  permite_api: boolean;
  permite_carga_masiva: boolean;
  permite_metricas: boolean;
  permite_auditoria: boolean;
  muestra_pdf_publico: boolean;
}

export interface EstadoPlanEmpresa {
  plan: (PlanCatalogo & { muestra_pdf_publico: boolean }) | null;
  suscripcion: { id: number; ciclo: string; estado: string; fecha_inicio: string; fecha_fin: string } | null;
  consumo: {
    anio: number; mes: number;
    incluidos: number; emitidos: number; adicionales: number;
    monto_adicional: number; restantes: number;
  };
}

export interface UsuarioEmpresa {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  activo: number;
  rol_id: number;
  rol: string;
}

export interface Rol { id: number; nombre: string; descripcion: string | null; }

export interface CrearEmpresaDto {
  razon_social: string;
  tenant_slug?: string;
  dominio?: string;
  ruc?: string;
  logo?: string;
  plan_id?: number;     // plan con el que arranca (default: Básico)
  ciclo_id?: number;    // ciclo de facturación (default: mensual)
}

export interface EditarEmpresaDto {
  razon_social?: string;
  tenant_slug?: string;
  dominio?: string;
  ruc?: string;
  logo?: string;
  activo?: boolean;
}

export interface CrearUsuarioDto {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
  rol_id: number;
  producto?: string;   // a qué producto se le da acceso (certificaciones, sistemas-vaxa…)
}

export interface EditarUsuarioDto {
  nombres?: string;
  apellidos?: string;
  correo?: string;
  contrasena?: string;   // opcional: solo si se quiere cambiar
  rol_id?: number;
  activo?: boolean;
}

export const creditosAdminApi = {
  listEmpresas: () =>
    api.get<EmpresaCreditos[]>('/api/admin/empresas', opts()),

  crearEmpresa: (dto: CrearEmpresaDto) =>
    api.post<EmpresaCreditos>('/api/admin/empresas', dto, opts()),

  editarEmpresa: (id: number, dto: EditarEmpresaDto) =>
    api.patch<EmpresaCreditos>(`/api/admin/empresas/${id}`, dto, opts()),

  recargar: (empresaId: number, cantidad: number, descripcion?: string) =>
    api.post<{ empresaId: number; saldo: number }>(
      `/api/admin/creditos/empresas/${empresaId}/recargar`,
      { cantidad, descripcion },
      opts(),
    ),

  movimientos: (empresaId: number, limit = 100) =>
    api.get<MovimientoCredito[]>(
      `/api/admin/creditos/empresas/${empresaId}/movimientos?limit=${limit}`,
      opts(),
    ),

  listUsuarios: (empresaId: number, producto?: string) =>
    api.get<UsuarioEmpresa[]>(
      `/api/admin/empresas/${empresaId}/usuarios${producto ? `?producto=${encodeURIComponent(producto)}` : ''}`,
      opts(),
    ),

  crearUsuario: (empresaId: number, dto: CrearUsuarioDto) =>
    api.post<UsuarioEmpresa>(`/api/admin/empresas/${empresaId}/usuarios`, dto, opts()),

  editarUsuario: (empresaId: number, usuarioId: number, dto: EditarUsuarioDto) =>
    api.patch<UsuarioEmpresa>(`/api/admin/empresas/${empresaId}/usuarios/${usuarioId}`, dto, opts()),

  eliminarUsuario: (empresaId: number, usuarioId: number, producto?: string) =>
    api.delete<{ ok: boolean }>(
      `/api/admin/empresas/${empresaId}/usuarios/${usuarioId}${producto ? `?producto=${encodeURIComponent(producto)}` : ''}`,
      opts(),
    ),

  listRoles: () =>
    api.get<Rol[]>('/api/admin/roles', opts()),

  /** ── Planes ── */
  listPlanes: () =>
    api.get<PlanCatalogo[]>('/api/admin/planes', opts()),

  getPlanEmpresa: (empresaId: number) =>
    api.get<EstadoPlanEmpresa>(`/api/admin/empresas/${empresaId}/plan`, opts()),

  asignarPlan: (empresaId: number, plan_id: number, ciclo_id: number) =>
    api.post<EstadoPlanEmpresa>(`/api/admin/empresas/${empresaId}/plan`, { plan_id, ciclo_id }, opts()),
};
