/* ────────────────────────────────────────────────────────────────
 * <EditorEnfocado> — editor de diseño en MODO ENFOCADO, estilo Canva.
 *
 * Ocupa la pantalla a la derecha del menú (el menú sigue visible), con el
 * lienzo GRANDE que cabe ENTERO (sin scroll): se calcula el ancho para que
 * quepa por alto y por ancho. Barra de herramientas arriba (limpia, iconos)
 * y panel de Propiedades a la derecha. Reusa CertificadoPreview + EditorLienzo
 * + InspectorLienzo (mismas herramientas). Ver [[feature-diseno-personalizado-lienzo]].
 * ──────────────────────────────────────────────────────────────── */
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { createPortal } from 'react-dom';
import CertificadoPreview from '../shared/components/CertificadoPreview';
import { W, H } from '../shared/components/CertificadoPDF';
import EditorLienzo from './EditorLienzo';
import InspectorLienzo from './InspectorLienzo';
import { type LayoutLienzo, sincronizarFirmas } from './layout';
import { X } from '@/components/ui/icon';

type PreviewProps = ComponentProps<typeof CertificadoPreview>;

interface Props {
  plantillaUrl?: string | null;
  logos: PreviewProps['logos'];
  firmas: PreviewProps['firmas'];
  texto?: string | null;
  tipoPrograma?: string;
  programaNombre?: string;
  horas?: number;
  creditos?: number;
  layout: LayoutLienzo | null;
  onLayoutChange: (l: LayoutLienzo) => void;
  /** Nº de firmas ELEGIDAS en la config → se crean solas como espacios en el lienzo. */
  numFirmas: number;
  selectedKey: string | null;
  onSelectField: (k: string | null) => void;
  baseLayout?: LayoutLienzo | null;
  onSaveBase?: (l: LayoutLienzo) => void;
  savingBase?: boolean;
  baseSaved?: boolean;
  onClose: () => void;
}

/** Ancho del menú lateral (w-[220px] en AdminLayout). El editor arranca después. */
const SIDEBAR_W = 220;

export default function EditorEnfocado(props: Props) {
  const { onClose } = props;
  const areaRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(760);

  // Calcula el ancho para que el certificado quepa ENTERO en el área (por ancho
  // y por alto): así no hay scroll. Recalcula al montar y al cambiar el tamaño.
  useLayoutEffect(() => {
    const medir = () => {
      const el = areaRef.current;
      if (!el) return;
      const availW = el.clientWidth - 40;
      const availH = el.clientHeight - 40;
      setCanvasW(Math.max(360, Math.floor(Math.min(availW, availH * (W / H)))));
    };
    medir();
    const ro = new ResizeObserver(medir);
    if (areaRef.current) ro.observe(areaRef.current);
    window.addEventListener('resize', medir);
    return () => { ro.disconnect(); window.removeEventListener('resize', medir); };
  }, []);

  // Sincroniza los espacios de firma con las firmas elegidas en la config (al abrir
  // y si cambia la cantidad). Así no hay que "agregar firma" a mano: salen solas.
  const layoutRef = useRef(props.layout);
  layoutRef.current = props.layout;
  useEffect(() => {
    const actual = layoutRef.current;
    const { campos, changed } = sincronizarFirmas(actual?.campos ?? {}, props.numFirmas);
    if (changed) props.onLayoutChange({ ...(actual ?? { activo: true }), activo: true, campos });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.numFirmas]);

  // Esc cierra + bloquea scroll del fondo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return createPortal(
    <div className="fixed z-[90] flex flex-col" style={{ left: SIDEBAR_W, top: 0, right: 0, bottom: 0, background: '#EBECF0' }}>
      {/* Barra superior (chrome tipo Canva) */}
      <div className="flex items-center justify-between px-5 py-2.5 shrink-0" style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>Editor de diseño</span>
          <span className="text-[11px] hidden md:inline" style={{ color: '#9CA3AF' }}>arrastra para ubicar · clic = editar · Ctrl+Z deshace</span>
        </div>
        <button onClick={onClose} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-1.5 rounded-lg text-white" style={{ background: '#7C3AED' }}>
          <X size={14} /> Listo
        </button>
      </div>

      {/* Barra de herramientas (agregar elementos + guardar base) */}
      <div className="px-4 py-2 shrink-0" style={{ background: '#fff', borderBottom: '1px solid #EEF0F2' }}>
        <EditorLienzo
          value={props.layout}
          onChange={props.onLayoutChange}
          onSelect={props.onSelectField}
          baseLayout={props.baseLayout}
          onSaveBase={props.onSaveBase}
          savingBase={props.savingBase}
          baseSaved={props.baseSaved}
          compact
          firmasAuto
        />
      </div>

      {/* Lienzo grande (centro) + Propiedades (derecha) */}
      <div className="flex-1 flex min-h-0">
        <div ref={areaRef} className="flex-1 min-w-0 flex items-center justify-center p-5 overflow-hidden">
          <div style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.18)' }}>
            <CertificadoPreview
              plantillaUrl={props.plantillaUrl}
              logos={props.logos}
              firmas={props.firmas}
              texto={props.texto}
              tipoPrograma={props.tipoPrograma}
              programaNombre={props.programaNombre}
              horas={props.horas}
              creditos={props.creditos}
              layout={props.layout}
              displayWidth={canvasW}
              editable
              onLayoutChange={props.onLayoutChange}
              selectedKey={props.selectedKey}
              onSelectField={props.onSelectField}
            />
          </div>
        </div>
        <div className="w-[300px] shrink-0 overflow-y-auto p-3" style={{ background: '#F7F7F9', borderLeft: '1px solid #E5E7EB' }}>
          <InspectorLienzo
            layout={props.layout}
            selectedKey={props.selectedKey}
            onChange={props.onLayoutChange}
            onSelect={props.onSelectField}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
