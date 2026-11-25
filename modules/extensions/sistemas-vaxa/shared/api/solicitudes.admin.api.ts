import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

// Mismo patrón que reclamos: el panel interno de Vaxa autentica con el token del
// tenant raíz 'vaxa' (requireRootTenant en el backend valida ese tenant).
const ROOT_TENANT = 'vaxa';
const opts = () => ({ tenantId: ROOT_TENANT, token: authStorage.getToken(ROOT_TENANT) ?? undefined });

export type SolicitudEstado = 'pendiente' | 'atendida' | 'descartada';

/** Una solicitud comercial registrada por el formulario inteligente de la landing. */
export interface Solicitud {
  id: number;
  codigo: string;
  tipo_organizacion: string | null;
  servicio: string | null;
  necesidad: string | null;
  nombre: string;
  empresa: string | null;
  whatsapp: string;
  correo: string;
  info_adicional: string | null;
  estado: SolicitudEstado;
  origen: string | null;
  created_at: string;
}

export interface SolicitudFiltro {
  estado?: SolicitudEstado | '';
  q?: string;
  limit?: number;
  offset?: number;
}

export interface SolicitudStats {
  total: number;
  pendiente: number;
  atendida: number;
  descartada: number;
}

export interface SolicitudPagina {
  items: Solicitud[];
  total: number;
  stats: SolicitudStats;
}

export const solicitudesApi = {
  /** Lista las solicitudes (más recientes primero) con filtro por estado y búsqueda. */
  list: (filtro: SolicitudFiltro = {}) => {
    const qs = new URLSearchParams();
    if (filtro.estado) qs.set('estado', filtro.estado);
    if (filtro.q)      qs.set('q', filtro.q);
    if (filtro.limit  != null) qs.set('limit', String(filtro.limit));
    if (filtro.offset != null) qs.set('offset', String(filtro.offset));
    const q = qs.toString();
    return api.get<SolicitudPagina>(`/api/admin/solicitudes${q ? `?${q}` : ''}`, opts());
  },

  /** Cambia el estado de una solicitud (pendiente / atendida / descartada). */
  cambiarEstado: (id: number, estado: SolicitudEstado) =>
    api.patch<{ ok: boolean; id: number; estado: SolicitudEstado }>(
      `/api/admin/solicitudes/${id}/estado`, { estado }, opts(),
    ),
};
