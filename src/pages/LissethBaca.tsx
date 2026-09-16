/**
 * ── Marca personal · Lic. Lisseth Baca Nole (Terapia de Lenguaje) ──────────
 *
 * Sitio REAL de una clienta (CTMP 19175). Landing estática, sin API ni login.
 * Se sirve en `lissethbaca.vaxa.com.pe` (modo 'lissethbaca' de lib/host.ts).
 *
 * ESTILO: dark premium / awwwards. Fondo oscuro inmersivo, tipografía gigante
 * (Space Grotesk), acento en DEGRADADO azul→violeta, VISUALIZADOR de onda de
 * voz animado (motivo temático: voz/lenguaje), foco de luz que sigue el cursor,
 * grain, y micro-interacciones (magnético, reveal, count-up). Buscado que
 * impacte y NO parezca plantilla. Autocontenido, clases prefijadas `lb-`.
 *
 * Foto: /public/lisseth.jpg. Iconos: lucide-react.
 */
import { useEffect, useRef, useState, type ReactNode, type CSSProperties, type MouseEvent as ReactMouseEvent, type FormEvent } from 'react';
import {
  Brain, Mic, Ear, Activity, Quote, Star, Clock, MapPin, Mail, MessageCircle,
  ArrowRight, ArrowUpRight, GraduationCap, Award, ShieldCheck, CheckCircle2,
  Plus, Minus, Phone, Menu, X, HeartHandshake, Sparkles,
} from 'lucide-react';

// ── Paleta (dark premium) ───────────────────────────────────────────────────
const C = {
  bg: '#FFFFFF', bg2: '#F4F8FB', card: '#FFFFFF', ink: '#0B2540', soft: '#4E6479',
  line: 'rgba(11,37,64,.12)', a1: '#0C4A8E', a2: '#2EAEDF',
};
const GRAD = `linear-gradient(95deg,${C.a1},${C.a2})`;
const HEAD = "'Space Grotesk', system-ui, sans-serif";
const BODY = "'Inter', system-ui, sans-serif";

// ── Datos reales (editables) ────────────────────────────────────────────────
const MARCA = {
  nombre: 'Lisseth Baca Nole',
  corto: 'Lisseth',
  rol: 'Tecnóloga Médica en Terapia de Lenguaje · CTMP 19175',
  foto: '/liss.png',
  fotoCut: '/liss-cut.png',
  whatsapp: '51966134878',

  // email: 'lissethbaca2@gmail.com',
  ciudad: 'Lima, Perú',
};

const SERVICIOS = [
  { Icon: Brain, t: 'Terapia de lenguaje y habla', d: 'Evaluación e intervención de retrasos y trastornos del lenguaje, habla y comunicación, en niños y adultos.' },
  { Icon: Activity, t: 'Motricidad orofacial y deglución', d: 'Reeducación con terapia miofuncional y electroestimulación (Método ENMD).' },
  { Icon: Mic, t: 'Rehabilitación de la voz', d: 'Cuidado y recuperación vocal con técnicas y electroterapia especializada.' },
  { Icon: Ear, t: 'Audición y tinnitus', d: 'Valoración y acompañamiento en audición y manejo del tinnitus.' },
];

const PROCESO = [
  { t: 'Primer contacto', d: 'Me escribes por WhatsApp y coordinamos una conversación breve, sin costo, para conocer tu caso.' },
  { t: 'Evaluación', d: 'Valoración fonoaudiológica para definir objetivos claros y realistas.' },
  { t: 'Intervención', d: 'Sesiones personalizadas con técnicas y equipos especializados, a tu ritmo.' },
  { t: 'Seguimiento', d: 'Medimos avances en cada sesión y te acompaño hasta consolidar los logros.' },
];

const FORMACION = [
  { anio: '2025', t: 'Certificación internacional · Uso de Equipos en Fonoaudiología', sub: 'Lenguaje, habla, voz y motricidad orofacial' },
  { anio: '2025', t: 'Segunda Especialidad · Reeducación de la Motricidad Orofacial', sub: 'Universidad Nacional Federico Villarreal' },
  { anio: '2024', t: 'Certificación Prostim Chile · Método ENMD y electroestimulación', sub: 'Deglución y motricidad orofacial' },
  { anio: '2017 – 2019', t: 'Maestría en Docencia Universitaria', sub: 'Universidad Norbert Wiener' },
  { anio: '2010 – 2014', t: 'Tecnología Médica · Terapia de Lenguaje', sub: 'Universidad Nacional Federico Villarreal' },
];

const EXPERIENCIA = [
  { anio: 'Actualidad', t: 'Hospital Nacional E. Rebagliati Martins', sub: 'Atención clínica intrahospitalaria' },
  { anio: 'Actualidad', t: 'Representante SIEFO Perú', sub: 'Sociedad de especialistas en fonoaudiología' },
  { anio: 'Actualidad', t: 'Docente invitada · UPCH', sub: 'Terapia de audición, voz y lenguaje' },
  { anio: '2021 – 2023', t: 'Jefa de práctica · UPCH', sub: 'Terapia de audición, voz y lenguaje' },
  { anio: '2021 – 2023', t: 'San Juan de Dios · Tinnitus Perú', sub: 'Atención ambulatoria y hospitalaria' },
  { anio: '2014', t: 'Internado · Hospital E. Rebagliati Martins', sub: 'Formación clínica hospitalaria' },
];

// ⚠️ Testimonios de RELLENO (editables) — reemplazar por los reales de la clienta.
const TESTIMONIOS = [
  { txt: 'Mi hijo empezó a hablar con más claridad en pocos meses. Es muy paciente y sabe conectar con los niños desde el primer día.', a: 'Rosa M.', m: 'Terapia de lenguaje infantil', ini: 'RM' },
  { txt: 'Después de mi operación recuperé la voz gracias a su terapia. Profesional, cálida y muy preparada.', a: 'Carlos T.', m: 'Rehabilitación de la voz', ini: 'CT' },
  { txt: 'El trabajo de motricidad orofacial mejoró muchísimo la deglución de mi mamá. La recomiendo totalmente.', a: 'Andrea P.', m: 'Motricidad orofacial', ini: 'AP' },
];

const MARQUEE = ['Terapia de lenguaje', 'Voz', 'Deglución', 'Motricidad orofacial', 'Audición', 'Tinnitus', 'Método ENMD', 'Niños & adultos'];

const FAQ = [
  { q: '¿Atiende a niños y adultos?', a: 'Sí. Trabajo terapia de lenguaje, voz, deglución y motricidad orofacial tanto en población infantil como en adultos.' },
  { q: '¿Qué es la motricidad orofacial?', a: 'Es la terapia de las funciones de la boca y la cara (respirar, masticar, tragar, hablar). Uso técnicas miofuncionales y electroestimulación (Método ENMD) para reeducarlas.' },
  { q: '¿Las sesiones son presenciales o a domicilio?', a: 'Atiendo de forma presencial y también a domicilio dentro de Lima, según la necesidad de cada paciente.' },
  { q: '¿Trabaja con equipos y tecnología?', a: 'Sí. Cuento con certificación internacional en uso de equipos en fonoaudiología (electroestimulación, entre otros) para potenciar los resultados.' },
  { q: '¿Cómo es la primera cita?', a: 'La primera sesión es una evaluación: conocemos el caso, definimos objetivos y armamos un plan de intervención claro.' },
];

// ── Página ───────────────────────────────────────────────────────────────────
export default function LissethBaca() {
  const wa = `https://wa.me/${MARCA.whatsapp}?text=${encodeURIComponent('Hola Lisseth, quisiera agendar una cita 🙂')}`;
  const barRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState(false);
  const LINKS = [
    { href: '#servicios', t: 'Servicios' },
    { href: '#proceso', t: 'Proceso' },
    { href: '#sobre-mi', t: 'Sobre mí' },
    { href: '#trayectoria', t: 'Trayectoria' },
    { href: '#contacto', t: 'Contacto' },
  ];

  // Progreso de scroll + nav sólido al bajar.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const p = doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight);
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
        if (navRef.current) navRef.current.classList.toggle('lb-nav-solid', window.scrollY > 40);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div style={{ fontFamily: BODY, color: C.ink, background: C.bg, minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{LB_CSS}</style>
      <Spotlight />
      <div ref={barRef} className="lb-progress" />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="lb-nav" ref={navRef}>
        <nav className="lb-wrap lb-nav-in">
          <a href="#top" className="lb-logo">
            <img src="/logo liss vaxa.png" alt="Lisseth Baca Nole" className="lb-mono lb-mono-img" />
            <span className="lb-logo-txt">
              <b>· {MARCA.nombre}</b>
            </span>
          </a>
          <div className="lb-nav-links">
            {LINKS.map((l) => <a key={l.href} href={l.href} className="lb-navlink">{l.t}</a>)}
            <a href={wa} target="_blank" rel="noreferrer" className="lb-btn lb-btn-primary lb-btn-sm">
              Agendar <ArrowUpRight size={15} />
            </a>
          </div>
          <button className="lb-burger" onClick={() => setMenu(true)} aria-label="Abrir menú"><Menu size={26} /></button>
        </nav>
      </header>

      {menu && (
        <div className="lb-drawer" onClick={() => setMenu(false)}>
          <div className="lb-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <button className="lb-drawer-close" onClick={() => setMenu(false)} aria-label="Cerrar menú"><X size={24} /></button>
            <span className="lb-drawer-title">{MARCA.nombre}</span>
            {LINKS.map((l) => <a key={l.href} href={l.href} onClick={() => setMenu(false)}>{l.t}</a>)}
            <a href={wa} target="_blank" rel="noreferrer" onClick={() => setMenu(false)} className="lb-btn lb-btn-primary lb-btn-lg">
              Agendar cita <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      )}

      {/* ── Hero inmersivo ───────────────────────────────────────────────── */}
<section id="top" className="lb-hero">
  <span className="lb-hero-glow" aria-hidden />
  <span className="lb-vertlabel" aria-hidden>TERAPIA DE LENGUAJE — FONOAUDIOLOGÍA</span>
  <div className="lb-wrap lb-hero-in">
    <span className="lb-tag lb-fade"><span className="lb-dot" /> Agenda abierta · Lima, Perú</span>
    <h1 className="lb-hero-h1 lb-fade" style={{ animationDelay: '.08s' }}>
      Recupera tu voz y tu <span className="lb-grad">comunicación</span>
    </h1>

    <div className="lb-hero-row">
      <div className="lb-hero-side lb-side-l">
        <div className="lb-card lb-fade" style={{ animationDelay: '.42s' }}>
          <span className="lb-card-ic"><ShieldCheck size={18} /></span>
          <div><b>CTMP 19175</b><span>Colegiada habilitada</span></div>
        </div>
       <div className="lb-card lb-fade" style={{ animationDelay: '.5s' }}>
          <span className="lb-card-ic"><Award size={18} /></span>
          <div><b>SIEFO Perú</b><span>Miembro activo</span></div>
        </div>
      </div>

      <div className="lb-hero-figure lb-fade" style={{ animationDelay: '.2s' }}>
        <span className="lb-figure-glow" aria-hidden />
        <Wave />
        <img src={MARCA.fotoCut} alt={MARCA.nombre} />
      </div>

      <div className="lb-hero-side lb-side-r">
        <div className="lb-card lb-fade" style={{ animationDelay: '.5s' }}>
          <span className="lb-card-ic"><Sparkles size={18} /></span>
          <div><b>+10 años</b><span>De experiencia clínica</span></div>
        </div>
        <div className="lb-card lb-fade" style={{ animationDelay: '.58s' }}>
          <span className="lb-card-ic"><HeartHandshake size={18} /></span>
          <div><b>Niños y adultos</b><span>Presencial y a domicilio</span></div>
        </div>
      </div>
    </div>

    <div className="lb-hero-cta lb-fade" style={{ animationDelay: '.34s' }}>
      <Magnetic href={wa} className="lb-btn lb-btn-primary lb-btn-lg">
        <MessageCircle size={18} /> Reservar una cita
      </Magnetic>
      <a href="#servicios" className="lb-btn lb-btn-ghost lb-btn-lg">Ver servicios <ArrowRight size={17} /></a>
        </div>
      </div>
    </section>

      {/* ── Marquee ──────────────────────────────────────────────────────── */}
      <div className="lb-marquee">
        <div className="lb-marquee-track">
          {[0, 1].map((rep) => (
            <div className="lb-marquee-group" key={rep} aria-hidden={rep === 1}>
              {MARQUEE.map((m, i) => <span key={i} className="lb-mq">{m}<i /></span>)}
            </div>
          ))}
        </div>
      </div>

      {/* ── Servicios ────────────────────────────────────────────────────── */}
      <section id="servicios" className="lb-wrap lb-section">
        <Head n="01" eyebrow="Servicios" titulo="En qué puedo ayudarte" />
        <div className="lb-serv-grid">
          {SERVICIOS.map((s, i) => (
            <Reveal key={s.t} delay={i * 70}>
              <article className="lb-serv">
                <span className="lb-serv-n">0{i + 1}</span>
                <span className="lb-serv-ic"><s.Icon size={24} strokeWidth={1.7} /></span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <a href={wa} target="_blank" rel="noreferrer" className="lb-serv-go" aria-label="Consultar"><ArrowUpRight size={18} /></a>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Sobre mí ─────────────────────────────────────────────────────── */}
      <section id="sobre-mi" className="lb-about-sec">
        <div className="lb-wrap lb-section lb-about">
          <Reveal>
            <div className="lb-about-media">
              <span className="lb-about-ring" />
              <img src={MARCA.foto} alt={MARCA.nombre} />
              <div className="lb-about-badge"><ShieldCheck size={18} /> <div><b>Colegiada CTMP</b><span>19175 · habilitada</span></div></div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="lb-about-copy">
              <span className="lb-tag"><HeartHandshake size={14} /> Sobre mí</span>
              <h2 className="lb-h2">Detrás de cada sesión, <span className="lb-grad">años de preparación</span></h2>
              <p>Soy Tecnóloga Médica en Terapia de Lenguaje de la Universidad Nacional Federico Villarreal y egresada de la Maestría en Docencia Universitaria de la Universidad Norbert Wiener. Actualmente curso la segunda especialidad en Reeducación de la Motricidad Orofacial.</p>
              <p>Cuento con certificación nacional e internacional en Uso de Equipos en Fonoaudiología y realizo actividades formativas para estudiantes de pregrado y posgrado.</p>
              <div className="lb-chips">
                {['Terapia de lenguaje', 'Motricidad orofacial', 'Voz y deglución', 'Docente universitaria', 'Ponente internacional'].map((c) => (
                  <span key={c} className="lb-pill"><CheckCircle2 size={13} /> {c}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Proceso ──────────────────────────────────────────────────────── */}
      <section id="proceso" className="lb-wrap lb-section">
        <Head n="02" eyebrow="Cómo trabajo" titulo="Tu proceso, paso a paso" />
        <div className="lb-steps">
          {PROCESO.map((p, i) => (
            <Reveal key={p.t} delay={i * 80}>
              <div className="lb-step">
                <span className="lb-step-n">0{i + 1}</span>
                <h4>{p.t}</h4>
                <p>{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Trayectoria ──────────────────────────────────────────────────── */}
      <section id="trayectoria" className="lb-wrap lb-section">
        <Head n="03" eyebrow="Trayectoria" titulo="Formación & experiencia" />
        <div className="lb-ledger">
          <Reveal>
            <div>
              <h3 className="lb-ledger-h"><GraduationCap size={18} /> Formación</h3>
              {FORMACION.map((f) => (
                <div key={f.t} className="lb-lrow">
                  <span className="lb-lyear">{f.anio}</span>
                  <div><b>{f.t}</b><span>{f.sub}</span></div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div>
              <h3 className="lb-ledger-h"><Award size={18} /> Experiencia</h3>
              {EXPERIENCIA.map((e) => (
                <div key={e.t} className="lb-lrow">
                  <span className="lb-lyear">{e.anio}</span>
                  <div><b>{e.t}</b><span>{e.sub}</span></div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Testimonios ──────────────────────────────────────────────────── */}
      <Testimonios />

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="lb-wrap lb-section">
        <Head n="04" eyebrow="Preguntas frecuentes" titulo="Antes de empezar" />
        <div className="lb-faq">
          {FAQ.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ── Contacto ─────────────────────────────────────────────────────── */}
      <section id="contacto" className="lb-wrap lb-section">
        <div className="lb-contact">
          <Reveal>
            <div className="lb-contact-intro">
              <span className="lb-tag"><Sparkles size={14} /> Contacto</span>
              <h2 className="lb-h2">Agenda tu <span className="lb-grad">primera cita</span></h2>
              <p>Déjame tus datos y te escribo en menos de 24 horas. Sin compromiso.</p>
              <Magnetic href={wa} className="lb-btn lb-btn-primary lb-btn-lg" style={{ marginTop: 6 }}>
                <MessageCircle size={18} /> Escribir por WhatsApp
              </Magnetic>
              <div className="lb-contact-info">

               
                <Info Icon={MapPin} value={`${MARCA.ciudad} · Presencial y a domicilio`} />
                <Info Icon={Clock} value="Lun a Sáb · 9am – 7pm" />
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <ContactForm wa={wa} />
          </Reveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="lb-footer">
        <div className="lb-wrap lb-footer-in">
          <div className="lb-logo">
            
            <span className="lb-logo-txt"> <b> {MARCA.nombre}</b> <small>  · {MARCA.rol}</small></span>
          </div>
          <div className="lb-social">
            <a href={`tel:+${MARCA.whatsapp}`} aria-label="Llamar"><Phone size={18} /></a>
            <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={18} /></a>
            <a href={`mailto:${MARCA.email}`} aria-label="Correo"><Mail size={18} /></a>
          </div>
        </div>
        <div className="lb-wrap lb-footer-legal">
          <span>© {new Date().getFullYear()} {MARCA.nombre}</span>
          <span>Sitio creado por <a href="https://www.vaxa.com.pe" target="_blank" rel="noreferrer" className="lb-vaxa-link">Vaxa</a></span>        </div>
      </footer>
    </div>
  );
}

// ── Subcomponentes ──────────────────────────────────────────────────────────
/** Foco de luz que sigue el cursor (solo desktop). */
function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    let raf = 0;
    const move = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (ref.current) ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      });
    };
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className="lb-spot" aria-hidden />;
}

/** Visualizador de onda de voz (barras animadas). Motivo temático de la marca. */
function Wave() {
  const N = 40;
  return (
    <div className="lb-wave" aria-hidden>
      {Array.from({ length: N }).map((_, i) => {
        const h = 22 + Math.abs(Math.sin(i * 0.6) * 0.7 + Math.cos(i * 0.27) * 0.3) * 78;
        return <span key={i} style={{ height: `${h}%`, animationDelay: `${(i % 10) * 0.09}s`, background: i % 2 ? C.a2 : C.a1 }} />;
      })}
    </div>
  );
}

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('lb-in'); io.disconnect(); }
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className="lb-reveal" style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function Stat({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now(), dur = 1500;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = `${prefix}${Math.round(to * eased)}${suffix}`;
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, prefix, suffix]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

function Magnetic({ href, className, style, children }: { href: string; className?: string; style?: CSSProperties; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia('(hover: none)').matches) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
    };
    const leave = () => { el.style.transform = ''; };
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); };
  }, []);
  const target = href.startsWith('http') ? '_blank' : undefined;
  return <a ref={ref} href={href} target={target} rel={target ? 'noreferrer' : undefined} className={`lb-magnetic ${className ?? ''}`} style={style}>{children}</a>;
}

function Head({ n, eyebrow, titulo }: { n: string; eyebrow: string; titulo: string }) {
  return (
    <Reveal>
      <div className="lb-head">
        <span className="lb-head-n">{n}</span>
        <div>
          <span className="lb-tag"><span className="lb-dot" /> {eyebrow}</span>
          <h2 className="lb-h2">{titulo}</h2>
        </div>
      </div>
    </Reveal>
  );
}

function Info({ Icon, value }: { Icon: typeof MapPin; value: string }) {
  return <div className="lb-info"><span className="lb-info-ic"><Icon size={16} /></span> <b>{value}</b></div>;
}

/** Testimonio destacado rotativo (auto + clic). */
function Testimonios() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setI((v) => (v + 1) % TESTIMONIOS.length), 5500);
    return () => clearInterval(id);
  }, [paused]);
  const t = TESTIMONIOS[i];
  return (
    <section className="lb-testi-sec" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="lb-wrap lb-section">
        <Reveal>
          <div className="lb-testi">
            <div className="lb-testi-head">
              <Quote className="lb-testi-q" size={40} />
              <div className="lb-stars">{Array.from({ length: 5 }).map((_, k) => <Star key={k} size={16} fill={C.a1} strokeWidth={0} />)}</div>
            </div>
            <blockquote key={i} className="lb-testi-txt">{t.txt}</blockquote>
            <div className="lb-testi-foot">
              <div className="lb-testi-who"><span className="lb-testi-av">{t.ini}</span><div><b>{t.a}</b><span>{t.m}</span></div></div>
              <div className="lb-testi-dots">
                {TESTIMONIOS.map((tt, k) => (
                  <button key={tt.a} onClick={() => setI(k)} className={`lb-testi-dot ${k === i ? 'lb-on' : ''}`} aria-label={tt.a} />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ContactForm({ wa }: { wa: string }) {
  const [enviado, setEnviado] = useState(false);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const msg = `Hola Lisseth, soy ${f.get('nombre')}.%0A` +
      `Motivo: ${f.get('motivo')}%0A` +
      `Tel: ${f.get('telefono')} · Correo: ${f.get('correo')}%0A%0A` +
      `${f.get('mensaje')}`;
    const base = wa.split('?')[0];
    window.open(`${base}?text=${msg}`, '_blank');
    setEnviado(true);
  };
  return (
    <form className="lb-form" onSubmit={onSubmit}>
      <div className="lb-form-row">
        <label className="lb-field"><span>Nombre completo</span><input name="nombre" required placeholder="Tu nombre" /></label>
        <label className="lb-field"><span>Teléfono</span><input name="telefono" type="tel" required placeholder="+51 ..." /></label>
      </div>
      <div className="lb-form-row">
        <label className="lb-field"><span>Correo</span><input name="correo" type="email" required placeholder="tu@correo.com" /></label>
        <label className="lb-field">
          <span>Motivo de consulta</span>
          <select name="motivo" defaultValue="Terapia de lenguaje (niños)">
            <option>Terapia de lenguaje (niños)</option>
            <option>Terapia de lenguaje (adultos)</option>
            <option>Motricidad orofacial / deglución</option>
            <option>Rehabilitación de la voz</option>
            <option>Audición / tinnitus</option>
            <option>Otro</option>
          </select>
        </label>
      </div>
      <label className="lb-field"><span>Cuéntame un poco (opcional)</span><textarea name="mensaje" rows={4} placeholder="¿En qué te puedo ayudar?" /></label>
      <button type="submit" className="lb-btn lb-btn-primary lb-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
        {enviado ? <><CheckCircle2 size={18} /> ¡Listo! Continúa en WhatsApp</> : <><MessageCircle size={18} /> Enviar y agendar</>}
      </button>
      <p className="lb-form-note"><ShieldCheck size={13} /> Tus datos son confidenciales. No se comparten con terceros.</p>
    </form>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`lb-faq-item ${open ? 'lb-open' : ''}`}>
      <button onClick={() => setOpen((v) => !v)}>
        <span>{q}</span>
        {open ? <Minus size={19} className="lb-faq-ic" /> : <Plus size={19} className="lb-faq-ic" />}
      </button>
      <div className="lb-faq-a" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div><p>{a}</p></div>
      </div>
    </div>
  );
}

const LB_CSS = `
.lb-wrap{max-width:1180px;margin:0 auto;padding-left:26px;padding-right:26px}
.lb-section{padding-top:100px;padding-bottom:100px}
.lb-h2{font-family:${HEAD};font-size:clamp(30px,4vw,50px);font-weight:700;letter-spacing:-.03em;line-height:1.08;margin:16px 0 0;color:${C.ink}}
.lb-grad{background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent}

.lb-progress{position:fixed;top:0;left:0;right:0;height:3px;background:${GRAD};transform:scaleX(0);transform-origin:0 50%;z-index:80;will-change:transform}
.lb-spot{position:fixed;top:0;left:0;width:520px;height:520px;margin:-260px 0 0 -260px;border-radius:50%;background:radial-gradient(circle,rgba(12,74,142,.08),rgba(46,174,223,.05) 40%,transparent 68%);pointer-events:none;z-index:1;will-change:transform}
.lb-magnetic{transition:transform .3s cubic-bezier(.22,1,.36,1)}

/* Tag */
.lb-tag{display:inline-flex;align-items:center;gap:8px;background:rgba(11,37,64,.05);border:1px solid ${C.line};color:${C.ink};border-radius:999px;padding:7px 14px;font-size:13px;font-weight:500;letter-spacing:.01em}
.lb-dot{width:7px;height:7px;border-radius:50%;background:${C.a1};box-shadow:0 0 0 4px rgba(12,74,142,.18),0 0 12px ${C.a1};animation:lbPulse 2s ease-in-out infinite}
@keyframes lbPulse{0%,100%{box-shadow:0 0 0 4px rgba(12,74,142,.18),0 0 12px ${C.a1}}50%{box-shadow:0 0 0 8px rgba(12,74,142,.04),0 0 6px ${C.a1}}}

/* Nav */
.lb-nav{position:fixed;top:0;left:0;right:0;z-index:60;transition:background .4s,border-color .4s,backdrop-filter .4s;border-bottom:1px solid transparent}
.lb-nav.lb-nav-solid{background:rgba(255,255,255,.85);backdrop-filter:blur(16px);border-bottom:1px solid ${C.line}}
.lb-nav-in{height:78px;display:flex;align-items:center;justify-content:space-between;gap:24px}
.lb-logo{display:flex;align-items:center;gap:13px;text-decoration:none;color:${C.ink}}
.lb-mono{width:52px;height:52px;flex-shrink:0;border-radius:13px;background:${GRAD};color:#fff;display:grid;place-items:center;font-family:${HEAD};font-weight:700;font-size:17px;box-shadow:0 10px 24px -10px rgba(12,74,142,.4);overflow:hidden}
.lb-logo img.lb-mono{height:44px;width:auto;max-width:150px;flex-shrink:0;border-radius:10px;background:#fff;display:block;object-fit:contain;padding:4px 8px;box-sizing:border-box;box-shadow:0 4px 14px -6px rgba(11,37,64,.25);border:1px solid ${C.line}}
.lb-nav-links{display:flex;align-items:center;gap:30px}
.lb-navlink{color:${C.soft};text-decoration:none;font-size:14.5px;font-weight:500;position:relative;padding:4px 0;transition:color .25s}
.lb-navlink:hover{color:${C.ink}}
.lb-navlink::after{content:'';position:absolute;left:0;bottom:-3px;width:0;height:2px;background:${GRAD};border-radius:2px;transition:width .3s cubic-bezier(.22,1,.36,1)}
.lb-navlink:hover::after{width:100%}
.lb-burger{display:none;background:none;border:none;color:${C.ink};cursor:pointer;padding:4px}

/* Drawer */
.lb-drawer{position:fixed;inset:0;z-index:70;background:rgba(11,37,64,.35);backdrop-filter:blur(6px);animation:lbFade .25s ease}
.lb-drawer-panel{position:absolute;top:0;right:0;bottom:0;width:min(84%,330px);background:${C.bg2};border-left:1px solid ${C.line};padding:76px 26px 28px;display:flex;flex-direction:column;gap:4px;animation:lbDrawer .34s cubic-bezier(.22,1,.36,1)}
@keyframes lbDrawer{from{transform:translateX(100%)}to{transform:none}}
.lb-drawer-title{font-family:${HEAD};font-weight:700;font-size:15px;color:${C.a1};margin-bottom:10px}
.lb-drawer-panel>a:not(.lb-btn){color:${C.ink};text-decoration:none;font-family:${HEAD};font-size:19px;font-weight:600;padding:15px 2px;border-bottom:1px solid ${C.line}}
.lb-drawer-panel .lb-btn{justify-content:center;margin-top:20px}
.lb-drawer-close{position:absolute;top:22px;right:20px;background:none;border:none;color:${C.ink};cursor:pointer;padding:4px}

/* Botones */
.lb-btn{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:15px;border-radius:12px;text-decoration:none;transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s,background .25s,border-color .25s,color .25s;cursor:pointer;border:none}
.lb-btn-sm{padding:9px 16px;border-radius:10px;font-size:14px}
.lb-btn-lg{padding:14px 24px}
.lb-btn-primary{background:${GRAD};color:#fff;box-shadow:0 14px 30px -12px rgba(12,74,142,.5)}
.lb-btn-primary:hover{transform:translateY(-2px);box-shadow:0 20px 40px -14px rgba(46,174,223,.55)}
.lb-btn-ghost{background:rgba(11,37,64,.04);color:${C.ink};border:1px solid ${C.line}}
.lb-btn-ghost:hover{background:${C.a1};border-color:${C.a1};color:#fff;transform:translateY(-2px)}

/* Reveal / fade */
.lb-reveal{opacity:0;transform:translateY(26px);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1)}
.lb-reveal.lb-in{opacity:1;transform:none}
@keyframes lbFade{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
.lb-fade{opacity:0;animation:lbFade .9s cubic-bezier(.22,1,.36,1) forwards}

/* Hero centerpiece (foto grande al centro + credenciales a los costados) */
.lb-hero{position:relative;overflow:hidden;min-height:100vh;min-height:100svh;display:flex;align-items:center;padding:112px 0 50px;text-align:center;isolation:isolate}
.lb-hero-glow{position:absolute;top:-14%;left:50%;transform:translateX(-50%);width:1000px;height:800px;max-width:132vw;background:radial-gradient(ellipse at center,rgba(78,123,255,.24),rgba(154,107,255,.1) 44%,transparent 70%);z-index:-1;pointer-events:none}
.lb-hero::after{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.5;background-image:radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px);background-size:26px 26px;-webkit-mask-image:radial-gradient(ellipse at 50% 50%,#000,transparent 76%);mask-image:radial-gradient(ellipse at 50% 50%,#000,transparent 76%)}
.lb-vertlabel{position:absolute;top:50%;left:18px;transform:translateY(-50%) rotate(180deg);writing-mode:vertical-rl;font-size:11px;letter-spacing:.32em;color:${C.soft};opacity:.45;font-weight:500;z-index:4}
.lb-hero-in{position:relative;z-index:2;width:100%;display:flex;flex-direction:column;align-items:center}
.lb-hero-h1{font-family:${HEAD};font-weight:700;font-size:clamp(32px,4.4vw,58px);line-height:1.04;letter-spacing:-.04em;margin:16px 0 0;max-width:16ch}

/* Fila del hero: tarjetas laterales + foto protagonista */
.lb-hero-row{display:flex;align-items:center;justify-content:center;gap:24px;margin-top:30px;width:100%;flex-wrap:wrap}
.lb-hero-side{display:flex;flex-direction:column;gap:14px;width:190px;flex-shrink:0}
.lb-side-l{align-items:flex-end}
.lb-side-r{align-items:flex-start}
.lb-card{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:rgba(255,255,255,.04);border:1px solid ${C.line};border-radius:14px;padding:12px 16px;transition:transform .3s,border-color .3s}
.lb-card:hover{transform:translateY(-3px);border-color:rgba(78,123,255,.4)}
.lb-card-ic{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:rgba(78,123,255,.14);color:${C.a1};flex-shrink:0}
.lb-card b{display:block;font-size:14px;font-weight:600;color:${C.ink};line-height:1.3}
.lb-card span{font-size:12px;color:${C.soft}}

/* Figura protagonista (centro, único foco) — ÚNICA definición, sin duplicados */
.lb-hero-figure{position:relative;z-index:2;width:min(820px,72vw);flex-shrink:0;display:flex;justify-content:center;align-items:flex-end}
.lb-hero-figure img{position:relative;z-index:2;width:100%;height:auto;display:block;filter:drop-shadow(0 30px 50px rgba(0,0,0,.6))}
.lb-figure-glow{position:absolute;z-index:0;left:50%;top:8%;transform:translateX(-50%);width:132%;height:110%;background:radial-gradient(ellipse at 50% 45%,rgba(78,123,255,.32),rgba(154,107,255,.14) 45%,transparent 68%);filter:blur(18px);pointer-events:none}
.lb-wave{position:absolute;z-index:1;left:50%;bottom:0%;transform:translateX(-50%);width:170%;height:62%;display:flex;align-items:center;justify-content:center;gap:8px;pointer-events:none;opacity:.9}
.lb-wave span{width:7px;border-radius:6px;transform:scaleY(.3);transform-origin:center;animation:lbEq 1.2s ease-in-out infinite;box-shadow:0 0 16px currentColor}



/* Hero centerpiece (foto grande al centro + credenciales alrededor) */
.lb-hero{position:relative;overflow:hidden;min-height:100vh;min-height:100svh;display:flex;align-items:center;padding:112px 0 50px;text-align:center;isolation:isolate}
.lb-hero-glow{position:absolute;top:-14%;left:50%;transform:translateX(-50%);width:1000px;height:800px;max-width:132vw;background:radial-gradient(ellipse at center,rgba(78,123,255,.24),rgba(154,107,255,.1) 44%,transparent 70%);z-index:-1;pointer-events:none}
.lb-hero::after{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.5;background-image:radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px);background-size:26px 26px;-webkit-mask-image:radial-gradient(ellipse at 50% 50%,#000,transparent 76%);mask-image:radial-gradient(ellipse at 50% 50%,#000,transparent 76%)}
.lb-vertlabel{position:absolute;top:50%;left:18px;transform:translateY(-50%) rotate(180deg);writing-mode:vertical-rl;font-size:11px;letter-spacing:.32em;color:${C.soft};opacity:.45;font-weight:500;z-index:4}
.lb-hero-in{position:relative;z-index:2;width:100%;display:flex;flex-direction:column;align-items:center}
.lb-hero-h1{font-family:${HEAD};font-weight:700;font-size:clamp(32px,4.4vw,58px);line-height:1.04;letter-spacing:-.04em;margin:16px 0 0;max-width:16ch}

/* Figura protagonista (centro, único foco) */
.lb-hero-figure{position:relative;z-index:2;width:min(430px,60vw);margin:14px auto 0;display:flex;justify-content:center;align-items:flex-end}
.lb-hero-figure img{position:relative;z-index:2;width:100%;display:block;filter:drop-shadow(0 30px 50px rgba(0,0,0,.6))}
.lb-figure-glow{position:absolute;z-index:0;left:50%;top:8%;transform:translateX(-50%);width:132%;height:110%;background:radial-gradient(ellipse at 50% 45%,rgba(78,123,255,.32),rgba(154,107,255,.14) 45%,transparent 68%);filter:blur(18px);pointer-events:none}
.lb-wave{
  width:350%;
  height:75%;
}.lb-wave span{width:5px;border-radius:5px;transform:scaleY(.3);transform-origin:center;animation:lbEq 1.2s ease-in-out infinite;box-shadow:0 0 12px currentColor}
@keyframes lbEq{0%,100%{transform:scaleY(.28)}50%{transform:scaleY(1)}}
.lb-hero-cta{position:relative;z-index:4;display:flex;align-items:center;justify-content:center;gap:16px;margin-top:22px;flex-wrap:wrap}
.lb-hero-badges{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 14px;margin-top:26px}
.lb-hero-badges span{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:500;color:${C.soft};background:rgba(255,255,255,.04);border:1px solid ${C.line};border-radius:999px;padding:8px 14px}
.lb-hero-badges svg{color:${C.a1}}
.lb-hero-mini{display:flex;flex-direction:column;padding-left:16px;border-left:1px solid ${C.line};text-align:left}
.lb-hero-mini b{font-family:${HEAD};font-size:22px;font-weight:700;line-height:1}
.lb-hero-mini span{font-size:12px;color:${C.soft};margin-top:4px}
/* Marquee */
.lb-marquee{border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};overflow:hidden;background:${C.bg2}}
.lb-marquee-track{display:flex;width:max-content;animation:lbMarquee 26s linear infinite}
.lb-marquee-group{display:flex;flex-shrink:0}
.lb-mq{display:inline-flex;align-items:center;font-family:${HEAD};font-weight:600;font-size:clamp(22px,3vw,34px);letter-spacing:-.02em;color:${C.ink};padding:20px 0;white-space:nowrap}
.lb-mq i{display:inline-block;width:9px;height:9px;border-radius:50%;background:${GRAD};margin:0 34px}
@keyframes lbMarquee{to{transform:translateX(-50%)}}

/* Section head */
.lb-head{display:flex;align-items:flex-start;gap:22px;max-width:820px}
.lb-head-n{font-family:${HEAD};font-size:15px;font-weight:700;color:transparent;-webkit-text-stroke:1px ${C.a1};padding-top:6px}

/* Servicios */
.lb-serv-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:52px}
.lb-serv{position:relative;background:${C.card};border:1px solid ${C.line};border-radius:22px;padding:30px;height:100%;overflow:hidden;box-shadow:0 8px 26px -18px rgba(11,37,64,.25);transition:transform .35s cubic-bezier(.22,1,.36,1),border-color .35s,box-shadow .35s}
.lb-serv::before{content:'';position:absolute;inset:0;border-radius:22px;padding:1px;background:${GRAD};-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .35s}
.lb-serv:hover{transform:translateY(-6px);box-shadow:0 20px 40px -18px rgba(11,37,64,.3)}
.lb-serv:hover::before{opacity:1}
.lb-serv-n{position:absolute;top:22px;right:26px;font-family:${HEAD};font-size:44px;font-weight:700;color:transparent;-webkit-text-stroke:1px rgba(11,37,64,.1);line-height:1}
.lb-serv-ic{display:grid;place-items:center;width:54px;height:54px;border-radius:15px;background:rgba(12,74,142,.1);color:${C.a1};transition:transform .35s}
.lb-serv:hover .lb-serv-ic{transform:scale(1.08) rotate(-5deg)}
.lb-serv h3{font-family:${HEAD};font-size:21px;font-weight:600;margin:20px 0 10px;letter-spacing:-.01em;color:${C.ink}}
.lb-serv p{color:${C.soft};line-height:1.62;font-size:14.5px;margin:0;max-width:420px}
.lb-serv-go{position:absolute;bottom:26px;right:26px;width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:rgba(11,37,64,.05);border:1px solid ${C.line};color:${C.ink};transition:background .25s,transform .25s,color .25s}
.lb-serv-go:hover{background:${GRAD};color:#fff;transform:translate(2px,-2px);border-color:transparent}

/* Sobre mí */
.lb-about-sec{background:${C.bg2};border-top:1px solid ${C.line};border-bottom:1px solid ${C.line}}
.lb-about{display:grid;grid-template-columns:.9fr 1.1fr;gap:60px;align-items:center}
.lb-about-media{position:relative;max-width:400px}
.lb-about-ring{position:absolute;inset:-14px;border-radius:28px;background:${GRAD};opacity:.3;filter:blur(24px)}
.lb-about-media img{position:relative;width:100%;height:470px;object-fit:cover;object-position:center 18%;border-radius:24px;display:block;border:1px solid ${C.line}}
.lb-about-badge{position:absolute;z-index:2;bottom:20px;right:-16px;background:rgba(255,255,255,.97);backdrop-filter:blur(10px);color:${C.ink};border:1px solid ${C.line};border-radius:14px;padding:13px 16px;display:flex;align-items:center;gap:11px;box-shadow:0 22px 44px -22px rgba(11,37,64,.35)}
.lb-about-badge svg{color:${C.a1}}
.lb-about-badge b{display:block;font-size:14px}
.lb-about-badge span{font-size:12.5px;color:${C.soft}}
.lb-about-copy .lb-h2{margin-top:16px}
.lb-about-copy p{font-size:15.5px;line-height:1.75;color:${C.soft};margin:16px 0 0}
.lb-chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}
.lb-pill{display:inline-flex;align-items:center;gap:7px;background:rgba(11,37,64,.04);border:1px solid ${C.line};border-radius:999px;padding:8px 14px;font-size:13px;font-weight:500;color:${C.ink}}
.lb-pill svg{color:${C.a1}}

/* Proceso */
.lb-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:56px}
.lb-step{background:${C.card};border:1px solid ${C.line};border-radius:20px;padding:26px;height:100%;box-shadow:0 8px 26px -18px rgba(11,37,64,.22);transition:transform .35s,border-color .35s,box-shadow .35s}
.lb-step:hover{transform:translateY(-6px);border-color:rgba(12,74,142,.4);box-shadow:0 18px 36px -18px rgba(11,37,64,.28)}
.lb-step-n{font-family:${HEAD};font-size:15px;font-weight:700;background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent}
.lb-step h4{font-family:${HEAD};font-size:18px;font-weight:600;margin:14px 0 8px;color:${C.ink}}
.lb-step p{color:${C.soft};font-size:14px;line-height:1.58;margin:0}

/* Trayectoria */
.lb-ledger{display:grid;grid-template-columns:1fr 1fr;gap:52px;margin-top:52px}
.lb-ledger-h{font-family:${HEAD};font-size:19px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0 0 10px;padding-bottom:14px;border-bottom:1px solid ${C.line};color:${C.ink}}
.lb-ledger-h svg{color:${C.a1}}
.lb-lrow{display:grid;grid-template-columns:104px 1fr;gap:18px;align-items:start;padding:17px 6px;border-bottom:1px solid ${C.line};transition:background .3s,padding-left .3s;border-radius:8px}
.lb-lrow:hover{background:rgba(11,37,64,.035);padding-left:12px}
.lb-lyear{font-family:${HEAD};font-size:14px;font-weight:700;color:${C.a1};line-height:1.35;white-space:nowrap}
.lb-lrow b{font-family:${HEAD};font-size:15.5px;font-weight:600;display:block;line-height:1.35;color:${C.ink}}
.lb-lrow span{font-size:13.5px;color:${C.soft};display:block;margin-top:4px}

/* Testimonios */
.lb-testi-sec{background:${C.bg2};border-top:1px solid ${C.line};border-bottom:1px solid ${C.line}}
.lb-testi{max-width:880px;margin:0 auto}
.lb-testi-head{display:flex;align-items:center;justify-content:space-between}
.lb-testi-q{color:${C.a1}}
.lb-stars{display:flex;gap:3px}
.lb-testi-txt{font-family:${HEAD};font-size:clamp(22px,3vw,34px);line-height:1.36;font-weight:500;color:${C.ink};margin:22px 0 0;border:none;padding:0;letter-spacing:-.015em;animation:lbFade .6s ease}
.lb-testi-foot{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:34px;flex-wrap:wrap}
.lb-testi-who{display:flex;align-items:center;gap:14px}
.lb-testi-av{width:50px;height:50px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;background:${GRAD};color:#fff;font-family:${HEAD};font-weight:700;font-size:16px}
.lb-testi-who b{color:${C.ink};font-size:15px;display:block}
.lb-testi-who span{color:${C.soft};font-size:13.5px}
.lb-testi-dots{display:flex;gap:9px}
.lb-testi-dot{width:32px;height:5px;border-radius:3px;border:none;background:rgba(11,37,64,.15);cursor:pointer;transition:background .25s,width .25s}
.lb-testi-dot.lb-on{background:${GRAD};width:44px}

/* FAQ */
.lb-faq{max-width:820px;margin:52px auto 0;display:flex;flex-direction:column;gap:12px}
.lb-faq-item{background:${C.card};border:1px solid ${C.line};border-radius:16px;overflow:hidden;box-shadow:0 6px 20px -16px rgba(11,37,64,.2);transition:border-color .3s}
.lb-faq-item.lb-open{border-color:rgba(12,74,142,.5)}
.lb-faq-item button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px;background:none;border:none;cursor:pointer;font-family:${HEAD};font-size:17px;font-weight:600;color:${C.ink};text-align:left}
.lb-faq-ic{color:${C.a1};flex-shrink:0}
.lb-faq-a{display:grid;transition:grid-template-rows .38s cubic-bezier(.22,1,.36,1)}
.lb-faq-a>div{overflow:hidden}
.lb-faq-a p{margin:0;padding:0 22px 22px;color:${C.soft};font-size:15px;line-height:1.65}

/* Contacto */
.lb-contact{display:grid;grid-template-columns:1fr 1.05fr;gap:26px;align-items:stretch}
.lb-contact-intro{position:relative;overflow:hidden;background:${C.card};border:1px solid ${C.line};border-radius:26px;padding:38px;height:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:14px;box-shadow:0 8px 26px -18px rgba(11,37,64,.22)}
.lb-contact-intro::before{content:'';position:absolute;top:-120px;right:-120px;width:320px;height:320px;border-radius:50%;background:${GRAD};opacity:.14;filter:blur(50px)}
.lb-contact-intro .lb-h2{margin:6px 0 0}
.lb-contact-intro>p{font-size:16px;line-height:1.6;color:${C.soft};margin:0;max-width:380px}
.lb-contact-info{position:relative;z-index:1;margin-top:auto;padding-top:12px;display:flex;flex-direction:column;gap:2px}
.lb-info{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid ${C.line};font-size:15px}
.lb-info-ic{width:34px;height:34px;border-radius:10px;background:rgba(12,74,142,.1);color:${C.a1};display:grid;place-items:center;flex-shrink:0}
.lb-info b{font-weight:500;color:${C.ink}}
.lb-form{background:${C.card};border:1px solid ${C.line};color:${C.ink};border-radius:26px;padding:32px;display:flex;flex-direction:column;gap:16px;box-shadow:0 8px 26px -18px rgba(11,37,64,.22)}
.lb-form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.lb-field{display:flex;flex-direction:column;gap:7px}
.lb-field span{font-size:13px;font-weight:600;color:${C.ink}}
.lb-field input,.lb-field select,.lb-field textarea{font-family:${BODY};font-size:15px;color:${C.ink};background:${C.bg2};border:1px solid ${C.line};border-radius:12px;padding:12px 14px;outline:none;transition:border-color .25s,box-shadow .25s;width:100%;box-sizing:border-box}
.lb-field input::placeholder,.lb-field textarea::placeholder{color:${C.soft}}
.lb-field input:focus,.lb-field select:focus,.lb-field textarea:focus{border-color:${C.a1};box-shadow:0 0 0 4px rgba(12,74,142,.12)}
.lb-field select{color:${C.ink}}
.lb-field textarea{resize:vertical;min-height:96px}
.lb-form-note{display:flex;align-items:center;gap:7px;font-size:12.5px;color:${C.soft};margin:2px 0 0}
.lb-form-note svg{color:${C.a1}}

/* Footer (oscuro, a propósito, para contraste con el resto de la web clara) */
.lb-footer{background:${C.ink};border-top:1px solid rgba(255,255,255,.1)}
.lb-footer-in{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;padding-top:46px;padding-bottom:28px}
.lb-footer .lb-logo-txt b{color:#fff}
.lb-footer .lb-logo-txt small{color:rgba(255,255,255,.6)}
.lb-social{display:flex;gap:10px}
.lb-social a{width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;display:grid;place-items:center;transition:transform .25s,background .25s}
.lb-social a:hover{transform:translateY(-3px);background:${GRAD};border-color:transparent}
.lb-footer-legal{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;padding-top:18px;padding-bottom:28px;border-top:1px solid rgba(255,255,255,.12);font-size:12.5px;color:rgba(255,255,255,.55)}
.lb-vaxa-link{color:rgba(255,255,255,.7);text-decoration:underline;text-underline-offset:2px;transition:color .25s}
.lb-vaxa-link:hover{color:${C.a2}}

/* Responsive */
@media(max-width:960px){
  .lb-nav-links{display:none}
  .lb-burger{display:inline-flex}
  .lb-vertlabel{display:none}
  .lb-hero-row{flex-direction:column;gap:24px}
  .lb-hero-side{flex-direction:row;flex-wrap:wrap;justify-content:center;width:100%;max-width:420px}
  .lb-card{flex:1 1 160px}
  .lb-hero-figure{width:min(340px,74vw)}
  .lb-serv-grid{grid-template-columns:1fr}
  .lb-steps{grid-template-columns:1fr 1fr;gap:16px}
  .lb-about{grid-template-columns:1fr;gap:44px}
  .lb-about-media{margin:0 auto}
  .lb-ledger{grid-template-columns:1fr;gap:44px}
  .lb-contact{grid-template-columns:1fr;gap:20px}
}
@media(max-width:600px){
  .lb-wrap{padding-left:18px;padding-right:18px}
  .lb-section{padding-top:72px;padding-bottom:72px}
  .lb-hero{padding-top:118px}
  .lb-logo-txt small{display:none}
  .lb-hero-figure{width:min(280px,74vw)}
  .lb-hero-cta{flex-direction:column;align-items:stretch;width:100%;max-width:340px}
  .lb-hero-cta .lb-btn{justify-content:center}
  .lb-steps{grid-template-columns:1fr;max-width:340px;margin-left:auto;margin-right:auto}
  .lb-form,.lb-contact-intro{padding:24px}
  .lb-form-row{grid-template-columns:1fr}
  .lb-serv{padding:24px}
  .lb-head{gap:14px}
}

@media(prefers-reduced-motion:reduce){
  *,.lb-fade,.lb-reveal{animation:none!important;transition:none!important}
  .lb-reveal{opacity:1!important;transform:none!important}
  .lb-wave span{transform:scaleY(.6)!important}
}
`;
