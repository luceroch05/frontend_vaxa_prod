import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

export interface Plan {
  id: number;
  slug: string;
  nombre: string;
  precio_mensual: number;            // = mantenimiento mensual
  implementacion: number;            // pago único de activación
  mantenimiento_mensual: number;
  creditos_incluidos: number;        // certificados que incluye el plan (0 = ilimitado)
  usuarios_incluidos: number;        // 0 = ilimitado
  limite_certificados_mes: number;   // (modelo viejo, ya no se usa)
  precio_certificado_adicional: number;
  setup_inicial: number;             // = implementación
  permite_diseno: boolean;
  permite_subdominio: boolean;
  permite_api: boolean;
  permite_carga_masiva: boolean;
  permite_metricas: boolean;
  permite_auditoria: boolean;
  muestra_pdf_publico: boolean;
  activo: boolean;
  orden: number;
}

export interface ConsumoMes {
  anio: number;
  mes: number;
  incluidos: number;        // cupo del plan ese mes
  emitidos: number;
  adicionales: number;      // excedente
  monto_adicional: number;
  restantes: number;        // cupo libre
}

export type EstadoCobranza = 'vigente' | 'por_vencer' | 'vencido';

/** Saldo de créditos de la empresa (modelo créditos + mantenimiento). */
export interface CreditosSaldo {
  disponibles: number;   // saldo actual para emitir (cada certificado consume 1)
  asignados: number;     // total histórico asignado (incluidos del plan + recargas)
  consumidos: number;    // asignados − disponibles
  recargados: number;    // total comprado aparte (recargas); el resto vino del plan
  ilimitado: boolean;    // plan ilimitado (Corporativo): emite sin tope, no se bloquea
}

export interface EstadoPlan {
  plan: Plan | null;
  suscripcion: {
    id: number;
    ciclo: string;
    estado: string;
    fecha_inicio: string;
    fecha_fin: string;
    fecha_limite_pago: string;     // fecha máxima recomendada de pago (vence − días de aviso)
    dias_para_vencer: number;      // días hasta el vencimiento (negativo si ya venció)
    estado_cobranza: EstadoCobranza;
  } | null;
  consumo: ConsumoMes;             // (modelo viejo de cupo mensual; informativo)
  creditos: CreditosSaldo;         // saldo real que controla la emisión
  /** Precio por certificado (solo modo "Pago por certificado"). null = no aplica. */
  precio_certificado?: number | null;
}

/** Un movimiento del saldo de créditos (ledger). */
export interface MovimientoCredito {
  id: number;
  tipo: 'asignacion' | 'recarga' | 'consumo' | 'devolucion' | 'ajuste';
  cantidad: number;              // +N suma al saldo, −N lo descuenta
  saldo_resultante: number;      // saldo después del movimiento
  certificado_id: number | null;
  descripcion: string | null;
  created_at: string;
}

/** Paquetes de recarga (Tarifario de Créditos; la compra es manual: el cliente contacta a Vaxa).
 *  `planSlug` = a qué plan corresponde cada paquete (el cliente solo ve el de SU plan). */
export const PAQUETES_CREDITOS = [
  { nombre: 'Básico',      planSlug: 'basico',      creditos: 100, precio: 270 },
  { nombre: 'Profesional', planSlug: 'profesional', creditos: 300, precio: 750 },
  { nombre: 'Empresarial', planSlug: 'empresarial', creditos: 700, precio: 1500 },
] as const;

/** Compra de créditos individuales (clientes con plan activo que necesitan pocos). */
export const CREDITOS_INDIVIDUALES = [
  { desde: 1,  hasta: 49, precio: 3.00 },
  { desde: 50, hasta: 99, precio: 2.85 },
] as const;

export const planesApi = {
  /** Catálogo de planes disponibles. */
  catalogo: (empresa: string) =>
    api.get<Plan[]>('/api/certificados/planes', opts(empresa)),

  /** Plan vigente + consumo del mes de la empresa. */
  estado: (empresa: string) =>
    api.get<EstadoPlan>('/api/certificados/planes/estado', opts(empresa)),

  /** Historial de movimientos de créditos (más recientes primero). */
  movimientos: (empresa: string, limit = 50) =>
    api.get<MovimientoCredito[]>(`/api/certificados/creditos/movimientos?limit=${limit}`, opts(empresa)),
};
