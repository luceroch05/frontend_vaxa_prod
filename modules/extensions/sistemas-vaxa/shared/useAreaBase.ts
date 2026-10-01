import { useLocation } from 'react-router-dom';

/**
 * Área (producto) en la que se está navegando dentro del panel admin, según la URL.
 * Las páginas compartidas (Empresas, Perfil, Cobranza, Registrar) la usan para volver
 * y navegar SIEMPRE dentro de su propio sistema, sin saltar a otro.
 *   '/certificaciones'  o  '/historias-clinicas'
 */
export function useAreaBase(): string {
  const { pathname } = useLocation();
  return pathname.includes('/historias-clinicas') ? '/historias-clinicas' : '/certificaciones';
}
