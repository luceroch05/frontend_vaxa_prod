import { useEffect, useState } from 'react';
import { Outlet, useOutletContext, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Users, LogOut, Activity, Calendar, Layers, Globe, Shield, DollarSign, Package, CreditCard, BarChart3, Menu, X } from '@/components/ui/icon';
import { authStorage } from '@/lib/auth';
import { terapPath } from '@/lib/paths';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import type { Branding } from './TerapLayout';
import { terapApi, type HcModulos, type CentroFiscal } from './api/terapeutico.api';
import TerapSesionUnica from './TerapSesionUnica';
import { ConfirmProvider } from '@/modules/extensions/certificaciones/shared/hooks/useConfirm';

const TEAL = '#0F766E';
/** Degradado slate/teal oscuro premium del sidebar. */
const SIDEBAR_BG = 'linear-gradient(180deg, #10302F 0%, #0A1E22 100%)';

/** Contexto que el shell provee a las páginas hijas: branding + módulos + datos fiscales. */
export interface TerapCtx extends Branding {
  modulos: HcModulos | null;    // null mientras carga (se asume todo activo)
  centro: CentroFiscal | null;
}
export const useTerapCtx = () => useOutletContext<TerapCtx>();

/** Todos los módulos ON: fallback mientras carga la config (evita parpadeo de ocultar). */
const TODOS_ON: HcModulos = { pacientes: true, historia: true, agenda: true, servicios: true, ventas: true, inventario: true, caja: true, web: true };

/** Layout del panel: cabecera con logo del centro + nav lateral + logout. */
export default function TerapShell() {
  const branding = useOutletContext<Branding>();
  const navigate = useNavigate();
  const location = useLocation();
  const slug = useEmpresaSlug()!;
  const user = authStorage.getUser(slug);
  const marca = branding?.razonSocial ?? slug;

  const [modulos, setModulos] = useState<HcModulos | null>(null);
  const [centro, setCentro] = useState<CentroFiscal | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);   // drawer en móvil

  useEffect(() => {
    let vivo = true;
    terapApi.miConfig(slug)
      .then((c) => { if (vivo) { setModulos(c.modulos); setCentro(c.centro); } })
      .catch(() => { if (vivo) setModulos(TODOS_ON); });   // falla abierto: no bloquea el panel
    return () => { vivo = false; };
  }, [slug]);

  const logout = () => {
    authStorage.clearSession(slug);
    navigate(terapPath(slug, '/login'));
  };

  const rolUpper = (user?.rol ?? '').toUpperCase();
  const gestiona = ['ADMINISTRADOR', 'ADMISION'].includes(rolUpper);
  const esAdmin = rolUpper === 'ADMINISTRADOR';
  const mod = modulos ?? TODOS_ON;   // mientras carga, se ve todo
  const nav = [
    ...(mod.pacientes ? [{ to: terapPath(slug, '/panel'), label: 'Pacientes', icon: Users, end: true }] : []),
    ...(mod.agenda ? [{ to: terapPath(slug, '/panel/agenda'), label: 'Agenda', icon: Calendar, end: false }] : []),
    ...(gestiona && mod.servicios ? [{ to: terapPath(slug, '/panel/servicios'), label: 'Servicios', icon: Layers, end: false }] : []),
    ...(gestiona && mod.ventas ? [{ to: terapPath(slug, '/panel/ventas'), label: 'Ventas', icon: DollarSign, end: false }] : []),
    ...(gestiona && mod.inventario ? [{ to: terapPath(slug, '/panel/inventario'), label: 'Inventario', icon: Package, end: false }] : []),
    ...(gestiona && mod.caja ? [{ to: terapPath(slug, '/panel/caja'), label: 'Caja', icon: CreditCard, end: false }] : []),
    ...(gestiona ? [{ to: terapPath(slug, '/panel/reportes'), label: 'Reportes', icon: BarChart3, end: false }] : []),
    ...(esAdmin && mod.web ? [{ to: terapPath(slug, '/panel/web'), label: 'Mi Web', icon: Globe, end: false }] : []),
    ...(esAdmin ? [{ to: terapPath(slug, '/panel/auditoria'), label: 'Auditoría', icon: Shield, end: false }] : []),
  ];

  // Guard: si el centro entra por URL a un módulo apagado, lo devolvemos a Pacientes.
  useEffect(() => {
    if (!modulos) return;   // espera a la config real
    const p = location.pathname;
    const bloqueado =
      (!modulos.agenda && p.includes('/panel/agenda')) ||
      (!modulos.servicios && p.includes('/panel/servicios')) ||
      (!modulos.ventas && p.includes('/panel/ventas')) ||
      (!modulos.inventario && p.includes('/panel/inventario')) ||
      (!modulos.caja && p.includes('/panel/caja')) ||
      (!modulos.web && p.includes('/panel/web'));
    if (bloqueado) navigate(terapPath(slug, '/panel'), { replace: true });
  }, [modulos, location.pathname, navigate, slug]);

  // Cierra el drawer móvil al cambiar de sección.
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Contenido del sidebar (se reusa en desktop y en el drawer móvil).
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Marca */}
      <div className="flex items-center gap-3 px-4 py-3 min-h-16 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {branding?.logoUrl
          ? <img src={branding.logoUrl} alt={marca} className="h-9 w-9 rounded-lg object-contain bg-white p-0.5" />
          : <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: TEAL }}><Activity size={18} color="#fff" /></div>}
        <div className="leading-tight min-w-0">
          <p className="text-[13.5px] font-bold capitalize text-white leading-snug line-clamp-2">{marca}</p>
          <p className="text-[9.5px] font-semibold mt-0.5" style={{ color: '#5EEAD4', letterSpacing: '0.18em' }}>HISTORIAS CLÍNICAS</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors hover:bg-white/[0.06]"
            style={({ isActive }: any) => isActive
              ? { background: TEAL, color: '#fff', boxShadow: '0 6px 16px rgba(15,118,110,0.35)' }
              : { color: '#9FBFBD' }}>
            <n.icon size={17} /> {n.label}
          </NavLink>
        ))}
      </nav>

      {/* Usuario + salir */}
      <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {user && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: 'rgba(94,234,212,0.15)', color: '#5EEAD4' }}>
              {((user.nombres?.[0] ?? '') + (user.apellidos?.[0] ?? '')).toUpperCase() || '?'}
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-[12.5px] font-semibold text-white truncate">{user.nombres} {user.apellidos}</p>
              <p className="text-[10px]" style={{ color: '#7FA3A1' }}>{user.rol}</p>
            </div>
          </div>
        )}
        <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors hover:bg-red-500/10" style={{ color: '#FCA5A5' }}>
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F7F7' }}>
      {/* Sesión única (una por usuario/dispositivo): WS en tiempo real + modal */}
      <TerapSesionUnica slug={slug} />

      {/* Sidebar fijo (desktop) */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 sticky top-0 h-screen" style={{ background: SIDEBAR_BG }}>
        {sidebarContent}
      </aside>

      {/* Columna de contenido */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Barra superior solo en móvil (abre el drawer) */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14" style={{ background: SIDEBAR_BG }}>
          <div className="flex items-center gap-2 min-w-0">
            {branding?.logoUrl
              ? <img src={branding.logoUrl} alt={marca} className="h-8 w-8 rounded-lg object-contain bg-white p-0.5" />
              : <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: TEAL }}><Activity size={16} color="#fff" /></div>}
            <span className="text-[14px] font-bold text-white capitalize truncate">{marca}</span>
          </div>
          <button onClick={() => setMenuOpen(true)} className="text-white/90 p-1.5" aria-label="Menú"><Menu size={22} /></button>
        </div>

        <main className="flex-1 p-5 sm:p-7">
          <div className="max-w-[1100px] w-full mx-auto">
            <ConfirmProvider>
              <Outlet context={{ ...branding, modulos, centro } satisfies TerapCtx} />
            </ConfirmProvider>
          </div>
        </main>
      </div>

      {/* Drawer móvil */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0" style={{ background: 'rgba(6,14,16,0.55)', backdropFilter: 'blur(2px)' }} onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 shadow-2xl" style={{ background: SIDEBAR_BG }}>
            <button onClick={() => setMenuOpen(false)} className="absolute right-3 top-4 text-white/70 z-10" aria-label="Cerrar"><X size={20} /></button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </div>
  );
}
