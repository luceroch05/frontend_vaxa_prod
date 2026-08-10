/* ────────────────────────────────────────────────────────────────
 * <EditorLienzo> — herramientas del modo "Diseño Personalizado".
 *
 * Ya NO es la lista larga de campos: eso lo muestra <InspectorLienzo> al
 * lado del lienzo (clic en un elemento → sus propiedades a la derecha).
 * Aquí queda lo global: activar/desactivar el modo, la PLANTILLA BASE de la
 * empresa (cargar/guardar) y agregar elementos (campo, línea, firma — máx 3).
 *
 * Plantilla base: cada empresa guarda UNA vez la posición por defecto de sus
 * elementos; al activar el diseño en frío se carga esa base (o, si no la tiene,
 * un arranque genérico). Ya NO hay preset hardcodeado por cliente — lo maneja
 * el usuario. Ver [[feature-diseno-personalizado-lienzo]].
 *
 * Dos presentaciones:
 *  · full (default): tarjeta con el switch + explicación. ARRIBA, para activar.
 *  · compact: barra angosta para la COLUMNA DERECHA cuando ya está activo.
 * ──────────────────────────────────────────────────────────────── */
import {
  LayoutLienzo, layoutActivo, layoutPorDefecto, nuevoCampoTexto, nuevaLinea, nuevaFirma,
  contarFirmas, MAX_FIRMAS,
} from './layout';
import { Plus, FileSignature, Save, CheckCircle, Loader2 } from '@/components/ui/icon';

interface Props {
  value: LayoutLienzo | null;
  onChange: (l: LayoutLienzo) => void;
  /** Selecciona un elemento (p.ej. el recién agregado) para editarlo en el panel. */
  onSelect?: (key: string | null) => void;
  /** Plantilla base guardada de la empresa (o null si aún no guardó ninguna). */
  baseLayout?: LayoutLienzo | null;
  /** Guarda el layout actual como plantilla base de la empresa. */
  onSaveBase?: (l: LayoutLienzo) => void;
  savingBase?: boolean;
  baseSaved?: boolean;
  /** Barra angosta para la columna derecha (asume el modo ya activo). */
  compact?: boolean;
}

export default function EditorLienzo({
  value, onChange, onSelect, baseLayout, onSaveBase, savingBase, baseSaved, compact = false,
}: Props) {
  const layout: LayoutLienzo = value ?? { activo: false, campos: {} };
  const campos = layout.campos ?? {};
  const entries = Object.entries(campos);
  const activo = layoutActivo(layout);
  const firmasCount = contarFirmas(campos);
  const hayBase = layoutActivo(baseLayout);

  const addCampo = () => {
    const { key, campo } = nuevoCampoTexto(entries.filter(([k]) => k !== 'qr').length + 1);
    onChange({ ...layout, activo: true, campos: { ...campos, [key]: campo } });
    onSelect?.(key);
  };

  const addLinea = () => {
    const { key, campo } = nuevaLinea();
    onChange({ ...layout, activo: true, campos: { ...campos, [key]: campo } });
    onSelect?.(key);
  };

  const addFirma = () => {
    const nueva = nuevaFirma(campos);
    if (!nueva) return;  // ya hay 3
    onChange({ ...layout, activo: true, campos: { ...campos, [nueva.key]: nueva.campo } });
    onSelect?.(nueva.key);
  };

  const toggleActivo = (on: boolean) => {
    if (!on) { onChange({ ...layout, activo: false }); onSelect?.(null); return; }
    if (entries.length > 0) { onChange({ ...layout, activo: true }); return; }
    // Al activar en frío: se carga la plantilla base de la empresa; si no tiene,
    // un arranque genérico (nombre + fecha + logos + QR). El usuario solo mueve.
    onChange(hayBase ? { ...baseLayout!, activo: true } : layoutPorDefecto());
    onSelect?.(null);
  };

  const guardarBase = () => onSaveBase?.(layout);

  const AddButtons = (
    <>
      <button type="button" onClick={addCampo}
        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
        style={{ background: '#fff', color: '#15803D', border: '1px solid #BBF7D0' }}>
        <Plus size={12} /> Agregar campo
      </button>
      <button type="button" onClick={addLinea}
        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
        style={{ background: '#fff', color: '#2563EB', border: '1px solid #BFDBFE' }}>
        <Plus size={12} /> Agregar línea
      </button>
      <button type="button" onClick={addFirma} disabled={firmasCount >= MAX_FIRMAS}
        title={firmasCount >= MAX_FIRMAS ? 'Ya tienes el máximo de 3 firmas' : 'Agrega un espacio de firma (hasta 3)'}
        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#fff', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
        <FileSignature size={12} /> Agregar firma
        <span className="font-normal" style={{ color: '#A78BFA' }}>{firmasCount}/{MAX_FIRMAS}</span>
      </button>
    </>
  );

  const BaseButtons = (
    <button type="button" onClick={guardarBase} disabled={!activo || savingBase}
      title="Guarda este diseño como la plantilla base de tu empresa (se cargará solo al activar en otros programas)"
      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
      style={baseSaved
        ? { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }
        : { background: '#0D0E12', color: '#fff' }}>
      {savingBase ? <Loader2 size={12} className="animate-spin" /> : baseSaved ? <CheckCircle size={12} /> : <Save size={12} />}
      {savingBase ? 'Guardando…' : baseSaved ? '¡Guardada!' : 'Guardar base'}
    </button>
  );

  // ── Barra angosta para la columna derecha ──
  if (compact) {
    return (
      <div className="rounded-2xl p-3" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[12px] font-bold" style={{ color: '#9A3412' }}>Herramientas</p>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} title="Desactivar el diseño personalizado">
            <input type="checkbox" checked={activo} onChange={e => toggleActivo(e.target.checked)} />
            <span className="text-[11px] font-semibold" style={{ color: '#9A3412' }}>Activado</span>
          </label>
        </div>
        <p className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#C2410C' }}>Agregar</p>
        <div className="flex flex-wrap gap-1.5 mb-2.5">{AddButtons}</div>
        <p className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#C2410C' }}>Plantilla base de la empresa</p>
        <div className="flex flex-wrap gap-1.5">{BaseButtons}</div>
        <p className="text-[10px] mt-1.5 leading-snug" style={{ color: '#B45309' }}>
          Acomoda tus elementos y pulsa <b>Guardar base</b>: al activar el diseño en otros programas se cargará así solo.
        </p>
      </div>
    );
  }

  // ── Tarjeta completa (estado apagado): switch + explicación ──
  return (
    <div className="rounded-2xl p-4" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold" style={{ color: '#9A3412' }}>Diseño personalizado (Lienzo)</p>
          <p className="text-[11.5px] mt-0.5 leading-relaxed" style={{ color: '#B45309', maxWidth: 520 }}>
            El fondo que subas arriba se usa a sangre completa y el sistema estampa encima estos elementos.
            Al activarlo se carga {hayBase ? 'la plantilla base de tu empresa' : 'un arranque genérico'} y los
            acomodas arrastrándolos sobre la vista previa; clic en uno edita sus propiedades a la derecha.
          </p>
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
          <input type="checkbox" checked={activo} onChange={e => toggleActivo(e.target.checked)} />
          <span className="text-[12px] font-semibold" style={{ color: activo ? '#9A3412' : '#B0A898' }}>
            {activo ? 'Activado' : 'Desactivado'}
          </span>
        </label>
      </div>
      <p className="text-[11px] mt-2" style={{ color: '#B45309' }}>
        Actívalo para posicionar los elementos sobre el fondo del cliente. Las herramientas para agregar
        campos y firmas, y guardar tu plantilla base, aparecerán a la derecha, junto al lienzo.
      </p>
    </div>
  );
}
