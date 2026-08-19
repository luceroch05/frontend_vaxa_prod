import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

/**
 * Capa API del módulo "Mi Web" (web pública editable por el cliente).
 * Pega contra /api/web (protegido) con el tenant + token del centro.
 * Las imágenes se mandan como data URL base64; el backend las guarda como
 * archivo en /uploads/web (ver shared/imagenes.ts).
 */

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

// ── Tipos ──────────────────────────────────────────────────────────────────
export interface WebConfig {
  empresa_id?: number;
  logo_url?: string | null;
  color_primario?: string | null;
  color_secundario?: string | null;
  hero_titulo?: string | null;
  hero_subtitulo?: string | null;
  hero_imagen?: string | null;
  hero_boton_texto?: string | null;
  hero_boton_link?: string | null;
  red_facebook?: string | null;
  red_instagram?: string | null;
  red_tiktok?: string | null;
  red_youtube?: string | null;
  red_linkedin?: string | null;
  red_whatsapp?: string | null;
  contacto_direccion?: string | null;
  contacto_telefono?: string | null;
  contacto_telefono2?: string | null;
  contacto_email?: string | null;
  contacto_horario?: string | null;
  contacto_mapa_url?: string | null;
  publicada?: number;
}

export interface WebServicio {
  id: number; titulo: string; descripcion: string | null;
  icono: string | null; imagen_url: string | null; orden: number; activo: number;
}
export interface WebStaff {
  id: number; nombre: string; cargo: string | null; descripcion: string | null;
  foto_url: string | null; orden: number; activo: number;
}
export interface WebAlianza {
  id: number; nombre: string; logo_url: string | null; link: string | null; orden: number; activo: number;
}

/** Contenido público completo de la web de un tenant (para la landing). */
export interface WebPublic {
  config: WebConfig;
  servicios: WebServicio[];
  staff: WebStaff[];
  alianzas: WebAlianza[];
}

// ── API ────────────────────────────────────────────────────────────────────
export const webApi = {
  // Config (hero + marca + redes + contacto)
  getConfig: (empresa: string) => api.get<WebConfig>('/api/web/config', opts(empresa)),
  saveConfig: (empresa: string, data: Partial<WebConfig>) =>
    api.put<WebConfig>('/api/web/config', data, opts(empresa)),

  // Servicios
  listServicios: (empresa: string) => api.get<WebServicio[]>('/api/web/servicios', opts(empresa)),
  createServicio: (empresa: string, data: Partial<WebServicio>) =>
    api.post<WebServicio>('/api/web/servicios', data, opts(empresa)),
  updateServicio: (empresa: string, id: number, data: Partial<WebServicio>) =>
    api.patch<WebServicio>(`/api/web/servicios/${id}`, data, opts(empresa)),
  deleteServicio: (empresa: string, id: number) =>
    api.delete<void>(`/api/web/servicios/${id}`, opts(empresa)),

  // Staff
  listStaff: (empresa: string) => api.get<WebStaff[]>('/api/web/staff', opts(empresa)),
  createStaff: (empresa: string, data: Partial<WebStaff>) =>
    api.post<WebStaff>('/api/web/staff', data, opts(empresa)),
  updateStaff: (empresa: string, id: number, data: Partial<WebStaff>) =>
    api.patch<WebStaff>(`/api/web/staff/${id}`, data, opts(empresa)),
  deleteStaff: (empresa: string, id: number) =>
    api.delete<void>(`/api/web/staff/${id}`, opts(empresa)),

  // Alianzas
  listAlianzas: (empresa: string) => api.get<WebAlianza[]>('/api/web/alianzas', opts(empresa)),
  createAlianza: (empresa: string, data: Partial<WebAlianza>) =>
    api.post<WebAlianza>('/api/web/alianzas', data, opts(empresa)),
  updateAlianza: (empresa: string, id: number, data: Partial<WebAlianza>) =>
    api.patch<WebAlianza>(`/api/web/alianzas/${id}`, data, opts(empresa)),
  deleteAlianza: (empresa: string, id: number) =>
    api.delete<void>(`/api/web/alianzas/${id}`, opts(empresa)),

  /** PÚBLICO: contenido completo de la web de un tenant (sin login). */
  getPublicWeb: (slug: string) => api.get<WebPublic>(`/public/web/${slug}`),
};

/** Convierte un File (imagen) a data URL base64 para mandarlo en el JSON. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
