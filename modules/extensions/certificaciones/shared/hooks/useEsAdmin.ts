import { useParams } from 'react-router-dom';
import { authStorage } from '@/lib/auth';

/**
 * ¿El usuario logueado es ADMINISTRADOR de la empresa? El rol ADMISION (operativo)
 * puede crear programas/aulas/inscripciones/alumnos y emitir, pero NO editar,
 * archivar, eliminar, anular certificados, ni ver reportes/auditoría.
 * El backend lo refuerza (rol.guard `soloAdmin`); esto es solo para ocultar UI.
 */
export function useEsAdmin(): boolean {
  const { empresa } = useParams<{ empresa: string }>();
  const rol = authStorage.getUser(empresa ?? '')?.rol ?? '';
  return String(rol).toUpperCase() === 'ADMINISTRADOR';
}
