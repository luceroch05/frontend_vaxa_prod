/* ────────────────────────────────────────────────────────────────
 * <LienzoCampos> — dibuja SOLO los campos dinámicos del modo lienzo
 * (nombre, calidad, fecha, evento, QR) posicionados por coordenadas.
 *
 * No dibuja el fondo: el componente padre coloca el arte del cliente y
 * superpone este overlay (mismo viewport 1122×794). Se reutiliza en la
 * vista previa de configuración, en el visor/descarga y en el editor.
 * ──────────────────────────────────────────────────────────────── */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { imgUrl } from '@/lib/api/client';
import { CampoFirma, CampoFirmaTexto, CampoLinea, CampoLogo, CampoQR, CampoTexto, LayoutLienzo, expandirLienzo, fontFamilyCss, fontEsPesoUnico, tipoCampo, indiceLogo, indiceFirma, paginaDe, segmentosBold, quitarBold } from './layout';

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
  /** Hoja a dibujar: 1 (principal, default) o 2 (acta/créditos). */
  pagina?: number;
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
  // Fuentes de un solo peso no tienen negrita real: forzamos 400 para que la
  // medición (y por tanto el ancho de la línea) coincida con el PDF final.
  const weight = fontEsPesoUnico(campo.font) ? 400 : (campo.weight ?? (campo.bold ? 700 : 400));
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

/** Campo de texto del lienzo con "línea debajo" opcional. La línea se mide sobre
 *  el texto YA renderizado (offsetWidth/offsetLeft), no con un canvas aparte, así
 *  cubre EXACTO todo el texto sin importar la fuente, el tamaño ni el tracking
 *  (antes, con fuentes serif/cursivas, la línea salía más corta). */
function TextoLienzo({ campoKey, style, segments, boldWeight, underline, onMeasure }: {
  campoKey: string;
  style: CSSProperties;
  segments: { text: string; bold: boolean }[];
  boldWeight: number;
  underline: { offset: number; thickness: number; color: string } | null;
  onMeasure: (key: string, geom: { left: number; width: number; bottom: number }) => void;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);

  // Publica la geometría real del texto (para líneas decorativas que lo "siguen").
  useLayoutEffect(() => {
    const span = spanRef.current;
    if (!span) return;
    const px = (v: string | number | undefined) => typeof v === 'number' ? v : (parseFloat(String(v ?? 0)) || 0);
    onMeasure(campoKey, {
      left:   px(style.left) + span.offsetLeft,
      width:  span.offsetWidth,
      bottom: px(style.top) + span.offsetTop + span.offsetHeight,
    });
  });

  // La "línea debajo" es el border-bottom del PROPIO texto: por CSS mide EXACTAMENTE
  // el ancho del texto (incluye el grado/término), separada por paddingBottom. No se
  // mide nada, así que es imposible que quede corta con cualquier fuente.
  const spanStyle: CSSProperties = underline
    ? { display: 'inline-block', borderBottom: `${underline.thickness}px solid ${underline.color}`, paddingBottom: underline.offset }
    : { display: 'inline-block' };

  return (
    <p style={style}>
      <span ref={spanRef} style={spanStyle}>
        {segments.map((s, i) => s.bold
          ? <strong key={i} style={{ fontWeight: boldWeight }}>{s.text}</strong>
          : <span key={i}>{s.text}</span>)}
      </span>
    </p>
  );
}

/** Carga las fuentes del lienzo y fuerza un re-render cuando estén listas. Sin
 *  esto, la primera medición del ancho (canvas measureText) usa la fuente de
 *  reemplazo del sistema y la "línea debajo" sale MÁS CORTA que el texto en
 *  fuentes cursivas/decorativas (Great Vibes, Lobster, Pacifico…). Al re-medir
 *  con la fuente ya cargada, la línea cubre todo el texto. */
function useFuentesListas(familias: string): void {
  const [, bump] = useState(0);
  useEffect(() => {
    const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
    if (!fonts) return;
    let cancel = false;
    const cargas = familias.split('|').filter(Boolean)
      .flatMap((fam) => ['400', '700'].map((w) => fonts.load(`${w} 40px ${fam}`).catch(() => undefined)));
    Promise.all(cargas)
      .then(() => fonts.ready)
      .then(() => { if (!cancel) bump((n) => n + 1); });
    return () => { cancel = true; };
  }, [familias]);
}

export default function LienzoCampos({ layout, vars, codigo, qrDataUrl, logos = [], firmas = [], pagina = 1 }: Props) {
  const campos = layout.campos ?? {};

  // Familias realmente usadas por los campos → se cargan y, al estar listas, se
  // re-mide el ancho para que la "línea debajo" coincida con el texto.
  const familiasUsadas = useMemo(() => {
    const set = new Set<string>([fontFamilyCss('sans')]);   // firmas usan 'sans'
    for (const raw of Object.values(campos)) {
      set.add(fontFamilyCss((raw as CampoTexto | undefined)?.font));
    }
    return Array.from(set).join('|');
  }, [campos]);
  useFuentesListas(familiasUsadas);

  // Geometría real (medida en el DOM) de cada campo de texto. La usan las líneas
  // decorativas que "siguen" a un texto, para tomar su ancho/centro exactos.
  const [medidas, setMedidas] = useState<Record<string, { left: number; width: number; bottom: number }>>({});
  const reportarMedida = useCallback((key: string, g: { left: number; width: number; bottom: number }) => {
    setMedidas(prev => {
      const a = prev[key];
      if (a && a.left === g.left && a.width === g.width && a.bottom === g.bottom) return prev;
      return { ...prev, [key]: g };
    });
  }, []);

  return (
    <>
      {Object.entries(campos).map(([key, raw]) => {
        if (!raw || (raw as CampoTexto | CampoQR | CampoLogo | CampoFirma).on === false) return null;
        // Solo los campos de esta hoja (1 = principal, 2 = acta/créditos).
        if (paginaDe(raw as { pagina?: number }) !== pagina) return null;

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
          // Tamaño del texto INDEPENDIENTE de la imagen. El nombre usa textSize; el cargo, 2px menos.
          const tSize = c.textSize ?? 12;
          const cargoSize = Math.max(6, tSize - 2);
          return (
            <div key={key} style={{ position: 'absolute', left: c.x ?? 0, top: c.y ?? 0, width: w, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Imagen + línea agrupadas en un contenedor que se ENCOGE al ancho real de la
                  imagen (fit-content), así la línea de abajo mide lo mismo que la firma y no sale larga. */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'fit-content', maxWidth: 'none' }}>
                {/* La imagen manda por ALTURA (h); el ancho es libre según su forma. */}
                <img src={imgUrl(firma.imagen_firma)} alt={firma.nombre_autoridad} style={{ height: h, width: 'auto', maxWidth: 'none', objectFit: 'contain', marginBottom: -6 }} crossOrigin="anonymous" />
                {/* La línea va con el TEXTO. Si el texto está separado (soloImagen), la imagen queda sola SIN línea. */}
                {!c.soloImagen && <div style={{ width: 'calc(100% + 72px)', borderTop: '1.4px solid #475569', marginBottom: 4 }} />}
              </div>
              {/* Nombre + cargo, salvo que el texto esté separado en su propio elemento (firmatextoN). */}
              {!c.soloImagen && <>
                <p style={{ margin: 0, width: w, fontSize: tSize, fontWeight: 700, color: '#1e293b', textAlign: 'center', lineHeight: 1.25, whiteSpace: 'pre-wrap', fontFamily: fontFamilyCss('sans') }}>{firma.nombre_autoridad}</p>
                <p style={{ margin: '2px 0 0', width: w, fontSize: cargoSize, fontStyle: 'italic', color: '#64748b', textAlign: 'center', lineHeight: 1.25, whiteSpace: 'pre-wrap', fontFamily: fontFamilyCss('sans') }}>{firma.cargo}</p>
              </>}
            </div>
          );
        }

        // ── TEXTO DE FIRMA separado (nombre + cargo movibles aparte de la imagen) ──
        if (tipoCampo(key) === 'firmatexto') {
          const c = raw as CampoFirmaTexto;
          const firma = firmas[indiceFirma(key)];
          if (!firma) return null;
          const w = c.w ?? 260;
          const tSize = c.textSize ?? 12;
          const cargoSize = Math.max(6, tSize - 2);
          const align = c.align ?? 'center';
          return (
            <div key={key} style={{ position: 'absolute', left: c.x ?? 0, top: c.y ?? 0, width: w }}>
              {/* La línea va CON el texto: arriba del nombre. */}
              <div style={{ width: w, borderTop: '1.4px solid #475569', marginBottom: 4 }} />
              <p style={{ margin: 0, width: w, fontSize: tSize, fontWeight: 700, color: '#1e293b', textAlign: align, lineHeight: 1.25, whiteSpace: 'pre-wrap', fontFamily: fontFamilyCss('sans') }}>{firma.nombre_autoridad}</p>
              <p style={{ margin: '2px 0 0', width: w, fontSize: cargoSize, fontStyle: 'italic', color: '#64748b', textAlign: align, lineHeight: 1.25, whiteSpace: 'pre-wrap', fontFamily: fontFamilyCss('sans') }}>{firma.cargo}</p>
            </div>
          );
        }

        // ── LÍNEA decorativa (opcionalmente subrayado adaptado a un texto) ──
        if (tipoCampo(key) === 'linea') {
          const c = raw as CampoLinea;
          let left = c.x ?? 0, width = c.w ?? 200;
          const obj = c.sigueA ? campos[c.sigueA] : undefined;
          if (obj && tipoCampo(c.sigueA!) === 'texto') {
            // Preferimos la medida REAL del DOM (cubre todo el texto, incluido el
            // grado/término); si aún no llegó, caemos al cálculo por canvas.
            const dom = medidas[c.sigueA!];
            if (dom) {
              left = dom.left; width = dom.width;
            } else {
              const fit = lineaSigueTexto(obj as CampoTexto, vars);
              if (fit) { left = fit.x; width = fit.w; }
            }
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
        // Fuente de un solo peso → sin negrita real: se muestra en 400 para que la
        // vista previa sea idéntica al PDF (que incrusta solo el .ttf Regular).
        const pesoUnico = fontEsPesoUnico(c.font);
        const weight = pesoUnico ? 400 : (c.weight ?? (c.bold ? 700 : 400));
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
        // En fuentes de un solo peso, el **negrita parcial** tampoco tiene efecto en
        // el PDF → se mantiene en 400 para no mostrar un grosor que luego no saldrá.
        const boldWeight = pesoUnico ? 400 : Math.max(weight, 700);
        // La "línea debajo" la mide TextoLienzo sobre el texto ya pintado, así cubre
        // todo el texto exactamente (sin importar la fuente).
        return (
          <TextoLienzo
            key={key}
            campoKey={key}
            style={style}
            segments={segmentosBold(txt)}
            boldWeight={boldWeight}
            underline={c.underline ? {
              offset: c.underlineOffset ?? 10,   // más aire por defecto (antes 6, quedaba pegada)
              thickness: c.underlineThickness ?? 1.5,
              color: c.underlineColor ?? c.color ?? '#0f172a',
            } : null}
            onMeasure={reportarMedida}
          />
        );
      })}
    </>
  );
}
