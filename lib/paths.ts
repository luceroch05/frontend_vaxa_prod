/**
 * ── Construcción de rutas consciente del subdominio ────────────────────────
 *
 * En vez de escribir el prefijo a mano (`/${empresa}/certificados/...`) por
 * todos lados, se usa estos helpers. Devuelven la URL correcta según el modo
 * (ver `lib/host.ts`):
 *
 *   legacy       → igual que hoy (nada se rompe, los QR viejos siguen validando)
 *   certificados → sin el segmento `/certificados`
 *   sistemas     → sin el prefijo del tenant
 */
import { getHostMode } from './host';

/**
 * Ruta interna del área de certificados de una empresa.
 *   sub: '', '/login', '/validar', '/panel', '/panel/programas', ...
 */
export function certPath(empresa: string, sub = ''): string {
  const { modo } = getHostMode();
  return modo === 'certificados'
    ? `/${empresa}${sub}`
    : `/${empresa}/certificados${sub}`;
}

/**
 * Ruta interna de un tenant del sistema interno (sistemas-vaxa / certificaciones).
 *   sub: '', '/login', '/sistemas', '/certificaciones/empresas', ...
 * En el subdominio `sistemas.` el tenant es fijo, así que va sin prefijo.
 */
export function tenantPath(tenantId: string, sub = ''): string {
  const { modo } = getHostMode();
  return modo === 'sistemas'
    ? (sub || '/')
    : `/${tenantId}${sub}`;
}

/**
 * URL ABSOLUTA pública de certificados (para compartir con el cliente o el QR).
 * Funciona aunque se genere desde el subdominio de sistemas: si está definido
 * VITE_CERT_URL apunta ahí; si no (legacy/local), usa el origen actual.
 */
export function publicCertUrl(empresa: string, sub = ''): string {
  const base = (import.meta.env.VITE_CERT_URL as string | undefined)?.replace(/\/$/, '');
  if (base) return `${base}/${empresa}${sub}`;
  return `${window.location.origin}/${empresa}/certificados${sub}`;
}
