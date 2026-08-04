import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, ClipboardList, FileBadge,
  Settings, LogOut, Menu, X, GraduationCap, Globe, Users, CreditCard,
  MessageCircle, Mail, Shield, BarChart3, AlertTriangle, Clock,
} from '@/components/ui/icon';
import type { ComponentType } from 'react';

/** Contacto de soporte de Vaxa (para que el cliente nos escriba directo). */
const VAXA_SOPORTE = {
  whatsapp: '51924600490',          // número en formato internacional (sin +)
  whatsappLabel: '+51 924 600 490',
  email: 'info@vaxa.com.pe',
};
import { authStorage } from '@/lib/auth';
import { imgUrl } from '@/lib/api/client';
import { certPath } from '@/lib/paths';
import { publicApi } from '../api/public.api';
import { ConfirmProvider } from '../hooks/useConfirm';
import { PlanProvider, usePlan } from '../hooks/usePlan';
import { useSessionSocket } from '../hooks/useSessionSocket';
import SessionRevokedModal from './SessionRevokedModal';

/** Pastilla con el saldo de créditos de la empresa (cada certificado consume 1). */
function CreditosBadge() {
  const { estado, loading } = usePlan();
  if (loading || !estado || !estado.plan) return null;

  const { creditos, plan } = estado;
  const disponibles = creditos.disponibles;
  const ilimitado = creditos.ilimitado;
  const sinSaldo = !ilimitado && disponibles <= 0;
  const pocos    = !ilimitado && !sinSaldo && disponibles <= 10;   // queda poco saldo

  const color = sinSaldo ? '#DC2626' : pocos ? '#D97706' : '#0D7C66';
  const bg    = sinSaldo ? '#FEF2F2' : pocos ? '#FEF3C7' : '#ECFDF5';
  const border= sinSaldo ? '#FECACA' : pocos ? '#FDE68A' : '#A7F3D0';

  const texto = ilimitado
    ? 'Créditos ilimitados'
    : sinSaldo
      ? 'Sin créditos'
      : `${disponibles} crédito${disponibles === 1 ? '' : 's'}`;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
      style={{ background: bg, border: `1px solid ${border}` }}
      title={ilimitado
        ? `Plan ${plan.nombre} · créditos ilimitados`
        : `Plan ${plan.nombre} · ${disponibles} créditos disponibles · ${creditos.consumidos} consumidos de ${creditos.asignados} asignados`}
    >
      <CreditCard size={14} style={{ color }} />
      <span className="text-[12px] font-semibold" style={{ color }}>
        {texto}
      </span>
    </div>
  );
}

/** Fecha 'YYYY-MM-DD' → "18 de julio de 2026". */
function fmtFechaLarga(s: string): string {
  return new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Alerta GLOBAL de vencimiento del plan: sale en todas las páginas del panel
 * cuando el mantenimiento está por vencer (≤ 7 días) o ya venció. Muestra los
 * días restantes bien grandes y un botón directo para contactar a Vaxa.
 */
function VencimientoAlert({ waLink }: { waLink: string }) {
  const { estado } = usePlan();
  const s = estado?.suscripcion;
  if (!s || s.estado_cobranza === 'vigente') return null;

  const vencido = s.estado_cobranza === 'vencido';   // suspendido (2+ cuotas)
  const atrasado = s.dias_para_vencer < 0;           // el pago máximo YA pasó (1+ cuota vencida)
  const dias = Math.abs(s.dias_para_vencer);
  const C = vencido
    ? { bg: '#FEF2F2', bd: '#FECACA', fg: '#B91C1C', ico: '#DC2626' }
    : { bg: '#FFFBEB', bd: '#FDE68A', fg: '#B45309', ico: '#D97706' };

  return (
    <div className="mb-5 rounded-2xl p-4 flex items-center gap-4 flex-wrap"
      style={{ background: C.bg, border: `1.5px solid ${C.bd}`, boxShadow: `0 4px 16px ${C.bg}` }}>
      {/* Contador de días bien grande */}
      <div className="flex flex-col items-center justify-center rounded-xl px-4 py-2 flex-shrink-0"
        style={{ background: '#fff', border: `1px solid ${C.bd}`, minWidth: 78 }}>
        <span className="text-[26px] font-extrabold leading-none tabular-nums" style={{ color: C.ico }}>{dias}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: C.fg }}>
          {vencido ? (dias === 1 ? 'día' : 'días') : (dias === 1 ? 'día' : 'días')}
        </span>
      </div>

      <div className="flex-1 min-w-[220px]">
        <div className="flex items-center gap-1.5 mb-0.5">
          <AlertTriangle size={16} style={{ color: C.ico }} />
          <p className="text-[14px] font-bold" style={{ color: C.fg }}>
            {vencido
              ? `Tu plan está suspendido · venció hace ${dias} ${dias === 1 ? 'día' : 'días'}`
              : atrasado
                ? `Pago pendiente · venció hace ${dias} ${dias === 1 ? 'día' : 'días'}`
                : `Tu plan vence en ${dias} ${dias === 1 ? 'día' : 'días'}`}
          </p>
        </div>
        <p className="text-[12.5px]" style={{ color: C.fg }}>
          {vencido
            ? <>El mantenimiento venció el <b>{fmtFechaLarga(s.fecha_limite_pago)}</b>. Renueva para seguir emitiendo certificados sin cortes.</>
            : atrasado
              ? <>El pago del mantenimiento venció el <b>{fmtFechaLarga(s.fecha_limite_pago)}</b>. Regulariza para renovar sin interrupciones.</>
              : <>Vence el <b>{fmtFechaLarga(s.fecha_fin)}</b>. Paga como máximo el <b>{fmtFechaLarga(s.fecha_limite_pago)}</b> para renovar sin interrupciones.</>}
        </p>
      </div>

      <a href={waLink} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold flex-shrink-0 transition-transform hover:-translate-y-0.5"
        style={{ background: C.fg, color: '#fff' }}>
        <MessageCircle size={16} /> Contactar a Vaxa
      </a>
    </div>
  );
}

/** Pastilla siempre visible con los días de vigencia (topbar). Cambia de color al acercarse. */
function VigenciaChip() {
  const { estado, loading } = usePlan();
  const s = estado?.suscripcion;
  if (loading || !s) return null;
  const d = s.dias_para_vencer;
  const vencido = s.estado_cobranza === 'vencido';
  const alerta  = s.estado_cobranza !== 'vigente';
  const color = vencido ? '#DC2626' : alerta ? '#D97706' : '#0D7C66';
  const bg    = vencido ? '#FEF2F2' : alerta ? '#FEF3C7' : '#ECFDF5';
  const bd    = vencido ? '#FECACA' : alerta ? '#FDE68A' : '#A7F3D0';
  const texto = d < 0 ? `Venció hace ${Math.abs(d)}d` : `Vence en ${d}d`;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: bg, border: `1px solid ${bd}` }}
      title={`Mantenimiento vigente hasta ${fmtFechaLarga(s.fecha_fin)}`}>
      <Clock size={14} style={{ color }} />
      <span className="text-[12px] font-semibold" style={{ color }}>{texto}</span>
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
  plan:          'Mi plan',
  reportes:      'Reportes',
  auditoria:     'Auditoría',
  config:        'Configuración',
};

/** Item del menú lateral, reutilizable (mismo estilo para todas las entradas). */
function NavItem({ to, label, Icon, end, onNavigate }: {
  to: string; label: string; Icon: ComponentType<{ size?: number | string; style?: React.CSSProperties }>; end?: boolean; onNavigate: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
          isActive ? 'text-white' : 'text-[#64748B] hover:bg-[#F5F3EE] hover:text-[#1a1c23]'
        }`
      }
      style={({ isActive }) => ({ background: isActive ? '#0D0E12' : undefined })}
    >
      {({ isActive }) => (
        <>
          <Icon size={16} style={{ color: isActive ? '#D97706' : '#B0A898', flexShrink: 0 }} />
          {label}
        </>
      )}
    </NavLink>
  );
}

/** Entrada "Reportes": solo ADMINISTRADOR y planes con métricas (Profesional+). */
function ReportesNavLink({ base, empresa, onNavigate }: { base: string; empresa: string; onNavigate: () => void }) {
  const { estado } = usePlan();
  const esAdmin = String(authStorage.getUser(empresa)?.rol ?? '').toUpperCase() === 'ADMINISTRADOR';
  if (!esAdmin || !estado?.plan?.permite_metricas) return null;
  return <NavItem to={`${base}/reportes`} label="Reportes" Icon={BarChart3} onNavigate={onNavigate} />;
}

/** Entrada "Auditoría": solo visible para el Admin de la empresa y planes Profesional+. */
function AuditoriaNavLink({ base, empresa, onNavigate }: { base: string; empresa: string; onNavigate: () => void }) {
  const { estado } = usePlan();
  const esAdmin = String(authStorage.getUser(empresa)?.rol ?? '').toUpperCase() === 'ADMINISTRADOR';
  if (!esAdmin || !estado?.plan?.permite_auditoria) return null;
  return <NavItem to={`${base}/auditoria`} label="Auditoría" Icon={Shield} onNavigate={onNavigate} />;
}

// "Grupos" se unificó dentro de cada programa (pestaña "Aulas"), por eso ya no
// aparece como sección aparte del menú.
const NAV_ITEMS = [
  { key: '',             label: 'Dashboard',     Icon: LayoutDashboard, end: true },
  { key: 'programas',    label: 'Programas',      Icon: BookOpen },
  { key: 'estudiantes',  label: 'Estudiantes',    Icon: Users },
  { key: 'inscripciones',label: 'Inscripciones',  Icon: ClipboardList },
  { key: 'certificados', label: 'Certificados',   Icon: FileBadge },
  { key: 'plan',         label: 'Mi plan',        Icon: CreditCard },
  { key: 'config',       label: 'Configuración',  Icon: Settings },
];

export default function AdminLayout() {
  const { empresa }   = useParams<{ empresa: string }>();
  const navigate      = useNavigate();
  const location      = useLocation();
  const [open, setOpen] = useState(false);
  const user = authStorage.getUser(empresa!);

  // Sesión única: WebSocket que cierra esta sesión al instante si la cuenta
  // inicia sesión en otro dispositivo.
  useSessionSocket(empresa!);

  // Branding de la institución (logo + razón social) para personalizar el panel.
  const [brand, setBrand] = useState<{ logo: string | null; nombre: string | null }>({ logo: null, nombre: null });
  useEffect(() => {
    let activo = true;
    publicApi.existeEmpresa(empresa!)
      .then(r => { if (activo) setBrand({ logo: r.logo_url ? imgUrl(r.logo_url) : null, nombre: r.razon_social ?? null }); })
      .catch(() => { /* sin branding → se usa el slug */ });
    return () => { activo = false; };
  }, [empresa]);
  const marca = brand.nombre ?? empresa;

  const base = certPath(empresa!, '/panel');

  const handleLogout = () => {
    authStorage.clearSession(empresa!);
    navigate(certPath(empresa!, '/login'));
  };

  const segments  = location.pathname.split('/');
  const lastSeg   = segments[segments.length - 1] ?? 'panel';
  // En el detalle (/programas/:id) el último segmento es numérico → mostramos "Programa".
  const pageLabel = PAGE_LABELS[lastSeg] ?? (/^\d+$/.test(lastSeg) ? 'Programa' : 'Panel');

  const initials = user
    ? `${user.nombres.charAt(0)}${user.apellidos.charAt(0)}`.toUpperCase()
    : 'OP';

  const fullName = user ? `${user.nombres} ${user.apellidos}` : 'Operador';

  // Enlaces de contacto con Vaxa. El mensaje "chapa" al usuario logueado y su
  // empresa, así sabemos quién escribe y desde qué cliente sin preguntar.
  const empresaNombre = brand.nombre ?? empresa;
  const waMsg = encodeURIComponent(
    `Hola Vaxa 👋, soy ${fullName}${user?.rol ? ` (${user.rol})` : ''} de "${empresaNombre}" y necesito ayuda con el sistema de certificados.`,
  );
  const waLink = `https://wa.me/${VAXA_SOPORTE.whatsapp}?text=${waMsg}`;
  const mailLink = `mailto:${VAXA_SOPORTE.email}?subject=${encodeURIComponent(`Soporte Vaxa — ${empresaNombre}`)}&body=${encodeURIComponent(`Hola Vaxa, soy ${fullName} de "${empresaNombre}".\n\n`)}`;

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
        <div className="flex items-center gap-2.5 min-w-0">
          {brand.logo ? (
            <img
              src={brand.logo}
              alt={marca ?? 'Logo'}
              className="w-8 h-8 rounded-[10px] object-contain bg-white flex-shrink-0"
              style={{ border: '1px solid #EEECE6' }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}
            >
              <GraduationCap size={15} style={{ color: '#D97706' }} />
            </div>
          )}
          <div className="min-w-0">
            <p
              className={`text-[13px] font-bold leading-tight truncate ${brand.nombre ? '' : 'capitalize'}`}
              style={{ color: '#0D0E12' }}
            >
              {marca}
            </p>
            <p className="text-[10px] leading-tight" style={{ color: '#B0A898', letterSpacing: '0.03em' }}>
              Certificados
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

        {NAV_ITEMS.map(({ key, label, Icon, end }) => (
          <NavItem
            key={key || 'panel'}
            to={key ? `${base}/${key}` : base}
            label={label}
            Icon={Icon}
            end={end}
            onNavigate={() => setOpen(false)}
          />
        ))}
        {/* Reportes: solo Admin en planes Profesional+ */}
        <ReportesNavLink base={base} empresa={empresa!} onNavigate={() => setOpen(false)} />
        {/* Auditoría: visible solo para Admin en planes Profesional+ */}
        <AuditoriaNavLink base={base} empresa={empresa!} onNavigate={() => setOpen(false)} />

        <div className="pt-3 pb-1">
          <div className="h-px" style={{ background: '#F0EEE9' }} />
        </div>

        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#C8C3BB' }}>
          Accesos
        </p>

        <a
          href={certPath(empresa!)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:bg-[#F5F3EE]"
          style={{ color: '#64748B' }}
        >
          <Globe size={16} style={{ color: '#B0A898', flexShrink: 0 }} />
          Portal público
        </a>

        {/* Soporte Vaxa — para que el cliente nos contacte directo */}
        <div className="px-1 pt-4">
          <div className="rounded-2xl p-3.5" style={{ background: '#0D0E12' }}>
            <p className="text-[12px] font-bold text-white">¿Necesitas ayuda?</p>
            <p className="text-[10.5px] mb-2.5" style={{ color: '#9AA39F' }}>Escríbenos a Vaxa</p>

            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: '#25D366', color: '#04110C' }}
            >
              <MessageCircle size={15} style={{ flexShrink: 0 }} />
              WhatsApp
            </a>
            <a
              href={mailLink}
              className="flex items-center gap-2 mt-1.5 px-2.5 py-2 rounded-lg text-[11.5px] font-medium transition-colors hover:bg-white/5"
              style={{ color: '#C8CFCB' }}
            >
              <Mail size={14} style={{ flexShrink: 0, color: '#9AA39F' }} />
              {VAXA_SOPORTE.email}
            </a>
          </div>
        </div>
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
    <PlanProvider empresa={empresa!}>
    <SessionRevokedModal />
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
            <p className={`text-[11px] font-semibold uppercase tracking-widest mb-0.5 ${brand.nombre ? '' : 'capitalize'}`} style={{ color: '#C8C3BB' }}>
              Panel · {marca}
            </p>
            <h1 className="text-[20px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>
              {pageLabel}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <VigenciaChip />
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
              <VencimientoAlert waLink={waLink} />
              <Outlet />
            </ConfirmProvider>
          </div>
        </main>
      </div>
    </div>
    </PlanProvider>
  );
}
