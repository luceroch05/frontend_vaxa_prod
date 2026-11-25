import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowRight, BadgeCheck, BookOpen, Building2, Calendar, Check, CreditCard, FileText,
  Globe, GraduationCap, LayoutDashboard, MessageCircle, Package, PenTool, Plus,
  QrCode, Settings, Sparkles, UserPlus, Users,
} from '@/components/ui/icon';
import { api } from '@/lib/api/client';

/**
 * Formulario inteligente de contacto (4 pasos).
 *   1. Tipo de organización  →  2. Servicio (depende del tipo)
 *   3. Pregunta de necesidad (depende del servicio)  →  4. Datos de contacto
 *
 * Envía la solicitud a POST /public/solicitud. La confirmación solo se muestra si el
 * backend registró la solicitud y devolvió su código; desde ahí se continúa por WhatsApp.
 */

/* ── Tokens visuales (mismos de la landing) ─────────────────────────────── */
const GREEN = '#10B981';
const GREEN_BRIGHT = '#34D399';
const ON_GREEN = '#04110C';
const TEXT = '#E8EEEB';
const MUTED = '#7E8C87';
const SURFACE = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(255,255,255,0.12)';
const ERROR = '#FCA5A5';
const DISPLAY = "'Space Grotesk', system-ui, sans-serif";

const CARD_STYLE = {
  background: 'rgba(8,16,14,0.72)',
  border: `1px solid ${BORDER}`,
  boxShadow: '0 40px 90px -30px rgba(0,0,0,0.85)',
  backdropFilter: 'blur(8px)',
} as const;
const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl text-[14.5px] outline-none transition-colors focus:border-[rgba(16,185,129,0.5)]';
const INPUT_STYLE = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT } as const;
const BTN_PRIMARY_CLASS = 'w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-60';

/* ── Modelo de datos ────────────────────────────────────────────────────── */
type Icono = typeof Globe;

type Pregunta =
  | { tipo: 'opciones'; q: string; opciones: string[] }
  | { tipo: 'texto'; q: string; placeholder: string; multilinea?: boolean };

interface Opcion { label: string; Icon: Icono }
interface Servicio extends Opcion { pregunta: Pregunta }

const opciones = (q: string, ops: string[]): Pregunta => ({ tipo: 'opciones', q, opciones: ops });
const texto = (q: string, placeholder: string, multilinea = true): Pregunta => ({ tipo: 'texto', q, placeholder, multilinea });

/* Paso 3: una pregunta por tipo de servicio. */
const P_WEB = opciones('¿Actualmente cuentas con una página web?', ['Sí, deseo renovarla.', 'No, necesito una nueva.']);
const P_PROFESIONALES = opciones('¿Cuántos profesionales utilizarán el sistema?', ['De 1 a 3 profesionales.', 'De 4 a 6 profesionales.', 'De 7 a 10 profesionales.', 'Más de 10 profesionales.']);
const P_ESTUDIANTES = opciones('¿Cuántos estudiantes estimas tener?', ['Hasta 30 estudiantes.', 'De 31 a 100 estudiantes.', 'Más de 100 estudiantes.']);
const P_CERTIFICADOS = opciones('¿Cuántos certificados estimas emitir mensualmente?', ['Hasta 100 certificados.', 'De 101 a 500 certificados.', 'Más de 500 certificados.']);
const P_PRODUCTOS = opciones('¿Cuántos productos comercializas aproximadamente?', ['Hasta 20 productos.', 'De 21 a 100 productos.', 'Más de 100 productos.']);
const P_URL = texto('¿Cuál es la dirección de tu página web actual?', 'Ej. www.tusitio.com', false);
const P_SOFTWARE = texto('¿Qué proceso de tu negocio deseas digitalizar?', 'Describe brevemente el proceso o la necesidad.');
const P_RESERVAS = texto('Cuéntanos cómo te gustaría gestionar tus reservas o inscripciones.', 'Describe cómo lo haces hoy y qué te gustaría mejorar.');
const P_OTRO = texto('Cuéntanos qué necesitas y cómo podemos ayudarte.', 'Escribe aquí tu necesidad.');

/* Paso 1 */
const TIPOS: Opcion[] = [
  { label: 'Instituto / Academia', Icon: GraduationCap },
  { label: 'Centro de salud / terapéutico', Icon: Users },
  { label: 'Profesional independiente', Icon: UserPlus },
  { label: 'Empresa u otro', Icon: Building2 },
];

/* Paso 2: servicios por tipo de organización. */
const MEJORA_WEB: Servicio = { label: 'Mejora de página web existente', Icon: Settings, pregunta: P_URL };
const OTRO_SERVICIO: Servicio = { label: 'Otro servicio', Icon: Plus, pregunta: P_OTRO };

const SERVICIOS: Record<string, Servicio[]> = {
  'Instituto / Academia': [
    { label: 'Desarrollo de página web institucional', Icon: Globe, pregunta: P_WEB },
    { label: 'Plataforma educativa virtual (Synap LMS)', Icon: BookOpen, pregunta: P_ESTUDIANTES },
    { label: 'Sistema de certificados digitales con QR', Icon: QrCode, pregunta: P_CERTIFICADOS },
    { label: 'Sistema de inscripción a cursos y talleres', Icon: UserPlus, pregunta: P_RESERVAS },
    MEJORA_WEB,
    OTRO_SERVICIO,
  ],
  'Centro de salud / terapéutico': [
    { label: 'Desarrollo de página web institucional', Icon: Globe, pregunta: P_WEB },
    { label: 'Sistema de historias clínicas electrónicas (VAXA HCE)', Icon: FileText, pregunta: P_PROFESIONALES },
    { label: 'Sistema de agenda y gestión de pacientes', Icon: Calendar, pregunta: P_PROFESIONALES },
    { label: 'Plataforma educativa virtual', Icon: BookOpen, pregunta: P_ESTUDIANTES },
    { label: 'Sistema de certificados digitales con QR', Icon: QrCode, pregunta: P_CERTIFICADOS },
    MEJORA_WEB,
    OTRO_SERVICIO,
  ],
  'Profesional independiente': [
    { label: 'Página web de marca personal', Icon: Sparkles, pregunta: P_WEB },
    { label: 'Portafolio profesional', Icon: PenTool, pregunta: P_WEB },
    { label: 'Sistema de reserva de citas', Icon: Calendar, pregunta: P_RESERVAS },
    { label: 'Plataforma de cursos virtuales', Icon: BookOpen, pregunta: P_ESTUDIANTES },
    { label: 'Sistema de certificados digitales con QR', Icon: QrCode, pregunta: P_CERTIFICADOS },
    MEJORA_WEB,
    OTRO_SERVICIO,
  ],
  'Empresa u otro': [
    { label: 'Desarrollo de página web corporativa', Icon: Building2, pregunta: P_WEB },
    { label: 'Tienda virtual (E-commerce)', Icon: CreditCard, pregunta: P_PRODUCTOS },
    { label: 'Catálogo digital de productos', Icon: Package, pregunta: P_PRODUCTOS },
    { label: 'Desarrollo de software personalizado', Icon: LayoutDashboard, pregunta: P_SOFTWARE },
    { label: 'Página web para ONG o asociaciones', Icon: Users, pregunta: P_WEB },
    MEJORA_WEB,
    OTRO_SERVICIO,
  ],
};

/* ── Utilidades ─────────────────────────────────────────────────────────── */
const TOTAL_PASOS = 4;
const AVANCE_MS = 180;   // pausa breve para que se vea la opción elegida antes de avanzar
const ORIGEN = 'Landing Vaxa (formulario inteligente)';

const esCorreoValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const soloDigitos = (v: string) => v.replace(/\D/g, '');

interface Respuestas { tipo: string; servicio: string; necesidad: string }
interface Contacto { nombre: string; empresa: string; whatsapp: string; correo: string; info: string }

const RESPUESTAS_VACIAS: Respuestas = { tipo: '', servicio: '', necesidad: '' };
const CONTACTO_VACIO: Contacto = { nombre: '', empresa: '', whatsapp: '', correo: '', info: '' };

function validarContacto(c: Contacto, acepta: boolean): string | null {
  if (!c.nombre.trim()) return 'Ingresa tus nombres y apellidos.';
  if (soloDigitos(c.whatsapp).length < 9) return 'Ingresa un número de WhatsApp válido.';
  if (!c.correo.trim()) return 'Ingresa tu correo electrónico.';
  if (!esCorreoValido(c.correo.trim())) return 'El correo electrónico no es válido.';
  if (!acepta) return 'Debes aceptar la política de privacidad.';
  return null;
}

/** Mensaje prellenado de WhatsApp (solo incluye las líneas opcionales que tienen valor). */
function mensajeWhatsApp(r: Respuestas, c: Contacto): string {
  const linea = (etiqueta: string, valor: string) => (valor.trim() ? `${etiqueta}: ${valor.trim()}` : null);
  return [
    'Hola, equipo de VAXA. Me gustaría recibir información sobre sus servicios.',
    '',
    linea('Tipo de organización', r.tipo),
    linea('Servicio de interés', r.servicio),
    linea('Necesidad', r.necesidad),
    linea('Nombre', c.nombre),
    linea('Empresa', c.empresa),
    linea('Correo electrónico', c.correo),
    linea('Información adicional', c.info),
    '',
    'Me gustaría recibir una propuesta personalizada.',
  ].filter((l): l is string => l !== null).join('\n');
}

/* ── Componente principal ───────────────────────────────────────────────── */
export default function ContactoQuiz({ whatsapp }: { whatsapp: string }) {
  const [paso, setPaso] = useState(0);                       // 0..3
  const [resp, setResp] = useState<Respuestas>(RESPUESTAS_VACIAS);
  const [contacto, setContacto] = useState<Contacto>(CONTACTO_VACIO);
  const [acepta, setAcepta] = useState(false);
  const [trampa, setTrampa] = useState('');                  // honeypot anti-bot
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);

  const servicios = SERVICIOS[resp.tipo] ?? [];
  const pregunta = servicios.find((s) => s.label === resp.servicio)?.pregunta;

  const avanzar = () => setTimeout(() => setPaso((p) => p + 1), AVANCE_MS);
  const atras = () => { setError(null); setPaso((p) => Math.max(0, p - 1)); };

  /** Cambiar de tipo invalida servicio y necesidad; cambiar de servicio invalida la necesidad. */
  const elegirTipo = (tipo: string) => {
    setResp((p) => (p.tipo === tipo ? p : { tipo, servicio: '', necesidad: '' }));
    avanzar();
  };
  const elegirServicio = (servicio: string) => {
    setResp((p) => (p.servicio === servicio ? p : { ...p, servicio, necesidad: '' }));
    avanzar();
  };
  const elegirNecesidad = (necesidad: string) => {
    setResp((p) => ({ ...p, necesidad }));
    avanzar();
  };
  const continuarTexto = () => {
    if (!resp.necesidad.trim()) { setError('Completa este campo para continuar.'); return; }
    setError(null);
    setPaso((p) => p + 1);
  };

  const setCampo = (campo: keyof Contacto) => (valor: string) =>
    setContacto((c) => ({ ...c, [campo]: valor }));

  const enviar = async () => {
    const mensajeError = validarContacto(contacto, acepta);
    if (mensajeError) { setError(mensajeError); return; }

    setEnviando(true);
    setError(null);
    try {
      const res = await api.post<{ ok: boolean; codigo: string }>('/public/solicitud', {
        tipo: resp.tipo,
        servicio: resp.servicio,
        necesidad: resp.necesidad.trim(),
        nombre: contacto.nombre.trim(),
        empresa: contacto.empresa.trim(),
        whatsapp: contacto.whatsapp.trim(),
        correo: contacto.correo.trim(),
        info: contacto.info.trim(),
        acepta,
        origen: ORIGEN,
        website: trampa,
      });
      // Solo se confirma si el backend devolvió el código de la solicitud registrada.
      if (!res?.ok || !res.codigo) throw new Error('No se pudo registrar tu solicitud.');
      setCodigo(res.codigo);
    } catch (e) {
      setError((e as Error)?.message || 'No se pudo enviar tu solicitud. Inténtalo nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  const reiniciar = () => {
    setResp(RESPUESTAS_VACIAS);
    setContacto(CONTACTO_VACIO);
    setAcepta(false);
    setCodigo(null);
    setError(null);
    setPaso(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (codigo) {
    const href = `https://wa.me/${soloDigitos(whatsapp)}?text=${encodeURIComponent(mensajeWhatsApp(resp, contacto))}`;
    return <Confirmacion codigo={codigo} hrefWhatsApp={href} onVolver={reiniciar} />;
  }

  const porcentaje = ((paso + 1) / TOTAL_PASOS) * 100;

  return (
    <div className="rounded-2xl p-6 sm:p-7" style={CARD_STYLE}>
      {/* Progreso */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11.5px] font-semibold uppercase tracking-wider" style={{ color: GREEN_BRIGHT }}>
          Paso {paso + 1} de {TOTAL_PASOS}
        </span>
        {paso > 0 && (
          <button type="button" onClick={atras} className="inline-flex items-center gap-1 text-[12.5px] font-medium transition-colors hover:text-white" style={{ color: MUTED }}>
            <ArrowRight size={13} className="rotate-180" /> Atrás
          </button>
        )}
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden mb-6"
        style={{ background: 'rgba(255,255,255,0.08)' }}
        role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100}
      >
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${porcentaje}%`, background: `linear-gradient(90deg, ${GREEN}, ${GREEN_BRIGHT})` }} />
      </div>

      <div key={paso} className="page-fade">
        {paso === 0 && (
          <Paso titulo="¿Qué describe mejor a tu organización?">
            <ListaOpciones opciones={TIPOS} seleccionada={resp.tipo} onElegir={elegirTipo} />
          </Paso>
        )}

        {paso === 1 && (
          <Paso titulo="¿En qué podemos ayudarte?">
            <ListaOpciones opciones={servicios} seleccionada={resp.servicio} onElegir={elegirServicio} />
          </Paso>
        )}

        {paso === 2 && pregunta && (
          <Paso titulo={pregunta.q}>
            {pregunta.tipo === 'opciones' ? (
              <ListaOpciones
                opciones={pregunta.opciones.map((label) => ({ label }))}
                seleccionada={resp.necesidad}
                onElegir={elegirNecesidad}
              />
            ) : (
              <div>
                {pregunta.multilinea ? (
                  <textarea
                    value={resp.necesidad} rows={4} autoFocus maxLength={500}
                    onChange={(e) => setResp((p) => ({ ...p, necesidad: e.target.value }))}
                    placeholder={pregunta.placeholder}
                    className={`${INPUT_CLASS} resize-none`} style={INPUT_STYLE}
                  />
                ) : (
                  <input
                    value={resp.necesidad} autoFocus maxLength={500}
                    onChange={(e) => setResp((p) => ({ ...p, necesidad: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') continuarTexto(); }}
                    placeholder={pregunta.placeholder}
                    className={INPUT_CLASS} style={INPUT_STYLE}
                  />
                )}
                <button type="button" onClick={continuarTexto} className={`${BTN_PRIMARY_CLASS} mt-3`} style={{ background: GREEN, color: ON_GREEN }}>
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
            )}
          </Paso>
        )}

        {paso === 3 && (
          <Paso titulo="¡Estamos a un paso de comenzar!" subtitulo="Déjanos tus datos para preparar una propuesta personalizada de acuerdo con tus necesidades.">
            <div className="space-y-3">
              <input value={contacto.nombre} onChange={(e) => setCampo('nombre')(e.target.value)} maxLength={160} autoFocus autoComplete="name"
                placeholder="Nombres y apellidos *" aria-label="Nombres y apellidos" className={INPUT_CLASS} style={INPUT_STYLE} />
              <input value={contacto.empresa} onChange={(e) => setCampo('empresa')(e.target.value)} maxLength={160} autoComplete="organization"
                placeholder="Empresa, institución o marca (opcional)" aria-label="Empresa, institución o marca" className={INPUT_CLASS} style={INPUT_STYLE} />
              <input value={contacto.whatsapp} onChange={(e) => setCampo('whatsapp')(e.target.value.replace(/[^\d+ ]/g, ''))} maxLength={40}
                inputMode="tel" autoComplete="tel" placeholder="Número de WhatsApp *" aria-label="Número de WhatsApp" className={INPUT_CLASS} style={INPUT_STYLE} />
              <input value={contacto.correo} onChange={(e) => setCampo('correo')(e.target.value)} maxLength={160} type="email" autoComplete="email"
                placeholder="Correo electrónico *" aria-label="Correo electrónico" className={INPUT_CLASS} style={INPUT_STYLE} />
              <textarea value={contacto.info} onChange={(e) => setCampo('info')(e.target.value)} maxLength={2000} rows={3}
                placeholder="Información adicional (opcional)" aria-label="Información adicional" className={`${INPUT_CLASS} resize-none`} style={INPUT_STYLE} />

              {/* Honeypot: invisible para personas; los bots suelen llenarlo. */}
              <input value={trampa} onChange={(e) => setTrampa(e.target.value)} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

              <label className="flex items-start gap-3 cursor-pointer text-[13px] leading-snug" style={{ color: MUTED }}>
                <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="sr-only peer" />
                <span className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400"
                  style={{ background: acepta ? GREEN : SURFACE, border: `1px solid ${acepta ? GREEN : BORDER}` }}>
                  {acepta && <Check size={13} color={ON_GREEN} />}
                </span>
                <span>
                  Acepto la <a href="#" className="underline hover:text-white" style={{ color: GREEN_BRIGHT }}>política de privacidad</a> y
                  el tratamiento de mis datos personales. *
                </span>
              </label>
            </div>

            <button type="button" onClick={enviar} disabled={enviando} className={`${BTN_PRIMARY_CLASS} mt-5`}
              style={{ background: GREEN, color: ON_GREEN, boxShadow: '0 14px 40px -12px rgba(16,185,129,0.6)' }}>
              {enviando ? 'Enviando…' : <>Enviar solicitud <ArrowRight size={16} /></>}
            </button>
          </Paso>
        )}

        {error && <p role="alert" className="text-[13px] mt-3 text-center" style={{ color: ERROR }}>{error}</p>}
      </div>
    </div>
  );
}

/* ── Sub-componentes ────────────────────────────────────────────────────── */

function Paso({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <>
      <h3 style={{ fontFamily: DISPLAY }} className={`text-[20px] sm:text-[23px] font-bold leading-tight ${subtitulo ? 'mb-1' : 'mb-5'}`}>{titulo}</h3>
      {subtitulo && <p className="text-[13.5px] mb-5" style={{ color: MUTED }}>{subtitulo}</p>}
      {children}
    </>
  );
}

/** Lista de botones de selección. Las opciones sin ícono se muestran solo con texto. */
function ListaOpciones({ opciones, seleccionada, onElegir }: {
  opciones: { label: string; Icon?: Icono }[];
  seleccionada: string;
  onElegir: (label: string) => void;
}) {
  return (
    <div className="grid gap-2.5" role="group">
      {opciones.map(({ label, Icon }) => {
        const activa = seleccionada === label;
        return (
          <button
            key={label} type="button" onClick={() => onElegir(label)} aria-pressed={activa}
            className="group flex items-center gap-3 text-left px-4 py-3.5 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ background: activa ? 'rgba(16,185,129,0.14)' : SURFACE, border: `1px solid ${activa ? 'rgba(16,185,129,0.5)' : BORDER}` }}
          >
            {Icon && (
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors" style={{ background: activa ? GREEN : 'rgba(16,185,129,0.12)' }}>
                <Icon size={17} color={activa ? ON_GREEN : GREEN_BRIGHT} />
              </span>
            )}
            <span className="text-[14.5px] font-semibold flex-1" style={{ color: TEXT }}>{label}</span>
            <ArrowRight size={16} className="transition-all opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0" style={{ color: GREEN_BRIGHT }} />
          </button>
        );
      })}
    </div>
  );
}

function Confirmacion({ codigo, hrefWhatsApp, onVolver }: { codigo: string; hrefWhatsApp: string; onVolver: () => void }) {
  return (
    <div className="rounded-2xl p-8 sm:p-10 text-center page-fade" style={CARD_STYLE}>
      <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
        <BadgeCheck size={32} style={{ color: GREEN_BRIGHT }} />
      </div>
      <h3 style={{ fontFamily: DISPLAY }} className="text-[22px] font-bold">¡Gracias por confiar en VAXA!</h3>
      <p className="text-[12.5px] font-semibold mt-2" style={{ color: GREEN_BRIGHT }}>Código de solicitud: {codigo}</p>
      <p className="text-[14.5px] mt-3 leading-relaxed" style={{ color: MUTED }}>
        Hemos recibido tu solicitud correctamente. Nuestro equipo se pondrá en contacto contigo para brindarte una propuesta personalizada.
      </p>
      <p className="text-[14.5px] mt-2 leading-relaxed" style={{ color: MUTED }}>
        Si deseas continuar la conversación, puedes contactarnos directamente por WhatsApp.
      </p>
      <div className="flex flex-col gap-3 mt-6">
        <a href={hrefWhatsApp} target="_blank" rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold transition-transform hover:-translate-y-0.5"
          style={{ background: GREEN, color: ON_GREEN }}>
          <MessageCircle size={16} /> Continuar por WhatsApp
        </a>
        <button type="button" onClick={onVolver}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-[14px] font-semibold transition-colors hover:text-white"
          style={{ background: SURFACE, color: TEXT, border: `1px solid ${BORDER}` }}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}