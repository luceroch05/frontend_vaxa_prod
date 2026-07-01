import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

const ROOT_TENANT = 'vaxa';
const opts = () => ({ tenantId: ROOT_TENANT, token: authStorage.getToken(ROOT_TENANT) ?? undefined });

export type EstadoCotizacion = 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA';

/** Estados como IDs (coinciden con cotizacion_estado). */
export const COT_ESTADO = { BORRADOR: 1, ENVIADA: 2, ACEPTADA: 3, RECHAZADA: 4, VENCIDA: 5 } as const;

export interface CotizacionDetalle {
  orden: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  creditos: number | null;
  renueva: boolean;
}

export interface Cotizacion {
  id: number;
  numero: string;
  empresa_id: number | null;
  empresa: string | null;
  cliente_tipo_doc: string;
  cliente_num_doc: string;
  cliente_razon_social: string;
  cliente_email: string | null;
  moneda: string;
  igv_incluido: boolean;
  subtotal: number;
  descuento_tipo: 'monto' | 'pct' | null;
  descuento_valor: number;
  descuento_monto: number;
  total: number;
  notas: string | null;
  valida_hasta: string | null;
  estado_id: number;
  estado: EstadoCotizacion;
  estado_nombre: string;
  comprobante_id: number | null;
  comprobante_numero: string | null;
  created_at: string;
  updated_at: string;
}

export interface CotizacionConDetalle extends Cotizacion {
  detalle: CotizacionDetalle[];
}

export interface NuevaCotizacionDto {
  empresa_id?: number | null;
  cliente?: { tipoDoc: string; numDoc: string; razonSocial: string; email?: string };
  items: Array<{ descripcion: string; cantidad: number; precioUnitario: number; creditos?: number; renueva?: boolean }>;
  descuento?: { tipo: 'monto' | 'pct'; valor: number };
  igv_incluido?: boolean;
  notas?: string;
  valida_hasta?: string;   // 'YYYY-MM-DD'
}

export const cotizacionesApi = {
  list: () => api.get<Cotizacion[]>('/api/admin/cotizaciones', opts()),

  get: (id: number) => api.get<CotizacionConDetalle>(`/api/admin/cotizaciones/${id}`, opts()),

  crear: (dto: NuevaCotizacionDto) => api.post<CotizacionConDetalle>('/api/admin/cotizaciones', dto, opts()),

  cambiarEstado: (id: number, estado_id: number) =>
    api.patch<CotizacionConDetalle>(`/api/admin/cotizaciones/${id}/estado`, { estado_id }, opts()),

  pdf: (id: number) =>
    api.get<{ nombre: string; pdf_base64: string }>(`/api/admin/cotizaciones/${id}/pdf`, opts()),

  /** Convierte la cotización en venta real (emite comprobante). */
  convertir: (id: number, tipo_comprobante: '01' | '03' | 'NV') =>
    api.post<{
      comprobante: { numero: string; estado: string; estado_nombre: string; sunat_resp_desc: string | null };
      cotizacion: CotizacionConDetalle;
    }>(`/api/admin/cotizaciones/${id}/convertir`, { tipo_comprobante }, opts()),
};
