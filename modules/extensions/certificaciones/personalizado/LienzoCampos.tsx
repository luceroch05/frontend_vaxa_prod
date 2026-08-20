/* ────────────────────────────────────────────────────────────────
 * <LienzoCampos> — dibuja SOLO los campos dinámicos del modo lienzo
 * (nombre, calidad, fecha, evento, QR) posicionados por coordenadas.
 *
 * No dibuja el fondo: el componente padre coloca el arte del cliente y
 * superpone este overlay (mismo viewport 1122×794). Se reutiliza en la
 * vista previa de configuración, en el visor/descarga y en el editor.
 * ──────────────────────────────────────────────────────────────── */
import type { CSSProperties } from 'react';
import { imgUrl } from '@/lib/api/client';
import { CampoFirma, CampoLinea, CampoLogo, CampoQR, CampoTexto, LayoutLienzo, expandirLienzo, fontFamilyCss, tipoCampo, indiceLogo, indiceFirma, segmentosBold, quitarBold } from './layout';

interface Props {
  layout: LayoutLienzo;
  /** Valores para reemplazar {variables} en los campos de texto. */
  vars: Record<string, string>;
  codigo: string;
  /** Data URL del QR real. Si falta, se dibuja un placeholder gris. */
  qrDataUrl?: string;
  /** Logos seleccionados en la config (en orden). logo1→[0], logo2→[1]… */
  logos?: { imagen_logo: string }[];
  /** Firmas seleccionadas en la config (en orden). firma1→[0], firma2→[1]… */
  firmas?: { imagen_firma: string; nombre_autoridad: string; cargo: string }[];
}

/* Mide el ancho del texto con una fuente dada y encoge el tamaño hasta que
   entre en maxW en una sola línea (auto-ajuste del nombre). */
let _mCanvas: HTMLCanvasElement | null = null;
/** Ancho del texto (línea más ancha) con la fuente/estilo dados. */
function medirAncho(text: string, size: number, weight: number, italic: boolean, family: string, tracking: number): number {
  if (typeof document === 'undefined') return 0;
  _mCanvas = _mCanvas || document.createElement('canvas');
  const ctx = _mCanvas.getContext('2d');
  if (!ctx) return 0;
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${family}`;
  const lineas = text.split('\n');
  return Math.max(0, ...lineas.map(l => ctx.measureText(l).width + tracking * Math.max(0, l.length - 1)));
}
function fitSize(text: string, maxW: number, base: number, weight: number, italic: boolean, family: string, tracking: number): number {
  if (typeof document === 'undefined') return base;
  let size = base;
  while (size > 8) {
    if (medirAncho(text, size, weight, italic, family, tracking) <= maxW) break;
    size -= 1;
  }
  return size;
}

/** Ancho y posición X de una línea que "sigue" a un campo de texto (subrayado
 *  adaptado). Devuelve null si el objetivo no existe o no es texto. */
function lineaSigueTexto(
  campo: CampoTexto, vars: Record<string, string>,
): { x: number; w: number } | null {
  let txt = quitarBold(expandirLienzo(campo.text ?? '', vars));
  if (campo.uppercase) txt = txt.toUpperCase();
  if (!txt.trim()) return null;
  const weight = campo.weight ?? (campo.bold ? 700 : 400);
  const fam = fontFamilyCss(campo.font);
  const base = campo.size ?? 20;
  const size = campo.autoFit
    ? fitSize(txt, campo.w ?? 400, base, weight, !!campo.italic, fam, campo.tracking ?? 0)
    : base;
  const tw = medirAncho(txt, size, weight, !!campo.italic, fam, campo.tracking ?? 0);
  if (tw <= 0) return null;
  const boxX = campo.x ?? 0, boxW = campo.w ?? 400;
  const left = campo.align === 'left'  ? boxX
             : campo.align === 'right' ? boxX + boxW - tw
             :                           boxX + (boxW - tw) / 2;   // center (default)
  return { x: left, w: tw };
}

export default function LienzoCampos({ layout, vars, codigo, qrDataUrl, logos = [], firmas = [] }: Props) {
  const campos = layout.campos ?? {};

  return (
    <>
      {Object.entries(campos).map(([key, raw]) => {
        if (!raw || (raw as CampoTexto | CampoQR | CampoLogo | CampoFirma).on === false) return null;

        // ── LOGO (imagen del logo seleccionado en la config) ──
        if (tipoCampo(key) === 'logo') {
          const c = raw as CampoLogo;
          const logo = logos[indiceLogo(key)];
          if (!logo) return null;
          const size = c.size ?? 100;
          return (
            <div key={key} style={{ position: 'absolute', left: c.x ?? 0, top: c.y ?? 0, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={imgUrl(logo.imagen_logo)} alt="logo" style={{ maxWidth: size, maxHeight: size, objectFit: 'contain' }} crossOrigin="anonymous" />
            </div>
          );
        }

        // ── FIRMA (imagen del garabato + línea + nombre + cargo de la firma seleccionada) ──
        if (tipoCampo(key) === 'firma') {
          const c = raw as CampoFirma;
          const firma = firmas[indiceFirma(key)];
          if (!firma) return null;
          const w = c.w ?? 260;
          const h = c.h ?? 58;
          return (
            <div key={key} style={{ position: 'absolute', left: c.x ?? 0, top: c.y ?? 0, width: w, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src={imgUrl(firma.imagen_firma)} alt={firma.nombre_autoridad} style={{ height: h, maxWidth: w, objectFit: 'contain', marginBottom: -6 }} crossOrigin="anonymous" />
              <div style={{ width: w, borderTop: '1.4px solid #475569', marginBottom: 4 }} />
              <p style={{ margin: 0, width: w, fontSize: 12, fontWeight: 700, color: '#1e293b', textAlign: 'center', lineHeight: 1.25, fontFamily: fontFamilyCss('sans') }}>{firma.nombre_autoridad}</p>
              <p style={{ margin: '2px 0 0', width: w, fontSize: 10, fontStyle: 'italic', color: '#64748b', textAlign: 'center', lineHeight: 1.25, whiteSpace: 'pre-wrap', fontFamily: fontFamilyCss('sans') }}>{firma.cargo}</p>
            </div>
          );
        }

        // ── LÍNEA decorativa (opcionalmente subrayado adaptado a un texto) ──
        if (tipoCampo(key) === 'linea') {
          const c = raw as CampoLinea;
          let left = c.x ?? 0, width = c.w ?? 200;
          const obj = c.sigueA ? campos[c.sigueA] : undefined;
          if (obj && tipoCampo(c.sigueA!) === 'texto') {
            const fit = lineaSigueTexto(obj as CampoTexto, vars);
            if (fit) { left = fit.x; width = fit.w; }
          }
          return (
            <div key={key} style={{ position: 'absolute', left, top: c.y ?? 0, width, borderTop: `${c.thickness ?? 1.5}px solid ${c.color ?? '#c9a24b'}` }} />
          );
        }

        // ── QR ──
        if (key === 'qr') {
          const c = raw as CampoQR;
          const size = c.size ?? 90;
          return (
            <div key={key} style={{ position: 'absolute', left: c.x ?? 0, top: c.y ?? 0, width: size, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR" style={{ width: size, height: size }} />
              ) : (
                <div style={{
                  width: size, height: size, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: '#94a3b8', fontFamily: '"Courier New", monospace',
                }}>QR</div>
              )}
              {c.showCodigo !== false && (
                <p style={{ margin: '4px 0 0', fontSize: 8, color: '#94a3b8', fontFamily: '"Courier New", monospace', textAlign: 'center', width: size + 20, wordBreak: 'break-all', lineHeight: 1.2 }}>
                  {codigo}
                </p>
              )}
            </div>
          );
        }

        // ── Campo de texto ──
        const c = raw as CampoTexto;
        const txt = expandirLienzo(c.text ?? '', vars);
        const plano = quitarBold(txt);            // sin marcas ** (para medir / detectar vacío)
        if (!plano.trim()) return null;
        const weight = c.weight ?? (c.bold ? 700 : 400);
        const measureTxt = c.uppercase ? plano.toUpperCase() : plano;
        const fontSize = c.autoFit
          ? fitSize(measureTxt, c.w ?? 400, c.size ?? 20, weight, !!c.italic, fontFamilyCss(c.font), c.tracking ?? 0)
          : (c.size ?? 20);
        const style: CSSProperties = {
          position: 'absolute',
          left: c.x ?? 0,
          top: c.y ?? 0,
          width: c.w ?? 400,
          margin: 0,
          fontSize,
          color: c.color ?? '#0f172a',
          textAlign: c.align ?? 'center',
          fontWeight: weight,
          fontStyle: c.italic ? 'italic' : 'normal',
          textTransform: c.uppercase ? 'uppercase' : 'none',
          letterSpacing: c.tracking ? `${c.tracking}px` : undefined,
          lineHeight: 1.2,
          whiteSpace: 'pre-wrap',
          fontFamily: fontFamilyCss(c.font),
        };
        const boldWeight = Math.max(weight, 700);
        // Línea DEBAJO del texto (opción "underline"): del ancho del texto, alineada
        // como él y separada por underlineOffset. Reusa la medición del subrayado adaptado.
        let subrayado: CSSProperties | null = null;
        if (c.underline) {
          const fit = lineaSigueTexto(c, vars);
          if (fit) {
            const lineCount = measureTxt.split('\n').length || 1;
            const top = (c.y ?? 0) + lineCount * fontSize * 1.2 + (c.underlineOffset ?? 6);
            subrayado = {
              position: 'absolute', left: fit.x, top, width: fit.w,
              borderTop: `${c.underlineThickness ?? 1.5}px solid ${c.underlineColor ?? c.color ?? '#0f172a'}`,
            };
          }
        }
        return (
          <div key={key}>
            <p style={style}>
              {segmentosBold(txt).map((s, i) =>
                s.bold
                  ? <strong key={i} style={{ fontWeight: boldWeight }}>{s.text}</strong>
                  : <span key={i}>{s.text}</span>,
              )}
            </p>
            {subrayado && <div style={subrayado} />}
          </div>
        );
      })}
    </>
  );
}
