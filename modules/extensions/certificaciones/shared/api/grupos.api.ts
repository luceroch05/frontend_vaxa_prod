import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';
import type { Grupo, CreateGrupoDto } from '../types';

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

export const gruposApi = {
  list: (empresa: string, incluirInactivos = false) =>
    api.get<Grupo[]>(`/api/certificados/grupos${incluirInactivos ? '?todos=1' : ''}`, opts(empresa)),

  /** Archiva (false) o reactiva (true) un aula. */
  setActivo: (empresa: string, id: number, activo: boolean) =>
    api.patch<Grupo>(`/api/certificados/grupos/${id}/activo`, { activo }, opts(empresa)),

  /** Borra el aula y sus inscripciones (falla 409 si tiene certificados emitidos). */
  eliminar: (empresa: string, id: number) =>
    api.delete<void>(`/api/certificados/grupos/${id}`, opts(empresa)),

  get: (empresa: string, id: number) =>
    api.get<Grupo>(`/api/certificados/grupos/${id}`, opts(empresa)),

  create: (empresa: string, data: CreateGrupoDto) =>
    api.post<Grupo>('/api/certificados/grupos', data, opts(empresa)),
};
