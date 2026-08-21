import { api } from '@/lib/api/client';
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
