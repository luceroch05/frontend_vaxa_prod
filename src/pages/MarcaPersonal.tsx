/**
 * ── Landing de MARCA PERSONAL (mockup / demo) ──────────────────────────────
 *
 * Página de EJEMPLO del tipo de sitio de marca personal que armamos para un
 * profesional de salud. Se sirve en `mimarca.vaxasys.com` (modo 'marca' de
 * lib/host.ts). 100% estática: contenido de muestra, sin API ni login.
 *
 * Todo va en un solo archivo. Layout con estilos inline; animaciones, :hover y
 * keyframes en el <style> del bloque MP_CSS (con clases prefijadas `mp-`). Los
 * iconos son de lucide-react (línea, no emojis). Para volverlo data-driven se
 * reemplazan las constantes de contenido por una llamada a /public/...
 */
import { useEffect, useRef, useState, type ReactNode, type CSSProperties, type MouseEvent as ReactMouseEvent, type FormEvent } from 'react';
import {
  Brain, HeartHandshake, Users, Compass, Sparkles, Leaf, Quote, Star,
  Calendar, Clock, MapPin, Mail, MessageCircle, ArrowRight, ArrowUpRight,
  GraduationCap, Award, BookOpen, ShieldCheck, CheckCircle2, Stethoscope,
  Feather, ChevronDown, Instagram, Linkedin, Facebook, Phone, Menu, X,
} from 'lucide-react';

// ── Paleta ───────────────────────────────────────────────────────────────
const C = {
  bg: '#FAF8F4', ink: '#17322D', soft: '#57685F', teal: '#2A9D8F',
  tealDark: '#14433C', gold: '#C9962C', sand: '#EFE9DE',
  line: 'rgba(23,50,45,.10)', card: '#FFFFFF',
};
const HEAD = "'Space Grotesk', system-ui, sans-serif";
const BODY = "'Inter', system-ui, sans-serif";

// ── Contenido de ejemplo (editable) ────────────────────────────────────────
const MARCA = {
  nombre: 'Dra. Valentina Ríos',
  corto: 'Valentina',
  rol: 'Psicóloga Clínica · CPsP 24518',
  tagline: 'Acompaño procesos de ansiedad, duelo y crecimiento personal con una terapia cálida y basada en evidencia.',
  // Foto del HERO (a pantalla completa). El sujeto se corre a la derecha por CSS
  // (object-position) para que el título de la izquierda NO le tape la cara.
  // Foto del hero full-bleed: terapeuta en sesión (ella a la derecha, cliente
  // desenfocada a la izq donde va el texto). ¿Cambiarla? Solo esta URL:
  //   1559839734-2b71ea197ec2     → doctora bata blanca, fondo árbol
  //   1594824476967-48c8b964273f  → doctora uniforme turquesa, fondo blanco
  foto: 'https://images.unsplash.com/photo-1714976694756-28bf07af3758?q=80&w=1600&auto=format&fit=crop',
  foto2: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800&auto=format&fit=crop',
  whatsapp: '51987654321',
  email: 'hola@valentinarios.pe',
  ciudad: 'Lima, Perú · Presencial y online',
};

const SERVICIOS = [
  { Icon: Brain, t: 'Terapia individual', d: 'Sesiones 1 a 1 para ansiedad, estrés, autoestima y hábitos. Enfoque cognitivo-conductual.', meta: '50 min · presencial u online' },
  { Icon: HeartHandshake, t: 'Acompañamiento en duelo', d: 'Un espacio seguro para elaborar pérdidas a tu ritmo, con herramientas concretas.', meta: 'Programa de 8 sesiones' },
  { Icon: Users, t: 'Terapia de pareja', d: 'Mejora la comunicación, resuelve conflictos y reconecta desde un lugar más sano.', meta: '60 min · presencial' },
  { Icon: Compass, t: 'Orientación vocacional', d: 'Claridad sobre tu propósito, fortalezas y siguiente paso, en jóvenes y adultos.', meta: 'Evaluación + 3 sesiones' },
];

const PROCESO = [
  { Icon: MessageCircle, t: 'Primer contacto', d: 'Me escribes y coordinamos una llamada breve, sin costo, para conocernos.' },
  { Icon: Feather, t: 'Sesión de valoración', d: 'Exploramos tu situación y definimos objetivos claros y realistas juntos.' },
  { Icon: Leaf, t: 'Proceso terapéutico', d: 'Sesiones semanales con herramientas prácticas que aplicas en tu día a día.' },
  { Icon: Sparkles, t: 'Cierre y seguimiento', d: 'Consolidamos avances y te acompaño en el sostenimiento del cambio.' },
];

const FORMACION = [
  { anio: '2016', t: 'Maestría en Psicología Clínica', sub: 'Pontificia Universidad Católica del Perú', Icon: GraduationCap },
  { anio: '2018', t: 'Certificación en Terapia Cognitivo-Conductual', sub: 'Beck Institute (online)', Icon: Award },
  { anio: '2020', t: 'Especialización en Duelo y Pérdida', sub: 'Asociación Peruana de Tanatología', Icon: BookOpen },
  { anio: '2023', t: 'Formación en Mindfulness aplicado a terapia', sub: 'Nirakara Institute', Icon: Leaf },
];

const EXPERIENCIA = [
  { anio: '2016 – 2019', t: 'Psicóloga en Clínica San Felipe', d: 'Atención en el área de salud mental y programas de manejo de ansiedad.' },
  { anio: '2019 – 2022', t: 'Coordinadora del programa de bienestar', d: 'Diseño de talleres de duelo y acompañamiento a colaboradores en empresa.' },
  { anio: '2022 – hoy', t: 'Práctica privada', d: 'Consulta propia, presencial y online, con más de 600 pacientes acompañados.' },
];

const TESTIMONIOS = [
  { txt: 'Llegué con crisis de ansiedad constantes. En pocos meses recuperé el control de mi vida. Te hace sentir en confianza desde el primer minuto.', a: 'María F.', m: 'Terapia individual', f: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop' },
  { txt: 'El acompañamiento en duelo me salvó. Nunca sentí que me apuraban. Hoy puedo hablar de mi papá con paz.', a: 'Jorge M.', m: 'Programa de duelo', f: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop' },
  { txt: 'Fuimos como pareja al borde de separarnos. Aprendimos a escucharnos de verdad. Profesional, empática y muy clara.', a: 'Lucía & Andrés', m: 'Terapia de pareja', f: 'https://images.unsplash.com/photo-1520295187453-cd239786490c?q=80&w=200&auto=format&fit=crop' },
];

const MARQUEE = [
  { Icon: ShieldCheck, t: 'Colegiada · CPsP 24518' },
  { Icon: Stethoscope, t: 'Online y presencial' },
  { Icon: Award, t: 'Basado en evidencia' },
  { Icon: Brain, t: 'Terapia cognitivo-conductual' },
  { Icon: Leaf, t: 'Mindfulness aplicado' },
  { Icon: HeartHandshake, t: 'Especialista en duelo' },
  { Icon: Users, t: 'Terapia de pareja' },
  { Icon: Sparkles, t: 'Primera llamada sin costo' },
];

const FAQ = [
  { q: '¿Cómo son las sesiones online?', a: 'Por videollamada segura, con la misma calidez que en consultorio. Solo necesitas un lugar tranquilo y conexión estable.' },
  { q: '¿Cuánto dura un proceso terapéutico?', a: 'Depende de cada persona y objetivo. Algunos procesos son breves (8–12 sesiones) y otros más largos. Lo revisamos juntos.' },
  { q: '¿La información es confidencial?', a: 'Absolutamente. Todo lo que compartes está protegido por el secreto profesional y la Ley de Protección de Datos.' },
  { q: '¿Atiendes a adolescentes?', a: 'Sí, atiendo desde los 15 años. Para menores coordino un primer encuentro con los padres o apoderados.' },
];

// ── Página ─────────────────────────────────────────────────────────────────
export default function MarcaPersonal() {
  const wa = `https://wa.me/${MARCA.whatsapp}?text=${encodeURIComponent('Hola, quisiera agendar una cita 🙂')}`;
  const barRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState(false);
  const LINKS = [
    { href: '#servicios', t: 'Servicios' },
    { href: '#proceso', t: 'Cómo trabajo' },
    { href: '#sobre-mi', t: 'Sobre mí' },
    { href: '#testimonios', t: 'Testimonios' },
    { href: '#contacto', t: 'Contacto' },
  ];

  // Barra de progreso de scroll + nav transparente→sólido + parallax (Webflow).
  useEffect(() => {
    const bgs = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const p = doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight);
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
        if (navRef.current) navRef.current.classList.toggle('mp-nav-solid', window.scrollY > 60);
        const y = window.scrollY;
        bgs.forEach((el) => {
          const sp = parseFloat(el.dataset.parallax || '0');
          el.style.transform = `translate3d(0, ${y * sp}px, 0)`;
        });
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div style={{ fontFamily: BODY, color: C.ink, background: C.bg, minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{MP_CSS}</style>
      <div ref={barRef} className="mp-progress" />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="mp-nav" ref={navRef}>
        <nav className="mp-wrap" style={{ height: 74, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="#top" className="mp-logo">
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: C.tealDark, color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Stethoscope size={19} strokeWidth={2} />
            </span>
            {MARCA.nombre}
          </a>
          <div className="mp-nav-links">
            {LINKS.map((l) => <a key={l.href} href={l.href} className="mp-navlink">{l.t}</a>)}
            <a href={wa} target="_blank" rel="noreferrer" className="mp-btn mp-btn-primary" style={{ padding: '10px 20px' }}>
              Agendar cita <ArrowUpRight size={16} />
            </a>
          </div>
          <button className="mp-burger" onClick={() => setMenu(true)} aria-label="Abrir menú"><Menu size={26} /></button>
        </nav>
      </header>

      {/* ── Menú móvil (drawer) ──────────────────────────────────────────── */}
      {menu && (
        <div className="mp-drawer" onClick={() => setMenu(false)}>
          <div className="mp-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <button className="mp-drawer-close" onClick={() => setMenu(false)} aria-label="Cerrar menú"><X size={24} /></button>
            <span className="mp-drawer-title">{MARCA.nombre}</span>
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenu(false)}>{l.t}</a>
            ))}
            <a href={wa} target="_blank" rel="noreferrer" onClick={() => setMenu(false)} className="mp-btn mp-btn-primary mp-btn-lg">
              Agendar cita <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      )}

      {/* ── Hero full-bleed inmersivo ────────────────────────────────────── */}
      <section id="top" className="mp-hero2">
        <div className="mp-hero2-bg">
          <img src={MARCA.foto} alt={MARCA.nombre} className="mp-hero2-img" />
          <div className="mp-hero2-scrim" />
          <div className="mp-hero2-grain" />
        </div>

        <div className="mp-wrap mp-hero2-inner">
          <span className="mp-pill mp-pill-glass mp-fade" style={{ animationDelay: '.05s' }}>
            <span className="mp-dot" /> Psicóloga clínica · Lima, Perú
          </span>
          <h1 className="mp-hero2-h1 mp-fade" style={{ animationDelay: '.16s' }}>
            Tu bienestar mental,<br /><em>un paso a la vez.</em>
          </h1>
          <p className="mp-hero2-lead mp-fade" style={{ animationDelay: '.26s' }}>{MARCA.tagline}</p>
          <div className="mp-hero2-cta mp-fade" style={{ animationDelay: '.34s' }}>
            <Magnetic href={wa} className="mp-btn mp-btn-primary mp-btn-lg">
              <MessageCircle size={18} /> Reservar una sesión
            </Magnetic>
            <a href="#servicios" className="mp-btn mp-btn-glass mp-btn-lg">Ver servicios <ArrowRight size={17} /></a>
          </div>
          <div className="mp-hero2-glass mp-fade" style={{ animationDelay: '.44s' }}>
            <Stat to={8} prefix="+" l="años de experiencia" light />
            <span className="mp-hero2-div" />
            <Stat to={600} prefix="+" l="pacientes acompañados" light />
            <span className="mp-hero2-div" />
            <Stat to={4.9} decimals={1} suffix="/5" l="valoración" light />
          </div>
        </div>

        <a href="#servicios" className="mp-scrollcue" aria-label="Desplázate">
          <span>Scroll</span><ChevronDown size={18} />
        </a>
      </section>

      {/* ── Marquee de credenciales (loop infinito) ──────────────────────── */}
      <div className="mp-marquee">
        <div className="mp-marquee-track">
          {[0, 1].map((rep) => (
            <div className="mp-marquee-group" key={rep} aria-hidden={rep === 1}>
              {MARQUEE.map((m, i) => (
                <span key={i} className="mp-mq-item"><m.Icon size={16} /> {m.t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Servicios ────────────────────────────────────────────────────── */}
      <section id="servicios" className="mp-wrap mp-section">
        <Head eyebrow="Servicios" titulo="Cómo puedo acompañarte" sub="Cada proceso es distinto. Elegimos juntos el enfoque que mejor se ajusta a tu momento." />
        <div className="mp-grid-4">
          {SERVICIOS.map((s, i) => (
            <Reveal key={s.t} delay={i * 80}>
              <Tilt className="mp-card mp-serv">
                <span className="mp-serv-ic"><s.Icon size={24} strokeWidth={1.8} /></span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <div className="mp-serv-meta"><Clock size={14} /> {s.meta}</div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Metodología / proceso ────────────────────────────────────────── */}
      <section id="proceso" style={{ background: C.sand }}>
        <div className="mp-wrap mp-section">
          <Head eyebrow="Cómo trabajo" titulo="Un camino claro, sin sorpresas" sub="Saber qué esperar da tranquilidad. Así es el proceso, paso a paso." />
          <div className="mp-steps">
            {PROCESO.map((p, i) => (
              <Reveal key={p.t} delay={i * 100}>
                <div className="mp-step">
                  <span className="mp-step-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="mp-step-ic"><p.Icon size={22} strokeWidth={1.8} /></span>
                  <h4>{p.t}</h4>
                  <p>{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sobre mí ─────────────────────────────────────────────────────── */}
      <section id="sobre-mi" className="mp-about">
        <div className="mp-wrap mp-about-grid">
          <Reveal>
            <div className="mp-about-media">
              <img src={MARCA.foto2} alt={MARCA.nombre} />
              <div className="mp-about-badge"><Verified /> <div><b>Colegiada CPsP</b><span>24518 · habilitada</span></div></div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div>
              <span className="mp-pill mp-pill-dark"><HeartHandshake size={14} /> Sobre mí</span>
              <h2 className="mp-h2" style={{ color: '#fff', marginTop: 16 }}>Hola, soy {MARCA.corto}</h2>
              <p className="mp-about-p">Psicóloga clínica con más de 8 años acompañando a personas que atraviesan ansiedad, duelos y momentos de cambio. Creo en una terapia sin juicios, donde te sientas escuchada de verdad.</p>
              <p className="mp-about-p">Mi enfoque combina la terapia cognitivo-conductual con herramientas de mindfulness, siempre adaptadas a lo que tú necesitas.</p>
              <div className="mp-chips">
                {['Cognitivo-conductual', 'Mindfulness', 'Especialista en duelo', 'Adolescentes y adultos'].map((c) => (
                  <span key={c} className="mp-chip"><CheckCircle2 size={14} /> {c}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Formación & Experiencia ──────────────────────────────────────── */}
      <section className="mp-wrap mp-section">
        <Head eyebrow="Trayectoria" titulo="Formación y experiencia" sub="Años de preparación al servicio de tu proceso." />
        <div className="mp-two">
          {/* Formación (timeline) */}
          <Reveal>
            <div>
              <h3 className="mp-col-title"><GraduationCap size={20} /> Formación</h3>
              <div className="mp-timeline">
                {FORMACION.map((f) => (
                  <div key={f.t} className="mp-tl-item">
                    <span className="mp-tl-dot"><f.Icon size={15} /></span>
                    <div>
                      <span className="mp-tl-year">{f.anio}</span>
                      <h4>{f.t}</h4>
                      <p>{f.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          {/* Experiencia */}
          <Reveal delay={120}>
            <div>
              <h3 className="mp-col-title"><Award size={20} /> Experiencia</h3>
              <div className="mp-exp">
                {EXPERIENCIA.map((e) => (
                  <div key={e.t} className="mp-exp-item">
                    <span className="mp-exp-year">{e.anio}</span>
                    <h4>{e.t}</h4>
                    <p>{e.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Testimonios ──────────────────────────────────────────────────── */}
      <section id="testimonios" style={{ background: C.sand }}>
        <div className="mp-wrap mp-section">
          <Head eyebrow="Testimonios" titulo="Historias de quienes dieron el paso" sub="Resultados reales de personas que confiaron en el proceso." />
          <div className="mp-grid-3">
            {TESTIMONIOS.map((t, i) => (
              <Reveal key={t.a} delay={i * 90}>
                <figure className="mp-card mp-testi">
                  <Quote size={30} className="mp-quote" />
                  <div className="mp-stars">{Array.from({ length: 5 }).map((_, k) => <Star key={k} size={15} fill={C.gold} strokeWidth={0} />)}</div>
                  <blockquote>{t.txt}</blockquote>
                  <figcaption>
                    <img src={t.f} alt={t.a} />
                    <div><b>{t.a}</b><span>{t.m}</span></div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="mp-wrap mp-section">
        <Head eyebrow="Preguntas frecuentes" titulo="Antes de empezar" sub="Las dudas más comunes, resueltas." />
        <div className="mp-faq">
          {FAQ.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ── Contacto: formulario + datos ─────────────────────────────────── */}
      <section id="contacto" className="mp-wrap mp-section">
        <Head eyebrow="Contacto" titulo="Agenda tu primera sesión" sub="Déjame tus datos y te escribo en menos de 24 horas. Sin compromiso." />
        <div className="mp-contact">
          <Reveal>
            <ContactForm wa={wa} />
          </Reveal>
          <Reveal delay={120}>
            <aside className="mp-contact-side">
              <div className="mp-cta-glow" />
              <h3>¿Prefieres directo?</h3>
              <p>Escríbeme por WhatsApp y te respondo personalmente.</p>
              <Magnetic href={wa} className="mp-btn mp-btn-lg" style={{ background: '#fff', color: C.tealDark, marginTop: 4 }}>
                <MessageCircle size={18} /> Escribir por WhatsApp
              </Magnetic>
              <div className="mp-contact-info">
                <Info Icon={MapPin} label="Consultorio" value={MARCA.ciudad} />
                <Info Icon={Mail} label="Correo" value={MARCA.email} />
                <Info Icon={Clock} label="Horario" value="Lun a Sáb · 9am – 7pm" last />
              </div>
            </aside>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="mp-footer">
        <div className="mp-wrap mp-footer-row">
          <span style={{ fontWeight: 700, color: C.ink, fontFamily: HEAD, fontSize: 16 }}>{MARCA.nombre}</span>
          <div className="mp-social">
            <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
            <a href={`https://wa.me/${MARCA.whatsapp}`} aria-label="WhatsApp"><Phone size={18} /></a>
          </div>
          <span style={{ fontSize: 12, color: C.soft, opacity: .8 }}>Sitio de ejemplo creado con Vaxa</span>
        </div>
      </footer>
    </div>
  );
}

// ── Subcomponentes ──────────────────────────────────────────────────────────
/** Aparición al hacer scroll (IntersectionObserver). */
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('mp-in'); io.disconnect(); }
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className="mp-reveal" style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

/** Número que cuenta desde 0 cuando entra en pantalla (estilo Webflow). */
function Stat({ to, l, prefix = '', suffix = '', decimals = 0, light = false }: { to: number; l: string; prefix?: string; suffix?: string; decimals?: number; light?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now(), dur = 1600;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = `${prefix}${(to * eased).toFixed(decimals)}${suffix}`;
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, prefix, suffix, decimals]);
  return <div className={`mp-stat${light ? ' mp-stat-light' : ''}`}><b ref={ref}>{prefix}0{suffix}</b><span>{l}</span></div>;
}

/** Botón que "sigue" al cursor (efecto magnético). */
function Magnetic({ href, className, style, children }: { href: string; className?: string; style?: CSSProperties; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia('(hover: none)').matches) return; // no en touch
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px, ${(e.clientY - r.top - r.height / 2) * 0.45}px)`;
    };
    const leave = () => { el.style.transform = ''; };
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); };
  }, []);
  const target = href.startsWith('http') ? '_blank' : undefined;
  return <a ref={ref} href={href} target={target} rel={target ? 'noreferrer' : undefined} className={`mp-magnetic ${className ?? ''}`} style={style}>{children}</a>;
}

/** Card con inclinación 3D según la posición del cursor. */
function Tilt({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: ReactMouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateX(${-py * 6}deg) rotateY(${px * 6}deg) translateY(-6px)`;
  };
  const leave = () => { if (ref.current) ref.current.style.transform = ''; };
  return <div ref={ref} className={className} onMouseMove={move} onMouseLeave={leave}>{children}</div>;
}

function Head({ eyebrow, titulo, sub }: { eyebrow: string; titulo: string; sub: string }) {
  return (
    <Reveal>
      <div className="mp-head">
        <span className="mp-eyebrow">{eyebrow}</span>
        <h2 className="mp-h2">{titulo}</h2>
        <p>{sub}</p>
      </div>
    </Reveal>
  );
}

function Verified() {
  return <span className="mp-badge-ic"><ShieldCheck size={20} /></span>;
}

function Info({ Icon, label, value, last }: { Icon: typeof MapPin; label: string; value: string; last?: boolean }) {
  return (
    <div className="mp-info" style={{ borderBottom: last ? 'none' : '1px solid rgba(255,255,255,.14)' }}>
      <Icon size={18} />
      <div><span>{label}</span><b>{value}</b></div>
    </div>
  );
}

/** Formulario de contacto. Al enviar arma un mensaje de WhatsApp con los datos
 *  (mockup sin backend). Si mañana hay API, se cambia el onSubmit por un fetch. */
function ContactForm({ wa }: { wa: string }) {
  const [enviado, setEnviado] = useState(false);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const msg = `Hola, soy ${f.get('nombre')}.%0A` +
      `Motivo: ${f.get('motivo')}%0A` +
      `Tel: ${f.get('telefono')} · Correo: ${f.get('correo')}%0A%0A` +
      `${f.get('mensaje')}`;
    const base = wa.split('?')[0];
    window.open(`${base}?text=${msg}`, '_blank');
    setEnviado(true);
  };
  return (
    <form className="mp-form" onSubmit={onSubmit}>
      <div className="mp-form-row">
        <label className="mp-field">
          <span>Nombre completo</span>
          <input name="nombre" required placeholder="Tu nombre" />
        </label>
        <label className="mp-field">
          <span>Teléfono</span>
          <input name="telefono" type="tel" required placeholder="+51 ..." />
        </label>
      </div>
      <div className="mp-form-row">
        <label className="mp-field">
          <span>Correo</span>
          <input name="correo" type="email" required placeholder="tu@correo.com" />
        </label>
        <label className="mp-field">
          <span>Motivo de consulta</span>
          <select name="motivo" defaultValue="Terapia individual">
            <option>Terapia individual</option>
            <option>Acompañamiento en duelo</option>
            <option>Terapia de pareja</option>
            <option>Orientación vocacional</option>
            <option>Otro</option>
          </select>
        </label>
      </div>
      <label className="mp-field">
        <span>Cuéntame un poco (opcional)</span>
        <textarea name="mensaje" rows={4} placeholder="¿En qué te puedo ayudar?" />
      </label>
      <button type="submit" className="mp-btn mp-btn-primary mp-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
        {enviado ? <><CheckCircle2 size={18} /> ¡Mensaje listo! Continúa en WhatsApp</> : <><MessageCircle size={18} /> Enviar y agendar</>}
      </button>
      <p className="mp-form-note"><ShieldCheck size={13} /> Tus datos son confidenciales. No se comparten con terceros.</p>
    </form>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`mp-faq-item ${open ? 'mp-open' : ''}`}>
      <button onClick={() => setOpen((v) => !v)}>
        <span>{q}</span>
        <ChevronDown size={20} className="mp-faq-chev" />
      </button>
      <div className="mp-faq-a" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div><p>{a}</p></div>
      </div>
    </div>
  );
}

// ── CSS (animaciones, :hover, keyframes, responsive) ────────────────────────
const MP_CSS = `
.mp-wrap{max-width:1140px;margin:0 auto;padding-left:24px;padding-right:24px}
.mp-section{padding-top:88px;padding-bottom:88px}

/* Barra de progreso de scroll */
.mp-progress{position:fixed;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${C.teal},${C.gold});transform:scaleX(0);transform-origin:0 50%;z-index:60;will-change:transform}

/* Magnetic + tilt */
.mp-magnetic{transition:transform .3s cubic-bezier(.22,1,.36,1)}
.mp-serv{transition:transform .18s ease-out,box-shadow .3s;will-change:transform}

/* Marquee */
.mp-marquee{border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};background:rgba(42,157,143,.04);overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.mp-marquee-track{display:flex;width:max-content;animation:mpMarquee 32s linear infinite}
.mp-marquee:hover .mp-marquee-track{animation-play-state:paused}
.mp-marquee-group{display:flex;flex-shrink:0}
.mp-mq-item{display:inline-flex;align-items:center;gap:9px;padding:16px 30px;color:${C.soft};font-size:14px;font-weight:600;white-space:nowrap}
.mp-mq-item svg{color:${C.teal}}
@keyframes mpMarquee{to{transform:translateX(-50%)}}

/* Nav (transparente sobre el hero → sólido al hacer scroll) */
.mp-nav{position:fixed;top:0;left:0;right:0;z-index:50;background:transparent;border-bottom:1px solid transparent;transition:background .4s,border-color .4s,backdrop-filter .4s}
.mp-nav.mp-nav-solid{background:rgba(250,248,244,.85);backdrop-filter:blur(14px);border-bottom:1px solid ${C.line}}
.mp-logo{display:flex;align-items:center;gap:11px;font-weight:700;font-size:17px;font-family:${HEAD};text-decoration:none;color:#fff;transition:color .4s}
.mp-nav-solid .mp-logo{color:${C.ink}}
.mp-nav-links{display:flex;align-items:center;gap:26px}
.mp-burger{display:none;background:none;border:none;color:#fff;cursor:pointer;padding:4px;transition:color .4s}
.mp-nav-solid .mp-burger{color:${C.ink}}
/* Drawer (menú móvil) */
.mp-drawer{position:fixed;inset:0;z-index:70;background:rgba(9,30,27,.55);backdrop-filter:blur(4px);animation:mpFade .25s ease}
.mp-drawer-panel{position:absolute;top:0;right:0;bottom:0;width:min(84%,330px);background:${C.bg};padding:76px 26px 28px;display:flex;flex-direction:column;gap:4px;box-shadow:-24px 0 60px -20px rgba(0,0,0,.45);animation:mpDrawer .34s cubic-bezier(.22,1,.36,1)}
@keyframes mpDrawer{from{transform:translateX(100%)}to{transform:none}}
.mp-drawer-title{font-family:${HEAD};font-weight:700;font-size:15px;color:${C.teal};margin-bottom:10px}
.mp-drawer-panel>a:not(.mp-btn){color:${C.ink};text-decoration:none;font-family:${HEAD};font-size:18px;font-weight:600;padding:15px 2px;border-bottom:1px solid ${C.line}}
.mp-drawer-panel>a:not(.mp-btn):active{color:${C.teal}}
.mp-drawer-panel .mp-btn{justify-content:center;margin-top:20px}
.mp-drawer-close{position:absolute;top:22px;right:20px;background:none;border:none;color:${C.ink};cursor:pointer;padding:4px}
.mp-navlink{color:rgba(255,255,255,.92);text-decoration:none;font-size:14px;font-weight:500;position:relative;padding:4px 0;transition:color .4s}
.mp-nav-solid .mp-navlink{color:${C.ink}}
.mp-navlink::after{content:'';position:absolute;left:0;bottom:-2px;width:0;height:2px;background:${C.teal};transition:width .3s cubic-bezier(.22,1,.36,1)}
.mp-navlink:hover::after{width:100%}
/* CTA del nav: glass sobre el hero, teal cuando el nav es sólido */
.mp-nav .mp-btn-primary{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.32);box-shadow:none;backdrop-filter:blur(8px)}
.mp-nav.mp-nav-solid .mp-btn-primary{background:${C.tealDark};border-color:transparent;box-shadow:0 10px 24px -12px rgba(20,67,60,.7)}

/* Hero full-bleed inmersivo */
.mp-hero2{position:relative;min-height:100vh;display:flex;align-items:flex-end;overflow:hidden;color:#fff}
.mp-hero2-bg{position:absolute;inset:-8% 0;z-index:0;will-change:transform}
.mp-hero2-img{width:100%;height:100%;object-fit:cover;object-position:center 30%;animation:mpKen 22s ease-in-out infinite alternate}
@keyframes mpKen{from{transform:scale(1.02)}to{transform:scale(1.1)}}
.mp-hero2-scrim{position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,30,27,.92) 0%,rgba(11,36,32,.6) 34%,rgba(11,36,32,.12) 62%,transparent 80%),linear-gradient(180deg,rgba(11,36,32,.35) 0%,transparent 30%,transparent 55%,rgba(9,30,27,.9) 100%)}
.mp-hero2-grain{position:absolute;inset:0;opacity:.07;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.mp-hero2-inner{position:relative;z-index:2;width:100%;padding-top:110px;padding-bottom:84px}
.mp-dot{width:8px;height:8px;border-radius:50%;background:#7FD8C9;box-shadow:0 0 0 4px rgba(127,216,201,.25);animation:mpPulse 2s ease-in-out infinite}
@keyframes mpPulse{0%,100%{box-shadow:0 0 0 4px rgba(127,216,201,.25)}50%{box-shadow:0 0 0 8px rgba(127,216,201,.08)}}
.mp-pill-glass{background:rgba(255,255,255,.13);color:#fff;border:1px solid rgba(255,255,255,.26);backdrop-filter:blur(8px)}
.mp-hero2-h1{font-family:${HEAD};font-size:clamp(38px,5.6vw,66px);line-height:1.02;font-weight:700;letter-spacing:-.025em;margin:20px 0 0;max-width:15ch;text-shadow:0 2px 30px rgba(0,0,0,.25)}
.mp-hero2-h1 em{font-style:normal;background:linear-gradient(92deg,#8FE0D1,${C.gold});-webkit-background-clip:text;background-clip:text;color:transparent}
.mp-hero2-lead{font-size:clamp(16px,1.7vw,20px);line-height:1.55;max-width:520px;margin:22px 0 0;color:rgba(255,255,255,.9)}
.mp-hero2-cta{display:flex;gap:14px;margin-top:34px;flex-wrap:wrap}
.mp-btn-glass{background:rgba(255,255,255,.13);color:#fff;border:1px solid rgba(255,255,255,.32);backdrop-filter:blur(8px)}
.mp-btn-glass:hover{background:rgba(255,255,255,.22);transform:translateY(-2px)}
.mp-hero2-glass{display:inline-flex;align-items:center;gap:28px;margin-top:42px;padding:22px 32px;background:linear-gradient(135deg,rgba(255,255,255,.18),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.3);border-radius:20px;backdrop-filter:blur(16px);box-shadow:0 24px 55px -24px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.25)}
.mp-hero2-div{width:1px;height:42px;background:linear-gradient(180deg,transparent,rgba(255,255,255,.4),transparent)}
.mp-hero2-glass .mp-stat b{font-size:33px;font-weight:700;background:linear-gradient(92deg,#9DEBDC,#E7B54A);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 1px 6px rgba(0,0,0,.25))}
.mp-hero2-glass .mp-stat span{color:rgba(255,255,255,.85);font-weight:500}
.mp-scrollcue{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:5px;color:rgba(255,255,255,.85);font-size:11px;letter-spacing:.18em;text-transform:uppercase;text-decoration:none}
.mp-scrollcue svg{animation:mpBounce 1.7s ease-in-out infinite}
@keyframes mpBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}
@media(max-width:640px){
  .mp-hero2-glass{gap:16px 20px;padding:16px 20px;flex-wrap:wrap}
  .mp-hero2-div{display:none}
}

/* Botones */
.mp-btn{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:15px;border-radius:999px;text-decoration:none;transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s,background .25s;cursor:pointer;border:none}
.mp-btn-lg{padding:14px 26px}
.mp-btn-primary{background:${C.tealDark};color:#fff;box-shadow:0 10px 24px -12px rgba(20,67,60,.7)}
.mp-btn-primary:hover{transform:translateY(-2px);box-shadow:0 16px 30px -12px rgba(20,67,60,.75)}
.mp-btn-ghost{background:transparent;color:${C.ink};border:1.5px solid ${C.line}}
.mp-btn-ghost:hover{border-color:${C.teal};color:${C.teal};transform:translateY(-2px)}
.mp-btn-outline{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.45)}
.mp-btn-outline:hover{background:rgba(255,255,255,.12);transform:translateY(-2px)}

/* Reveal on scroll */
.mp-reveal{opacity:0;transform:translateY(26px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
.mp-reveal.mp-in{opacity:1;transform:none}

/* Fade de entrada del hero */
@keyframes mpFade{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
.mp-fade{opacity:0;animation:mpFade .8s cubic-bezier(.22,1,.36,1) forwards}

/* Hero */
.mp-hero{display:grid;grid-template-columns:1.08fr .92fr;gap:56px;align-items:center;padding-top:76px;padding-bottom:48px;position:relative;z-index:2}
.mp-hero-copy{position:relative}
.mp-h1{font-family:${HEAD};font-size:54px;line-height:1.06;font-weight:700;letter-spacing:-.025em;margin:20px 0 0}
.mp-underline{position:relative;color:${C.teal};white-space:nowrap}
.mp-underline::after{content:'';position:absolute;left:0;right:0;bottom:4px;height:10px;background:rgba(42,157,143,.18);border-radius:6px;z-index:-1}
.mp-lead{font-size:19px;line-height:1.6;color:${C.soft};margin:22px 0 0;max-width:480px}
.mp-hero-cta{display:flex;gap:14px;margin-top:34px;flex-wrap:wrap}
.mp-hero-stats{display:flex;gap:34px;margin-top:46px}
.mp-stat b{font-family:${HEAD};font-size:28px;font-weight:700;color:${C.tealDark};display:block;line-height:1}
.mp-stat span{font-size:13px;color:${C.soft};margin-top:4px;display:block}

.mp-hero-media{position:relative}
.mp-hero-frame{position:absolute;inset:-16px;background:${C.teal};border-radius:30px;transform:rotate(-3deg);opacity:.13}
.mp-hero-img{position:relative;width:100%;height:500px;object-fit:cover;border-radius:26px;box-shadow:0 40px 70px -34px rgba(20,67,60,.5)}
.mp-float-card{position:absolute;background:#fff;border-radius:16px;padding:13px 16px;box-shadow:0 22px 44px -22px rgba(0,0,0,.28);display:flex;align-items:center;gap:12px;border:1px solid ${C.line}}
.mp-float-card b{font-size:14px;display:block;color:${C.ink}}
.mp-float-card span{font-size:12.5px;color:${C.soft}}
.mp-float-ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;flex-shrink:0}
.mp-float-a{bottom:26px;left:-26px;animation:mpFloat 5s ease-in-out infinite}
.mp-float-b{top:24px;right:-22px;animation:mpFloat 5s ease-in-out infinite .8s}
@keyframes mpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}

/* Blobs */
.mp-blob{position:absolute;border-radius:50%;filter:blur(60px);z-index:1;pointer-events:none}
.mp-blob-a{width:420px;height:420px;background:rgba(42,157,143,.16);top:-120px;right:-80px;animation:mpFloat 9s ease-in-out infinite}
.mp-blob-b{width:340px;height:340px;background:rgba(201,150,44,.12);bottom:-120px;left:-100px;animation:mpFloat 11s ease-in-out infinite 1s}

/* Pills / eyebrow */
.mp-pill{display:inline-flex;align-items:center;gap:7px;background:#EAF6F3;color:${C.tealDark};border-radius:999px;padding:7px 15px;font-size:13px;font-weight:600}
.mp-pill-dark{background:rgba(255,255,255,.12);color:#EAF6F3}
.mp-eyebrow{font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.teal}}

/* Trust */
.mp-trust{border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};background:rgba(42,157,143,.04)}
.mp-trust-row{padding:18px 24px;display:flex;gap:36px;flex-wrap:wrap;justify-content:center;color:${C.soft};font-size:14px;font-weight:500}
.mp-trust-row span{display:inline-flex;align-items:center;gap:8px}
.mp-trust-row svg{color:${C.teal}}

/* Section head */
.mp-head{text-align:center;max-width:660px;margin:0 auto}
.mp-h2{font-family:${HEAD};font-size:38px;font-weight:700;letter-spacing:-.02em;margin:10px 0 0}
.mp-head p{font-size:16px;color:${C.soft};margin:14px 0 0;line-height:1.6}

/* Grids */
.mp-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:48px}
.mp-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:48px}
.mp-card{background:${C.card};border-radius:20px;border:1px solid ${C.line};transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s;height:100%}
.mp-card:hover{transform:translateY(-6px);box-shadow:0 26px 44px -28px rgba(20,67,60,.4)}

/* Servicios */
.mp-serv{padding:26px}
.mp-serv-ic{display:grid;place-items:center;width:52px;height:52px;border-radius:15px;background:linear-gradient(135deg,#EAF6F3,#D8EEE9);color:${C.tealDark};transition:transform .3s}
.mp-serv:hover .mp-serv-ic{transform:scale(1.08) rotate(-4deg)}
.mp-serv h3{font-family:${HEAD};font-size:19px;font-weight:600;margin:16px 0 8px}
.mp-serv p{color:${C.soft};line-height:1.6;font-size:14.5px;margin:0}
.mp-serv-meta{margin-top:16px;padding-top:15px;border-top:1px solid ${C.line};font-size:12.5px;font-weight:600;color:${C.teal};display:flex;align-items:center;gap:6px}

/* Proceso */
.mp-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:48px}
.mp-step{position:relative;padding:8px 4px}
.mp-step-n{font-family:${HEAD};font-size:44px;font-weight:700;color:rgba(42,157,143,.22);line-height:1}
.mp-step-ic{display:grid;place-items:center;width:50px;height:50px;border-radius:14px;background:#fff;color:${C.teal};box-shadow:0 12px 26px -16px rgba(20,67,60,.5);margin:12px 0 14px}
.mp-step h4{font-family:${HEAD};font-size:18px;font-weight:600;margin:0 0 8px}
.mp-step p{color:${C.soft};font-size:14.5px;line-height:1.6;margin:0}

/* Sobre mí */
.mp-about{background:${C.tealDark};color:#EAF6F3}
.mp-about-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:56px;align-items:center;padding-top:90px;padding-bottom:90px}
.mp-about-media{position:relative}
.mp-about-media img{width:100%;height:460px;object-fit:cover;border-radius:24px}
.mp-about-badge{position:absolute;bottom:20px;right:-18px;background:#fff;color:${C.ink};border-radius:16px;padding:13px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 22px 44px -22px rgba(0,0,0,.35)}
.mp-about-badge b{display:block;font-size:14px}
.mp-about-badge span{font-size:12.5px;color:${C.soft}}
.mp-badge-ic{width:40px;height:40px;border-radius:11px;background:#EAF6F3;color:${C.tealDark};display:grid;place-items:center}
.mp-about-p{font-size:17px;line-height:1.7;margin:18px 0 0;color:rgba(234,246,243,.86)}
.mp-chips{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
.mp-chip{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:8px 15px;font-size:13px;font-weight:500}
.mp-chip svg{color:#7FD8C9}

/* Trayectoria */
.mp-two{display:grid;grid-template-columns:1fr 1fr;gap:56px;margin-top:48px}
.mp-col-title{font-family:${HEAD};font-size:20px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0 0 24px}
.mp-col-title svg{color:${C.teal}}
.mp-timeline{position:relative;padding-left:8px}
.mp-tl-item{position:relative;display:flex;gap:18px;padding-bottom:26px}
.mp-tl-item::before{content:'';position:absolute;left:17px;top:36px;bottom:-6px;width:2px;background:${C.line}}
.mp-tl-item:last-child::before{display:none}
.mp-tl-dot{flex-shrink:0;width:36px;height:36px;border-radius:50%;background:#EAF6F3;color:${C.tealDark};display:grid;place-items:center;z-index:1}
.mp-tl-year{font-size:12px;font-weight:700;color:${C.teal};letter-spacing:.05em}
.mp-tl-item h4{font-family:${HEAD};font-size:16px;font-weight:600;margin:3px 0 3px}
.mp-tl-item p{font-size:14px;color:${C.soft};margin:0}
.mp-exp-item{border-left:2px solid ${C.line};padding:0 0 22px 20px;position:relative}
.mp-exp-item::before{content:'';position:absolute;left:-6px;top:4px;width:10px;height:10px;border-radius:50%;background:${C.gold}}
.mp-exp-year{font-size:12px;font-weight:700;color:${C.gold};letter-spacing:.05em}
.mp-exp-item h4{font-family:${HEAD};font-size:17px;font-weight:600;margin:4px 0 5px}
.mp-exp-item p{font-size:14.5px;color:${C.soft};line-height:1.6;margin:0}

/* Testimonios */
.mp-testi{padding:26px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.mp-quote{position:absolute;top:18px;right:18px;color:rgba(42,157,143,.16)}
.mp-stars{display:flex;gap:2px;color:${C.gold};margin-bottom:12px}
.mp-testi blockquote{font-size:15px;line-height:1.65;margin:0 0 20px;color:${C.ink};border:none;padding:0}
.mp-testi figcaption{display:flex;align-items:center;gap:12px;margin-top:auto}
.mp-testi figcaption img{width:44px;height:44px;border-radius:50%;object-fit:cover}
.mp-testi figcaption b{display:block;font-size:14px}
.mp-testi figcaption span{font-size:13px;color:${C.soft}}

/* FAQ */
.mp-faq{max-width:760px;margin:44px auto 0;display:flex;flex-direction:column;gap:12px}
.mp-faq-item{background:#fff;border:1px solid ${C.line};border-radius:16px;overflow:hidden;transition:border-color .3s}
.mp-faq-item.mp-open{border-color:rgba(42,157,143,.4)}
.mp-faq-item button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 22px;background:none;border:none;cursor:pointer;font-family:${HEAD};font-size:16.5px;font-weight:600;color:${C.ink};text-align:left}
.mp-faq-chev{color:${C.teal};transition:transform .35s cubic-bezier(.22,1,.36,1);flex-shrink:0}
.mp-open .mp-faq-chev{transform:rotate(180deg)}
.mp-faq-a{display:grid;transition:grid-template-rows .38s cubic-bezier(.22,1,.36,1)}
.mp-faq-a>div{overflow:hidden}
.mp-faq-a p{margin:0;padding:0 22px 20px;color:${C.soft};font-size:15px;line-height:1.65}

/* Contacto (formulario + panel) */
.mp-contact{display:grid;grid-template-columns:1.35fr .95fr;gap:26px;margin-top:48px;align-items:stretch}
.mp-form{background:#fff;border:1px solid ${C.line};border-radius:24px;padding:30px;display:flex;flex-direction:column;gap:16px;height:100%;box-shadow:0 26px 50px -34px rgba(20,67,60,.35)}
.mp-form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.mp-field{display:flex;flex-direction:column;gap:7px}
.mp-field span{font-size:13px;font-weight:600;color:${C.ink}}
.mp-field input,.mp-field select,.mp-field textarea{font-family:${BODY};font-size:15px;color:${C.ink};background:${C.bg};border:1.5px solid ${C.line};border-radius:12px;padding:12px 14px;outline:none;transition:border-color .25s,box-shadow .25s;width:100%;box-sizing:border-box}
.mp-field input:focus,.mp-field select:focus,.mp-field textarea:focus{border-color:${C.teal};box-shadow:0 0 0 4px rgba(42,157,143,.14)}
.mp-field textarea{resize:vertical;min-height:96px}
.mp-form-note{display:flex;align-items:center;gap:7px;font-size:12.5px;color:${C.soft};margin:2px 0 0}
.mp-form-note svg{color:${C.teal}}
.mp-contact-side{position:relative;overflow:hidden;background:linear-gradient(150deg,${C.teal},${C.tealDark});border-radius:24px;padding:32px;color:#fff;display:flex;flex-direction:column;gap:12px;height:100%;box-sizing:border-box}
.mp-contact-side h3{font-family:${HEAD};font-size:22px;font-weight:700;margin:0}
.mp-contact-side>p{font-size:15px;line-height:1.6;color:rgba(255,255,255,.9);margin:0}
.mp-cta-glow{position:absolute;width:320px;height:320px;border-radius:50%;background:rgba(255,255,255,.14);filter:blur(50px);top:-120px;right:-70px;animation:mpFloat 8s ease-in-out infinite;pointer-events:none}
.mp-contact-info{position:relative;z-index:1;margin-top:auto;padding-top:8px}
.mp-info{display:flex;gap:14px;align-items:center;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.14)}
.mp-info svg{color:#fff;opacity:.85;flex-shrink:0}
.mp-info span{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.6);display:block}
.mp-info b{font-size:15px;display:block;margin-top:2px}
@media(max-width:820px){.mp-contact{grid-template-columns:1fr}.mp-form-row{grid-template-columns:1fr}}

/* Footer */
.mp-footer{border-top:1px solid ${C.line}}
.mp-footer-row{padding:26px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px}
.mp-social{display:flex;gap:10px}
.mp-social a{width:38px;height:38px;border-radius:11px;background:${C.sand};color:${C.tealDark};display:grid;place-items:center;transition:transform .25s,background .25s}
.mp-social a:hover{transform:translateY(-3px);background:${C.teal};color:#fff}

/* Responsive */
@media(max-width:1024px){
  .mp-grid-4{grid-template-columns:repeat(2,1fr)}
  .mp-steps{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:900px){
  .mp-nav-links{display:none}
  .mp-burger{display:inline-flex}
  .mp-section{padding-top:64px;padding-bottom:64px}
  .mp-about-grid{grid-template-columns:1fr;gap:36px}
  .mp-about-media img{height:360px}
  .mp-about-badge{right:8px}
  .mp-two{grid-template-columns:1fr;gap:40px}
  .mp-grid-3{grid-template-columns:1fr;max-width:460px;margin-left:auto;margin-right:auto}
  .mp-h2{font-size:30px}
  .mp-hero2-inner{padding-bottom:64px}
}
@media(max-width:600px){
  .mp-wrap{padding-left:18px;padding-right:18px}
  .mp-logo{font-size:15px;gap:9px}
  .mp-grid-4,.mp-steps{grid-template-columns:1fr;max-width:420px;margin-left:auto;margin-right:auto}
  .mp-hero2-h1{font-size:clamp(31px,8.6vw,42px)}
  .mp-hero2-lead{font-size:15.5px}
  .mp-hero2-cta{flex-direction:column;align-items:stretch}
  .mp-hero2-cta .mp-btn{justify-content:center}
  .mp-hero2-glass{gap:14px 18px;padding:14px 18px;flex-wrap:wrap}
  .mp-hero2-glass .mp-stat b{font-size:26px}
  .mp-hero2-div{display:none}
  .mp-scrollcue{display:none}
  .mp-head p{font-size:15px}
  .mp-cta{padding:36px 22px}
  .mp-form{padding:22px}
  .mp-serv,.mp-testi{padding:22px}
}

/* Respeta a quien prefiere menos movimiento */
@media(prefers-reduced-motion:reduce){
  *,.mp-fade,.mp-reveal{animation:none!important;transition:none!important}
  .mp-reveal{opacity:1!important;transform:none!important}
  .mp-marquee-track,.mp-float-a,.mp-float-b,.mp-blob{animation:none!important}
}
`;
