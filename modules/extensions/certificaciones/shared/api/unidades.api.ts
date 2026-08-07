import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';
import type { Unidad, CreateUnidadDto } from '../types';

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

export const unidadesApi = {
  list: (empresa: string, programaId: number) =>
    api.get<Unidad[]>(`/api/certificados/unidades?programa_id=${programaId}`, opts(empresa)),

  create: (empresa: string, data: CreateUnidadDto) =>
    api.post<Unidad>('/api/certificados/unidades', data, opts(empresa)),

  update: (empresa: string, id: number, data: Partial<Pick<CreateUnidadDto, 'nombre' | 'orden' | 'creditos'>>) =>
    api.patch<Unidad>(`/api/certificados/unidades/${id}`, data, opts(empresa)),

  remove: (empresa: string, id: number) =>
    api.delete<void>(`/api/certificados/unidades/${id}`, opts(empresa)),
};
