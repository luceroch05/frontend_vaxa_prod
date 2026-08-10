import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';
import type { ConfigCertificado, UpsertConfigDto } from '../types';

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

export const configApi = {
  /** grupoId=0 (default) → config base del programa.
   *  grupoId>0 → config específica del grupo (con fallback al programa si no existe). */
  get: (empresa: string, programaId: number, grupoId: number = 0) =>
    api.get<ConfigCertificado>(
      `/api/certificados/config/${programaId}${grupoId ? `?grupo_id=${grupoId}` : ''}`,
      opts(empresa),
    ),

  upsert: (empresa: string, programaId: number, data: UpsertConfigDto) =>
    api.put<ConfigCertificado>(`/api/certificados/config/${programaId}`, data, opts(empresa)),

  /** Lista los grupo_ids con config propia para ese programa */
  listGruposConConfig: (empresa: string, programaId: number) =>
    api.get<{ grupos: number[] }>(`/api/certificados/config/${programaId}/grupos`, opts(empresa)),

  /** Congela la config actual del programa para un grupo */
  congelarGrupo: (empresa: string, programaId: number, grupoId: number) =>
    api.post<ConfigCertificado>(
      `/api/certificados/config/${programaId}/congelar/${grupoId}`,
      undefined,
      opts(empresa),
    ),

  /** Elimina la config específica del grupo (vuelve a heredar del programa) */
  eliminarConfigGrupo: (empresa: string, programaId: number, grupoId: number) =>
    api.delete<void>(
      `/api/certificados/config/${programaId}/grupo/${grupoId}`,
      opts(empresa),
    ),

  /** Plantilla base del diseño personalizado de la empresa (JSON del layout, o null). */
  getLayoutBase: (empresa: string) =>
    api.get<{ layout_base: string | null }>('/api/certificados/config-base', opts(empresa)),

  /** Guarda (o limpia con null) la plantilla base del diseño personalizado. */
  saveLayoutBase: (empresa: string, layoutJson: string | null) =>
    api.put<{ ok: boolean }>('/api/certificados/config-base', { layout_base: layoutJson }, opts(empresa)),
};
