import { Navigate, Outlet, useParams } from 'react-router-dom';
import { authStorage } from '@/lib/auth';
import { certPath } from '@/lib/paths';
import AccessDenied from './AccessDenied';

const norm = (s?: string) => s?.toLowerCase().trim();

export default function AdminGuard() {
  const { empresa } = useParams<{ empresa: string }>();
  const slug = empresa!;

  const user = authStorage.getUser(slug);
  const tieneSesionAqui =
    authStorage.isAuthenticated(slug) && norm(user?.empresa) === norm(slug);

  // Sesión válida para esta empresa → pasa.
  if (tieneSesionAqui) {
    return <Outlet />;
  }

  // ¿Hay sesión activa pero de OTRA empresa? Mostramos 403, NO el login ajeno.
  const otra = authStorage.findAnySession();
  if (otra && norm(otra.empresa) !== norm(slug)) {
    return <AccessDenied empresa={slug} sesionEmpresa={otra.empresa} />;
  }

  // Si había un token huérfano/corrupto para esta empresa, lo limpiamos.
  if (authStorage.isAuthenticated(slug)) {
    authStorage.clearSession(slug);
  }

  // Sin sesión en ningún lado → login normal de esta empresa.
  return <Navigate to={certPath(slug, '/login')} replace />;
}
