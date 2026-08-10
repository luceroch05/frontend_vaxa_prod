import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';
import type { Firma } from '../types';

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

export const firmasApi = {
  list: (empresa: string) =>
    api.get<Firma[]>('/api/certificados/firmas', opts(empresa)),

  create: (empresa: string, data: { nombre_autoridad: string; cargo: string; imagen_firma: string }) =>
    api.post<Firma>('/api/certificados/firmas', data, opts(empresa)),

  /** Edita nombre, cargo y/o imagen. Omite `imagen_firma` para conservar la actual. */
  update: (empresa: string, id: number, data: { nombre_autoridad?: string; cargo?: string; imagen_firma?: string }) =>
    api.put<Firma>(`/api/certificados/firmas/${id}`, data, opts(empresa)),

  delete: (empresa: string, id: number) =>
    api.delete<void>(`/api/certificados/firmas/${id}`, opts(empresa)),
};
