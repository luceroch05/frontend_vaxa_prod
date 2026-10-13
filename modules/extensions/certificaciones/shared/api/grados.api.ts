import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

/** Grado académico EXTRA administrable por empresa (chip para todos los usuarios). */
export interface Grado {
  id: number;
  nombre: string;
  activo: number;
  orden: number;
}

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

export const gradosApi = {
  list: (empresa: string, incluirInactivos = false) =>
    api.get<Grado[]>(`/api/certificados/grados${incluirInactivos ? '?todos=1' : ''}`, opts(empresa)),

  create: (empresa: string, nombre: string) =>
    api.post<Grado>('/api/certificados/grados', { nombre }, opts(empresa)),
};
