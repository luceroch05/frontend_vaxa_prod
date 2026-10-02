'use client';

import { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Activity, DollarSign, ClipboardList, CreditCard,
  Building2, UserPlus, Package, Users, Globe, BookOpen, LogOut, Menu, X,
} from '@/components/ui/icon';
import { getHostMode } from '@/lib/host';
import { getTenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import { InsideShellContext } from '../shellContext';
import NotificacionesBell from './NotificacionesBell';

/* ── Identidad de Sistemas Vaxa: console claro + acentos esmeralda (NO el slate
      oscuro de Historias Clínicas; aquí la vida va en el verde) ─────────────── */
const EMERALD      = '#059669';
const EMERALD_GRAD = 'linear-gradient(135deg, #059669, #0F766E)';
const INK          = '#0D0E12';

interface NavItem { label: string; to: string; Icon: typeof FileText; }
interface NavGroup { grupo: string; items: NavItem[]; }

export default function SistemasShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { tenantId: paramTenant } = useParams<{ tenantId: string }>();
  const { modo, tenant: hostTenant } = getHostMode();
  const tenantId = modo === 'sistemas' ? hostTenant : (paramTenant ?? '');
  const tenant = tenantId ? getTenantConfig(tenantId) : null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const usuario = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(`auth_user_${tenantId}`) ?? 'null'); }
    catch { return null; }
  }, [tenantId]);

  // Cierra el drawer móvil al navegar.
  useEffect(() => { setMenuOpen(false); setUserOpen(false); }, [pathname]);

  const groups: NavGroup[] = useMemo(() => [
    { grupo: 'Inicio', items: [
      { label: 'Resumen', to: tenantPath(tenantId, '/sistemas'), Icon: LayoutDashboard },
    ]},
    { grupo: 'Sistemas', items: [
      { label: 'Certificados',       to: tenantPath(tenantId, '/certificaciones'),    Icon: FileText },
      { label: 'Historias Clínicas', to: tenantPath(tenantId, '/historias-clinicas'), Icon: Activity },
    ]},
    { grupo: 'Finanzas y cobros', items: [
      { label: 'Tarifario',   to: tenantPath(tenantId, '/tarifario'),   Icon: DollarSign },
      { label: 'Cotizaciones', to: tenantPath(tenantId, '/cotizaciones'), Icon: ClipboardList },
      { label: 'Facturación', to: tenantPath(tenantId, '/facturacion'), Icon: FileText },
      { label: 'Cobranza',    to: tenantPath(tenantId, '/cobranza'),    Icon: CreditCard },
    ]},
    { grupo: 'Gestión', items: [
      { label: 'Clientes',           to: tenantPath(tenantId, '/clientes'),                  Icon: Building2 },
      { label: 'Registrar cliente',  to: tenantPath(tenantId, '/registrar-empresa'),        Icon: UserPlus },
      { label: 'Infraestructura',    to: tenantPath(tenantId, '/infraestructura'),           Icon: Package },
      { label: 'Libro de Reclamaciones', to: tenantPath(tenantId, '/reclamos'),              Icon: BookOpen },
      { label: 'Usuarios',           to: tenantPath(tenantId, '/usuarios'),                  Icon: Users },
      { label: 'Landing',            to: tenantPath(tenantId, '/landing'),                   Icon: Globe },
    ]},
  ], [tenantId]);

  const norm = (p: string) => p.replace(/\/+$/, '');
  const isActive = (to: string) => norm(pathname) === norm(to);

  const logout = () => {
    localStorage.removeItem(`auth_${tenantId}`);
    localStorage.removeItem(`auth_user_${tenantId}`);
    navigate(tenantPath(tenantId, '/login'));
  };

  const initial = (usuario?.nombre ?? '?').charAt(0).toUpperCase();

  if (!tenant) return null;

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Marca: solo el logo de Vaxa, bien dimensionado y alineado con el inicio del menú */}
      <button
        onClick={() => navigate(tenantPath(tenantId, '/sistemas'))}
        className="flex items-center px-6 h-[68px] shrink-0 text-left"
        style={{ borderBottom: '1px solid #EEECE6' }}
      >
        <img
          src="/vaxa.png"
          alt="Vaxa"
          className="h-9 w-auto object-contain"
          style={{ maxWidth: 140 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </button>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {groups.map((g) => (
          <div key={g.grupo} className="mb-1.5">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] px-3 pt-3 pb-1.5" style={{ color: '#B0A898' }}>{g.grupo}</p>
            {g.items.map((it) => {
              const active = isActive(it.to);
              return (
                <button
                  key={it.to}
                  onClick={() => navigate(it.to)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all mb-0.5"
                  style={active
                    ? { background: EMERALD_GRAD, color: '#fff', boxShadow: '0 8px 18px -8px rgba(5,150,105,0.55)' }
                    : { color: '#64748B' }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F5F3EE'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <it.Icon className="w-[17px] h-[17px]" style={{ color: active ? '#fff' : '#94A3B8' }} />
                  <span>{it.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Usuario + salir */}
      <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid #EEECE6' }}>
        {usuario && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
              style={{ background: '#ECFDF5', color: EMERALD, border: '1px solid #A7F3D0' }}>{initial}</div>
            <div className="leading-tight min-w-0">
              <p className="text-[12.5px] font-semibold truncate" style={{ color: INK }}>{usuario.nombre}</p>
              <p className="text-[10px]" style={{ color: '#B0A898' }}>{usuario.role}</p>
            </div>
          </div>
        )}
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors hover:bg-red-50"
          style={{ color: '#DC2626' }}>
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F4F0' }}>
      {/* Sidebar fijo (desktop) */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 sticky top-0 h-screen"
        style={{ background: '#FFFFFF', borderRight: '1px solid #EEECE6' }}>
        {sidebar}
      </aside>

      {/* Columna de contenido */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Barra superior */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-14"
          style={{ background: '#FFFFFF', borderBottom: '1px solid #EEECE6' }}>
          <button onClick={() => setMenuOpen(true)} className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center" style={{ color: '#64748B' }} aria-label="Menú">
            <Menu className="w-5 h-5" />
          </button>
          <span className="hidden md:inline text-[11px] font-semibold uppercase" style={{ color: EMERALD, letterSpacing: '0.2em' }}>Panel de administración</span>
          <div className="flex items-center gap-3">
            <NotificacionesBell tenantId={tenantId} />
            <div className="relative">
              <button onClick={() => setUserOpen((o) => !o)} className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-xl transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F3EE'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <div className="hidden sm:block text-right leading-tight">
                  <p className="text-[12.5px] font-semibold" style={{ color: INK }}>{usuario?.nombre ?? '—'}</p>
                  <p className="text-[10.5px]" style={{ color: '#B0A898' }}>{usuario?.role ?? ''}</p>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
                  style={{ background: '#ECFDF5', color: EMERALD, border: '1px solid #A7F3D0' }}>{initial}</div>
              </button>
              {userOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl overflow-hidden z-50"
                    style={{ background: '#fff', border: '1px solid #EEECE6', boxShadow: '0 18px 50px rgba(13,14,18,0.12)' }}>
                    <div className="p-4" style={{ borderBottom: '1px solid #F2F0EA' }}>
                      <p className="text-[13px] font-bold" style={{ color: INK }}>{usuario?.nombre}</p>
                      <p className="text-[11.5px] mt-0.5" style={{ color: '#9CA3AF' }}>{usuario?.email}</p>
                    </div>
                    <button onClick={logout} className="w-full px-4 py-3 text-left text-[13px] font-semibold flex items-center gap-2.5 transition-colors hover:bg-red-50" style={{ color: '#DC2626' }}>
                      <LogOut className="w-4 h-4" /> Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contenido de la ruta hija (ya trae su propio fondo/main; el header propio se oculta) */}
        <div className="flex-1 min-w-0">
          <InsideShellContext.Provider value={true}>
            <Outlet />
          </InsideShellContext.Provider>
        </div>
      </div>

      {/* Drawer móvil */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0" style={{ background: 'rgba(13,14,18,0.35)', backdropFilter: 'blur(3px)' }} onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 shadow-2xl" style={{ background: '#FFFFFF' }}>
            <button onClick={() => setMenuOpen(false)} className="absolute right-3 top-4 z-10" style={{ color: '#9CA3AF' }} aria-label="Cerrar"><X className="w-5 h-5" /></button>
            {sidebar}
          </aside>
        </div>
      )}
    </div>
  );
}
