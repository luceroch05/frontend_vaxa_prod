import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

const ROOT_TENANT = 'vaxa';
const opts = () => ({ tenantId: ROOT_TENANT, token: authStorage.getToken(ROOT_TENANT) ?? undefined });

export interface TarifaPaquete { id: number; slug: string; planSlug: string | null; nombre: string; creditos: number; precio: number; }
export interface TarifaTramo   { desde: number; hasta: number; precio: number; }
export interface ServicioCatalogo { id: number; slug: string; grupo: string; nombre: string; precio: number; orden: number; }

export interface Tarifario {
  paquetes: TarifaPaquete[];
  tramos: TarifaTramo[];
  parametros: Record<string, number>;   // usuario_extra_activacion, usuario_extra_mensual…
  servicios: ServicioCatalogo[];         // web/dominios/hosting (editables desde la BD)
}

export const tarifarioApi = {
  /** Paquetes de créditos, tramos, parámetros y servicios (desde la BD). */
  get: () => api.get<Tarifario>('/api/admin/tarifario', opts()),

  /** Crea un servicio suelto (web/dominio/hosting). */
  crearServicio: (dto: { slug: string; grupo: string; nombre: string; precio: number; orden?: number }) =>
    api.post<ServicioCatalogo>('/api/admin/tarifario/servicios', dto, opts()),

  /** Edita nombre/precio/grupo/orden de un servicio. */
  actualizarServicio: (id: number, dto: { grupo?: string; nombre?: string; precio?: number; orden?: number }) =>
    api.put<ServicioCatalogo>(`/api/admin/tarifario/servicios/${id}`, dto, opts()),

  /** Baja lógica de un servicio. */
  eliminarServicio: (id: number) =>
    api.delete<{ ok: boolean }>(`/api/admin/tarifario/servicios/${id}`, opts()),
};
