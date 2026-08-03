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
import { CampoFirma, CampoLinea, CampoLogo, CampoQR, CampoTexto, LayoutLienzo, expandirLienzo, fontFamilyCss, tipoCampo, indiceLogo, indiceFirma } from './layout';

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
function fitSize(text: string, maxW: number, base: number, weight: number, italic: boolean, family: string, tracking: number): number {
  if (typeof document === 'undefined') return base;
  _mCanvas = _mCanvas || document.createElement('canvas');
  const ctx = _mCanvas.getContext('2d');
  if (!ctx) return base;
  const lineas = text.split('\n');
  let size = base;
  while (size > 8) {
    ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${family}`;
    const w = Math.max(...lineas.map(l => ctx.measureText(l).width + tracking * Math.max(0, l.length - 1)));
    if (w <= maxW) break;
    size -= 1;
  }
  return size;
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

        // ── LÍNEA decorativa ──
        if (tipoCampo(key) === 'linea') {
          const c = raw as CampoLinea;
          return (
            <div key={key} style={{ position: 'absolute', left: c.x ?? 0, top: c.y ?? 0, width: c.w ?? 200, borderTop: `${c.thickness ?? 1.5}px solid ${c.color ?? '#c9a24b'}` }} />
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
        if (!txt.trim()) return null;
        const weight = c.weight ?? (c.bold ? 700 : 400);
        const measureTxt = c.uppercase ? txt.toUpperCase() : txt;
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
        return <p key={key} style={style}>{txt}</p>;
      })}
    </>
  );
}
