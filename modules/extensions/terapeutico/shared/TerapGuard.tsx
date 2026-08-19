import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { authStorage } from '@/lib/auth';
import { terapPath } from '@/lib/paths';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import type { Branding } from './TerapLayout';

const norm = (s?: string) => s?.toLowerCase().trim();

/** Protege el panel: exige sesión válida para esta empresa. */
export default function TerapGuard() {
  const branding = useOutletContext<Branding>();   // viene de TerapLayout
  const slug = useEmpresaSlug()!;

  const user = authStorage.getUser(slug);
  const tieneSesion = authStorage.isAuthenticated(slug) && norm(user?.empresa) === norm(slug);

  // Reenvía el branding para que el shell/páginas del panel tengan el logo.
  if (tieneSesion) return <Outlet context={branding} />;

  if (authStorage.isAuthenticated(slug)) authStorage.clearSession(slug);
  return <Navigate to={terapPath(slug, '/login')} replace />;
}
