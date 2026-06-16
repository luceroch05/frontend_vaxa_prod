import { api } from '@/lib/api/client';
import type { AuthUser } from '@/lib/auth';

export interface LoginResponse {
  token: string;
  usuario: AuthUser;
}

/** Slug del producto de este sistema (multi-producto: ver tabla `productos`). */
export const PRODUCTO_CERTIFICACIONES = 'certificaciones';

export const authApi = {
  login: (empresa: string, correo: string, contrasena: string) =>
    api.post<LoginResponse>('/api/auth/login', {
      correo, contrasena, empresa, producto: PRODUCTO_CERTIFICACIONES,
    }),
};
