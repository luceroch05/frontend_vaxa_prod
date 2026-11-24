import { useEffect, useState } from 'react';
import { Outlet, useOutletContext, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Users, LogOut, Activity, Calendar, Layers, Globe, Shield, DollarSign, Package, CreditCard, BarChart3, Menu, X, ChevronLeft, ChevronRight } from '@/components/ui/icon';
import type { ComponentType } from 'react';
import { authStorage } from '@/lib/auth';
import { terapPath } from '@/lib/paths';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import type { Branding } from './TerapLayout';
import { terapApi, type HcModulos, type CentroFiscal } from './api/terapeutico.api';
import TerapSesionUnica from './TerapSesionUnica';
import { ConfirmProvider } from '@/modules/extensions/certificaciones/shared/hooks/useConfirm';

const TEAL = '#0F766E';
/** Sidebar CLARO premium: blanco con un leve tinte teal (la vida va en los acentos). */
const SIDEBAR_BG = 'linear-gradient(180deg, #FFFFFF 0%, #F2F8F7 100%)';
const SIDEBAR_BORDER = '#E6EDEC';
const GRAD_TEAL = 'linear-gradient(135deg,#14B8A6,#0F766E)';
const LS_COLAPSADO = 'terap-sidebar-colapsado';

type NavItemT = { to: string; label: string; icon: ComponentType<any>; end: boolean };

/** Fila de navegación: chip de ícono + etiqueta. Activa = degradado teal + sombra.
 *  Al contraer, la etiqueta se desvanece y encoge (anima junto con el ancho del sidebar),
 *  y el layout de la fila NO cambia (el chip queda centrado solo) → transición fluida. */
function NavRow({ item, colapsado }: { item: NavItemT; colapsado: boolean }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end={item.end} title={colapsado ? item.label : undefined}
      className={`group relative flex items-center px-2.5 py-1.5 rounded-xl transition-colors ${colapsado ? '' : 'hover:bg-[#EAF3F1]'}`}
      style={({ isActive }: any) => (isActive && !colapsado)
        ? { background: GRAD_TEAL, boxShadow: '0 8px 18px -6px rgba(15,118,110,0.45)' }
        : undefined}>
      {({ isActive }: any) => (
        <>
          {/* Barra de acento a la izquierda cuando está activa (solo expandido) */}
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full transition-opacity duration-200"
            style={{ background: 'rgba(255,255,255,0.65)', opacity: isActive && !colapsado ? 1 : 0 }} />
          {/* Chip: colapsado+activo = degradado teal relleno (mismo tamaño que los demás);
              expandido+activo = chip translúcido sobre el degradado de la fila. */}
          <span className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
            style={isActive
              ? (colapsado
                ? { background: GRAD_TEAL, boxShadow: '0 8px 18px -6px rgba(15,118,110,0.55)' }
                : { background: 'rgba(255,255,255,0.22)' })
              : { background: '#EAF3F1' }}>
            <Icon size={17} color={isActive ? '#FFFFFF' : TEAL} />
          </span>
          {/* El margen izquierdo (separación con el chip) anima a 0 al colapsar → chip centrado */}
          <span className="text-[13.5px] font-semibold whitespace-nowrap overflow-hidden transition-all duration-200 ease-out"
            style={{ color: isActive ? '#FFFFFF' : '#51635F', maxWidth: colapsado ? 0 : 170, marginLeft: colapsado ? 0 : 10, opacity: colapsado ? 0 : 1 }}>
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

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
  const [colapsado, setColapsado] = useState(() => localStorage.getItem(LS_COLAPSADO) === '1');  // sidebar contraído (solo íconos)
  const toggleColapsado = () => setColapsado(c => { localStorage.setItem(LS_COLAPSADO, c ? '0' : '1'); return !c; });

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
  // Navegación agrupada por secciones (le da estructura y jerarquía al panel).
  const grupos: { titulo: string; items: NavItemT[] }[] = [
    { titulo: 'Clínico', items: [
      ...(mod.pacientes ? [{ to: terapPath(slug, '/panel'), label: 'Pacientes', icon: Users, end: true }] : []),
      ...(mod.agenda ? [{ to: terapPath(slug, '/panel/agenda'), label: 'Agenda', icon: Calendar, end: false }] : []),
    ] },
    { titulo: 'Gestión', items: [
      ...(gestiona && mod.servicios ? [{ to: terapPath(slug, '/panel/servicios'), label: 'Servicios', icon: Layers, end: false }] : []),
      ...(gestiona && mod.ventas ? [{ to: terapPath(slug, '/panel/ventas'), label: 'Ventas', icon: DollarSign, end: false }] : []),
      ...(gestiona && mod.inventario ? [{ to: terapPath(slug, '/panel/inventario'), label: 'Inventario', icon: Package, end: false }] : []),
      ...(gestiona && mod.caja ? [{ to: terapPath(slug, '/panel/caja'), label: 'Caja', icon: CreditCard, end: false }] : []),
      ...(gestiona ? [{ to: terapPath(slug, '/panel/reportes'), label: 'Reportes', icon: BarChart3, end: false }] : []),
    ] },
    { titulo: 'Centro', items: [
      ...(esAdmin && mod.web ? [{ to: terapPath(slug, '/panel/web'), label: 'Mi Web', icon: Globe, end: false }] : []),
      ...(esAdmin ? [{ to: terapPath(slug, '/panel/auditoria'), label: 'Auditoría', icon: Shield, end: false }] : []),
    ] },
  ].filter(g => g.items.length > 0);

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

  // Contenido del sidebar. `col` = colapsado (solo íconos). En el drawer móvil siempre va expandido.
  const renderSidebar = (col: boolean) => (
    <div className="flex flex-col h-full">
      {/* Marca (el texto se anima; el logo se centra cuando queda la barra de íconos) */}
      <div className={`relative flex items-center min-h-[68px] shrink-0 overflow-hidden ${col ? 'justify-center px-2' : 'gap-2.5 pl-3.5 pr-2.5'}`}
        style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}`, background: 'linear-gradient(180deg, rgba(240,253,250,0.7), rgba(255,255,255,0))' }}>
        {branding?.logoUrl
          ? <img src={branding.logoUrl} alt={marca} className="h-10 w-10 rounded-xl object-contain bg-white p-1 shrink-0" style={{ border: `1px solid ${SIDEBAR_BORDER}`, boxShadow: '0 4px 10px -4px rgba(16,48,44,0.25)' }} />
          : <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GRAD_TEAL, boxShadow: '0 8px 16px -5px rgba(15,118,110,0.55)' }}><Activity size={19} color="#fff" /></div>}
        <div className="min-w-0 overflow-hidden transition-all duration-200 ease-out" style={{ maxWidth: col ? 0 : 200, maxHeight: col ? 0 : 400, opacity: col ? 0 : 1 }}>
          <p className="text-[13.5px] font-extrabold capitalize break-words leading-[1.15]" style={{ color: '#0E1A1A', letterSpacing: '-0.01em' }} title={marca}>{marca}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[8.5px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded-full"
            style={{ color: TEAL, background: 'rgba(15,118,110,0.09)', letterSpacing: '0.1em' }}>
            <span className="h-1 w-1 rounded-full" style={{ background: TEAL }} /> HISTORIAS CLÍNICAS
          </p>
        </div>
      </div>

      {/* Navegación por secciones */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-2">
        {grupos.map((g, gi) => (
          <div key={g.titulo} className="space-y-1">
            {/* Título de sección: se desvanece/encoge al contraer (en vez de saltar) */}
            <p className="px-2 text-[9.5px] font-bold uppercase whitespace-nowrap overflow-hidden transition-all duration-200 ease-out"
              style={{ color: '#9FB3B0', letterSpacing: '0.16em', maxHeight: col ? 0 : 20, opacity: col ? 0 : 1, paddingBottom: col ? 0 : 2, marginTop: col && gi > 0 ? 6 : 0 }}>
              {g.titulo}
            </p>
            {g.items.map(item => <NavRow key={item.to} item={item} colapsado={col} />)}
          </div>
        ))}
      </nav>

      {/* Contraer / expandir (solo desktop): barra de ancho completo con borde, solo el chevron */}
      <div className="hidden md:block px-2.5 pb-1 pt-1 shrink-0">
        <button onClick={toggleColapsado} title={col ? 'Expandir' : 'Contraer'} aria-label={col ? 'Expandir' : 'Contraer'}
          className="w-full flex items-center justify-center py-1.5 rounded-lg transition-colors hover:bg-[#EAF3F1]"
          style={{ border: `1px solid ${SIDEBAR_BORDER}`, color: TEAL }}>
          {col ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Usuario + salir */}
      <div className="px-2.5 py-3 shrink-0" style={{ borderTop: `1px solid ${SIDEBAR_BORDER}` }}>
        {user && (
          <div className={`flex items-center mb-1.5 rounded-xl overflow-hidden transition-all duration-200 ${col ? 'justify-center py-1' : 'gap-2.5 px-2 py-2'}`}
            title={col ? `${user.nombres} ${user.apellidos} · ${user.rol}` : undefined}
            style={col ? undefined : { background: '#F4F9F8', border: `1px solid ${SIDEBAR_BORDER}` }}>
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 text-white" style={{ background: GRAD_TEAL }}>
              {((user.nombres?.[0] ?? '') + (user.apellidos?.[0] ?? '')).toUpperCase() || '?'}
            </div>
            <div className="leading-tight min-w-0 transition-all duration-200 ease-out" style={{ maxWidth: col ? 0 : 160, opacity: col ? 0 : 1 }}>
              <p className="text-[12.5px] font-semibold truncate" style={{ color: '#0E1A1A' }}>{user.nombres} {user.apellidos}</p>
              <p className="text-[10px]" style={{ color: '#7A8B89' }}>{user.rol}</p>
            </div>
          </div>
        )}
        <button onClick={logout} title="Cerrar sesión"
          className={`w-full flex items-center rounded-xl text-[13px] font-semibold transition-colors hover:bg-red-50 ${col ? 'justify-center py-2' : 'gap-2.5 px-2.5 py-2'}`}
          style={{ color: '#DC2626' }}>
          <span className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FEF2F2' }}><LogOut size={15} /></span>
          <span className="whitespace-nowrap overflow-hidden transition-all duration-200 ease-out" style={{ maxWidth: col ? 0 : 160, opacity: col ? 0 : 1 }}>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F7F7' }}>
      {/* Sesión única (una por usuario/dispositivo): WS en tiempo real + modal */}
      <TerapSesionUnica slug={slug} />

      {/* Sidebar (desktop): al contraer queda como barra angosta de íconos (no desaparece). */}
      <aside className={`hidden md:flex md:flex-col shrink-0 sticky top-0 h-screen overflow-hidden ${colapsado ? 'w-[76px]' : 'w-60'}`}
        style={{ background: SIDEBAR_BG, borderRight: `1px solid ${SIDEBAR_BORDER}`, transition: 'width 300ms cubic-bezier(0.22,1,0.36,1)' }}>
        {renderSidebar(colapsado)}
      </aside>

      {/* Columna de contenido */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Barra superior solo en móvil (abre el drawer) */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14" style={{ background: SIDEBAR_BG, borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
          <div className="flex items-center gap-2 min-w-0">
            {branding?.logoUrl
              ? <img src={branding.logoUrl} alt={marca} className="h-8 w-8 rounded-lg object-contain bg-white p-0.5" style={{ border: `1px solid ${SIDEBAR_BORDER}` }} />
              : <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: TEAL }}><Activity size={16} color="#fff" /></div>}
            <span className="text-[14px] font-bold capitalize truncate" style={{ color: '#0E1A1A' }}>{marca}</span>
          </div>
          <button onClick={() => setMenuOpen(true)} className="p-1.5" style={{ color: '#334155' }} aria-label="Menú"><Menu size={22} /></button>
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
          <aside className="absolute left-0 top-0 h-full w-64 shadow-2xl" style={{ background: SIDEBAR_BG, borderRight: `1px solid ${SIDEBAR_BORDER}` }}>
            <button onClick={() => setMenuOpen(false)} className="absolute right-3 top-4 z-10" style={{ color: '#94A3B8' }} aria-label="Cerrar"><X size={20} /></button>
            {renderSidebar(false)}
          </aside>
        </div>
      )}
    </div>
  );
}
