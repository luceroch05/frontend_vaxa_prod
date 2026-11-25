import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Shield, BadgeCheck, QrCode, FileBadge, ArrowRight, ArrowUpRight, Loader2,
  AlertCircle, Search, Phone, Mail, MessageCircle, Menu, X,
} from '@/components/ui/icon';
import { api, imgUrl, ApiError } from '@/lib/api/client';

/* ── Sistema visual (mismo tech/dark de la landing) ─────────────── */
const BG = '#070B0A';
const SURFACE = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(255,255,255,0.12)';
const GREEN = '#10B981';
const GREEN_BRIGHT = '#34D399';
const TEXT = '#E8EEEB';
const MUTED = '#7E8C87';
const ON_GREEN = '#04110C';
const ERROR = '#FCA5A5';
const DISPLAY = "'Space Grotesk', system-ui, sans-serif";

const WA_VAXA = '51924600490';

/* Mismo menú de la landing. Los anclas apuntan a /#seccion para volver al inicio
   y hacer scroll desde esta subpágina; "Sé Asesor(a)" es la sección activa. */
const NAV = [
  { label: 'Inicio', href: '/#top' },
  { label: 'Productos', href: '/#productos' },
  { label: 'Soluciones', href: '/#soluciones' },
  { label: 'Clientes', href: '/#clientes' },
  { label: 'Nosotros', href: '/#nosotros' },
  { label: 'Sé Asesor(a)', href: '/se-asesora' },
  { label: 'Contacto', href: '/#contacto' },
];

/** Datos públicos de una asesora autorizada (lo que devuelve el backend). */
interface Asesora {
  codigo: string;
  nombre: string;
  dni: string | null;
  cargo: string | null;
  foto_url: string | null;
  zona: string | null;
  autorizada: boolean;       // activa y dentro de vigencia
  vigente_hasta: string | null;
}
interface AsesoraResp { ok: boolean; asesora: Asesora | null }

const limpiarCodigo = (v: string) => v.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);

const fmtFecha = (s: string | null) =>
  s ? new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

export default function SeAsesora() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Asesora | null>(null);
  const [noExiste, setNoExiste] = useState(false);

  const verificar = useCallback(async (code: string) => {
    const c = limpiarCodigo(code);
    if (!c) { setError('Ingresa el código del asesor(a).'); return; }
    setConsultando(true); setError(null); setResultado(null); setNoExiste(false);
    const inicio = Date.now();
    // Deja correr el escaneo al menos un barrido completo, aunque la API responda al instante.
    const esperarScan = async () => {
      const resto = 1400 - (Date.now() - inicio);
      if (resto > 0) await new Promise((r) => setTimeout(r, resto));
    };
    try {
      const r = await api.get<AsesoraResp>(`/public/asesora/${encodeURIComponent(c)}`);
      await esperarScan();
      if (r?.ok && r.asesora) setResultado(r.asesora);
      else setNoExiste(true);
    } catch (e) {
      await esperarScan();
      if (e instanceof ApiError && e.status === 404) setNoExiste(true);
      else setError('No pudimos verificar el código ahora. Inténtalo nuevamente.');
    } finally { setConsultando(false); }
  }, []);

  // Si llega por el QR del fotocheck (…/se-asesora?codigo=ASE-XXXX), valida solo.
  useEffect(() => {
    const c = params.get('codigo') || params.get('c');
    if (c) { setCodigo(limpiarCodigo(c)); verificar(c); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(codigo ? { codigo } : {}, { replace: true });
    verificar(codigo);
  };

  return (
    <div style={{ background: BG, color: TEXT, minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes saRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes saFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes saDrift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(60px,40px) scale(1.15); } }
        @keyframes saDrift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,30px) scale(1.1); } }
        @keyframes saScan { 0% { top: 6%; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { top: 94%; opacity: 0; } }
        @keyframes saShine { to { background-position: 200% center; } }
        .sa-rise { opacity: 0; animation: saRise .7s cubic-bezier(.22,1,.36,1) forwards; }
        .sa-float { animation: saFloat 6s ease-in-out infinite; }
        .sa-blob1 { animation: saDrift1 16s ease-in-out infinite; }
        .sa-blob2 { animation: saDrift2 20s ease-in-out infinite; }
        .sa-scan { animation: saScan 1.4s ease-in-out infinite; }
        .sa-shine { background-size: 200% auto; animation: saShine 4s linear infinite; }
        .sa-card-hover { transition: transform .25s ease, border-color .25s ease, background .25s ease; }
        .sa-card-hover:hover { transform: translateY(-4px); border-color: rgba(16,185,129,0.45); background: rgba(16,185,129,0.06); }
        @media (prefers-reduced-motion: reduce) { .sa-rise, .sa-float, .sa-blob1, .sa-blob2, .sa-scan, .sa-shine { animation: none; opacity: 1; } }
      `}</style>
      {/* Navbar — mismo de la landing */}
      <header className="sticky top-0 z-40" style={{ background: 'rgba(7,11,10,0.72)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${BORDER}` }}>
        <nav className="max-w-[1200px] mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/vaxa-logo-white.png" alt="Vaxa" className="w-20 h-8 rounded-[9px] object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </a>
          <div className="hidden md:flex items-center gap-8">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-[13.5px] font-medium transition-colors hover:text-white" style={{ color: n.label === 'Sé Asesor(a)' ? GREEN_BRIGHT : MUTED }}>{n.label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center">
            <a href="/#contacto" className="group inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-lg transition-transform hover:-translate-y-0.5"
              style={{ background: GREEN, color: ON_GREEN }}>
              Solicitar demo <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
          <button onClick={() => setOpen((o) => !o)} className="md:hidden p-2 -mr-2" aria-label="Menú" style={{ color: TEXT }}>{open ? <X size={22} /> : <Menu size={22} />}</button>
        </nav>
        {open && (
          <div className="md:hidden px-6 pb-5 flex flex-col gap-1" style={{ borderTop: `1px solid ${BORDER}` }}>
            {NAV.map((n) => (<a key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-2.5 text-[15px] font-medium" style={{ color: n.label === 'Sé Asesor(a)' ? GREEN_BRIGHT : MUTED }}>{n.label}</a>))}
            <a href="/#contacto" onClick={() => setOpen(false)} className="mt-2 text-center text-[14px] font-semibold px-4 py-3 rounded-lg" style={{ background: GREEN, color: ON_GREEN }}>Solicitar demo</a>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Aurora verde animada + grid */}
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="sa-blob1 absolute -top-40 right-[-12%] w-[620px] h-[620px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.40), transparent 60%)' }} />
          <div className="sa-blob2 absolute top-[28%] left-[-16%] w-[520px] h-[520px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.34), transparent 62%)' }} />
          <div className="sa-blob1 absolute bottom-[-18%] left-[42%] w-[480px] h-[480px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.22), transparent 65%)' }} />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.7) 1px,transparent 1px)', backgroundSize: '46px 46px', maskImage: 'radial-gradient(80% 60% at 55% 10%, #000, transparent 78%)', WebkitMaskImage: 'radial-gradient(80% 60% at 55% 10%, #000, transparent 78%)' }} />
        </div>

        <div className="relative max-w-[1100px] mx-auto px-6 sm:px-10 pt-14 pb-14 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="sa-rise inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold mb-6"
              style={{ background: 'rgba(16,185,129,0.12)', border: `1px solid rgba(16,185,129,0.35)`, color: GREEN_BRIGHT }}>
              <Shield size={15} /> Identificación oficial
            </span>
            <h1 style={{ fontFamily: DISPLAY, animationDelay: '.08s' }} className="sa-rise text-[38px] sm:text-[54px] font-bold leading-[1.05] tracking-[-0.025em]">
              Identifica a nuestro<br />
              <span className="sa-shine" style={{ backgroundImage: `linear-gradient(100deg, ${GREEN}, ${GREEN_BRIGHT}, #A7F3D0, ${GREEN_BRIGHT}, ${GREEN})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>personal comercial</span>
            </h1>
            <p className="sa-rise text-[15px] mt-5 leading-relaxed max-w-md" style={{ color: MUTED, animationDelay: '.16s' }}>
              Por tu seguridad y confianza, verifica aquí la identidad del personal comercial autorizado de <b style={{ color: TEXT }}>VAXA SYSTEMS S.A.C.</b>
            </p>

            {/* Formulario de verificación */}
            <form onSubmit={onSubmit} className="sa-rise mt-7 rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}`, animationDelay: '.24s', boxShadow: '0 30px 70px -40px rgba(16,185,129,0.45)' }}>
              <label className="text-[12.5px] font-semibold uppercase tracking-wider" style={{ color: GREEN_BRIGHT }}>
                Verifica con el código del fotocheck
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5 mt-2.5">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
                  <input
                    value={codigo}
                    onChange={(e) => { setCodigo(limpiarCodigo(e.target.value)); setError(null); }}
                    placeholder="Ej. ASE-0007"
                    autoCapitalize="characters"
                    className="w-full pl-10 pr-3 py-3 rounded-xl text-[15px] font-semibold tracking-wide outline-none transition-colors focus:border-[rgba(16,185,129,0.5)]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: TEXT }}
                  />
                </div>
                <button type="submit" disabled={consultando}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[14.5px] font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: GREEN, color: ON_GREEN, boxShadow: '0 12px 34px -12px rgba(16,185,129,0.6)' }}>
                  {consultando ? <><Loader2 size={17} className="animate-spin" /> Verificando…</> : <>Verificar <ArrowRight size={16} /></>}
                </button>
              </div>
              <p className="text-[12px] mt-2.5 flex items-center gap-1.5" style={{ color: MUTED }}>
                <QrCode size={13} /> También puedes escanear el código QR del fotocheck.
              </p>
              {error && <p className="text-[13px] mt-2.5" style={{ color: ERROR }}>{error}</p>}
            </form>

            {/* Chips de confianza */}
            <div className="sa-rise flex flex-wrap items-center gap-x-5 gap-y-2 mt-5" style={{ animationDelay: '.3s' }}>
              {[{ I: BadgeCheck, t: 'Sin costo' }, { I: QrCode, t: 'Verificación al instante' }, { I: Shield, t: 'Respaldo oficial' }].map(({ I, t }) => (
                <span key={t} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color: MUTED }}>
                  <I size={14} style={{ color: GREEN_BRIGHT }} /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Fotocheck ilustrativo (con halo + flotando) */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative sa-float">
              <div aria-hidden className="absolute inset-0 -z-10 blur-3xl" style={{ background: 'radial-gradient(circle at 50% 45%, rgba(16,185,129,0.30), transparent 60%)', transform: 'scale(1.2)' }} />
              <Fotocheck asesora={resultado} escaneando={consultando} />
            </div>
          </div>
        </div>
      </section>

      {/* Resultado de la verificación */}
      {(resultado || noExiste) && (
        <section className="max-w-[1100px] mx-auto px-6 sm:px-10 pb-6">
          {resultado ? <ResultadoOk a={resultado} /> : <ResultadoNoExiste />}
        </section>
      )}

      {/* ¿Cómo identificarlo(a)? */}
      <section className="max-w-[1100px] mx-auto px-6 sm:px-10 py-12">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-center mb-2" style={{ color: GREEN_BRIGHT }}>Señales de confianza</p>
        <h2 style={{ fontFamily: DISPLAY }} className="text-[27px] sm:text-[30px] font-bold text-center">¿Cómo identificarlo(a)?</h2>
        <p className="text-[14px] text-center mt-2 mb-9 max-w-md mx-auto" style={{ color: MUTED }}>Toda asesora o asesor de Vaxa cumple estas tres señales.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { Icon: FileBadge, t: 'Porta un fotocheck oficial', d: 'Con el logo y los datos de VAXA SYSTEMS S.A.C.' },
            { Icon: QrCode, t: 'Cuenta con un código QR', d: 'Y un código único de verificación impreso.' },
            { Icon: BadgeCheck, t: 'Está autorizado(a)', d: 'Para brindarte información y presentarte nuestras soluciones.' },
          ].map(({ Icon, t, d }, i) => (
            <div key={t} className="sa-card-hover relative rounded-2xl p-6 overflow-hidden" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <span className="absolute top-4 right-5 text-[34px] font-bold leading-none tabular-nums" style={{ fontFamily: DISPLAY, color: 'rgba(16,185,129,0.14)' }}>0{i + 1}</span>
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Icon size={21} style={{ color: GREEN_BRIGHT }} />
              </span>
              <p className="text-[15.5px] font-bold" style={{ color: TEXT }}>{t}</p>
              <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: MUTED }}>{d}</p>
            </div>
          ))}
        </div>

        {/* Ayuda / contacto */}
        <div className="rounded-2xl p-5 mt-6 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: 'rgba(16,185,129,0.10)', border: `1px solid rgba(16,185,129,0.3)` }}>
          <div className="flex items-center gap-3">
            <Shield size={22} style={{ color: GREEN_BRIGHT }} />
            <div>
              <p className="text-[15px] font-bold" style={{ color: TEXT }}>¿Dudas sobre un asesor(a)?</p>
              <p className="text-[13px]" style={{ color: MUTED }}>Escríbenos y confirmamos su identidad al instante.</p>
            </div>
          </div>
          <a href={`https://wa.me/${WA_VAXA}?text=${encodeURIComponent('Hola Vaxa 👋, quiero verificar la identidad de un asesor(a) comercial.')}`}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold transition-transform hover:-translate-y-0.5"
            style={{ background: GREEN, color: ON_GREEN }}>
            <MessageCircle size={16} /> Consultar por WhatsApp
          </a>
        </div>
      </section>

      <footer className="border-t" style={{ borderColor: BORDER }}>
        <div className="max-w-[1100px] mx-auto px-6 sm:px-10 py-7 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[12.5px]" style={{ color: MUTED }}>© {new Date().getFullYear()} VAXA SYSTEMS S.A.C. — Identificación oficial de personal comercial.</p>
          <div className="flex items-center gap-4 text-[12.5px]" style={{ color: MUTED }}>
            <a href={`tel:+${WA_VAXA}`} className="inline-flex items-center gap-1.5 hover:text-white"><Phone size={13} /> +51 924 600 490</a>
            <a href="mailto:info@vaxa.com.pe" className="inline-flex items-center gap-1.5 hover:text-white"><Mail size={13} /> info@vaxa.com.pe</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-componentes ─────────────────────────────────────────────── */

/** Tarjeta tipo fotocheck. Si hay resultado, muestra la foto/datos reales; si no, un ejemplo.
 *  El escáner (haz + esquinas) solo se anima mientras `escaneando` (al verificar). */
function Fotocheck({ asesora, escaneando }: { asesora: Asesora | null; escaneando: boolean }) {
  const nombre = asesora?.nombre ?? 'María Pérez Torres';
  const dni = asesora?.dni ?? '—';
  const cargo = asesora?.cargo ?? 'Asesor(a) Comercial';
  const foto = asesora?.foto_url ? imgUrl(asesora.foto_url) : null;
  const BR = '2.5px solid #10B981';
  return (
    <div className="relative" style={{ width: 268 }}>
      {/* Cordón */}
      <div className="mx-auto" style={{ width: 54, height: 60, background: 'linear-gradient(180deg,#0E3A6B,#0A2A4E)', borderRadius: '6px 6px 0 0' }} />
      <div className="mx-auto -mt-1" style={{ width: 14, height: 14, borderRadius: 999, background: '#C9CDD2', border: '2px solid #9aa0a6' }} />
      {/* Tarjeta */}
      <div className="relative overflow-hidden rounded-2xl p-5 -mt-1" style={{ background: '#FFFFFF', boxShadow: '0 40px 90px -30px rgba(0,0,0,0.9)' }}>
        {/* Haz de escaneo: SOLO mientras se está verificando */}
        {escaneando && (
          <div aria-hidden className="sa-scan absolute left-0 right-0 pointer-events-none z-10" style={{ height: 58 }}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent, rgba(16,185,129,0.22))' }} />
            <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #34D399 18%, #10B981 50%, #34D399 82%, transparent)', boxShadow: '0 0 18px 4px rgba(16,185,129,0.75)' }} />
          </div>
        )}
        <div className="flex justify-center mb-3">
          <img src="/vaxa-logo.png" alt="Vaxa" className="h-6 w-auto object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/vaxa.png'; }} />
        </div>
        <div className="relative mx-auto" style={{ width: 120, height: 130 }}>
          <div className="rounded-xl overflow-hidden flex items-center justify-center w-full h-full" style={{ background: '#EAF1F7', border: '3px solid #E2E8F0' }}>
            {foto
              ? <img src={foto} alt={nombre} className="w-full h-full object-cover" />
              : <FileBadge size={40} style={{ color: '#9DB4C7' }} />}
          </div>
          {/* Esquinas del escáner: enfocan la foto, solo mientras verifica */}
          {escaneando && (
            <>
              <span aria-hidden className="absolute w-3.5 h-3.5" style={{ top: -3, left: -3, borderTop: BR, borderLeft: BR, borderTopLeftRadius: 4 }} />
              <span aria-hidden className="absolute w-3.5 h-3.5" style={{ top: -3, right: -3, borderTop: BR, borderRight: BR, borderTopRightRadius: 4 }} />
              <span aria-hidden className="absolute w-3.5 h-3.5" style={{ bottom: -3, left: -3, borderBottom: BR, borderLeft: BR, borderBottomLeftRadius: 4 }} />
              <span aria-hidden className="absolute w-3.5 h-3.5" style={{ bottom: -3, right: -3, borderBottom: BR, borderRight: BR, borderBottomRightRadius: 4 }} />
            </>
          )}
        </div>
        <p className="text-center text-[16px] font-bold mt-3" style={{ color: '#0B2540', fontFamily: DISPLAY }}>{nombre}</p>
        <p className="text-center text-[12px] font-semibold mt-1.5 inline-block w-full">
          <span className="px-3 py-1 rounded-full" style={{ background: '#D1FAE5', color: '#047857' }}>{cargo}</span>
        </p>
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #EEF2F6' }}>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>DNI</p>
            <p className="text-[12.5px] font-bold tabular-nums" style={{ color: '#0B2540' }}>{dni}</p>
          </div>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#0B2540' }}>
            <QrCode size={28} color="#fff" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Resultado: asesora AUTORIZADA (verde) o registrada pero NO vigente (ámbar). */
function ResultadoOk({ a }: { a: Asesora }) {
  const ok = a.autorizada;
  const C = ok
    ? { bg: 'rgba(16,185,129,0.12)', bd: 'rgba(16,185,129,0.4)', fg: GREEN_BRIGHT }
    : { bg: 'rgba(245,158,11,0.12)', bd: 'rgba(245,158,11,0.4)', fg: '#FCD34D' };
  const vig = fmtFecha(a.vigente_hasta);
  return (
    <div className="sa-rise rounded-2xl p-6 flex items-center gap-5 flex-wrap" style={{ background: C.bg, border: `1px solid ${C.bd}` }}>
      <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}` }}>
        {a.foto_url ? <img src={imgUrl(a.foto_url)} alt={a.nombre} className="w-full h-full object-cover" /> : <FileBadge size={26} style={{ color: MUTED }} />}
      </div>
      <div className="flex-1 min-w-[220px]">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: C.fg }}>
          <BadgeCheck size={14} /> {ok ? 'Asesor(a) autorizado(a)' : 'Registrado(a) · fuera de vigencia'}
        </span>
        <p className="text-[21px] font-bold mt-2" style={{ fontFamily: DISPLAY, color: TEXT }}>{a.nombre}</p>
        <p className="text-[13.5px] mt-0.5" style={{ color: MUTED }}>
          {a.cargo ?? 'Asesor(a) Comercial'} · Código {a.codigo}
          {a.dni ? ` · DNI ${a.dni}` : ''}
          {a.zona ? ` · ${a.zona}` : ''}
        </p>
        {ok
          ? <p className="text-[13px] mt-2" style={{ color: GREEN_BRIGHT }}>✓ Autorizada por VAXA SYSTEMS S.A.C.{vig ? ` · vigente hasta el ${vig}` : ''}</p>
          : <p className="text-[13px] mt-2" style={{ color: '#FCD34D' }}>⚠ Su autorización no está vigente. Confírmalo con nosotros antes de continuar.</p>}
      </div>
    </div>
  );
}

/** Resultado: código NO existe → advertencia clara. */
function ResultadoNoExiste() {
  return (
    <div className="sa-rise rounded-2xl p-6 flex items-center gap-4 flex-wrap" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)' }}>
      <AlertCircle size={26} style={{ color: ERROR }} />
      <div className="flex-1 min-w-[220px]">
        <p className="text-[16px] font-bold" style={{ color: TEXT }}>No encontramos ese código</p>
        <p className="text-[13.5px] mt-1" style={{ color: MUTED }}>
          Esta persona <b style={{ color: ERROR }}>no figura</b> como asesor(a) autorizado(a) de VAXA. Por tu seguridad, no compartas información y verifícalo con nosotros.
        </p>
      </div>
      <a href={`https://wa.me/${WA_VAXA}?text=${encodeURIComponent('Hola Vaxa 👋, un código de asesor(a) no aparece como autorizado. ¿Pueden ayudarme?')}`}
        target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold transition-transform hover:-translate-y-0.5"
        style={{ background: GREEN, color: ON_GREEN }}>
        <MessageCircle size={16} /> Reportar
      </a>
    </div>
  );
}
