import { useState, useEffect, useRef } from 'react';
import {
  Shield, Zap, ArrowRight, ArrowUpRight, Users, FileText,
  BarChart3, Layers, Menu, X, Check, MessageCircle, Sparkles, Award,
  Phone, Mail, MapPin, GraduationCap,
  Building2, Star, MousePointerClick, TrendingUp,
  FileBadge, QrCode, UserPlus, BadgeCheck,
  Facebook, Instagram, Youtube, Linkedin, Music2,
} from '@/components/ui/icon';
import { libroReclamacionesUrl } from '@/lib/paths';
import { api, imgUrl } from '@/lib/api/client';

/** Redes/contacto de la landing (editables desde sistemas-vaxa). */
interface Redes {
  facebook?: string | null; instagram?: string | null; tiktok?: string | null;
  youtube?: string | null; linkedin?: string | null;
  whatsapp?: string | null; email?: string | null; telefono?: string | null;
}

/** Alianza/convenio (logos editables desde sistemas-vaxa). */
interface Alianza { id: number; nombre: string; logo_url?: string | null; link?: string | null; }

/** Testimonio real de cliente (editable desde sistemas-vaxa). Reutiliza el logo de una alianza. */
interface Testimonio {
  id: number; comentario: string; autor: string;
  cargo?: string | null; empresa?: string | null;
  alianza_id?: number | null; logo_url?: string | null; calificacion?: number;
}
/** Testimonios por defecto (si aún no hay ninguno cargado desde el admin). */
const DEFAULT_TESTIMONIOS: Testimonio[] = [
  { id: -1, comentario: 'Vaxa nos permite emitir y validar nuestros certificados en segundos, con el respaldo del QR público. Ha mejorado mucho nuestro trabajo diario.', autor: 'Jesús Yactayo', cargo: 'CEO', empresa: 'Centro de Terapias Crecemos', calificacion: 5 },
  { id: -2, comentario: 'La plataforma es intuitiva, segura y se adapta a nuestras necesidades. El soporte siempre ha sido excelente.', autor: 'Comité Organizador', cargo: '', empresa: 'SIEFO Perú', calificacion: 5 },
];

const WA_DEFAULT = '51924600490';
const EMAIL_DEFAULT = 'info@vaxa.com.pe';
const TEL_DEFAULT = '+51 924 600 490';
const waLink = (num?: string | null) =>
  `https://wa.me/${(num || WA_DEFAULT).replace(/\D/g, '')}?text=${encodeURIComponent('Hola Vaxa 👋, quiero información sobre el sistema de certificados.')}`;

/* ── Sistema visual (tech / dark) ────────────────────────────── */
const BG = '#070B0A';            // casi negro verdoso
const SURFACE = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(255,255,255,0.12)';
const GREEN = '#10B981';
const GREEN_BRIGHT = '#34D399';
const TEXT = '#E8EEEB';
const MUTED = '#7E8C87';

const DISPLAY = "'Space Grotesk', system-ui, sans-serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SCRIPT = "'Caveat', 'Segoe Script', cursive";

const NAV = [
  { label: 'Inicio', href: '#top' },
  { label: 'Productos', href: '#productos' },
  { label: 'Soluciones', href: '#soluciones' },
  { label: 'Clientes', href: '#clientes' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Contacto', href: '#contacto' },
];

export default function HomePage() {
  const [open, setOpen] = useState(false);
  const [redes, setRedes] = useState<Redes>({});
  const [alianzas, setAlianzas] = useState<Alianza[]>([]);
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  useEffect(() => {
    api.get<Redes>('/public/vaxa-landing').then(setRedes).catch(() => {});
    api.get<Alianza[]>('/public/vaxa-alianzas').then((a) => setAlianzas(Array.isArray(a) ? a : [])).catch(() => {});
    api.get<Testimonio[]>('/public/vaxa-testimonios').then((t) => setTestimonios(Array.isArray(t) ? t : [])).catch(() => {});
  }, []);
  const WA_LINK = waLink(redes.whatsapp);
  const EMAIL = redes.email || EMAIL_DEFAULT;
  const TEL = redes.telefono || TEL_DEFAULT;

  // Redes con enlace (para el footer). WhatsApp/teléfono/correo se arman como enlaces especiales.
  const socials: { key: string; href: string; Icon: typeof Facebook; label: string }[] = [
    redes.facebook  && { key: 'fb', href: redes.facebook,  Icon: Facebook,  label: 'Facebook' },
    redes.instagram && { key: 'ig', href: redes.instagram, Icon: Instagram, label: 'Instagram' },
    redes.tiktok    && { key: 'tk', href: redes.tiktok,    Icon: Music2,    label: 'TikTok' },
    redes.youtube   && { key: 'yt', href: redes.youtube,   Icon: Youtube,   label: 'YouTube' },
    redes.linkedin  && { key: 'in', href: redes.linkedin,  Icon: Linkedin,  label: 'LinkedIn' },
    { key: 'mail', href: `mailto:${EMAIL}`, Icon: Mail, label: 'Correo' },
  ].filter(Boolean) as { key: string; href: string; Icon: typeof Facebook; label: string }[];

  // Testimonios: usa los reales (editables) o unos por defecto. Reutiliza el logo
  // de la alianza (por id, o por nombre de empresa) — el testimonio no lleva foto.
  const testimoniosView = (testimonios.length > 0 ? testimonios : DEFAULT_TESTIMONIOS).map((t) => {
    const al = t.alianza_id
      ? alianzas.find((a) => a.id === t.alianza_id)
      : alianzas.find((a) => (a.nombre ?? '').toLowerCase() === (t.empresa ?? '').toLowerCase());
    return { ...t, logo_url: t.logo_url || al?.logo_url || null, empresa: t.empresa || al?.nombre || null };
  });

  return (
    <div style={{ background: BG, color: TEXT, fontFamily: SANS }} className="min-h-screen overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap');

        /* Aparición al hacer scroll */
        .reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1); will-change: opacity, transform; }
        .reveal.reveal-in { opacity: 1; transform: none; }

        /* Entrada del hero al cargar */
        @keyframes rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
        .rise { opacity: 0; animation: rise .8s cubic-bezier(.2,.7,.2,1) forwards; }

        /* Flotado continuo de tarjetas */
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        .floaty { animation: floaty 5s ease-in-out infinite; }
        .floaty-2 { animation: floaty 6.5s ease-in-out infinite; }
        .floaty-3 { animation: floaty 5.8s ease-in-out infinite .6s; }

        /* Barras que crecen */
        @keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .bar { transform-origin: bottom; animation: grow .9s cubic-bezier(.2,.7,.2,1) both; }

        /* Brillo que recorre (shimmer) */
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        /* Latido suave */
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.0); } 50% { box-shadow: 0 0 22px -2px rgba(16,185,129,0.55); } }
        .glow-pulse { animation: glowPulse 2.6s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .reveal, .rise { opacity: 1 !important; transform: none !important; animation: none !important; }
          .floaty, .floaty-2, .floaty-3, .bar, .glow-pulse { animation: none !important; }
        }
      `}</style>

      {/* ── Navbar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40" style={{ background: 'rgba(7,11,10,0.72)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${BORDER}` }}>
        <nav className="max-w-[1200px] mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5"><Logo /></a>
          <div className="hidden md:flex items-center gap-8">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-[13.5px] font-medium transition-colors hover:text-white" style={{ color: n.label === 'Inicio' ? GREEN_BRIGHT : MUTED }}>{n.label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center">
            <a href="#contacto" className="glow-pulse group inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-lg transition-transform hover:-translate-y-0.5"
              style={{ background: GREEN, color: '#04110C' }}>
              Solicitar demo <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
        <div className="relative max-w-[1200px] mx-auto px-6 sm:px-10 pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-[1fr_1.05fr] gap-14 items-center">
          <div>
            <span className="rise inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium mb-7 uppercase tracking-[0.14em]"
              style={{ fontFamily: MONO, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: GREEN_BRIGHT, animationDelay: '.05s' }}>
              <FileBadge size={13} /> Software de certificación digital
            </span>

            <h1 style={{ fontFamily: DISPLAY, animationDelay: '.15s' }} className="rise text-[38px] sm:text-[56px] font-bold leading-[1.05] tracking-[-0.03em]">
              Digitalizamos tu certificación,<br />
              <span style={{ background: `linear-gradient(100deg, ${GREEN_BRIGHT}, ${GREEN})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>potenciamos tu institución.</span>
            </h1>

            <p className="rise text-[16px] sm:text-[17px] leading-relaxed mt-6 max-w-lg" style={{ color: MUTED, animationDelay: '.28s' }}>
              Emite, administra y valida certificados en segundos. Una plataforma segura,
              fácil de usar, con inscripción en línea y validación pública por QR.
            </p>

            <div className="rise flex flex-col sm:flex-row gap-3 mt-9" style={{ animationDelay: '.4s' }}>
              <a href="#contacto" className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: GREEN, color: '#04110C', boxShadow: '0 0 0 1px rgba(52,211,153,0.4), 0 14px 40px -10px rgba(16,185,129,0.6)' }}>
                Solicitar demo <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href="#productos" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold"
                style={{ background: SURFACE, color: TEXT, border: `1px solid ${BORDER}` }}>
                Conocer productos
              </a>
            </div>

            <div className="rise flex flex-wrap items-center gap-x-6 gap-y-3 mt-10" style={{ animationDelay: '.52s' }}>
              {[
                { Icon: Shield, t: 'Seguro y confiable' },
                { Icon: MapPin, t: 'Soporte en Perú' },
                { Icon: Zap, t: 'Implementación rápida' },
              ].map(({ Icon, t }) => (
                <span key={t} className="flex items-center gap-2 text-[13px]" style={{ color: MUTED }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <Icon size={12} style={{ color: GREEN_BRIGHT }} />
                  </span>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="rise relative lg:pt-10" style={{ animationDelay: '.35s' }}>
            {/* Detalle manuscrito verde (como el mockup) — arriba a la izquierda, sin chocar con las tarjetas */}
            <span className="hidden lg:block absolute -top-2 left-0 z-20 -rotate-6 text-[23px] leading-[1.15] pointer-events-none"
              style={{ fontFamily: SCRIPT, color: GREEN_BRIGHT, textShadow: '0 0 20px rgba(52,211,153,0.45)', maxWidth: 210 }}>
              Certificación que<br />genera confianza
            </span>
            <Shot src="/landing-media/hero.png" alt="Panel de Vaxa"
              className="w-full h-auto rounded-2xl"
              style={{ border: `1px solid ${BORDER}`, boxShadow: '0 40px 90px -30px rgba(0,0,0,0.8)' }}>
              <HeroDashboard />
            </Shot>
          </div>
        </div>
      </section>

      {/* ── Nuestros clientes ───────────────────────────────── */}
      <section id="clientes" style={{ borderTop: `1px solid ${BORDER}`, position: 'relative' }}>
        <Aurora />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 130% at 50% 0%, rgba(16,185,129,0.12), transparent 70%)' }} />
        <div className="relative max-w-[1200px] mx-auto px-6 sm:px-10 py-20 sm:py-24">
          <Reveal>
            <p className="text-center text-[11px] uppercase tracking-[0.22em] font-medium" style={{ fontFamily: MONO, color: MUTED }}>
              <span style={{ color: GREEN }}>//</span> nuestros clientes
            </p>
            <h2 style={{ fontFamily: DISPLAY }} className="text-center text-[26px] sm:text-[38px] font-bold leading-[1.1] tracking-[-0.025em] mt-4">
              Instituciones que confían<br className="hidden sm:block" /> en <span style={{ color: GREEN_BRIGHT }}>nuestras soluciones</span>
            </h2>
            <p className="text-center text-[14.5px] leading-relaxed mt-4 max-w-xl mx-auto" style={{ color: MUTED }}>
              Centros de salud, instituciones educativas y organizaciones de diversos sectores
              que ya impulsan su transformación digital con Vaxa.
            </p>
          </Reveal>
          <div className="mt-12"><ClientesCarrusel alianzas={alianzas} /></div>
        </div>
      </section>

      {/* ── Nuestros productos ──────────────────────────────── */}
      <section id="productos" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-20 sm:py-28 grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <Eyebrow label="Nuestros productos" />
            <h2 style={{ fontFamily: DISPLAY }} className="text-[30px] sm:text-[42px] font-bold leading-[1.08] tracking-[-0.025em] mt-5">
              Soluciones digitales para tu institución
            </h2>
            <p className="text-[15px] leading-relaxed mt-5 max-w-md" style={{ color: MUTED }}>
              Con el sistema de certificados como eje, un ecosistema completo para emitir,
              validar y hacer crecer tu institución.
            </p>
            <a href="#contacto" className="group inline-flex items-center gap-2 mt-8 px-5 py-3 rounded-xl text-[14px] font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: GREEN, color: '#04110C', boxShadow: '0 12px 34px -12px rgba(16,185,129,0.6)' }}>
              Ver todos los productos <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { Icon: FileBadge, t: 'Certificados', s: 'Emisión y validación digital', d: 'Nuestro producto principal: emite en lote con validación pública por QR.', principal: true },
              { Icon: FileText, t: 'Historias Clínicas', s: 'Gestión clínica electrónica', d: 'Registro clínico completo, seguro y accesible desde cualquier lugar.' },
              { Icon: Sparkles, t: 'Marca Personal', s: 'Identidad y presencia digital', d: 'Creamos tu logo, identidad visual y presencia digital como profesional.' },
              { Icon: Layers, t: 'Más soluciones', s: 'Inscripciones, reportes, web y Vaxa ID', d: 'Complementa tu institución con nuestras soluciones digitales a medida.' },
            ].map(({ Icon, t, s, d, principal }, i) => (
              <Reveal key={t} delay={i * 90}>
              <a href="#contacto" className="group block rounded-2xl p-7 relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 h-full"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(60% 60% at 80% 0%, rgba(16,185,129,0.14), transparent 70%)' }} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <IconBox><Icon size={22} style={{ color: GREEN_BRIGHT }} strokeWidth={1.75} /></IconBox>
                    {principal && (
                      <span className="text-[10px] font-semibold tracking-widest px-2.5 py-1 rounded-full" style={{ fontFamily: MONO, background: 'rgba(16,185,129,0.16)', color: GREEN_BRIGHT }}>PRINCIPAL</span>
                    )}
                  </div>
                  <h3 style={{ fontFamily: DISPLAY }} className="text-[19px] font-bold mt-5">{t}</h3>
                  <p className="text-[13px] font-medium mt-0.5" style={{ color: GREEN_BRIGHT }}>{s}</p>
                  <p className="text-[13.5px] leading-relaxed mt-3" style={{ color: MUTED }}>{d}</p>
                  <span className="inline-flex items-center gap-1.5 mt-5 text-[13px] font-semibold" style={{ color: TEXT }}>
                    <ArrowRight size={15} style={{ color: GREEN_BRIGHT }} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ¿Por qué elegir Vaxa? ───────────────────────────── */}
      <section id="nosotros" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-20 sm:py-28 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <Eyebrow label="¿Por qué elegir Vaxa?" />
            <h2 style={{ fontFamily: DISPLAY }} className="text-[30px] sm:text-[42px] font-bold leading-[1.08] tracking-[-0.025em] mt-5">
              Tecnología que entiende<br className="hidden sm:block" /> tu realidad
            </h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8 mt-10">
              {[
                { Icon: Award, t: 'Especializados en certificación', d: 'Soluciones diseñadas según tus procesos y necesidades reales.' },
                { Icon: MousePointerClick, t: 'Fácil de usar', d: 'Interfaz intuitiva para todo tu equipo.' },
                { Icon: Zap, t: 'Implementación rápida', d: 'Comienza a trabajar en pocos días con nuestro acompañamiento.' },
                { Icon: MessageCircle, t: 'Soporte en Perú', d: 'Atención personalizada y continua por nuestro equipo local.' },
              ].map(({ Icon, t, d }, i) => (
                <Reveal key={t} delay={i * 90}>
                  <IconBox><Icon size={20} style={{ color: GREEN_BRIGHT }} strokeWidth={1.75} /></IconBox>
                  <h4 className="text-[15.5px] font-semibold mt-4">{t}</h4>
                  <p className="text-[13.5px] leading-relaxed mt-1.5" style={{ color: MUTED }}>{d}</p>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={120} className="relative"><EficienciaVisual /></Reveal>
        </div>
      </section>

      {/* ── Soluciones por tipo de institución ──────────────── */}
      <section id="soluciones" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-20 sm:py-28">
          <Reveal>
            <p className="text-center text-[11px] uppercase tracking-[0.22em] font-medium" style={{ fontFamily: MONO, color: MUTED }}>
              <span style={{ color: GREEN }}>//</span> para quién es vaxa
            </p>
            <h2 style={{ fontFamily: DISPLAY }} className="text-center text-[28px] sm:text-[40px] font-bold leading-[1.08] tracking-[-0.025em] mt-4">
              Soluciones para cada tipo de institución
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {[
              { Icon: GraduationCap, t: 'Institutos y academias', d: 'Cursos, diplomados y programas con certificado.', img: '/landing/sol-institutos.jpg' },
              { Icon: Building2, t: 'Instituciones educativas', d: 'Certificación de estudiantes y egresados.', img: '/landing/sol-educativas.jpg' },
              { Icon: Sparkles, t: 'Empresas capacitadoras', d: 'Capacitaciones y talleres corporativos.', img: '/landing/sol-capacitadoras.jpg' },
              { Icon: Users, t: 'Organizaciones y eventos', d: 'Congresos, seminarios y reconocimientos.', img: '/landing/sol-eventos.jpg' },
            ].map(({ Icon, t, d, img }, i) => (
              <Reveal key={t} delay={i * 90}>
              <a href="#contacto" className="group block rounded-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-1 h-full" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                <div className="h-44 relative overflow-hidden">
                  <Shot src={img} alt={t} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                    <div className="h-full w-full relative flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.16), rgba(16,185,129,0.02))' }}>
                      <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)', backgroundSize: '22px 22px' }} />
                      <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(7,11,10,0.6)', border: '1px solid rgba(16,185,129,0.3)', backdropFilter: 'blur(4px)' }}>
                        <Icon size={26} style={{ color: GREEN_BRIGHT }} strokeWidth={1.6} />
                      </div>
                    </div>
                  </Shot>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(7,11,10,0.55))' }} />
                </div>
                <div className="p-6">
                  <h3 className="text-[16px] font-bold flex items-center justify-between" style={{ fontFamily: DISPLAY }}>
                    {t} <ArrowRight size={16} style={{ color: GREEN_BRIGHT }} className="transition-transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-[13px] leading-relaxed mt-2" style={{ color: MUTED }}>{d}</p>
                </div>
              </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proceso ─────────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
            <div>
              <Eyebrow label="Un proceso simple" />
              <h2 style={{ fontFamily: DISPLAY }} className="text-[30px] sm:text-[42px] font-bold leading-[1.08] tracking-[-0.025em] mt-5">
                De la implementación<br className="hidden sm:block" /> a los resultados
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { n: '01', t: 'Te escuchamos', d: 'Conocemos tus necesidades y te asesoramos.', Icon: MessageCircle },
                { n: '02', t: 'Implementamos', d: 'Configuramos la plataforma y capacitamos a tu equipo.', Icon: Zap },
                { n: '03', t: 'Te acompañamos', d: 'Soporte continuo para que obtengas el máximo beneficio.', Icon: TrendingUp },
              ].map(({ n, t, d, Icon }, i) => (
                <Reveal key={n} delay={i * 120}>
                  <div className="flex items-center gap-3 mb-4">
                    <span style={{ fontFamily: DISPLAY, color: GREEN_BRIGHT }} className="text-[15px] font-bold">{n}</span>
                    <IconBox><Icon size={18} style={{ color: GREEN_BRIGHT }} strokeWidth={1.75} /></IconBox>
                  </div>
                  <h4 className="text-[16px] font-bold" style={{ fontFamily: DISPLAY }}>{t}</h4>
                  <p className="text-[13.5px] leading-relaxed mt-2" style={{ color: MUTED }}>{d}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonios ─────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-20 sm:py-28 grid lg:grid-cols-[0.8fr_1.2fr] gap-12 items-start">
          <div>
            <Eyebrow label="Testimonios" />
            <h2 style={{ fontFamily: DISPLAY }} className="text-[30px] sm:text-[42px] font-bold leading-[1.08] tracking-[-0.025em] mt-5">
              Lo que dicen<br className="hidden sm:block" /> nuestros clientes
            </h2>
            <p className="text-[14.5px] leading-relaxed mt-5 max-w-sm" style={{ color: MUTED }}>
              Instituciones que ya están transformando su gestión con Vaxa.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {testimoniosView.map((t, i) => {
              const estrellas = Math.max(1, Math.min(5, t.calificacion ?? 5));
              return (
                <Reveal key={t.id} delay={i * 120} className="h-full">
                <div className="rounded-2xl p-7 flex flex-col h-full transition-transform duration-300 hover:-translate-y-1" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <div className="flex gap-1 mb-4">{Array.from({ length: estrellas }).map((_, s) => <Star key={s} size={15} style={{ color: GREEN_BRIGHT, fill: GREEN_BRIGHT }} />)}</div>
                  <p className="text-[14.5px] leading-relaxed flex-1" style={{ color: TEXT }}>“{t.comentario}”</p>
                  <div className="mt-6 pt-5 flex items-center gap-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                    {/* Logo de la empresa (reutilizado de la alianza) en vez de foto de la persona */}
                    {t.logo_url ? (
                      <span className="inline-flex items-center justify-center rounded-xl flex-shrink-0" style={{ background: '#fff', width: 46, height: 46, padding: 6 }}>
                        <img src={imgUrl(t.logo_url)} alt={t.empresa ?? ''} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-xl flex-shrink-0 text-[16px] font-bold" style={{ width: 46, height: 46, background: 'rgba(16,185,129,0.14)', color: GREEN_BRIGHT }}>
                        {(t.empresa || t.autor)?.[0]}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ fontFamily: DISPLAY }}>{t.autor}</p>
                      <p className="text-[12.5px] mt-0.5 truncate" style={{ color: MUTED }}>
                        {[t.cargo, t.empresa].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────────── */}
      <section id="contacto" className="px-6 sm:px-10 py-16 sm:py-24">
        <div className="max-w-[1150px] mx-auto rounded-3xl px-8 sm:px-14 py-14 sm:py-16 relative overflow-hidden grid lg:grid-cols-2 gap-12 items-center"
          style={{ background: 'linear-gradient(150deg, rgba(16,185,129,0.1), rgba(255,255,255,0.02))', border: `1px solid ${BORDER}` }}>
          <Aurora />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(50% 80% at 20% 10%, rgba(16,185,129,0.18), transparent 70%)' }} />
          <Reveal className="relative">
            <h2 style={{ fontFamily: DISPLAY }} className="text-[30px] sm:text-[44px] font-bold leading-[1.06] tracking-[-0.025em]">
              Llevemos tu institución<br />al siguiente nivel
            </h2>
            <p className="text-[15.5px] mt-5 max-w-md leading-relaxed" style={{ color: MUTED }}>
              Solicita una demostración y conoce cómo Vaxa puede ayudarte a optimizar tu certificación.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href={WA_LINK} target="_blank" rel="noreferrer"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: GREEN, color: '#04110C', boxShadow: '0 14px 40px -10px rgba(16,185,129,0.6)' }}>
                Solicitar demo <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href={`mailto:${EMAIL}?subject=Quiero%20una%20demo%20de%20Vaxa`}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold"
                style={{ background: SURFACE, color: TEXT, border: `1px solid ${BORDER}` }}>
                Contáctanos
              </a>
            </div>
          </Reveal>
          <Reveal delay={120} className="relative">
            <Shot src="/landing-media/cta.png" alt="Panel de reportes de Vaxa"
              className="w-full h-auto rounded-2xl"
              style={{ border: `1px solid ${BORDER}`, boxShadow: '0 40px 90px -30px rgba(0,0,0,0.8)' }}>
              <CtaDashboard />
            </Shot>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-14">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
            <div>
              <Logo />
              <p className="text-[14px] leading-relaxed mt-4 max-w-[220px]" style={{ color: MUTED }}>
                Digitalizamos tu gestión, potenciamos tu atención.
              </p>
              {socials.length > 0 && (
                <div className="flex items-center gap-2.5 mt-6">
                  {socials.map(({ key, href, Icon, label }) => (
                    <a key={key} href={href} target="_blank" rel="noreferrer" title={label} aria-label={label}
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5"
                      style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT }}>
                      <Icon size={16} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <FooterCol title="Productos" links={['Certificados QR', 'Historias Clínicas', 'Marca Personal', 'Reportes', 'Web y proyectos a medida']} />
            <FooterCol title="Empresa" links={['Nosotros', 'Clientes', 'Blog', 'Contacto']} />

            <div>
              <h4 className="text-[12px] uppercase tracking-[0.16em] font-semibold" style={{ fontFamily: MONO, color: MUTED }}>Soporte</h4>
              <ul className="mt-5 space-y-3">
                {['Preguntas frecuentes', 'Centro de ayuda'].map((l) => (
                  <li key={l}><a href="#contacto" className="text-[14px] transition-colors hover:text-white" style={{ color: MUTED }}>{l}</a></li>
                ))}
              </ul>
              <a href="#contacto" className="inline-flex items-center gap-1.5 mt-6 text-[13px] font-semibold px-4 py-2.5 rounded-lg"
                style={{ background: GREEN, color: '#04110C' }}>Solicitar demo <ArrowUpRight size={14} /></a>
              <div className="mt-5 space-y-2">
                <a href={`tel:${TEL.replace(/\s/g, '')}`} className="flex items-center gap-2 text-[13.5px]" style={{ color: MUTED }}><Phone size={14} style={{ color: GREEN_BRIGHT }} /> {TEL}</a>
                <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 text-[13.5px]" style={{ color: MUTED }}><Mail size={14} style={{ color: GREEN_BRIGHT }} /> {EMAIL}</a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: `1px solid ${BORDER}` }}>
            <p className="text-[12px]" style={{ fontFamily: MONO, color: '#4F5B57' }}>
              © {new Date().getFullYear()} VAXA SYSTEMS S.A.C. · RUC: 20615047954 · Lima, Perú
            </p>
            <div className="flex items-center gap-5">
              <a href="#" className="text-[12px] transition-colors hover:text-white" style={{ color: '#4F5B57' }}>Términos y condiciones</a>
              <a href="#" className="text-[12px] transition-colors hover:text-white" style={{ color: '#4F5B57' }}>Política de privacidad</a>
              <a href={libroReclamacionesUrl()} title="Libro de Reclamaciones"
                className="inline-flex items-center rounded-lg overflow-hidden transition-transform hover:-translate-y-0.5"
                style={{ background: '#fff', padding: '5px 8px' }}>
                <img src="/libro-reclamaciones.webp" alt="Libro de Reclamaciones" style={{ height: 38, width: 'auto', display: 'block' }} />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Botón flotante de WhatsApp (siempre visible) ─────── */}
      <a href={WA_LINK} target="_blank" rel="noreferrer"
        aria-label="Escríbenos por WhatsApp" title="Escríbenos por WhatsApp"
        className="group fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-50 inline-flex items-center justify-center rounded-full transition-transform hover:-translate-y-0.5"
        style={{ width: 58, height: 58, background: '#25D366', boxShadow: '0 12px 30px -6px rgba(37,211,102,0.65), 0 0 0 6px rgba(37,211,102,0.15)' }}>
        <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(37,211,102,0.35)' }} />
        <WhatsAppIcon size={30} />
      </a>
    </div>
  );
}

/* ── Sub-componentes ─────────────────────────────────────────── */
/** Logo oficial de WhatsApp (globo + teléfono). Negro por defecto. */
function WhatsAppIcon({ size = 28, color = '#04110C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ position: 'relative' }} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.945c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.454h.006c6.585 0 11.946-5.36 11.949-11.945a11.821 11.821 0 00-3.495-8.407z" />
    </svg>
  );
}

function Logo() {
  return <img src="/vaxa-logo-white.png" alt="Vaxa" className="w-20 h-8 rounded-[9px] object-contain" />;
}

/**
 * Muestra una IMAGEN REAL si el archivo existe en /public; si no carga (404),
 * cae automáticamente en la maqueta CSS (children). Así puedes subir los
 * screenshots/fotos reales del mockup sin tocar el código.
 */
function Shot({ src, alt, className, style, children }: {
  src: string; alt: string; className?: string; style?: React.CSSProperties; children: React.ReactNode;
}) {
  const [ok, setOk] = useState(true);
  if (ok) return <img src={src} alt={alt} onError={() => setOk(false)} className={className} style={style} />;
  return <>{children}</>;
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-[12px] uppercase tracking-[0.16em] font-semibold" style={{ fontFamily: MONO, color: MUTED }}>{title}</h4>
      <ul className="mt-5 space-y-3">
        {links.map((l) => (
          <li key={l}><a href="#productos" className="text-[14px] transition-colors hover:text-white" style={{ color: MUTED }}>{l}</a></li>
        ))}
      </ul>
    </div>
  );
}

/** Tarjeta de cliente: tarjeta OSCURA (como el mockup, sin fondo blanco) con el logo dentro.
 *  El logo PNG lleva un "aura" blanca suave para que lea bien sobre el fondo oscuro. */
function ClienteCard({ a }: { a: Alianza }) {
  const inner = a.logo_url ? (
    // Logo NORMAL a color, sobre tarjeta glass (transparente). Opacidad al hover.
    <img src={imgUrl(a.logo_url)} alt={a.nombre} title={a.nombre}
      className="opacity-90 transition-opacity duration-300 group-hover:opacity-100"
      style={{ maxHeight: 96, maxWidth: '92%', width: 'auto', objectFit: 'contain' }} />
  ) : (
    <span className="text-[16px] font-semibold text-center px-2" style={{ color: MUTED }}>{a.nombre}</span>
  );
  const card = (
    <div className="group flex items-center justify-center transition-transform hover:-translate-y-1 h-full"
      style={{ minHeight: 140, padding: '16px' }}>
      {inner}
    </div>
  );
  return a.link ? <a href={a.link} target="_blank" rel="noreferrer" className="block h-full">{card}</a> : card;
}

/** Una fila del marquee. `dir` = sentido (left/right). Se pausa al pasar el mouse. */
function MarqueeRow({ items, dir, dur }: { items: Alianza[]; dir: 'left' | 'right'; dur: number }) {
  // Rellena hasta tener suficientes para que el bucle no se vea vacío.
  let base = items;
  if (base.length === 0) return null;
  while (base.length < 6) base = [...base, ...items];
  return (
    <div className="clientes-marquee">
      <div className="clientes-track" style={{ animationDuration: `${dur}s`, animationDirection: dir === 'right' ? 'reverse' : 'normal' }}>
        {[...base, ...base].map((a, i) => (
          <div className="clientes-slide" key={`${a.id}-${i}`}><ClienteCard a={a} /></div>
        ))}
      </div>
    </div>
  );
}

/**
 * Carrusel de clientes: marquee infinito que se mueve SOLO. Con varios logos se
 * parte en DOS filas que corren en sentido CONTRARIO. Se pausa al pasar el mouse.
 */
function ClientesCarrusel({ alianzas }: { alianzas: Alianza[] }) {
  const items: Alianza[] = alianzas.length > 0
    ? alianzas
    : ['SIEFO Perú', 'Centro Fonoaudiológico', 'SYNAP', 'Crecemos'].map((n, i) => ({ id: -(i + 1), nombre: n }));

  const dosFilas = items.length >= 18;
  const mid = Math.ceil(items.length / 2);
  const fila1 = dosFilas ? items.slice(0, mid) : items;
  const fila2 = dosFilas ? items.slice(mid) : [];
  const dur = Math.max(26, items.length * 3.2);

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes clientes-scroll { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
        .clientes-marquee { overflow: hidden; -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent); mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent); }
        .clientes-track { display: flex; width: max-content; will-change: transform; animation-name: clientes-scroll; animation-timing-function: linear; animation-iteration-count: infinite; }
        .clientes-marquee:hover .clientes-track { animation-play-state: paused; }
        .clientes-slide { flex: 0 0 280px; padding: 0 10px; }
        @media (max-width: 1024px) { .clientes-slide { flex-basis: 240px; } }
        @media (max-width: 640px)  { .clientes-slide { flex-basis: 200px; } }
        @media (prefers-reduced-motion: reduce) { .clientes-track { animation: none; } }
      `}</style>
      <MarqueeRow items={fila1} dir="left" dur={dur} />
      {dosFilas && fila2.length > 0 && <MarqueeRow items={fila2} dir="right" dur={dur} />}
    </div>
  );
}

/** Envuelve contenido para que aparezca (fade-up) cuando entra en pantalla. */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShow(true); io.disconnect(); }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${show ? 'reveal-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** Aurora: manchas verdes borrosas que flotan suavemente (efecto del mockup). */
function Aurora({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <style>{`
        @keyframes aurora-a { 0%,100% { transform: translate3d(-10%, -8%, 0) scale(1); } 50% { transform: translate3d(8%, 6%, 0) scale(1.15); } }
        @keyframes aurora-b { 0%,100% { transform: translate3d(10%, 6%, 0) scale(1.1); } 50% { transform: translate3d(-8%, -6%, 0) scale(0.95); } }
        @media (prefers-reduced-motion: reduce) { .aurora-blob { animation: none !important; } }
      `}</style>
      <div className="aurora-blob absolute rounded-full" style={{ width: '48%', height: '120%', left: '-6%', top: '-30%', background: 'radial-gradient(circle, rgba(16,185,129,0.32), transparent 62%)', filter: 'blur(70px)', animation: 'aurora-a 16s ease-in-out infinite' }} />
      <div className="aurora-blob absolute rounded-full" style={{ width: '44%', height: '110%', right: '-8%', top: '-20%', background: 'radial-gradient(circle, rgba(52,211,153,0.24), transparent 62%)', filter: 'blur(80px)', animation: 'aurora-b 20s ease-in-out infinite' }} />
    </div>
  );
}

function GridGlow() {
  return (
    <>
      <Aurora />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(50% 45% at 72% 8%, rgba(16,185,129,0.16), transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.7) 1px,transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(70% 60% at 50% 0%, #000, transparent 75%)', WebkitMaskImage: 'radial-gradient(70% 60% at 50% 0%, #000, transparent 75%)' }} />
    </>
  );
}

function Eyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3" style={{ fontFamily: MONO }}>
      <span className="w-6 h-px" style={{ background: 'rgba(16,185,129,0.5)' }} />
      <span className="text-[11.5px] uppercase tracking-[0.2em]" style={{ color: GREEN_BRIGHT }}>{label}</span>
    </div>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl flex items-center justify-center" style={{ width: 46, height: 46, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)' }}>{children}</div>;
}

/* ── Hero visual: mockup de dashboard (agenda + próxima sesión + reporte) ── */
function HeroDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-[600px]">
      {/* Panel principal: agenda de hoy */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, backdropFilter: 'blur(8px)', boxShadow: '0 40px 90px -30px rgba(0,0,0,0.8)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 50% at 85% 0%, rgba(16,185,129,0.16), transparent 70%)' }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            <span className="text-[10.5px]" style={{ fontFamily: MONO, color: MUTED }}>Lunes, 25 de septiembre</span>
          </div>
          <p className="text-[13px] font-semibold mb-3" style={{ fontFamily: DISPLAY }}>Emisión de hoy</p>
          <div className="space-y-2">
            {[
              { c: 'VX-7K2D', n: 'Ana Herrera', e: 'Emitido', ok: true },
              { c: 'VX-9QFA', n: 'Luis Ramos', e: 'Emitido', ok: true },
              { c: 'VX-3M1P', n: 'María Gonzáles', e: 'En cola', ok: false },
            ].map((r) => (
              <div key={r.c} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(16,185,129,0.14)', color: GREEN_BRIGHT }}>{r.n[0]}</div>
                <div className="flex-1 min-w-0">
                  <span className="text-[12.5px] block truncate">{r.n}</span>
                  <span className="text-[9.5px]" style={{ fontFamily: MONO, color: MUTED }}>{r.c}</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ fontFamily: MONO, background: r.ok ? 'rgba(16,185,129,0.16)' : 'rgba(255,255,255,0.06)', color: r.ok ? GREEN_BRIGHT : MUTED }}>{r.e}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card flotante: validación por QR */}
      <div className="floaty absolute -top-4 -right-3 sm:-right-6 rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(10,15,13,0.92)', border: `1px solid ${BORDER}`, backdropFilter: 'blur(8px)', boxShadow: '0 24px 50px -16px rgba(0,0,0,0.8)' }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: GREEN, boxShadow: '0 0 16px -2px rgba(16,185,129,0.8)' }}>
          <QrCode size={18} style={{ color: '#04110C' }} strokeWidth={2} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO, color: MUTED }}>Validación QR</p>
          <p className="text-[13px] font-semibold leading-tight mt-0.5 flex items-center gap-1.5"><BadgeCheck size={14} style={{ color: GREEN_BRIGHT }} /> Certificado válido</p>
        </div>
      </div>

      {/* Card flotante: certificado */}
      <div className="floaty-2 absolute -bottom-6 -left-3 sm:-left-6 rounded-xl px-4 py-3 flex items-center gap-3 max-w-[250px]"
        style={{ background: 'rgba(10,15,13,0.92)', border: `1px solid ${BORDER}`, backdropFilter: 'blur(8px)', boxShadow: '0 24px 50px -16px rgba(0,0,0,0.8)' }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <FileBadge size={18} style={{ color: GREEN_BRIGHT }} strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO, color: MUTED }}>Certificado</p>
          <p className="text-[13px] font-semibold leading-tight mt-0.5">María Gonzáles Ríos</p>
          <p className="text-[11px]" style={{ color: MUTED }}>Especialización · 120 h</p>
        </div>
      </div>

      {/* Card flotante: reporte mensual */}
      <div className="floaty-3 absolute bottom-8 -right-2 sm:-right-8 rounded-xl px-4 py-3"
        style={{ background: 'rgba(10,15,13,0.92)', border: `1px solid ${BORDER}`, backdropFilter: 'blur(8px)', boxShadow: '0 24px 50px -16px rgba(0,0,0,0.8)' }}>
        <p className="text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO, color: MUTED }}>Reporte mensual</p>
        <div className="flex items-end gap-2 mt-1">
          <p style={{ fontFamily: DISPLAY }} className="text-[26px] font-bold leading-none">124</p>
          <span className="text-[11px] font-semibold mb-0.5" style={{ color: GREEN_BRIGHT }}>+12%</span>
        </div>
        <p className="text-[10.5px] mb-2" style={{ color: MUTED }}>Certificados emitidos</p>
        <div className="flex items-end gap-1 h-8">
          {[40, 55, 45, 70, 60, 85, 100].map((h, i) => (
            <span key={i} className="bar w-2 rounded-sm" style={{ height: `${h}%`, background: i === 6 ? GREEN_BRIGHT : 'rgba(16,185,129,0.4)', animationDelay: `${0.3 + i * 0.08}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Visual "por qué elegir Vaxa": eficiencia + checklist ─────── */
function EficienciaVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[480px]">
      {/* Foto real (o degradado de respaldo) */}
      <div className="rounded-2xl overflow-hidden relative" style={{ border: `1px solid ${BORDER}`, boxShadow: '0 40px 90px -30px rgba(0,0,0,0.8)' }}>
        <Shot src="/landing-media/porque.jpg" alt="Equipo Vaxa" className="w-full h-80 sm:h-[26rem] object-cover">
          <div className="h-80 sm:h-[26rem] relative" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(7,11,10,0.9))' }}>
            <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.7) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          </div>
        </Shot>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(7,11,10,0.6))' }} />
      </div>

      {/* Card flotante: +40% (sobre la foto, como el mockup) */}
      <div className="floaty absolute -top-5 -right-3 sm:-right-6 rounded-xl px-5 py-4 text-center"
        style={{ background: 'rgba(10,15,13,0.94)', border: '1px solid rgba(16,185,129,0.3)', backdropFilter: 'blur(8px)', boxShadow: '0 24px 50px -16px rgba(0,0,0,0.85)' }}>
        <p className="text-[11.5px]" style={{ color: MUTED }}>Mejora la eficiencia<br />de tu institución</p>
        <p style={{ fontFamily: DISPLAY, background: `linear-gradient(100deg, ${GREEN_BRIGHT}, ${GREEN})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }} className="text-[40px] font-bold leading-none mt-1.5">+40%</p>
        <p className="text-[11px] mt-1" style={{ color: MUTED }}>en gestión administrativa</p>
      </div>

      {/* Card flotante: beneficios */}
      <div className="floaty-2 absolute -bottom-6 -left-3 sm:-left-8 rounded-xl px-5 py-4"
        style={{ background: 'rgba(10,15,13,0.94)', border: `1px solid ${BORDER}`, backdropFilter: 'blur(8px)', boxShadow: '0 24px 50px -16px rgba(0,0,0,0.85)' }}>
        <p className="text-[12px] font-semibold mb-3" style={{ fontFamily: DISPLAY }}>Más tiempo para lo que importa</p>
        <ul className="space-y-2">
          {['Gestión simple', 'Información segura', 'Clientes más satisfechos'].map((t) => (
            <li key={t} className="flex items-center gap-2 text-[12.5px]" style={{ color: MUTED }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.18)' }}><Check size={10} style={{ color: GREEN_BRIGHT }} /></span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── CTA visual: mini dashboard con métricas + gráficos ──────── */
function CtaDashboard() {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, backdropFilter: 'blur(8px)', boxShadow: '0 40px 90px -30px rgba(0,0,0,0.8)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 50% at 85% 0%, rgba(16,185,129,0.14), transparent 70%)' }} />
      <div className="relative">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[{ n: '124', l: 'Certificados del mes', d: '+10%' }, { n: '386', l: 'Validaciones QR', d: '+8%' }, { n: '98%', l: 'Tasa de entrega', d: '+3%' }].map((s) => (
            <div key={s.l} className="rounded-xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
              <p style={{ fontFamily: DISPLAY }} className="text-[20px] font-bold leading-none">{s.n}</p>
              <p className="text-[9.5px] mt-1.5 leading-tight" style={{ color: MUTED }}>{s.l}</p>
              <p className="text-[9.5px] font-semibold" style={{ color: GREEN_BRIGHT }}>{s.d}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[1.5fr_1fr] gap-3">
          <div className="rounded-xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <p className="text-[10px] mb-3" style={{ fontFamily: MONO, color: MUTED }}>Evolución de emisiones</p>
            <div className="flex items-end gap-1.5 h-16">
              {[35, 50, 42, 65, 58, 78, 70, 90].map((h, i) => (
                <span key={i} className="bar flex-1 rounded-sm" style={{ height: `${h}%`, background: i >= 6 ? GREEN_BRIGHT : 'rgba(16,185,129,0.4)', animationDelay: `${0.2 + i * 0.07}s` }} />
              ))}
            </div>
          </div>
          <div className="rounded-xl px-3 py-3 flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
            <p className="text-[10px] mb-2 self-start" style={{ fontFamily: MONO, color: MUTED }}>Por programa</p>
            <div className="w-16 h-16 rounded-full" style={{ background: `conic-gradient(${GREEN_BRIGHT} 0% 45%, ${GREEN} 45% 72%, rgba(16,185,129,0.4) 72% 100%)` }}>
              <div className="w-full h-full rounded-full flex items-center justify-center" style={{ transform: 'scale(0.55)', background: BG }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
