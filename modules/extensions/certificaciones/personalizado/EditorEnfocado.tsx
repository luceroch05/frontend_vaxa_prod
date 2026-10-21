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
import { type LayoutLienzo, sincronizarFirmas, sincronizarLogos, sincronizarLogoObligatorio, logoKey, presetActa } from './layout';
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
  minutos?: number;
  creditos?: number;
  /** Fechas reales del aula (ISO) para que el preview muestre las fechas correctas. */
  fechaInicio?: string | null;
  fechaFin?: string | null;
  fechaDia2?: string | null;
  fechaDia3?: string | null;
  layout: LayoutLienzo | null;
  onLayoutChange: (l: LayoutLienzo) => void;
  /** Nº de firmas ELEGIDAS en la config → se crean solas como espacios en el lienzo. */
  numFirmas: number;
  /** ¿El programa tiene acta (unidades)? Solo entonces se muestra la Hoja 2. */
  tieneActa?: boolean;
  /** Unidades del programa → réplica del acta real en la Hoja 2. */
  actaUnidades?: { id: number; nombre: string; creditos?: number; tipo?: string }[];
  /** El programa no lleva evaluación → la Hoja 2 se muestra como temario (sin notas). */
  actaEsTemario?: boolean;
  /** Lleva créditos → columna CRÉD. + total en el acta (convive con notas). */
  actaEsCreditos?: boolean;
  /** Config del acta (qué datos muestra, título y texto extra). */
  actaConfig?: import('../shared/types').ActaConfig | null;
  /** Muestra REAL (alumno + notas) para la vista previa. */
  muestra?: { nombre: string; documento: string; grupo: string; notas: Record<number, number>; promedio: string; condicion: string } | null;
  /** Índice 0-based del logo OBLIGATORIO de la empresa (es_default) dentro de los
   *  logos seleccionados. Su slot no se puede ocultar ni borrar. -1/null = ninguno. */
  logoObligIndex?: number | null;
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
  // Zoom de la hoja: 1 = ajustada al área. Se puede acercar/alejar (con scroll al acercar).
  const [zoom, setZoom] = useState(1);
  const ZOOM_MIN = 0.5, ZOOM_MAX = 3;
  const clampZoom = (z: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(z * 100) / 100));
  const dispW = Math.max(240, Math.round(canvasW * zoom));
  // Hoja que se está editando: 1 (principal) o 2 (acta/créditos, en blanco).
  // La Hoja 2 solo existe si el programa tiene acta (unidades).
  const tieneActa = props.tieneActa ?? false;
  const [pagina, setPagina] = useState(1);

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

  // Sincroniza los slots de logo con los logos ELEGIDOS en la config (al abrir y si
  // cambia la cantidad): así los logos seleccionados aparecen solos en el editor,
  // igual que las firmas, sin necesidad de un botón "agregar logo".
  useEffect(() => {
    const actual = layoutRef.current;
    const { campos, changed } = sincronizarLogos(actual?.campos ?? {}, props.logos.length);
    if (changed) props.onLayoutChange({ ...(actual ?? { activo: true }), activo: true, campos });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.logos.length]);

  // El logo obligatorio de la empresa (es_default) SIEMPRE debe tener su slot visible:
  // se crea si falta y se fuerza a visible (el inspector impide ocultarlo/borrarlo).
  useEffect(() => {
    const actual = layoutRef.current;
    const { campos, changed } = sincronizarLogoObligatorio(actual?.campos ?? {}, props.logoObligIndex);
    if (changed) props.onLayoutChange({ ...(actual ?? { activo: true }), activo: true, campos });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.logoObligIndex]);

  // Al entrar a la Hoja 2, el acta ya debe quedar EDITABLE sin pulsar el botón "Acta":
  // si el programa tiene acta y aún no está como lienzo, la convertimos sola (inyecta
  // título, datos, tabla y resumen como elementos movibles/ocultables).
  useEffect(() => {
    if (pagina !== 2 || !tieneActa) return;
    const actual = layoutRef.current;
    if (!actual?.actaCustom) {
      // Primera conversión: inyecta TODO el preset del acta.
      props.onLayoutChange({
        ...(actual ?? { activo: true }), activo: true, actaCustom: true,
        campos: { ...(actual?.campos ?? {}), ...presetActa() },
      });
    } else if (!actual.campos?.actatablacred) {
      // Layout viejo (convertido antes de existir la tabla de créditos): se la agregamos
      // sin tocar lo demás, para que aparezca como elemento aparte.
      props.onLayoutChange({ ...actual, campos: { ...actual.campos, actatablacred: presetActa().actatablacred } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, tieneActa]);

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

      {/* Pestañas de hoja: la 2 (acta/créditos) solo aparece si el programa tiene acta. */}
      {tieneActa && (
        <div className="flex items-center gap-2 px-4 pt-2 shrink-0" style={{ background: '#fff' }}>
          {[1, 2].map(n => {
            const activa = pagina === n;
            return (
              <button key={n} type="button" onClick={() => { setPagina(n); props.onSelectField(null); }}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-t-lg transition-colors"
                style={activa
                  ? { background: '#0F1115', color: '#fff' }
                  : { background: '#F1F1F4', color: '#6B7280' }}>
                {n === 1 ? 'Hoja 1 · Certificado' : 'Hoja 2 · Acta / créditos'}
              </button>
            );
          })}
          {pagina === 2 && (
            <span className="text-[11px]" style={{ color: '#9CA3AF' }}>
              Hoja en blanco — agrega QR, logos de convenios, textos…
            </span>
          )}
        </div>
      )}

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
          pagina={pagina}
          numLogos={props.logos.length}
          logoObligIndex={props.logoObligIndex}
          conActa={tieneActa}
        />
      </div>

      {/* Lienzo grande (centro) + Propiedades (derecha) */}
      <div className="flex-1 flex min-h-0">
        <div
          ref={areaRef}
          className="flex-1 min-w-0 relative overflow-auto"
          onWheel={e => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(z => clampZoom(z - e.deltaY * 0.0015)); } }}
        >
          {/* min-width:min-content evita que el centrado recorte la hoja cuando el zoom la hace más grande que el área (se scrollea). */}
          <div className="flex items-center justify-center p-5" style={{ minWidth: 'min-content', minHeight: '100%' }}>
            <div style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.18)', flexShrink: 0 }}>
              <CertificadoPreview
                plantillaUrl={props.plantillaUrl}
                logos={props.logos}
                firmas={props.firmas}
                texto={props.texto}
                tipoPrograma={props.tipoPrograma}
                programaNombre={props.programaNombre}
                horas={props.horas}
                minutos={props.minutos}
                creditos={props.creditos}
                fechaInicio={props.fechaInicio}
                fechaFin={props.fechaFin}
                fechaDia2={props.fechaDia2}
                fechaDia3={props.fechaDia3}
                layout={props.layout}
                displayWidth={dispW}
                editable
                onLayoutChange={props.onLayoutChange}
                selectedKey={props.selectedKey}
                onSelectField={props.onSelectField}
                pagina={pagina}
                actaUnidades={props.actaUnidades}
                actaEsTemario={props.actaEsTemario}
                actaEsCreditos={props.actaEsCreditos}
                actaConfig={props.actaConfig}
                muestra={props.muestra}
              />
            </div>
          </div>

          {/* Control de zoom (flotante, abajo al centro) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1.5 py-1 rounded-xl shadow-lg select-none"
            style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
            <button type="button" onClick={() => setZoom(z => clampZoom(z - 0.1))} disabled={zoom <= ZOOM_MIN}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[16px] font-bold disabled:opacity-40"
              style={{ background: '#F6F6F8', color: '#4B5563' }} title="Alejar (Ctrl + rueda)">−</button>
            <button type="button" onClick={() => setZoom(1)}
              className="min-w-[52px] text-[12px] font-semibold px-1.5 py-1 rounded-lg"
              style={{ color: '#4B5563' }} title="Ajustar a la pantalla (100%)">{Math.round(zoom * 100)}%</button>
            <button type="button" onClick={() => setZoom(z => clampZoom(z + 0.1))} disabled={zoom >= ZOOM_MAX}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[16px] font-bold disabled:opacity-40"
              style={{ background: '#F6F6F8', color: '#4B5563' }} title="Acercar (Ctrl + rueda)">+</button>
          </div>
        </div>
        <div className="w-[300px] shrink-0 overflow-y-auto p-3" style={{ background: '#F7F7F9', borderLeft: '1px solid #E5E7EB' }}>
          <InspectorLienzo
            layout={props.layout}
            selectedKey={props.selectedKey}
            onChange={props.onLayoutChange}
            onSelect={props.onSelectField}
            logoObligKey={props.logoObligIndex != null && props.logoObligIndex >= 0 ? logoKey(props.logoObligIndex) : null}
            tieneActa={tieneActa}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
