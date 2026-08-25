import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

const ROOT_TENANT = 'vaxa';
const opts = () => ({ tenantId: ROOT_TENANT, token: authStorage.getToken(ROOT_TENANT) ?? undefined });

export type EstadoComprobante = 'PENDIENTE' | 'ENVIADO' | 'ACEPTADO' | 'OBSERVADO' | 'RECHAZADO' | 'BAJA' | 'ERROR' | 'EMITIDA';

export interface Comprobante {
  id: number;
  tipo_comprobante: string;        // '01' | '03' | '07' | '08'
  tipo_nombre: string;
  serie: string;
  correlativo: number;
  numero: string;                  // F001-1
  fecha_emision: string | null;
  moneda: string;
  cliente_num_doc: string;
  cliente_razon_social: string;
  importe_total: number;
  estado: EstadoComprobante;
  estado_nombre: string;
  sunat_resp_codigo: string | null;
  sunat_resp_desc: string | null;
  empresa_id: number | null;
  empresa: string | null;
}

export interface ComprobanteDetalle extends Comprobante {
  total_gravado: number;
  total_igv: number;
  detalle: Array<{
    orden: number; descripcion: string; unidad: string;
    cantidad: number; valor_unitario: number; precio_unitario: number;
    valor_total: number; igv: number;
  }>;
}

export interface ItemEmision {
  descripcion: string;
  cantidad: number;
  valorUnitario: number;   // sin IGV
  unidad?: string;
}

export interface EmitirDto {
  empresa_id: number;
  tipo_comprobante?: '01' | '03' | 'NV';
  pago_id?: number | null;
  items: ItemEmision[];
  cliente?: { tipoDoc: string; numDoc: string; razonSocial: string; direccion?: string };
}

export const facturacionApi = {
  list: () => api.get<Comprobante[]>('/api/admin/comprobantes', opts()),

  get: (id: number) => api.get<ComprobanteDetalle>(`/api/admin/comprobantes/${id}`, opts()),

  emitir: (dto: EmitirDto) => api.post<ComprobanteDetalle>('/api/admin/comprobantes', dto, opts()),

  archivo: (id: number, tipo: 'xml' | 'cdr') =>
    api.get<{ xml: string }>(`/api/admin/comprobantes/${id}/archivo?tipo=${tipo}`, opts()),

  pdf: (id: number) =>
    api.get<{ nombre: string; pdf_base64: string }>(`/api/admin/comprobantes/${id}/pdf`, opts()),

  emitirNota: (id: number, dto: { tipo_nota: '07' | '08'; motivo_codigo: string; motivo_descripcion: string }) =>
    api.post<ComprobanteDetalle>(`/api/admin/comprobantes/${id}/nota`, dto, opts()),

  /** Venta a cliente manual (persona con DNI/CE/sin doc), sin empresa. Solo boleta o nota de venta. */
  registrarVentaManual: (dto: {
    cliente: { tipoDoc: string; numDoc: string; razonSocial: string; direccion?: string };
    items: Array<{ descripcion: string; cantidad: number; precioUnitario: number; creditos?: number; renueva?: boolean; descuentoTipo?: 'monto' | 'pct'; descuentoValor?: number }>;
    descuento?: { tipo: 'monto' | 'pct'; valor: number };
    tipo_comprobante: '03' | 'NV';
    notas?: string;
  }) =>
    api.post<{ comprobante: { numero: string; estado: string; estado_nombre: string; sunat_resp_desc: string | null }; descuento: number; total: number; creditosAgregados: number }>(
      '/api/admin/comprobantes/venta-manual', dto, opts(),
    ),
};
