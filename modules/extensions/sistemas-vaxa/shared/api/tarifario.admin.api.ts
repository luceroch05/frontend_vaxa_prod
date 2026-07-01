import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

const ROOT_TENANT = 'vaxa';
const opts = () => ({ tenantId: ROOT_TENANT, token: authStorage.getToken(ROOT_TENANT) ?? undefined });

export interface TarifaPaquete { id: number; slug: string; planSlug: string | null; nombre: string; creditos: number; precio: number; }
export interface TarifaTramo   { desde: number; hasta: number; precio: number; }

export interface Tarifario {
  paquetes: TarifaPaquete[];
  tramos: TarifaTramo[];
  parametros: Record<string, number>;   // usuario_extra_activacion, usuario_extra_mensual…
}

export const tarifarioApi = {
  /** Paquetes de créditos, tramos de crédito suelto y parámetros (desde la BD). */
  get: () => api.get<Tarifario>('/api/admin/tarifario', opts()),
};
