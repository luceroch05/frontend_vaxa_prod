import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';
import type { Logo } from '../types';

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

export const logosApi = {
  list: (empresa: string) =>
    api.get<Logo[]>('/api/certificados/logos', opts(empresa)),

  create: (empresa: string, data: { nombre?: string; imagen_logo: string }) =>
    api.post<Logo>('/api/certificados/logos', data, opts(empresa)),

  /** Edita nombre y/o imagen. Omite `imagen_logo` para conservar la actual. */
  update: (empresa: string, id: number, data: { nombre?: string | null; imagen_logo?: string }) =>
    api.put<Logo>(`/api/certificados/logos/${id}`, data, opts(empresa)),

  delete: (empresa: string, id: number) =>
    api.delete<void>(`/api/certificados/logos/${id}`, opts(empresa)),
};
