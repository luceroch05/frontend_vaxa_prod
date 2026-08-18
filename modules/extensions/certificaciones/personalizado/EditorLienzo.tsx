/* ────────────────────────────────────────────────────────────────
 * <EditorLienzo> — barra de herramientas del modo "Diseño Personalizado",
 * estilo Canva: iconos limpios, mínimo texto, todo con tooltip. Vive ARRIBA
 * del lienzo (no fullscreen). Las propiedades del elemento seleccionado las
 * muestra <InspectorLienzo> a la derecha.
 *
 * Dos presentaciones:
 *  · full (default): tarjeta chica con el switch para PRENDER el diseño.
 *  · compact: la barra de herramientas (ya activo) que va sobre el lienzo.
 * Ver [[feature-diseno-personalizado-lienzo]].
 * ──────────────────────────────────────────────────────────────── */
import {
  LayoutLienzo, layoutActivo, layoutPorDefecto, nuevoCampoTexto, nuevaLinea, nuevaFirma,
  contarFirmas, MAX_FIRMAS,
} from './layout';
import { Type, Minus, FileSignature, Save, CheckCircle, Loader2, Sparkles } from '@/components/ui/icon';

interface Props {
  value: LayoutLienzo | null;
  onChange: (l: LayoutLienzo) => void;
  onSelect?: (key: string | null) => void;
  baseLayout?: LayoutLienzo | null;
  onSaveBase?: (l: LayoutLienzo) => void;
  savingBase?: boolean;
  baseSaved?: boolean;
  /** Barra de herramientas (asume el modo ya activo). */
  compact?: boolean;
  /** Oculta el botón "Firma": las firmas salen solas de las elegidas en la config. */
  firmasAuto?: boolean;
}

/** Botón de herramienta tipo Canva: icono + etiqueta chica, con tooltip (tema claro). */
function Tool({ icon: Icon, label, onClick, disabled, loading, badge, title, tone = 'default' }: {
  icon: any; label: string; onClick: () => void; disabled?: boolean; loading?: boolean;
  badge?: string; title?: string; tone?: 'default' | 'ok';
}) {
  const border = tone === 'ok' ? '#BBF7D0' : '#E5E7EB';
  const bg     = tone === 'ok' ? '#F0FDF4' : '#F6F6F8';
  const color  = tone === 'ok' ? '#15803D' : '#4B5563';
  const labelC = tone === 'ok' ? '#15803D' : '#6B7280';
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title ?? label}
      className="relative flex flex-col items-center justify-center gap-1 w-[60px] h-[56px] rounded-xl transition-all hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: bg, border: `1px solid ${border}` }}>
      {loading ? <Loader2 size={18} className="animate-spin" color={color} /> : <Icon size={18} color={color} />}
      <span className="text-[10px] font-semibold leading-none" style={{ color: labelC }}>{label}</span>
      {badge && (
        <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: '#7C3AED', color: '#fff' }}>{badge}</span>
      )}
    </button>
  );
}

export default function EditorLienzo({
  value, onChange, onSelect, baseLayout, onSaveBase, savingBase, baseSaved, compact = false, firmasAuto = false,
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
    if (!nueva) return;
    onChange({ ...layout, activo: true, campos: { ...campos, [nueva.key]: nueva.campo } });
    onSelect?.(nueva.key);
  };
  const toggleActivo = (on: boolean) => {
    if (!on) { onChange({ ...layout, activo: false }); onSelect?.(null); return; }
    if (entries.length > 0) { onChange({ ...layout, activo: true }); return; }
    onChange(hayBase ? { ...baseLayout!, activo: true } : layoutPorDefecto());
    onSelect?.(null);
  };
  const guardarBase = () => onSaveBase?.(layout);

  // ── Barra de herramientas (modo activo), estilo Canva ──
  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Tool icon={Type}  label="Texto" onClick={addCampo} title="Agregar un texto o variable ({nombre}, {fecha}…)" />
        <Tool icon={Minus} label="Línea" onClick={addLinea} title="Agregar una línea" />
        {!firmasAuto && (
          <Tool icon={FileSignature} label="Firma" onClick={addFirma} disabled={firmasCount >= MAX_FIRMAS}
            badge={firmasCount > 0 ? `${firmasCount}/${MAX_FIRMAS}` : undefined}
            title={firmasCount >= MAX_FIRMAS ? 'Máximo 3 firmas' : 'Agregar un espacio de firma'} />
        )}

        <span style={{ width: 1, height: 34, background: '#E5E7EB', margin: '0 2px' }} />

        <Tool icon={baseSaved ? CheckCircle : Save} tone={baseSaved ? 'ok' : 'default'} loading={savingBase}
          label={baseSaved ? 'Base ✓' : 'Base'} onClick={guardarBase}
          title="Guardar este diseño como PLANTILLA BASE de tu empresa: se usará por defecto en TODOS los programas. (Los cambios de este programa ya se guardan solos.)" />

        <span className="text-[10.5px] hidden lg:inline px-1" style={{ color: '#9CA3AF' }}>
          Este programa se guarda solo · «Base» = default para todos
        </span>

        <label className="ml-auto flex items-center gap-2 cursor-pointer select-none px-2" title="Desactivar el diseño personalizado">
          <span className="text-[11px] font-semibold" style={{ color: '#6B7280' }}>Diseño</span>
          <span className="relative inline-flex items-center" style={{ width: 38, height: 22 }}>
            <input type="checkbox" checked={activo} onChange={e => toggleActivo(e.target.checked)} className="peer sr-only" />
            <span className="absolute inset-0 rounded-full transition-colors" style={{ background: activo ? '#7C3AED' : '#374151' }} />
            <span className="absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all"
              style={{ left: activo ? 18 : 2 }} />
          </span>
        </label>
      </div>
    );
  }

  // ── Tarjeta chica para PRENDER el diseño (estado apagado) ──
  return (
    <div className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FED7AA' }}>
          <Sparkles size={16} style={{ color: '#9A3412' }} />
        </div>
        <div>
          <p className="text-[13px] font-bold" style={{ color: '#9A3412' }}>Diseño personalizado</p>
          <p className="text-[11.5px]" style={{ color: '#B45309' }}>
            Coloca tú los textos y firmas sobre el fondo del cliente, tipo Canva.
          </p>
        </div>
      </div>
      <button type="button" onClick={() => toggleActivo(true)}
        className="text-[12.5px] font-semibold px-4 py-2 rounded-xl text-white shrink-0" style={{ background: '#9A3412' }}>
        Activar
      </button>
    </div>
  );
}
