import { api, API_URL } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

const ROOT_TENANT = 'vaxa';
const opts = () => ({ tenantId: ROOT_TENANT, token: authStorage.getToken(ROOT_TENANT) ?? undefined });

export type EstadoReclamo = 'PENDIENTE' | 'EN_PROCESO' | 'ATENDIDO' | 'CERRADO';

/** Estados como IDs (coinciden con reclamo_estado). */
export const REC_ESTADO = { PENDIENTE: 1, EN_PROCESO: 2, ATENDIDO: 3, CERRADO: 4 } as const;

export interface ReclamoAdjunto { nombre: string; ruta: string; mime: string; tamano: number }

export interface Reclamo {
  id: number;
  numero: string;                    // LR-2026-0001
  consumidor_nombre: string;
  consumidor_tipo_doc: string;
  consumidor_num_doc: string;
  consumidor_domicilio: string | null;
  consumidor_telefono: string | null;
  consumidor_email: string | null;
  es_menor: boolean;
  apoderado_nombre: string | null;
  apoderado_num_doc: string | null;
  bien_tipo_id: number;
  bien_tipo: 'PRODUCTO' | 'SERVICIO';
  bien_tipo_nombre: string;
  bien_monto: number | null;
  bien_descripcion: string | null;
  tipo_id: number;
  tipo: 'RECLAMO' | 'QUEJA';
  tipo_nombre: string;
  detalle: string;
  pedido: string;
  estado_id: number;
  estado: EstadoReclamo;
  estado_nombre: string;
  respuesta: string | null;
  respondido_at: string | null;
  user_crea_id: number | null;
  user_actua_id: number | null;
  fecha_limite: string | null;
  adjuntos?: ReclamoAdjunto[];        // solo en get(id); la lista no lo trae
  created_at: string;
  updated_at: string;
}

export interface ReclamoHito {
  estado: string;
  estado_nombre: string;
  nota: string | null;
  fecha: string | null;
}

export const reclamosApi = {
  /** Lista (más recientes primero), opcionalmente filtrada por estado. */
  list: (estadoId?: number) =>
    api.get<Reclamo[]>(`/api/admin/reclamos${estadoId ? `?estado_id=${estadoId}` : ''}`, opts()),

  get: (id: number) => api.get<Reclamo>(`/api/admin/reclamos/${id}`, opts()),

  /** Registra la respuesta/acciones del proveedor y marca el estado (default ATENDIDO). */
  responder: (id: number, respuesta: string, estado_id?: number) =>
    api.patch<Reclamo>(`/api/admin/reclamos/${id}/responder`, { respuesta, estado_id }, opts()),

  cambiarEstado: (id: number, estado_id: number, nota?: string) =>
    api.patch<Reclamo>(`/api/admin/reclamos/${id}/estado`, { estado_id, nota }, opts()),

  historial: (id: number) => api.get<ReclamoHito[]>(`/api/admin/reclamos/${id}/historial`, opts()),

  /** Descarga el PDF de la hoja como Blob (endpoint autenticado que devuelve el PDF crudo). */
  pdfBlob: async (id: number): Promise<Blob> => {
    const { tenantId, token } = opts();
    const res = await fetch(`${API_URL}/api/admin/reclamos/${id}/pdf`, {
      headers: {
        ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('No se pudo generar el PDF.');
    return res.blob();
  },
};
