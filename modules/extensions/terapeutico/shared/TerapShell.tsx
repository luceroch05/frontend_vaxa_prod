import { Outlet, useOutletContext, useNavigate, NavLink } from 'react-router-dom';
import { Users, LogOut, Activity, Calendar, Layers, Globe } from '@/components/ui/icon';
import { authStorage } from '@/lib/auth';
import { terapPath } from '@/lib/paths';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import type { Branding } from './TerapLayout';

const TEAL = '#0F766E';

/** Layout del panel: cabecera con logo del centro + nav lateral + logout. */
export default function TerapShell() {
  const branding = useOutletContext<Branding>();
  const navigate = useNavigate();
  const slug = useEmpresaSlug()!;
  const user = authStorage.getUser(slug);
  const marca = branding?.razonSocial ?? slug;

  const logout = () => {
    authStorage.clearSession(slug);
    navigate(terapPath(slug, '/login'));
  };

  const rolUpper = (user?.rol ?? '').toUpperCase();
  const gestiona = ['ADMINISTRADOR', 'ADMISION'].includes(rolUpper);
  const esAdmin = rolUpper === 'ADMINISTRADOR';
  const nav = [
    { to: terapPath(slug, '/panel'), label: 'Pacientes', icon: Users, end: true },
    { to: terapPath(slug, '/panel/agenda'), label: 'Agenda', icon: Calendar, end: false },
    ...(gestiona ? [{ to: terapPath(slug, '/panel/servicios'), label: 'Servicios', icon: Layers, end: false }] : []),
    ...(esAdmin ? [{ to: terapPath(slug, '/panel/web'), label: 'Mi Web', icon: Globe, end: false }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F2F4F3' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 h-16"
        style={{ background: '#0E1A1A', color: '#fff' }}>
        <div className="flex items-center gap-3">
          {branding?.logoUrl
            ? <img src={branding.logoUrl} alt={marca} className="h-9 w-9 rounded-lg object-contain bg-white p-0.5" />
            : <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: TEAL }}><Activity size={18} /></div>}
          <div className="leading-tight">
            <p className="text-[14px] font-bold capitalize">{marca}</p>
            <p className="text-[10px] tracking-widest" style={{ color: '#5EEAD4' }}>HISTORIAS CLÍNICAS</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-[12.5px] font-semibold">{user.nombres} {user.apellidos}</p>
              <p className="text-[10px]" style={{ color: '#94A3B8' }}>{user.rol}</p>
            </div>
          )}
          <button onClick={logout} className="flex items-center gap-1.5 text-[12.5px] px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 hidden md:block min-h-[calc(100vh-4rem)] p-3"
          style={{ background: '#fff', borderRight: '1px solid #E5E9E7' }}>
          <nav className="space-y-1">
            {nav.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium ${isActive ? 'text-white' : ''}`}
                style={({ isActive }: any) => isActive
                  ? { background: TEAL, color: '#fff' }
                  : { color: '#374151' }}>
                <n.icon size={16} /> {n.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-5 sm:p-7 max-w-[1100px] w-full mx-auto">
          <Outlet context={branding} />
        </main>
      </div>
    </div>
  );
}
