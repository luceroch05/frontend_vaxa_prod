/**
 * ── Detección de subdominio (ÚNICO lugar que conoce los dominios) ──────────
 *
 * Toda la app es UN SOLO build. Aquí se decide, según el subdominio, en qué
 * "modo" corre. El resto del código NO nombra dominios: usa los helpers de
 * `lib/paths.ts`, que se apoyan en esto.
 *
 *   sistemas.vaxasys.com      → sistema interno de Vaxa (tenant fijo)
 *   certificados.vaxasys.com  → SaaS de certificados (empresa = 1er segmento)
 *   historias.vaxasys.com     → SaaS de Historias Clínicas (empresa = 1er segmento)
 *   <dominio propio>          → Historias Clínicas white-label (tenant = dominio)
 *   cualquier otro / local    → 'legacy' (comportamiento actual, sin cambios)
 *
 * Nota: `historias` y `terapeutico` sirven el MISMO producto (Historias Clínicas)
 * pero difieren en de dónde sale el tenant:
 *   - historias   → subdominio Vaxa compartido; el tenant va en el PATH
 *                   (historias.vaxasys.com/<centro>/login).
 *   - terapeutico → dominio PROPIO del cliente; el tenant lo fija el dominio y la
 *                   URL queda limpia (mundokids.com.pe/login).
 *
 * Si mañana cambian los subdominios, se toca SOLO este archivo.
 */

export type HostMode = 'legacy' | 'sistemas' | 'certificados' | 'historias' | 'terapeutico';

export interface HostInfo {
  modo: HostMode;
  /** Tenant fijo cuando el dominio lo determina (sistemas → 'sistemas-vaxa'; dominio propio → su slug). */
  tenant: string;
}

/**
 * Dominios PROPIOS de clientes → su tenant de Historias Clínicas.
 * Cada cliente que usa su dominio se agrega aquí (más adelante puede leerse de BD).
 *   'mundokids.com.pe' → tenant 'mundokids'
 */
const DOMINIOS_TERAPEUTICO: Record<string, string> = {
  // Dominio de PRUEBA (synap.pe, que ya tenemos) → tenant demo con usuarios listos.
  'synap.pe': 'centro-demo',
  'www.synap.pe': 'centro-demo',
  // Cliente real (se activa cuando compren el dominio):
  // 'mundokids.com.pe': 'mundokids',
  // 'www.mundokids.com.pe': 'mundokids',
};

export function getHostMode(): HostInfo {
  if (typeof window === 'undefined') return { modo: 'legacy', tenant: '' };
  const h = window.location.hostname.toLowerCase();
  if (h.startsWith('sistemas.'))     return { modo: 'sistemas',     tenant: 'sistemas-vaxa' };
  if (h.startsWith('certificados.')) return { modo: 'certificados', tenant: '' };
  // Subdominio Vaxa compartido de Historias Clínicas: el tenant va en el path
  // (historias.vaxasys.com/<centro>/login), igual que certificados.
  if (h.startsWith('historias.'))    return { modo: 'historias',    tenant: '' };

  // Dominio propio del cliente (Historias Clínicas): la URL queda limpia y el
  // tenant lo fija el dominio, no el path.
  if (DOMINIOS_TERAPEUTICO[h]) return { modo: 'terapeutico', tenant: DOMINIOS_TERAPEUTICO[h] };

  // Prueba local SIN tocar el archivo hosts de Windows: cualquier «<slug>.lvh.me»
  // resuelve a 127.0.0.1 automáticamente. Ej: mundokids.lvh.me → tenant 'mundokids'.
  if (h.endsWith('.lvh.me')) return { modo: 'terapeutico', tenant: h.split('.')[0] };

  return { modo: 'legacy', tenant: '' };
}
