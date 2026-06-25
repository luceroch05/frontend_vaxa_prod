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
  consumo: ConsumoMes;
}

export const planesApi = {
  /** Catálogo de planes disponibles. */
  catalogo: (empresa: string) =>
    api.get<Plan[]>('/api/certificados/planes', opts(empresa)),

  /** Plan vigente + consumo del mes de la empresa. */
  estado: (empresa: string) =>
    api.get<EstadoPlan>('/api/certificados/planes/estado', opts(empresa)),
};
