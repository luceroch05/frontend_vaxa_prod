import { authStorage } from '../auth';

export const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

/**
 * Resuelve la URL final de una imagen guardada en la BD. Las imágenes ahora se
 * guardan como ARCHIVO en el servidor y la BD tiene la ruta `/uploads/...`; hay que
 * anteponerle el origen del backend (en dev el front y el back están en puertos
 * distintos). Soporta también base64 (`data:`) y URLs absolutas (legado) → las deja igual.
 */
export function imgUrl(src?: string | null): string {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) return src;
  return `${API_URL}${src.startsWith('/') ? '' : '/'}${src}`;
}

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

  // El modal bloqueante (SessionRevokedModal) escucha este evento y se encarga de
  // tapar la pantalla y llevar al login. Es el respaldo del WebSocket: si por lo
  // que sea no llegó el aviso en tiempo real, la primera petición 401 lo dispara.
  window.dispatchEvent(new CustomEvent('vaxa:session-revoked'));
}

/**
 * El plan de mantenimiento de la empresa venció (falta de pago): el backend corta
 * TODO el panel con 403 `PLAN_VENCIDO`, incluso para sesiones ya abiertas. Cerramos
 * la sesión local y mandamos al login, donde se muestra el motivo de la suspensión.
 */
function handlePlanVencido(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.includes('/certificados/login')) return;
  try { authStorage.clearAllSessions(); } catch { /* ignore */ }
  try { sessionStorage.setItem('vaxa_plan_vencido', '1'); } catch { /* ignore */ }
  const empresa = window.location.pathname.match(/^\/([^/]+)\/certificados\b/)?.[1];
  window.location.href = empresa ? `/${empresa}/certificados/login` : '/';
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
    if (response.status === 403 && errorData.code === 'PLAN_VENCIDO') {
      handlePlanVencido();
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
