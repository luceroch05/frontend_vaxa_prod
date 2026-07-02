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
  tipo_doc?: string;        // cat.06: '6' RUC · '1' DNI · '4' CE · '7' pasaporte
  logo_url: string | null;
  activo: number;
  creditos_disponibles: number;
  creditos_asignados_total: number;
  creditos_consumidos: number;
  ilimitado?: boolean;      // plan ilimitado (Corporativo): saldo sin tope
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

/** ── Planes (modelo créditos + mantenimiento) ──────────────── */
export interface PlanCatalogo {
  id: number;
  slug: string;
  nombre: string;
  precio_mensual: number;          // = mantenimiento mensual
  implementacion: number;          // pago único de activación
  mantenimiento_mensual: number;
  creditos_incluidos: number;
  usuarios_incluidos: number;      // 0 = ilimitado
  limite_certificados_mes: number; // legado (ya no se usa)
  precio_certificado_adicional: number;
  setup_inicial: number;           // = implementación
  permite_diseno: boolean;
  permite_subdominio: boolean;
  permite_api: boolean;
  permite_carga_masiva: boolean;
  permite_metricas: boolean;
  permite_auditoria: boolean;
  muestra_pdf_publico: boolean;
}

/** Saldo de créditos de la empresa. */
export interface CreditosSaldo {
  disponibles: number;
  asignados: number;
  consumidos: number;
  recargados: number;   // total comprado aparte (recargas); el resto vino del plan
  ilimitado: boolean;   // plan ilimitado (Corporativo): emite sin tope
}

export type EstadoCobranza = 'vigente' | 'por_vencer' | 'vencido';

export interface SuscripcionEmpresa {
  id: number; ciclo: string; estado: string;
  fecha_inicio: string; fecha_fin: string;   // fecha_fin = "mantenimiento pagado hasta" (fin de mes)
  fecha_limite_pago: string;     // fin de mes de referencia (próximo cobro o 1ra cuota impaga)
  dias_para_vencer: number;      // al día: días al próximo fin de mes; con deuda: días desde la 1ra cuota impaga (neg)
  estado_cobranza: EstadoCobranza;
  cuotas_vencidas?: number;      // cuántas cuotas de mantenimiento debe (0 = al día)
}

export interface EstadoPlanEmpresa {
  plan: (PlanCatalogo & { muestra_pdf_publico: boolean }) | null;
  suscripcion: SuscripcionEmpresa | null;
  consumo: {
    anio: number; mes: number;
    incluidos: number; emitidos: number; adicionales: number;
    monto_adicional: number; restantes: number;
  };
  creditos: CreditosSaldo;
}

/** Fila del control de cobranza (una por empresa). */
export interface VencimientoEmpresa {
  empresa_id: number;
  razon_social: string;
  tenant_slug: string;
  activo: boolean;
  plan: string | null;
  ciclo: string | null;
  precio_mensual: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ultimo_pago: string | null;
  cobranza: { fecha_limite_pago: string; dias_para_vencer: number; estado_cobranza: EstadoCobranza } | null;
}

export interface MarcarPagadoDto {
  monto?: number;
  fecha_pago?: string;          // 'YYYY-MM-DD'
  comprobante_tipo_id?: number; // 1 ninguno · 2 boleta · 3 factura
  comprobante_numero?: string;
  emitir_comprobante?: boolean; // emitir factura electrónica a SUNAT al registrar el pago
  renovar?: boolean;            // false en la primera venta (no extiende la vigencia ya otorgada)
  registrar_pago?: boolean;     // false = SOLO renueva, no inserta pago (el pago lo registra "Nueva venta")
}

/** Una fila del historial de pagos. */
export interface PagoHist {
  id: number;
  concepto: string;
  monto: number;
  moneda: string;
  estado: string;
  comprobante_tipo: string;
  comprobante_numero: string | null;
  referencia_niubiz: string | null;
  fecha: string | null;
  cpe_id: number | null;          // comprobante electrónico vinculado
  cpe_numero: string | null;      // F001-3
  cpe_estado: string | null;      // ACEPTADO / RECHAZADO...
  detalle: string | null;         // líneas facturadas: "Implementación · Mantenimiento…"
}

/** Una línea sugerida del "resumen de lo que debo cobrar". */
export interface LineaCobro {
  concepto: 'mantenimiento' | 'usuario_mant' | 'usuario_activacion' | 'usuario_mant_prorrateado';
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  renueva?: boolean;
  usuarioId?: number;
}

/** Resumen de lo que se le debe cobrar a la empresa (calculado en el backend). */
export interface ResumenCobro {
  plan: { id: number; nombre: string; slug: string } | null;
  ciclo: string | null;
  vencimiento: { fecha_fin: string; fecha_limite_pago: string; dias_para_vencer: number; estado_cobranza: EstadoCobranza } | null;
  usuarios: { incluidos: number; actuales: number; extra: number; ilimitado: boolean };
  lineas: LineaCobro[];
  total: number;
  marcarActivacionUsuarios: number[];
  // Mes en curso (aún no vencido): informativo, NO se cobra ni suma al total.
  enCurso: LineaCobro[];
  totalEnCurso: number;
  fechaCobroEnCurso: string | null;   // fin de mes en que se cobrará, o null
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
  tipo_doc?: string;    // cat.06: '6' RUC (default) · '1' DNI · '4' CE · '7' pasaporte
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

  /** Elimina la empresa. Devuelve si se borró ('eliminada') o se desactivó ('desactivada'). */
  eliminarEmpresa: (id: number) =>
    api.delete<{ ok: boolean; modo: 'eliminada' | 'desactivada' }>(`/api/admin/empresas/${id}`, opts()),

  recargar: (empresaId: number, cantidad: number, descripcion?: string) =>
    api.post<{ empresaId: number; saldo: number }>(
      `/api/admin/creditos/empresas/${empresaId}/recargar`,
      { cantidad, descripcion },
      opts(),
    ),

  /** Ajuste manual de créditos. `cantidad` con signo: negativa = quitar créditos
   *  (p. ej. asignados de más por error). No deja el saldo en negativo. */
  ajustar: (empresaId: number, cantidad: number, descripcion?: string) =>
    api.post<{ empresaId: number; saldo: number }>(
      `/api/admin/creditos/empresas/${empresaId}/ajustar`,
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

  /** Recarga `cantidad` créditos al saldo. `monto` opcional: precio total del paquete (con descuento). */
  recargarCupo: (empresaId: number, cantidad: number, monto?: number) =>
    api.post<{ agregados: number; precio_unitario: number; monto: number }>(
      `/api/admin/empresas/${empresaId}/recargar-cupo`,
      monto != null ? { cantidad, monto } : { cantidad },
      opts(),
    ),

  /** Control de cobranza: todas las empresas con su vencimiento y semáforo. */
  listCobranza: () =>
    api.get<VencimientoEmpresa[]>('/api/admin/cobranza', opts()),

  /** Marca el ciclo como pagado y renueva el vencimiento. Devuelve el estado del plan. */
  marcarPagado: (empresaId: number, dto: MarcarPagadoDto = {}) =>
    api.post<EstadoPlanEmpresa>(`/api/admin/empresas/${empresaId}/marcar-pagado`, dto, opts()),

  /** Revierte la última renovación del ciclo (si se marcó el pago por error). */
  revertirCiclo: (empresaId: number) =>
    api.post<EstadoPlanEmpresa>(`/api/admin/empresas/${empresaId}/revertir-ciclo`, {}, opts()),

  /** Reactiva la cuenta de mantenimiento tras suspensión (cuenta nueva desde hoy). */
  reactivarCuenta: (empresaId: number) =>
    api.post<EstadoPlanEmpresa>(`/api/admin/empresas/${empresaId}/reactivar-cuenta`, {}, opts()),

  /** Ajuste manual de "mantenimiento pagado hasta" (se guarda como fin del mes elegido). */
  ajustarPagadoHasta: (empresaId: number, fecha: string) =>
    api.post<EstadoPlanEmpresa>(`/api/admin/empresas/${empresaId}/pagado-hasta`, { fecha }, opts()),

  /** Historial de pagos de una empresa. */
  listPagos: (empresaId: number) =>
    api.get<PagoHist[]>(`/api/admin/empresas/${empresaId}/pagos`, opts()),

  /** Resumen de lo que hay que cobrar (mantenimiento del ciclo + usuarios extra prorrateados). */
  resumenCobro: (empresaId: number) =>
    api.get<ResumenCobro>(`/api/admin/empresas/${empresaId}/resumen-cobro`, opts()),

  /** Emite la factura electrónica de un pago (plan o certificados adicionales). */
  facturarPago: (pagoId: number) =>
    api.post<{ id: number; numero: string; estado: string; estado_nombre: string; sunat_resp_desc: string | null }>(
      `/api/admin/pagos/${pagoId}/comprobante`, {}, opts(),
    ),

  /** Registra una venta con líneas libres (estilo comprobante). */
  registrarVenta: (empresaId: number, dto: {
    items: Array<{ descripcion: string; cantidad: number; precioUnitario: number; creditos?: number; renueva?: boolean }>;
    descuento?: { tipo: 'monto' | 'pct'; valor: number };
    tipo_comprobante?: '01' | '03' | 'NV';
    marcar_activacion_usuarios?: number[];   // usuarios cuya activación (S/50) se cobra en esta venta
  }) =>
    api.post<{ comprobante: { numero: string; estado: string; estado_nombre: string; sunat_resp_desc: string | null }; descuento: number; total: number; creditosAgregados: number }>(
      `/api/admin/empresas/${empresaId}/venta`, dto, opts(),
    ),

  /** Verifica un RUC en SUNAT (dato público) → razón social + estado/condición. */
  consultarRuc: (ruc: string) =>
    api.get<{ ruc: string; razonSocial: string; estado?: string; condicion?: string; direccion?: string }>(
      `/api/admin/consulta/ruc/${encodeURIComponent(ruc)}`, opts(),
    ),
};
