/**
 * ── Detección de subdominio (ÚNICO lugar que conoce los dominios) ──────────
 *
 * Toda la app es UN SOLO build. Aquí se decide, según el subdominio, en qué
 * "modo" corre. El resto del código NO nombra dominios: usa los helpers de
 * `lib/paths.ts`, que se apoyan en esto.
 *
 *   sistemas.vaxasys.com      → sistema interno de Vaxa (tenant fijo)
 *   certificados.vaxasys.com  → SaaS de certificados (empresa = 1er segmento)
 *   cualquier otro / local    → 'legacy' (comportamiento actual, sin cambios)
 *
 * Si mañana cambian los subdominios, se toca SOLO este archivo.
 */

export type HostMode = 'legacy' | 'sistemas' | 'certificados';

export interface HostInfo {
  modo: HostMode;
  /** Tenant fijo cuando el subdominio lo determina (sistemas → 'sistemas-vaxa'). */
  tenant: string;
}

export function getHostMode(): HostInfo {
  if (typeof window === 'undefined') return { modo: 'legacy', tenant: '' };
  const h = window.location.hostname.toLowerCase();
  if (h.startsWith('sistemas.'))     return { modo: 'sistemas',     tenant: 'sistemas-vaxa' };
  if (h.startsWith('certificados.')) return { modo: 'certificados', tenant: '' };
  return { modo: 'legacy', tenant: '' };
}
