import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

/** Calidad de participación administrable por empresa (antes hardcodeada). */
export interface Calidad {
  id: number;
  nombre: string;
  activo: number;
  orden: number;
}

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

export const calidadesApi = {
  list: (empresa: string, incluirInactivas = false) =>
    api.get<Calidad[]>(`/api/certificados/calidades${incluirInactivas ? '?todas=1' : ''}`, opts(empresa)),

  create: (empresa: string, nombre: string) =>
    api.post<Calidad>('/api/certificados/calidades', { nombre }, opts(empresa)),

  update: (empresa: string, id: number, data: { nombre?: string; activo?: boolean; orden?: number }) =>
    api.patch<Calidad>(`/api/certificados/calidades/${id}`, data, opts(empresa)),
};
