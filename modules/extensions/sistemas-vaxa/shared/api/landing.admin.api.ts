import { api, API_URL } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

const ROOT_TENANT = 'vaxa';
const opts = () => ({ tenantId: ROOT_TENANT, token: authStorage.getToken(ROOT_TENANT) ?? undefined });

/** Redes y contacto que salen en la landing pública de Vaxa. */
export interface VaxaLanding {
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  linkedin?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  telefono?: string | null;
}

export const landingAdminApi = {
  get:  () => api.get<VaxaLanding>('/api/admin/vaxa-landing', opts()),
  save: (data: VaxaLanding) => api.put<VaxaLanding>('/api/admin/vaxa-landing', data, opts()),
};

/** Lectura pública (para la landing, sin login). */
export const getVaxaLandingPublic = () => api.get<VaxaLanding>('/public/vaxa-landing');

/** Aliado/convenio que sale en la landing pública de Vaxa. */
export interface VaxaAlianza {
  id: number;
  nombre: string;
  logo_url?: string | null;
  link?: string | null;
  orden?: number;
  activo?: number;
}

export const alianzasAdminApi = {
  list:   () => api.get<VaxaAlianza[]>('/api/admin/vaxa-alianzas', opts()),
  create: (data: Partial<VaxaAlianza>) => api.post<VaxaAlianza>('/api/admin/vaxa-alianzas', data, opts()),
  update: (id: number, data: Partial<VaxaAlianza>) => api.patch<VaxaAlianza>(`/api/admin/vaxa-alianzas/${id}`, data, opts()),
  remove: (id: number) => api.delete<void>(`/api/admin/vaxa-alianzas/${id}`, opts()),
};

/** Lectura pública de alianzas (para la landing, sin login). */
export const getVaxaAlianzasPublic = () => api.get<VaxaAlianza[]>('/public/vaxa-alianzas');

/**
 * Testimonio real de un cliente que sale en la landing pública de Vaxa.
 * No lleva foto de la persona: reutiliza el logo de la alianza (empresa cliente)
 * enlazada por `alianza_id`. El backend devuelve `empresa` y `logo_url` ya
 * resueltos desde la alianza (o los campos sueltos si no hay alianza enlazada).
 */
export interface VaxaTestimonio {
  id: number;
  comentario: string;
  autor: string;                 // nombre de la persona que da el testimonio
  cargo?: string | null;         // puesto / rol (ej. "CEO")
  empresa?: string | null;       // nombre de la empresa (fallback si no hay alianza)
  alianza_id?: number | null;    // reutiliza el logo de esta alianza
  logo_url?: string | null;      // logo mostrado: el propio si hay, si no el de la alianza (resuelto)
  logo_propio?: string | null;   // logo propio del testimonio (a color), crudo — para el editor
  calificacion?: number;         // 1..5 estrellas
  orden?: number;
  activo?: number;
}

export const testimoniosAdminApi = {
  list:   () => api.get<VaxaTestimonio[]>('/api/admin/vaxa-testimonios', opts()),
  create: (data: Partial<VaxaTestimonio>) => api.post<VaxaTestimonio>('/api/admin/vaxa-testimonios', data, opts()),
  update: (id: number, data: Partial<VaxaTestimonio>) => api.patch<VaxaTestimonio>(`/api/admin/vaxa-testimonios/${id}`, data, opts()),
  remove: (id: number) => api.delete<void>(`/api/admin/vaxa-testimonios/${id}`, opts()),
};

/** Lectura pública de testimonios (para la landing, sin login). */
export const getVaxaTestimoniosPublic = () => api.get<VaxaTestimonio[]>('/public/vaxa-testimonios');

/** File → data URL base64. El backend lo guarda como archivo PNG en /uploads/vaxa (no base64 en la BD). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Sube una imagen como ARCHIVO ADJUNTO (binario crudo, sin base64). El backend la
 * escribe en /uploads/vaxa y devuelve la RUTA pública, que se guarda como logo.
 */
export async function uploadVaxaImagen(file: File): Promise<string> {
  const res = await fetch(`${API_URL}/api/admin/vaxa-upload`, {
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
    throw new Error((e as { error?: string }).error ?? 'No se pudo subir la imagen');
  }
  return ((await res.json()) as { url: string }).url;
}
