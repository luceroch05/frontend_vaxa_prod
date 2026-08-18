/* ────────────────────────────────────────────────────────────────
 * <LienzoDragLayer> — capa de arrastre tipo Canva (SOLO overlay).
 *
 * Se monta ENCIMA de la vista previa existente (mismo viewport 1122×794,
 * escalado por `scale`) y pone una caja transparente por campo que se
 * ARRASTRA para moverlo. Extras tipo Canva:
 *   · Guías de alineación + snap: al arrastrar aparecen líneas cuando el
 *     campo queda alineado con otro (borde/centro) o con el centro del
 *     lienzo, y la posición se "pega". Mantén Alt para mover libre.
 *   · Deshacer (Ctrl/Cmd+Z): revierte el último movimiento.
 *   · Flechas del teclado: ajuste fino (Shift = 10 px).
 * El modelo sigue siendo X/Y: no cambia el guardado ni el PDF.
 * ──────────────────────────────────────────────────────────────── */
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { imgUrl } from '@/lib/api/client';
import {
  CampoTexto, CampoQR, CampoLogo, CampoFirma, CampoLinea, LayoutLienzo, Box,
  campoBox, snapToGuides, labelCampo, tipoCampo, indiceLogo, LIENZO_W as W, LIENZO_H as H,
} from './layout';

type Campo = CampoTexto & CampoQR & CampoLogo & CampoFirma & CampoLinea;

interface Props {
  layout: LayoutLienzo;
  /** Escala a la que se muestra la preview (displayWidth / 1122). */
  scale: number;
  onMove: (key: string, x: number, y: number) => void;
  /** Campo seleccionado (controlado desde afuera para compartirlo con el panel de propiedades). */
  selectedKey?: string | null;
  /** Se llama al seleccionar/deseleccionar un campo (clic en el campo o en zona vacía). */
  onSelectField?: (key: string | null) => void;
  /** Logos seleccionados (mismo orden que en la preview). Sirve para ajustar la
   *  caja de selección de cada logo a la forma real de su imagen. */
  logos?: { imagen_logo: string }[];
}

/** Padding extra: el selector mide un poquito más que la imagen, no un cuadrado. */
const HUG_PAD = 4;

/**
 * Mide la relación de aspecto (ancho/alto) de cada imagen dada su URL, cargándola
 * fuera de pantalla. Devuelve un mapa url→aspecto; mientras carga, la url no está.
 */
function useImageAspects(urls: string[]): Record<string, number> {
  const [aspects, setAspects] = useState<Record<string, number>>({});
  const key = urls.join('|');
  useEffect(() => {
    urls.forEach((url) => {
      if (!url) return;
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setAspects((a) => (a[url] ? a : { ...a, [url]: img.naturalWidth / img.naturalHeight }));
        }
      };
      img.src = url;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return aspects;
}

/**
 * Caja que "abraza" un logo: el logo se dibuja con object-fit: contain dentro de
 * un cuadrado size×size, así que una imagen angosta deja aire a los lados. Con su
 * aspecto real calculamos el recuadro que ocupa de verdad (centrado) + un pelín
 * de padding. Sin aspecto todavía (cargando), cae al cuadrado original.
 */
function logoHugBox(c: Campo, aspect?: number): Box {
  const s = c.size ?? 100;
  const x = c.x ?? 0, y = c.y ?? 0;
  if (!aspect || !Number.isFinite(aspect)) return { x, y, w: s, h: s };
  let w = s, h = s;
  if (aspect >= 1) h = s / aspect;   // imagen ancha → sobra alto
  else w = s * aspect;               // imagen angosta → sobra ancho
  return {
    x: x + (s - w) / 2 - HUG_PAD,
    y: y + (s - h) / 2 - HUG_PAD,
    w: w + HUG_PAD * 2,
    h: h + HUG_PAD * 2,
  };
}

export default function LienzoDragLayer({ layout, scale, onMove, selectedKey: selProp, onSelectField, logos = [] }: Props) {
  const aspects = useImageAspects(logos.map((l) => imgUrl(l.imagen_logo)).filter(Boolean));
  // Selección controlada si el padre la pasa; si no, estado interno (retrocompatible).
  const [innerSel, setInnerSel] = useState<string | null>(null);
  const selectedKey = selProp !== undefined ? selProp : innerSel;
  const setSelectedKey = (k: string | null) => { setInnerSel(k); onSelectField?.(k); };
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });
  const rootRef = useRef<HTMLDivElement>(null);
  // Arrastre en curso: qué campo y desde dónde (coords del campo + puntero en pantalla).
  const drag = useRef<{ key: string; startX: number; startY: number; cx: number; cy: number } | null>(null);
  // Pila de deshacer: posición previa de cada movimiento (una entrada por gesto).
  const undoStack = useRef<{ key: string; x: number; y: number }[]>([]);

  const campos = layout.campos ?? {};
  const clamp = (v: number, max: number) => Math.max(0, Math.min(max, v));

  /**
   * Limita x/y para que el elemento no se salga del lienzo. Para los LOGOS el
   * límite se calcula contra la imagen REAL (centrada en su cuadrado size×size),
   * no contra el cuadrado: así un logo ancho puede subir hasta el borde de arriba
   * en vez de frenarse a media altura. El PDF centra igual, así que coincide.
   */
  const clampXY = (key: string, c: Campo, x: number, y: number): { x: number; y: number } => {
    if (tipoCampo(key) === 'logo') {
      const ar = aspects[imgUrl(logos[indiceLogo(key)]?.imagen_logo ?? '')];
      if (ar && Number.isFinite(ar)) {
        const s = c.size ?? 100;
        const rw = ar >= 1 ? s : s * ar;   // ancho real de la imagen
        const rh = ar >= 1 ? s / ar : s;    // alto real de la imagen
        const gapX = (s - rw) / 2, gapY = (s - rh) / 2;  // aire por el centrado
        return {
          x: Math.round(Math.max(-gapX, Math.min(W - gapX - rw, x))),
          y: Math.round(Math.max(-gapY, Math.min(H - gapY - rh, y))),
        };
      }
    }
    return { x: clamp(Math.round(x), W), y: clamp(Math.round(y), H) };
  };

  const pushUndo = (key: string, x: number, y: number) => {
    undoStack.current.push({ key, x, y });
    if (undoStack.current.length > 100) undoStack.current.shift();
  };

  const undo = () => {
    const prev = undoStack.current.pop();
    if (!prev || !campos[prev.key]) return;   // nada que deshacer / campo ya no existe
    onMove(prev.key, prev.x, prev.y);
    setSelectedKey(prev.key);
    setGuides({ v: [], h: [] });
  };

  const onBoxDown = (e: ReactPointerEvent, key: string, c: Campo) => {
    e.stopPropagation();               // no burbujea → no deselecciona
    setSelectedKey(key);
    rootRef.current?.focus();          // habilita teclado (flechas + Ctrl+Z)
    pushUndo(key, c.x ?? 0, c.y ?? 0); // guarda la posición previa (1 entrada por arrastre)
    drag.current = { key, startX: c.x ?? 0, startY: c.y ?? 0, cx: e.clientX, cy: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onBoxMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const c = campos[d.key] as Campo | undefined;
    if (!c) return;
    // La preview está escalada: 1 px real = `scale` px en pantalla → dividir el delta.
    const { x: rawX, y: rawY } = clampXY(d.key, c,
      d.startX + (e.clientX - d.cx) / scale,
      d.startY + (e.clientY - d.cy) / scale);

    const base = campoBox(d.key, c);   // solo para w/h (no dependen de x/y)
    if (e.altKey) {                    // Alt = mover libre, sin snap ni guías
      onMove(d.key, rawX, rawY);
      setGuides({ v: [], h: [] });
      return;
    }
    const others = Object.entries(campos)
      .filter(([k, r]) => k !== d.key && (r as Campo).on !== false)
      .map(([k, r]) => campoBox(k, r as Campo));
    const snap = snapToGuides({ x: rawX, y: rawY, w: base.w, h: base.h }, others);
    onMove(d.key, snap.x, snap.y);
    setGuides({ v: snap.vLines, h: snap.hLines });
  };

  const endDrag = (e: ReactPointerEvent) => {
    if (drag.current) { try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ } }
    drag.current = null;
    setGuides({ v: [], h: [] });
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (!selectedKey) return;
    const c = campos[selectedKey] as Campo | undefined;
    if (!c) return;
    const step = e.shiftKey ? 10 : 1;
    let dx = 0, dy = 0;
    if (e.key === 'ArrowLeft') dx = -step;
    else if (e.key === 'ArrowRight') dx = step;
    else if (e.key === 'ArrowUp') dy = -step;
    else if (e.key === 'ArrowDown') dy = step;
    else return;
    e.preventDefault();
    pushUndo(selectedKey, c.x ?? 0, c.y ?? 0);   // cada nudge es deshacible
    const nudged = clampXY(selectedKey, c, (c.x ?? 0) + dx, (c.y ?? 0) + dy);
    onMove(selectedKey, nudged.x, nudged.y);
  };

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={() => setSelectedKey(null)}   // clic en zona vacía = deseleccionar
      style={{ position: 'absolute', inset: 0, width: W, height: H, outline: 'none' }}
    >
      {/* Cajas arrastrables */}
      {Object.entries(campos).map(([key, raw]) => {
        const c = (raw ?? {}) as Campo;
        if (c.on === false) return null;
        // Los logos usan una caja que abraza la imagen real (no el cuadrado size×size).
        let box = tipoCampo(key) === 'logo'
          ? logoHugBox(c, aspects[imgUrl(logos[indiceLogo(key)]?.imagen_logo ?? '')])
          : campoBox(key, c);
        // Línea que subraya un texto: el agarre cubre la zona del texto (su ancho real
        // lo mide el render; aquí basta con la caja del texto para poder tomarla).
        if (tipoCampo(key) === 'linea' && c.sigueA && campos[c.sigueA] && tipoCampo(c.sigueA) === 'texto') {
          const t = campos[c.sigueA] as Campo;
          box = { x: t.x ?? 0, y: (c.y ?? 0) - 5, w: t.w ?? 400, h: box.h };
        }
        const sel = selectedKey === key;
        return (
          <div
            key={key}
            title={`${labelCampo(key, c)} · clic para editar sus propiedades`}
            onPointerDown={e => onBoxDown(e, key, c)}
            onPointerMove={onBoxMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={{
              position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h,
              cursor: 'move', zIndex: sel ? 20 : 10, borderRadius: 3,
              // Sin marco cuando no está seleccionado → la preview se ve limpia.
              border: sel ? '2px dashed #EA580C' : 'none',
              background: sel ? 'rgba(234,88,12,0.08)' : 'transparent',
            }}
          />
        );
      })}

      {/* Guías de alineación (rosa, no interactivas) */}
      {guides.v.map((gx, i) => (
        <div key={`v${i}`} style={{ position: 'absolute', left: gx, top: 0, width: 1, height: H, background: '#F43F5E', zIndex: 30, pointerEvents: 'none' }} />
      ))}
      {guides.h.map((gy, i) => (
        <div key={`h${i}`} style={{ position: 'absolute', top: gy, left: 0, height: 1, width: W, background: '#F43F5E', zIndex: 30, pointerEvents: 'none' }} />
      ))}
    </div>
  );
}
