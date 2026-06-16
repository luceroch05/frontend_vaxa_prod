import { authStorage } from '../auth';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

/**
 * El backend revoca la sesión anterior cuando el mismo usuario inicia sesión en
 * otro dispositivo (sesión única). Cuando llega ese 401, cerramos la sesión local
 * y mandamos al login con un aviso, evitando que el usuario quede en un panel
 * "fantasma" cuyas peticiones ya no funcionan.
 */
function handleSessionRevoked(): void {
  if (typeof window === 'undefined') return;
  // Evita bucles si ya estamos en la pantalla de login.
  if (window.location.pathname.includes('/certificados/login')) return;

  try { authStorage.clearAllSessions(); } catch { /* ignore */ }
  try { sessionStorage.setItem('vaxa_session_revoked', '1'); } catch { /* ignore */ }

  const empresa = window.location.pathname.split('/').filter(Boolean)[0] ?? '';
  window.location.href = `/${empresa}/certificados/login`;
}

export interface RequestOptions extends RequestInit {
  tenantId?: string;
  token?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { tenantId, token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (tenantId) headers['x-tenant-id'] = tenantId;
  if (token)    headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { message?: string; error?: string; code?: string };
    // El backend devuelve los errores como { error: "..." }; soportamos ambos por compatibilidad.
    const msg = errorData.error ?? errorData.message ?? response.statusText ?? 'Error en la petición';
    if (response.status === 401 && errorData.code === 'SESSION_REVOKED') {
      handleSessionRevoked();
    }
    throw new ApiError(msg, response.status, errorData);
  }

  // 204 No Content — no hay body que parsear
  if (response.status === 204) return undefined as unknown as T;

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
