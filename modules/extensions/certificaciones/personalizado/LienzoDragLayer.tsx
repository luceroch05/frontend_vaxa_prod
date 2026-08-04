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
import { useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  CampoTexto, CampoQR, CampoLogo, CampoFirma, CampoLinea, LayoutLienzo,
  campoBox, snapToGuides, labelCampo, LIENZO_W as W, LIENZO_H as H,
} from './layout';

type Campo = CampoTexto & CampoQR & CampoLogo & CampoFirma & CampoLinea;

interface Props {
  layout: LayoutLienzo;
  /** Escala a la que se muestra la preview (displayWidth / 1122). */
  scale: number;
  onMove: (key: string, x: number, y: number) => void;
  /** Doble click en un campo → editar sus propiedades (fuente, tamaño…) abajo. */
  onEditField?: (key: string) => void;
}

export default function LienzoDragLayer({ layout, scale, onMove, onEditField }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });
  const rootRef = useRef<HTMLDivElement>(null);
  // Arrastre en curso: qué campo y desde dónde (coords del campo + puntero en pantalla).
  const drag = useRef<{ key: string; startX: number; startY: number; cx: number; cy: number } | null>(null);
  // Pila de deshacer: posición previa de cada movimiento (una entrada por gesto).
  const undoStack = useRef<{ key: string; x: number; y: number }[]>([]);

  const campos = layout.campos ?? {};
  const clamp = (v: number, max: number) => Math.max(0, Math.min(max, v));

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
    const rawX = clamp(Math.round(d.startX + (e.clientX - d.cx) / scale), W);
    const rawY = clamp(Math.round(d.startY + (e.clientY - d.cy) / scale), H);

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
    onMove(selectedKey, clamp((c.x ?? 0) + dx, W), clamp((c.y ?? 0) + dy, H));
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
        const box = campoBox(key, c);
        const sel = selectedKey === key;
        return (
          <div
            key={key}
            title={`${labelCampo(key, c)} · doble click para editar`}
            onPointerDown={e => onBoxDown(e, key, c)}
            onPointerMove={onBoxMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onDoubleClick={() => onEditField?.(key)}
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
