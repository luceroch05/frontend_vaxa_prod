import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Layers, ClipboardList, FileBadge,
  Settings, LogOut, Menu, X, GraduationCap, Globe, Users, CreditCard,
} from '@/components/ui/icon';
import { authStorage } from '@/lib/auth';
import { ConfirmProvider } from '../hooks/useConfirm';
import { CreditosProvider, useCreditos } from '../hooks/useCreditos';

/** Pastilla con el saldo de créditos de certificados de la empresa. */
function CreditosBadge() {
  const { estado, loading } = useCreditos();
  if (loading || !estado) return null;

  const saldo = estado.saldo;
  const color = saldo <= 0 ? '#DC2626' : saldo <= 10 ? '#D97706' : '#0D7C66';
  const bg    = saldo <= 0 ? '#FEF2F2' : saldo <= 10 ? '#FEF3C7' : '#ECFDF5';
  const border= saldo <= 0 ? '#FECACA' : saldo <= 10 ? '#FDE68A' : '#A7F3D0';

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
      style={{ background: bg, border: `1px solid ${border}` }}
      title={`${saldo} créditos disponibles de ${estado.asignados_total} asignados`}
    >
      <CreditCard size={14} style={{ color }} />
      <span className="text-[12px] font-semibold" style={{ color }}>
        {saldo} {saldo === 1 ? 'crédito' : 'créditos'}
      </span>
    </div>
  );
}

const PAGE_LABELS: Record<string, string> = {
  panel:         'Dashboard',
  programas:     'Programas',
  grupos:        'Grupos',
  estudiantes:   'Estudiantes',
  inscripciones: 'Inscripciones',
  certificados:  'Certificados',
  config:        'Configuración',
};

const NAV_ITEMS = [
  { key: '',             label: 'Dashboard',     Icon: LayoutDashboard, end: true },
  { key: 'programas',    label: 'Programas',      Icon: BookOpen },
  { key: 'grupos',       label: 'Grupos',         Icon: Layers },
  { key: 'estudiantes',  label: 'Estudiantes',    Icon: Users },
  { key: 'inscripciones',label: 'Inscripciones',  Icon: ClipboardList },
  { key: 'certificados', label: 'Certificados',   Icon: FileBadge },
  { key: 'config',       label: 'Configuración',  Icon: Settings },
];

export default function AdminLayout() {
  const { empresa }   = useParams<{ empresa: string }>();
  const navigate      = useNavigate();
  const location      = useLocation();
  const [open, setOpen] = useState(false);
  const user = authStorage.getUser(empresa!);

  const base = `/${empresa}/certificados/panel`;

  const handleLogout = () => {
    authStorage.clearSession(empresa!);
    navigate(`/${empresa}/certificados/login`);
  };

  const segments  = location.pathname.split('/');
  const lastSeg   = segments[segments.length - 1] ?? 'panel';
  const pageLabel = PAGE_LABELS[lastSeg] ?? 'Panel';

  const initials = user
    ? `${user.nombres.charAt(0)}${user.apellidos.charAt(0)}`.toUpperCase()
    : 'OP';

  const fullName = user ? `${user.nombres} ${user.apellidos}` : 'Operador';

  /* ── Sidebar ─────────────────────────────────────────────── */
  const Sidebar = () => (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-[220px] flex flex-col
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      style={{
        background: '#FFFFFF',
        borderRight: '1px solid #EEECE6',
        transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}
          >
            <GraduationCap size={15} style={{ color: '#D97706' }} />
          </div>
          <div>
            <p className="text-[13px] font-bold leading-tight" style={{ color: '#0D0E12' }}>
              Certificados
            </p>
            <p className="text-[10px] capitalize leading-tight" style={{ color: '#B0A898', letterSpacing: '0.03em' }}>
              {empresa}
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden" style={{ color: '#B0A898' }}>
          <X size={16} />
        </button>
      </div>

      <div className="mx-4 h-px" style={{ background: '#F0EEE9' }} />

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#C8C3BB' }}>
          Menú principal
        </p>

        {NAV_ITEMS.map(({ key, label, Icon, end }) => {
          const to = key ? `${base}/${key}` : base;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-white'
                    : 'text-[#64748B] hover:bg-[#F5F3EE] hover:text-[#1a1c23]'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? '#0D0E12' : undefined,
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    style={{ color: isActive ? '#D97706' : '#B0A898', flexShrink: 0 }}
                  />
                  {label}
                </>
              )}
            </NavLink>
          );
        })}

        <div className="pt-3 pb-1">
          <div className="h-px" style={{ background: '#F0EEE9' }} />
        </div>

        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#C8C3BB' }}>
          Accesos
        </p>

        <a
          href={`/${empresa}/certificados`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:bg-[#F5F3EE]"
          style={{ color: '#64748B' }}
        >
          <Globe size={16} style={{ color: '#B0A898', flexShrink: 0 }} />
          Portal público
        </a>
      </nav>

      <div className="mx-4 h-px" style={{ background: '#F0EEE9' }} />

      {/* User */}
      <div className="px-4 py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
            style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold truncate" style={{ color: '#0D0E12' }}>
              {fullName}
            </p>
            <p className="text-[10px] truncate" style={{ color: '#B0A898' }}>
              {user?.rol ?? 'Admin'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="p-1.5 rounded-lg transition-all flex-shrink-0 hover:bg-red-50 hover:text-red-500"
          style={{ color: '#C8C3BB' }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );

  return (
    <CreditosProvider empresa={empresa!}>
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F4F0' }}>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(13,14,18,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar desktop */}
        <header
          className="hidden lg:flex items-center justify-between px-8 py-4 flex-shrink-0"
          style={{ background: '#FFFFFF', borderBottom: '1px solid #EEECE6' }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#C8C3BB' }}>
              Panel · {empresa}
            </p>
            <h1 className="text-[20px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>
              {pageLabel}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <CreditosBadge />
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
              style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}
            >
              {initials}
            </div>
            <div>
              <p className="text-[13px] font-semibold leading-tight" style={{ color: '#0D0E12' }}>
                {fullName}
              </p>
              <p className="text-[11px] leading-tight" style={{ color: '#B0A898' }}>
                {user?.rol ?? 'Admin'}
              </p>
            </div>
          </div>
        </header>

        {/* Topbar móvil */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 py-3"
          style={{ background: '#FFFFFF', borderBottom: '1px solid #EEECE6' }}
        >
          <button onClick={() => setOpen(true)} style={{ color: '#64748B' }}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: '#FEF3C7' }}
            >
              <GraduationCap size={13} style={{ color: '#D97706' }} />
            </div>
            <span className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>
              Panel
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <ConfirmProvider>
              <Outlet />
            </ConfirmProvider>
          </div>
        </main>
      </div>
    </div>
    </CreditosProvider>
  );
}
