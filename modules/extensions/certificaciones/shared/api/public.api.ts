import { api } from '@/lib/api/client';
import type { Catalogos, Grupo, RegistroPublicoDto } from '../types';

/** Endpoints públicos — no requieren JWT ni x-tenant-id header */
export const publicApi = {
  /** Verifica si el tenant_slug existe y si está activa (y trae su branding).
   *  `activo=false` → empresa desactivada: solo se permite validar certificados. */
  existeEmpresa: (empresa: string) =>
    api.get<{ exists: boolean; activo?: boolean; razon_social?: string | null; logo_url?: string | null }>(`/public/certificados/${empresa}/existe`),

  getCatalogos: (empresa: string) =>
    api.get<Catalogos>(`/public/certificados/${empresa}/catalogos`),

  getGrupos: (empresa: string) =>
    api.get<Grupo[]>(`/public/certificados/${empresa}/grupos`),

  /** Autocompletado: busca un participante por número de documento. Lanza error si no existe. */
  buscarParticipante: (empresa: string, documento: string) =>
    api.get<{ tipo_documento_id: number; numero_documento: string; nombres: string; apellidos: string; email: string | null; telefono: string | null }>(
      `/public/certificados/${empresa}/participante?documento=${encodeURIComponent(documento)}`,
    ),

  registro: (empresa: string, data: RegistroPublicoDto) =>
    api.post<{ participante_id: number; inscripcion_id: number }>(
      `/public/certificados/${empresa}/registro`,
      data
    ),
};
