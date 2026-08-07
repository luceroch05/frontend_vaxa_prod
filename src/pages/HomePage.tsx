import { useState } from 'react';
import {
  FileBadge, Shield, Zap, QrCode, ArrowRight, ArrowUpRight,
  Users, FileText, Clock, Layers, Menu, X, Award, Check, MessageCircle, Sparkles,
} from '@/components/ui/icon';
import { libroReclamacionesUrl } from '@/lib/paths';

/** Contacto de Vaxa para la landing. */
const WA_LINK = `https://wa.me/51924600490?text=${encodeURIComponent('Hola Vaxa 👋, quiero información sobre el sistema de certificados.')}`;

/* ── Sistema visual (tech / dark) ────────────────────────────── */
const BG = '#070B0A';            // casi negro verdoso
const SURFACE = 'rgba(255,255,255,0.035)';
const BORDER = 'rgba(255,255,255,0.09)';
const GREEN = '#10B981';
const GREEN_BRIGHT = '#34D399';
const TEXT = '#E8EEEB';
const MUTED = '#7E8C87';

const DISPLAY = "'Space Grotesk', system-ui, sans-serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const NAV = [
  { label: 'Productos', href: '#productos' },
  { label: 'Plataforma', href: '#features' },
  { label: 'Estudio', href: '#nosotros' },
];

export default function HomePage() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: BG, color: TEXT, fontFamily: SANS }} className="min-h-screen overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40" style={{ background: 'rgba(7,11,10,0.7)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${BORDER}` }}>
        <nav className="max-w-[1200px] mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <Logo />
            
          </a>
          <div className="hidden md:flex items-center gap-9">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-[13.5px] font-medium transition-colors hover:text-white" style={{ color: MUTED }}>{n.label}</a>
            ))}
            <a href="#contacto" className="group inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-lg transition-all"
              style={{ background: GREEN, color: '#04110C', boxShadow: '0 0 0 1px rgba(52,211,153,0.4), 0 8px 24px -8px rgba(16,185,129,0.6)' }}>
              Solicitar demo <ArrowUpRight size={14} />
            </a>
          </div>
          <button onClick={() => setOpen((o) => !o)} className="md:hidden p-2 -mr-2" aria-label="Menú" style={{ color: TEXT }}>{open ? <X size={22} /> : <Menu size={22} />}</button>
        </nav>
        {open && (
          <div className="md:hidden px-6 pb-5 flex flex-col gap-1" style={{ borderTop: `1px solid ${BORDER}` }}>
            {NAV.map((n) => (<a key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-2.5 text-[15px] font-medium" style={{ color: MUTED }}>{n.label}</a>))}
            <a href="#contacto" onClick={() => setOpen(false)} className="mt-2 text-center text-[14px] font-semibold px-4 py-3 rounded-lg" style={{ background: GREEN, color: '#04110C' }}>Solicitar demo</a>
          </div>
        )}
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section id="top" className="relative">
        <GridGlow />
        <div className="relative max-w-[1200px] mx-auto px-6 sm:px-10 pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11.5px] font-medium mb-7"
              style={{ fontFamily: MONO, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: GREEN_BRIGHT }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN_BRIGHT }} /> v2 · Sistema de Certificados
            </span>

            <h1 style={{ fontFamily: DISPLAY }} className="text-[40px] sm:text-[62px] font-bold leading-[1.04] tracking-[-0.03em]">
              Infraestructura<br />
              de software para<br />
              <span style={{ background: `linear-gradient(100deg, ${GREEN_BRIGHT}, ${GREEN})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>instituciones modernas</span>.
            </h1>

            <p className="text-[16px] sm:text-[17.5px] leading-relaxed mt-7 max-w-lg" style={{ color: MUTED }}>
              Vaxa construye sistemas confiables: certificación digital con validación pública por QR
              e historias clínicas. Rápidos de implementar, seguros por diseño.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-9">
              <a href="#productos" className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: GREEN, color: '#04110C', boxShadow: '0 0 0 1px rgba(52,211,153,0.4), 0 14px 40px -10px rgba(16,185,129,0.6)' }}>
                Explorar productos <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href="#contacto" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold"
                style={{ background: SURFACE, color: TEXT, border: `1px solid ${BORDER}` }}>
                Solicitar demo
              </a>
            </div>

            <div className="flex items-center gap-6 mt-11" style={{ fontFamily: MONO }}>
              {['cifrado', 'QR público', 'multi-tenant'].map((t) => (
                <span key={t} className="flex items-center gap-2 text-[12px]" style={{ color: MUTED }}>
                  <Check size={13} style={{ color: GREEN }} /> {t}
                </span>
              ))}
            </div>
          </div>

          <div className="relative"><HeroVisual /></div>
        </div>
      </section>

      {/* ── Tira ────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-2" style={{ fontFamily: MONO }}>
          <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#4F5B57' }}>// usado por</span>
          {['institutos', 'academias', 'clínicas', 'capacitadoras'].map((t) => (
            <span key={t} className="text-[12.5px] font-medium" style={{ color: MUTED }}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── Productos (bento) ───────────────────────────────── */}
      <section id="productos" className="max-w-[1200px] mx-auto px-6 sm:px-10 py-20 sm:py-28">
        <Eyebrow num="01" label="Productos & servicios" />
        <h2 style={{ fontFamily: DISPLAY }} className="text-[30px] sm:text-[44px] font-bold leading-[1.06] tracking-[-0.025em] mt-5 max-w-2xl">
          Sistemas y servicios, un mismo núcleo de ingeniería.
        </h2>

        <div className="grid lg:grid-cols-2 gap-5 mt-12">
          {/* Certificados */}
          <Card glow>
            <div className="flex items-center justify-between mb-7">
              <IconBox><FileBadge size={22} style={{ color: GREEN_BRIGHT }} strokeWidth={1.75} /></IconBox>
              <Tag>NUEVO</Tag>
            </div>
            <h3 style={{ fontFamily: DISPLAY }} className="text-[24px] font-bold tracking-tight">Sistema de Certificados</h3>
            <p className="text-[14.5px] leading-relaxed mt-3" style={{ color: MUTED }}>
              Emite, administra y valida certificados en segundos. Cada empresa con su portal,
              inscripción en línea y verificación pública por QR.
            </p>
            <ul className="mt-7 space-y-0">
              {['Emisión individual o masiva', 'Validación pública por QR', 'Portal por empresa', 'Créditos y planes'].map((f, i) => (
                <li key={f} className="flex items-center gap-3 py-3 text-[14px]" style={{ borderTop: i === 0 ? 'none' : `1px solid ${BORDER}` }}>
                  <Check size={15} style={{ color: GREEN }} /> {f}
                </li>
              ))}
            </ul>
            <CardLink>Solicitar una demo</CardLink>
          </Card>

          {/* Historias clínicas */}
          <Card>
            <div className="flex items-center justify-between mb-7">
              <IconBox><FileText size={22} style={{ color: GREEN_BRIGHT }} strokeWidth={1.75} /></IconBox>
              <Tag muted>ORIGEN</Tag>
            </div>
            <h3 style={{ fontFamily: DISPLAY }} className="text-[24px] font-bold tracking-tight">Historias Clínicas</h3>
            <p className="text-[14.5px] leading-relaxed mt-3" style={{ color: MUTED }}>
              La solución con la que nació Vaxa: gestión digital de historias clínicas,
              ordenada, segura y lista para el día a día de clínicas y consultorios.
            </p>
            <ul className="mt-7 space-y-0">
              {['Registro clínico centralizado', 'Acceso seguro por roles', 'Historial siempre disponible', 'Confidencialidad de datos'].map((f, i) => (
                <li key={f} className="flex items-center gap-3 py-3 text-[14px]" style={{ borderTop: i === 0 ? 'none' : `1px solid ${BORDER}` }}>
                  <Check size={15} style={{ color: GREEN }} /> {f}
                </li>
              ))}
            </ul>
            <CardLink>Consultar disponibilidad</CardLink>
          </Card>

          {/* Marca Personal (servicio) — tarjeta ancha */}
          <Card glow className="lg:col-span-2">
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12 items-center">
              <div>
                <div className="flex items-center justify-between mb-7">
                  <IconBox><Sparkles size={22} style={{ color: GREEN_BRIGHT }} strokeWidth={1.75} /></IconBox>
                  <Tag>SERVICIO</Tag>
                </div>
                <h3 style={{ fontFamily: DISPLAY }} className="text-[24px] font-bold tracking-tight">Marca Personal</h3>
                <p className="text-[14.5px] leading-relaxed mt-3" style={{ color: MUTED }}>
                  Construimos tu identidad como profesional o negocio: logo, identidad visual y
                  presencia digital para que destaques, transmitas confianza y te recuerden.
                </p>
                <CardLink>Quiero mi marca</CardLink>
              </div>
              <ul className="space-y-0">
                {['Logo e identidad visual', 'Presencia digital y redes', 'Diseño de perfil profesional', 'Piezas para tu comunicación'].map((f, i) => (
                  <li key={f} className="flex items-center gap-3 py-3 text-[14px]" style={{ borderTop: i === 0 ? 'none' : `1px solid ${BORDER}` }}>
                    <Check size={15} style={{ color: GREEN }} /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Features (bento) ────────────────────────────────── */}
      <section id="features" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-20 sm:py-28">
          <Eyebrow num="02" label="Plataforma" />
          <h2 style={{ fontFamily: DISPLAY }} className="text-[30px] sm:text-[44px] font-bold leading-[1.06] tracking-[-0.025em] mt-5 max-w-2xl">
            Certificar, sin fricción.
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            {/* feature destacado */}
            <div className="sm:col-span-2 lg:col-span-2 rounded-2xl p-8 relative overflow-hidden" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(50% 60% at 85% 20%, rgba(16,185,129,0.14), transparent 70%)' }} />
              <div className="relative">
                <IconBox><Zap size={22} style={{ color: GREEN_BRIGHT }} strokeWidth={1.75} /></IconBox>
                <h4 style={{ fontFamily: DISPLAY }} className="text-[20px] font-bold mt-5">Emisión instantánea, individual o en lote</h4>
                <p className="text-[14px] leading-relaxed mt-2 max-w-md" style={{ color: MUTED }}>
                  Genera certificados en PDF al momento con la plantilla de cada empresa. Cientos en un clic.
                </p>
              </div>
            </div>
            {[
              { Icon: QrCode, t: 'Validación pública', d: 'Verificación por QR, sin cuentas.' },
              { Icon: Layers, t: 'Multi-empresa', d: 'Portal, marca y datos aislados.' },
              { Icon: Shield, t: 'Seguro por diseño', d: 'Aislamiento y accesos por servidor.' },
              { Icon: Clock, t: 'Implementación rápida', d: 'En marcha en días, no en meses.' },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="rounded-2xl p-7" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                <IconBox><Icon size={20} style={{ color: GREEN_BRIGHT }} strokeWidth={1.75} /></IconBox>
                <h4 style={{ fontFamily: DISPLAY }} className="text-[16px] font-bold mt-4">{t}</h4>
                <p className="text-[13.5px] leading-relaxed mt-1.5" style={{ color: MUTED }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Estudio ─────────────────────────────────────────── */}
      <section id="nosotros" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-20 sm:py-28 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <Eyebrow num="03" label="El estudio" />
            <h2 style={{ fontFamily: DISPLAY }} className="text-[30px] sm:text-[42px] font-bold leading-[1.08] tracking-[-0.025em] mt-5">
              Años construyendo software que las instituciones confían.
            </h2>
            <div className="mt-8 space-y-0">
              {[
                { Icon: Users, t: 'Cercanía real', d: 'Hablas con quienes construyen el sistema.' },
                { Icon: Shield, t: 'Seguridad primero', d: 'Tus datos protegidos en cada capa.' },
                { Icon: Clock, t: 'Rápido de implementar', d: 'En marcha en días, no en meses.' },
              ].map(({ Icon, t, d }, i) => (
                <div key={t} className="flex items-start gap-4 py-5" style={{ borderTop: i === 0 ? 'none' : `1px solid ${BORDER}` }}>
                  <Icon size={19} style={{ color: GREEN_BRIGHT, flexShrink: 0, marginTop: 2 }} strokeWidth={1.75} />
                  <div>
                    <h4 className="text-[15.5px] font-semibold">{t}</h4>
                    <p className="text-[14px] mt-0.5" style={{ color: MUTED }}>{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px rounded-2xl overflow-hidden" style={{ background: BORDER }}>
            {[{ n: '+5', l: 'años de experiencia' }, { n: '100%', l: 'enfoque institucional' }, { n: 'QR', l: 'validación verificable' }, { n: '24/7', l: 'disponibilidad' }].map((s) => (
              <div key={s.l} className="p-8 sm:p-9" style={{ background: BG }}>
                <p style={{ fontFamily: DISPLAY, color: GREEN_BRIGHT }} className="text-[42px] font-bold leading-none">{s.n}</p>
                <p className="text-[13px] mt-3" style={{ color: MUTED }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section id="contacto" className="px-6 sm:px-10 py-24 sm:py-32">
        <div className="max-w-[1100px] mx-auto rounded-3xl px-8 sm:px-16 py-16 sm:py-20 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.08), rgba(255,255,255,0.02))', border: `1px solid ${BORDER}` }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(50% 80% at 50% 0%, rgba(16,185,129,0.18), transparent 70%)' }} />
          <div className="relative">
            <h2 style={{ fontFamily: DISPLAY }} className="text-[32px] sm:text-[50px] font-bold leading-[1.05] tracking-[-0.025em]">
              Construyamos el sistema<br />de tu institución.
            </h2>
            <p className="text-[16px] mt-5 max-w-md mx-auto" style={{ color: MUTED }}>
              Cuéntanos qué necesitas y te mostramos cómo Vaxa puede ayudarte. Sin compromiso.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href={WA_LINK} target="_blank" rel="noreferrer"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold transition-transform hover:-translate-y-0.5"
                style={{ fontFamily: MONO, background: '#25D366', color: '#04110C', boxShadow: '0 16px 50px -12px rgba(37,211,102,0.6)' }}>
                <MessageCircle size={18} /> WhatsApp · +51 924 600 490
              </a>
              <a href="mailto:info@vaxa.com.pe?subject=Quiero%20una%20demo%20de%20Vaxa"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold transition-transform hover:-translate-y-0.5"
                style={{ fontFamily: MONO, background: SURFACE, color: TEXT, border: `1px solid ${BORDER}` }}>
                info@vaxa.com.pe <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <Logo />

          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <a href={libroReclamacionesUrl()} title="Libro de Reclamaciones"
              className="inline-flex items-center rounded-lg overflow-hidden transition-transform hover:-translate-y-0.5"
              style={{ background: '#fff', padding: '6px 10px' }}>
              <img src="/libro-reclamaciones.webp" alt="Libro de Reclamaciones"
                style={{ height: 46, width: 'auto', display: 'block' }} />
            </a>
            <p className="text-[12px]" style={{ fontFamily: MONO, color: '#4F5B57' }}>© {new Date().getFullYear()} Vaxa — software para instituciones</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-componentes ─────────────────────────────────────────── */
function Logo() {
  return <img src="/vaxa-logo-white.png" alt="Vaxa" className="w-20 h-8 rounded-[9px] object-contain" />;
}

function GridGlow() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(50% 45% at 72% 8%, rgba(16,185,129,0.16), transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.7) 1px,transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(70% 60% at 50% 0%, #000, transparent 75%)', WebkitMaskImage: 'radial-gradient(70% 60% at 50% 0%, #000, transparent 75%)' }} />
    </>
  );
}

function Eyebrow({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3" style={{ fontFamily: MONO }}>
      <span className="text-[12px] font-medium" style={{ color: GREEN }}>{num}</span>
      <span className="w-6 h-px" style={{ background: 'rgba(16,185,129,0.5)' }} />
      <span className="text-[11.5px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>{label}</span>
    </div>
  );
}

function Card({ children, glow, className = '' }: { children: React.ReactNode; glow?: boolean; className?: string }) {
  return (
    <article className={`rounded-2xl p-8 sm:p-9 relative overflow-hidden ${className}`} style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
      {glow && <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(55% 45% at 90% 0%, rgba(16,185,129,0.16), transparent 70%)' }} />}
      <div className="relative">{children}</div>
    </article>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl flex items-center justify-center" style={{ width: 46, height: 46, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)' }}>{children}</div>;
}

function Tag({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span className="text-[10.5px] font-semibold tracking-widest px-2.5 py-1 rounded-full" style={{ fontFamily: MONO, background: muted ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.16)', color: muted ? MUTED : GREEN_BRIGHT }}>
      {children}
    </span>
  );
}

function CardLink({ children }: { children: React.ReactNode }) {
  return (
    <a href="#contacto" className="group inline-flex items-center gap-2 mt-8 text-[14px] font-semibold" style={{ color: GREEN_BRIGHT }}>
      {children} <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}

/* ── Hero visual: certificado glass + glow ───────────────────── */
function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[430px]">
      <div className="rounded-2xl p-7 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, backdropFilter: 'blur(8px)', boxShadow: '0 40px 90px -30px rgba(0,0,0,0.8)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 50% at 80% 0%, rgba(16,185,129,0.18), transparent 70%)' }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Award size={15} style={{ color: GREEN_BRIGHT }} strokeWidth={1.75} />
              </div>
              <span className="text-[13px] font-semibold" style={{ fontFamily: DISPLAY }}>Certificado</span>
            </div>
            <span className="text-[10px] font-semibold tracking-widest px-2.5 py-1 rounded-full" style={{ fontFamily: MONO, background: 'rgba(16,185,129,0.16)', color: GREEN_BRIGHT }}>VÁLIDO</span>
          </div>
          <div className="h-px mb-5" style={{ background: BORDER }} />
          <p className="text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO, color: MUTED }}>Se certifica a</p>
          <p style={{ fontFamily: DISPLAY }} className="text-[22px] font-bold mt-1.5 leading-tight">María Gonzáles Ríos</p>
          <p className="text-[13px] mt-2" style={{ color: MUTED }}>Especialización Profesional · 120 horas</p>
          <div className="flex items-end justify-between mt-7">
            <div>
              <p className="text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO, color: MUTED }}>Código</p>
              <p className="text-[13px] font-semibold mt-1" style={{ fontFamily: MONO, color: TEXT }}>VX-7K2D-9QFA</p>
            </div>
            <div className="w-14 h-14 rounded-xl grid grid-cols-3 grid-rows-3 gap-1 p-2" style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}` }}>
              {[1, 0, 1, 0, 1, 1, 1, 1, 0].map((on, i) => (<div key={i} style={{ background: on ? GREEN_BRIGHT : 'transparent', borderRadius: 1 }} />))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-4 sm:-left-7 rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(10,15,13,0.9)', border: `1px solid ${BORDER}`, backdropFilter: 'blur(8px)', boxShadow: '0 24px 50px -16px rgba(0,0,0,0.8)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: GREEN, boxShadow: '0 0 16px -2px rgba(16,185,129,0.8)' }}>
          <QrCode size={17} style={{ color: '#04110C' }} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[13px] font-semibold leading-tight">Verificado</p>
          <p className="text-[11px]" style={{ fontFamily: MONO, color: MUTED }}>por QR público</p>
        </div>
      </div>
    </div>
  );
}
