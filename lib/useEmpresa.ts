import { useParams } from 'react-router-dom';
import { getHostMode } from './host';

/**
 * Slug de la empresa (tenant) para el área de Historias Clínicas.
 *
 *  - En un DOMINIO PROPIO del cliente (modo 'terapeutico'), el slug NO viene en la
 *    URL: lo fija el dominio (ver lib/host.ts). Así la URL queda limpia
 *    (mundokids.com.pe/login en vez de /mundokids/terapeutico/login).
 *  - En el dominio normal (legacy), el slug sigue viniendo del path /:empresa/...
 */
export function useEmpresaSlug(): string | undefined {
  const { empresa } = useParams<{ empresa: string }>();
  const { modo, tenant } = getHostMode();
  return modo === 'terapeutico' ? tenant : empresa;
}
