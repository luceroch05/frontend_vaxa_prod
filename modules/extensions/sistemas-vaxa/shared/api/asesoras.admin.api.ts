import { api, API_URL } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

// Mismo patrón que reclamos/solicitudes: el panel interno autentica con el token
// del tenant raíz 'vaxa' (requireRootTenant en el backend valida ese tenant).
const ROOT_TENANT = 'vaxa';
const opts = () => ({ tenantId: ROOT_TENANT, token: authStorage.getToken(ROOT_TENANT) ?? undefined });

export interface Asesora {
  id: number;
  codigo: string;
  nombre: string;
  dni: string | null;
  cargo: string | null;
  foto_url: string | null;
  zona: string | null;
  telefono: string | null;
  activo: 0 | 1;
  vigente_hasta: string | null;
  created_at: string;
}

export interface AsesoraStats { total: number; activas: number; vencidas: number }
export interface AsesorasPagina { items: Asesora[]; stats: AsesoraStats }

/** Datos editables de una asesora (la foto se maneja aparte con subirFoto). */
export interface AsesoraInput {
  nombre: string;
  dni?: string;
  cargo?: string;
  zona?: string;
  telefono?: string;
  vigente_hasta?: string | null;
  foto_url?: string | null;   // ruta ya subida (/uploads/...) o '' para quitar
}

export const asesorasApi = {
  list: (filtro: { estado?: 'activas' | 'baja' | ''; q?: string } = {}) => {
    const qs = new URLSearchParams();
    if (filtro.estado) qs.set('estado', filtro.estado);
    if (filtro.q) qs.set('q', filtro.q);
    const q = qs.toString();
    return api.get<AsesorasPagina>(`/api/admin/asesoras${q ? `?${q}` : ''}`, opts());
  },

  crear: (data: AsesoraInput) =>
    api.post<{ ok: boolean; asesora: Asesora }>('/api/admin/asesoras', data, opts()),

  actualizar: (id: number, data: AsesoraInput) =>
    api.patch<{ ok: boolean; asesora: Asesora }>(`/api/admin/asesoras/${id}`, data, opts()),

  setEstado: (id: number, activo: boolean) =>
    api.patch<{ ok: boolean; id: number; activo: boolean }>(`/api/admin/asesoras/${id}/estado`, { activo }, opts()),

  eliminar: (id: number) =>
    api.delete<{ ok: boolean; id: number }>(`/api/admin/asesoras/${id}`, opts()),

  /** Sube la foto como ARCHIVO binario (sin base64). Devuelve la ruta /uploads/asesoras/... */
  async subirFoto(file: File): Promise<string> {
    const res = await fetch(`${API_URL}/api/admin/asesoras/foto`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'x-tenant-id': ROOT_TENANT,
        Authorization: `Bearer ${authStorage.getToken(ROOT_TENANT) ?? ''}`,
      },
      body: file,
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error((e as { error?: string }).error ?? 'No se pudo subir la foto');
    }
    return ((await res.json()) as { url: string }).url;
  },
};
