import { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Download, X } from '@/components/ui/icon';
import type { Certificado, ConfigCertificado } from '../types';
import { expandirVariablesCertificado, periodoCurso } from '../utils/certVariables';
import { publicCertUrl } from '@/lib/paths';
import { imgUrl } from '@/lib/api/client';
import LienzoCampos from '../../personalizado/LienzoCampos';
import { layoutActivo, parseLayout } from '../../personalizado/layout';

interface Props {
  certificado: Certificado & { empresa_nombre: string };
  config: ConfigCertificado;
  onClose: () => void;
}

/* ── Dimensiones (mismo viewport que el otro proyecto) ──────── */
export const W = 1122;
export const H = 794;

/* ── Helpers ────────────────────────────────────────────────── */
function fmtDate(d: string | Date | undefined | null) {
  if (!d) return '';
  const s = typeof d === 'string' ? d.substring(0, 10) : d.toISOString().substring(0, 10);
  if (!s || s === '0000-00-00') return '';
  return new Date(s + 'T12:00:00').toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* Nombre corto = primer nombre + apellidos (para {nombreCorto}). El front solo
   tiene el nombre completo; heurística: 1er palabra + las 2 últimas (apellidos).
   Con <4 palabras deja el nombre tal cual. */
function nombreCortoDe(full?: string | null): string {
  const parts = (full ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length < 4) return (full ?? '').trim();
  return `${parts[0]} ${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
}

/* Mes + año, ej. "septiembre 2026" (para {mesEmision}). Espejo del backend. */
const MESES_MESANIO = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function fmtMesAnio(d: string | Date | undefined | null) {
  if (!d) return '';
  const s = typeof d === 'string' ? d.substring(0, 10) : d.toISOString().substring(0, 10);
  if (!s || s === '0000-00-00') return '';
  const [y, m] = s.split('-').map(Number);
  if (!y || !m) return '';
  return `${MESES_MESANIO[m - 1]} ${y}`;
}

/* Layout de logos:
   - 1 logo  → centro
   - 2 logos → izquierda y derecha
   - 3 logos → izquierda, centro y derecha                       */
export function getLogoSlots(n: number): ('left' | 'center' | 'right')[] {
  if (n === 1) return ['center'];
  if (n === 2) return ['left', 'right'];
  return ['left', 'center', 'right'];
}

/* Wrappers de logos: contenedor centrado 200x110, img dentro con aspect ratio respetado */
export function logoSlotStyle(slot: 'left' | 'center' | 'right'): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    top: 55,
    width: 240,
    height: 135,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  if (slot === 'left')   return { ...base, left: 70 };
  if (slot === 'right')  return { ...base, right: 70 };
  return { ...base, left: (W - 240) / 2 };
}

export const logoImgStyle: React.CSSProperties = {
  maxHeight: 125,
  maxWidth: 220,
  width: 'auto',
  height: 'auto',
  display: 'block',
};

/* Gap entre firmas según cantidad — mismo criterio del otro proyecto */
export function firmasGap(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 120;
  return 60;
}

export const SIG_ITEM_W = 200;
export const SIG_IMG_H  = 72;

/* Precarga las fuentes del lienzo y espera a que estén listas. html2canvas
   rasteriza con la fuente por defecto si aún no cargaron → hay que forzarlas. */
async function asegurarFuentes(): Promise<void> {
  try {
    const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
    if (!fonts) return;
    const familias = ['Barlow Condensed', 'Bebas Neue', 'Montserrat', 'Georgia'];
    const pesos = ['400', '600', '700', '800'];
    await Promise.all(
      familias.flatMap((fam) => pesos.map((w) => fonts.load(`${w} 40px "${fam}"`).catch(() => undefined))),
    );
    await fonts.ready;
  } catch { /* navegadores sin document.fonts: se ignora */ }
}

/* ── Componente ─────────────────────────────────────────────── */
export function CertificadoPDF({ certificado, config, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const qrUrl = publicCertUrl(certificado.empresa_nombre, `/validar?codigo=${certificado.codigo_unico}`);

  // Genera el QR localmente como data URL — evita CORS y queda igual en preview y PDF
  useEffect(() => {
    QRCode.toDataURL(qrUrl, { errorCorrectionLevel: 'M', width: 240, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [qrUrl]);

  const handleDescargar = async () => {
    if (!ref.current) return;

    // 1. Quitar temporalmente cualquier transform del wrapper para que html2canvas
    //    capture el certificado en su tamaño nativo 1122×794 sin deformación.
    const wrapper = ref.current.parentElement as HTMLDivElement | null;
    const originalTransform = wrapper?.style.transform ?? '';
    if (wrapper) wrapper.style.transform = 'none';

    // Espera a que las fuentes personalizadas del lienzo (Barlow Condensed, Bebas
    // Neue, Montserrat…) terminen de cargar ANTES de rasterizar. Sin esto html2canvas
    // captura con una fuente por defecto y el PDF sale con otra tipografía distinta a
    // la vista previa, aunque en pantalla se vea bien.
    await asegurarFuentes();

    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        letterRendering: true,
      } as any);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      pdf.save(`certificado-${certificado.codigo_unico}.pdf`);
    } finally {
      // 2. Restauramos el transform visual
      if (wrapper) wrapper.style.transform = originalTransform;
    }
  };

  // Texto del cuerpo
  const fechaInicio = fmtDate(certificado.fecha_inicio);
  const fechaFin    = fmtDate(certificado.fecha_fin);
  // Periodo según los días del curso (hasta 3 días puntuales). Mismo helper que
  // el backend (pdf.service) para que el PDF real y esta vista coincidan.
  const periodoFrase = periodoCurso(certificado.fecha_inicio, certificado.fecha_fin, certificado.fecha_dia2, certificado.fecha_dia3);
  const periodo     = periodoFrase ? `, realizado ${periodoFrase}` : '';
  const cuerpoDefault = `Por haber completado satisfactoriamente ${
    certificado.tipo_programa_nombre ?? 'el programa'
  } "${certificado.programa_nombre}" con una duración de ${
    certificado.horas_academicas ?? ''
  } horas académicas${periodo}.`;
  const cuerpoBase  = config.texto_personalizado?.trim() || cuerpoDefault;
  const docNum  = (certificado as any).numero_documento ?? '';
  const docTipo = (certificado as any).tipo_doc_codigo ?? (certificado as any).tipo_documento ?? '';
  const cuerpoTexto = expandirVariablesCertificado(cuerpoBase, {
    participante: certificado.participante_nombre,
    programa:     certificado.programa_nombre,
    horas:        certificado.horas_academicas ?? '',
    creditos:     certificado.creditos ?? '',
    tipoPrograma: certificado.tipo_programa_nombre ?? 'Certificado',
    tipoDocumento: docTipo,
    documento:    docNum,
    fecha:        fmtDate(certificado.fecha_emision),
    fechaInicio,
    fechaFin,
  });

  // Tamaño cuerpo adaptativo (igual que el otro proyecto)
  const esTextoLargo = cuerpoTexto.length > 200;
  const cuerpoSize   = esTextoLargo ? 18 : 20;

  // Logos
  const slots = getLogoSlots(config.logos?.length ?? 0);

  // Modo "Diseño Personalizado (Lienzo)": si está activo, se dibuja el fondo del
  // cliente + los campos posicionados, en vez del diseño por defecto.
  const layout     = parseLayout(config.layout_personalizado);
  const usarLienzo = layoutActivo(layout);
  const varsLienzo: Record<string, string> = {
    nombre: certificado.participante_nombre, participante: certificado.participante_nombre,
    nombreCorto: nombreCortoDe(certificado.participante_nombre),
    calidad: (certificado as any).calidad ?? 'Participante',
    tipoDocumento: docTipo, documento: docNum,
    programa: certificado.programa_nombre, curso: certificado.programa_nombre,
    tipo: certificado.tipo_programa_nombre ?? 'Certificado',
    fecha: fmtDate(certificado.fecha_emision), fechaInicio, fechaFin,
    mesEmision: fmtMesAnio(certificado.fecha_emision),
    horas: String(certificado.horas_academicas ?? ''),
    creditos: certificado.creditos ? String(certificado.creditos) : '',
    codigo: certificado.codigo_unico,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column',
      background: 'rgba(0,0,0,0.85)',
    }}>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', flexShrink: 0,
        background: '#0D0E12', borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <p style={{ margin: 0, color: '#F1F5F9', fontSize: 14, fontWeight: 600 }}>
          {certificado.participante_nombre}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleDescargar}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', background: '#D97706', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Download size={14} /> Descargar PDF
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '7px 10px', background: 'rgba(255,255,255,0.08)', color: '#9CA3AF',
              border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Scroll area ──────────────────────────────────────── */}
      <div style={{
        flex: 1, overflow: 'auto', padding: 24,
        background: '#1a1c23',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      }}>
        {/* Wrapper escalado SOLO para visualización.
            Antes de descargar, el handler quita este transform temporalmente. */}
        <div style={{
          transform: 'scale(0.6)',
          transformOrigin: 'top center',
          marginBottom: -W * 0.4,
          flexShrink: 0,
        }}>

          {/* ═══════════ CERTIFICADO 1122×794 ═══════════ */}
          <div
            ref={ref}
            style={{
              position: 'relative',
              width: W,
              height: H,
              background: '#fff',
              overflow: 'hidden',
              fontFamily: 'Helvetica, Arial, sans-serif',
            }}
          >
            {/* Fondo */}
            {config.plantilla_url && (
              <img
                src={imgUrl(config.plantilla_url)}
                alt=""
                style={{
                  position: 'absolute', inset: 0,
                  width: W, height: H, objectFit: usarLienzo ? 'fill' : 'cover',
                }}
              />
            )}

            {usarLienzo ? (
              /* ── Modo lienzo: solo el fondo del cliente + los campos posicionados ── */
              <LienzoCampos layout={layout!} vars={varsLienzo} codigo={certificado.codigo_unico} qrDataUrl={qrDataUrl} logos={config.logos ?? []} firmas={config.firmas ?? []} />
            ) : (
            <>
            {/* ── LOGOS (slot 200x110, img respeta aspect ratio) ── */}
            {config.logos?.map((logo, i) => (
              <div key={logo.id} style={logoSlotStyle(slots[i] ?? 'center')}>
                <img
                  src={imgUrl(logo.imagen_logo)}
                  alt={logo.nombre ?? 'logo'}
                  style={logoImgStyle}
                  crossOrigin="anonymous"
                />
              </div>
            ))}

            {/* ── CONTENIDO CENTRAL ────────────────────────── */}
            <div style={{
              position: 'absolute',
              top: 160,
              bottom: 180,
              left: 180,
              right: 180,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}>
              {/* Título (tipo de programa) */}
              <p style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 700,
                color: '#1a365d',
                textTransform: 'uppercase',
                wordSpacing: 'normal',
              }}>
                {certificado.tipo_programa_nombre ?? 'Certificado'}
              </p>

              {/* Se otorga a */}
              <p style={{
                margin: '28px 0 0',
                fontSize: 18,
                color: '#475569',
              }}>
                Se otorga a:
              </p>

              {/* Nombre del participante */}
              <p style={{
                margin: '10px 0 0',
                fontSize: 42,
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.15,
                fontFamily: 'Georgia, "Times New Roman", serif',
                whiteSpace: 'pre-wrap',
              }}>
                {nombreCortoDe(certificado.participante_nombre)}
              </p>

              {/* Cuerpo */}
              <p style={{
                margin: '35px 0 0',
                fontSize: cuerpoSize,
                color: '#475569',
                lineHeight: 1.65,
                maxWidth: 700,
                whiteSpace: 'pre-wrap',
              }}>
                {cuerpoTexto}
              </p>

              {/* Nombre del programa */}
              <p style={{
                margin: '30px 0 0',
                fontSize: 22,
                fontStyle: 'italic',
                color: '#1e40af',
                fontFamily: 'Georgia, "Times New Roman", serif',
                whiteSpace: 'pre-wrap',
              }}>
                &ldquo;{certificado.programa_nombre}&rdquo;
              </p>
            </div>

            {/* ── FIRMAS (centradas, bottom:30) ────────────── */}
            {config.firmas && config.firmas.length > 0 && (
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 60,
                display: 'flex',
                justifyContent: 'center',
                // flex-start: la línea de firma queda a la misma altura en todas
                // (los nombres largos crecen hacia abajo sin desalinear ni pisar).
                alignItems: 'flex-start',
                gap: firmasGap(config.firmas.length),
              }}>
                {config.firmas.map(f => (
                  <div key={f.id} style={{
                    width: SIG_ITEM_W,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}>
                    <img
                      src={imgUrl(f.imagen_firma)}
                      alt={f.nombre_autoridad}
                      style={{
                        height: SIG_IMG_H,
                        width: 'auto',
                        maxWidth: SIG_ITEM_W,
                        objectFit: 'contain',
                        marginBottom: -10, // overlap con la línea
                      }}
                      crossOrigin="anonymous"
                    />
                    <div style={{
                      width: SIG_ITEM_W,
                      borderTop: '1.5px solid #475569',
                      marginBottom: 6,
                    }} />
                    {/* Nombre: puede ocupar varias líneas. El cargo va SIEMPRE debajo
                        (block, sin position absoluta) así nunca se encima; si el
                        nombre es más largo, el cargo baja solo. lineHeight explícito
                        es obligatorio para que html2canvas no encime las líneas. */}
                    <p style={{
                      display: 'block',
                      width: SIG_ITEM_W,
                      margin: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#1e293b',
                      textAlign: 'center',
                      lineHeight: '15px',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    }}>
                      {f.nombre_autoridad}
                    </p>
                    <p style={{
                      display: 'block',
                      width: SIG_ITEM_W,
                      margin: '4px 0 0',
                      fontSize: 9,
                      fontStyle: 'italic',
                      color: '#64748b',
                      textAlign: 'center',
                      lineHeight: '12px',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    }}>
                      {f.cargo}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* ── QR (bottom:40, right:70, 100×100) ────────── */}
            <div style={{
              position: 'absolute',
              right: 70,
              bottom: 40,
              width: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR"
                  style={{ width: 100, height: 100 }}
                />
              )}
              <p style={{
                margin: '4px 0 0',
                fontSize: 8,
                color: '#94a3b8',
                fontFamily: '"Courier New", monospace',
                textAlign: 'center',
                width: 110,
                wordBreak: 'break-all',
                lineHeight: 1.2,
              }}>
                {certificado.codigo_unico}
              </p>
            </div>

            {/* ── PIE IZQUIERDO: Fecha de emisión ──────────── */}
            <p style={{
              position: 'absolute',
              left: 130,
              bottom: 20,
              margin: 0,
              fontSize: 11,
              color: '#9ca3af',
              whiteSpace: 'pre-wrap',
            }}>
              Fecha de emisión: {fmtDate(certificado.fecha_emision)}
            </p>

            {/* ── FOOTER centrado ──────────────────────────── */}
            <p style={{
              position: 'absolute',
              left: 0, right: 0, bottom: 20,
              margin: 0,
              fontSize: 11,
              color: '#9ca3af',
              textAlign: 'center',
              whiteSpace: 'pre-wrap',
            }}>
              Certificado generado por {certificado.empresa_nombre} — Sistema de Certificación
            </p>
            </>
            )}
          </div>
          {/* ═══════════ /CERTIFICADO ═══════════ */}
        </div>
      </div>
    </div>
  );
}

/* ── Botón pequeño usado en listas ──────────────────────────── */
export function BotonGenerarPDF({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', fontSize: 12, fontWeight: 600,
        background: '#EFF6FF', color: '#2563EB',
        border: '1px solid #BFDBFE', borderRadius: 10, cursor: 'pointer',
      }}
    >
      <Download size={12} />
      {loading ? 'Generando...' : 'PDF'}
    </button>
  );
}
