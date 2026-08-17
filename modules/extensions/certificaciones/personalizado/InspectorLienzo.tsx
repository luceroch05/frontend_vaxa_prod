/* ────────────────────────────────────────────────────────────────
 * <InspectorLienzo> — panel de propiedades tipo Canva.
 *
 * Muestra, al lado derecho del lienzo, TODO lo editable del elemento
 * que está seleccionado (el que clickeaste en la vista previa). Nada de
 * lista larga: un solo elemento a la vez. Arriba, una tira de "capas"
 * para saltar entre elementos sin tener que cazarlos en el lienzo.
 * Aislado: opera sobre el LayoutLienzo y avisa por onChange/onSelect.
 * ──────────────────────────────────────────────────────────────── */
import { useState, useEffect } from 'react';
import {
  CampoFirma, CampoLinea, CampoLogo, CampoQR, CampoTexto, LayoutLienzo,
  VARIABLES_LIENZO, labelCampo, tipoCampo, indiceLogo, indiceFirma,
} from './layout';
import { MousePointerClick, Trash2, Layers } from '@/components/ui/icon';

interface Props {
  layout: LayoutLienzo | null;
  /** Clave del campo seleccionado (compartida con la capa de arrastre). */
  selectedKey: string | null;
  onChange: (l: LayoutLienzo) => void;
  onSelect: (key: string | null) => void;
}

/* Input numérico compacto con etiqueta arriba.
 * Mantiene un estado de TEXTO local: te deja escribir libre (borrar todo, dígitos
 * intermedios por debajo del mínimo, etc.). Manda el valor al padre mientras escribes
 * (preview en vivo, SIN clampear) y recién ajusta al rango [min,max] cuando sales del
 * campo (blur). Así no pasa lo de "escribe un número cercano y baja con la flecha". */
function NumBox({ label, value, onChange, min = 0, max = 2000 }: {
  label: string; value: number | undefined; onChange: (n: number) => void; min?: number; max?: number;
}) {
  const [text, setText] = useState<string>(value == null ? '' : String(value));
  const [focused, setFocused] = useState(false);

  // Sincroniza desde afuera (ej. cuando arrastras el elemento en el lienzo) solo si
  // NO lo estás editando, para no pisar lo que escribes.
  useEffect(() => {
    if (!focused) setText(value == null ? '' : String(value));
  }, [value, focused]);

  const handleChange = (raw: string) => {
    setText(raw);
    if (raw.trim() === '' || raw === '-') return;   // deja el campo vacío/parcial mientras escribes
    const n = Number(raw);
    if (Number.isFinite(n)) onChange(n);            // preview en vivo, sin clamp
  };

  const handleBlur = () => {
    setFocused(false);
    const n = Number(text);
    const val = Number.isFinite(n) && text.trim() !== '' ? Math.max(min, Math.min(max, n)) : (value ?? min);
    setText(String(val));
    onChange(val);                                   // recién aquí se ajusta al rango
  };

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{label}</span>
      <input
        type="number"
        value={text}
        min={min}
        max={max}
        onFocus={() => setFocused(true)}
        onChange={e => handleChange(e.target.value)}
        onBlur={handleBlur}
        className="vx-input"
        style={{ padding: '5px 8px', fontSize: 12, width: 72 }}
      />
    </label>
  );
}

/* Color con etiqueta. */
function ColorBox({ label, value, fallback, onChange }: {
  label: string; value: string | undefined; fallback: string; onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{label}</span>
      <input type="color" value={value ?? fallback} onChange={e => onChange(e.target.value)}
        style={{ width: 40, height: 30, padding: 0, border: '1px solid #EEECE6', borderRadius: 6, background: '#fff', cursor: 'pointer' }} />
    </label>
  );
}

/* Etiqueta corta para la tira de capas (más breve que labelCampo). */
function chipLabel(key: string, c: CampoTexto): string {
  const t = tipoCampo(key);
  if (t === 'texto') return c.label || (c.text ?? 'Texto').slice(0, 18) || 'Texto';
  if (t === 'qr')    return 'QR';
  if (t === 'logo')  return `Logo ${indiceLogo(key) + 1}`;
  if (t === 'firma') return `Firma ${indiceFirma(key) + 1}`;
  if (t === 'linea') return 'Línea';
  return key;
}

export default function InspectorLienzo({ layout, selectedKey, onChange, onSelect }: Props) {
  const campos = (layout?.campos ?? {}) as Record<string, CampoTexto & CampoQR & CampoLogo & CampoFirma & CampoLinea>;
  const entries = Object.entries(campos);

  const setCampo = (key: string, patch: Partial<CampoTexto & CampoQR & CampoLogo & CampoFirma & CampoLinea>) =>
    onChange({ ...(layout ?? {}), activo: true, campos: { ...campos, [key]: { ...(campos[key] ?? {}), ...patch } } });

  const removeCampo = (key: string) => {
    const next = { ...campos };
    delete next[key];
    onChange({ ...(layout ?? {}), activo: true, campos: next });
    onSelect(null);
  };

  const sel = selectedKey && campos[selectedKey] ? selectedKey : null;
  const c = sel ? campos[sel] : null;
  const t = sel ? tipoCampo(sel) : null;

  return (
    <div className="rounded-2xl flex flex-col" style={{ background: '#fff', border: '1px solid #EEECE6', minHeight: 360 }}>
      {/* Cabecera */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #F5F4F0' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FFF7ED' }}>
          <MousePointerClick size={14} style={{ color: '#EA580C' }} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>Propiedades</p>
          <p className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>
            {c ? labelCampo(sel!, c) : 'Selecciona un elemento del lienzo'}
          </p>
        </div>
      </div>

      {/* Tira de capas: saltar entre elementos sin cazarlos en el lienzo */}
      {entries.length > 0 && (
        <div className="px-3 pt-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Layers size={11} style={{ color: '#9CA3AF' }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Elementos</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entries.map(([key, raw]) => {
              const activo = key === sel;
              const oculto = (raw as CampoTexto).on === false;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelect(key)}
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg truncate max-w-[130px]"
                  style={{
                    background: activo ? '#EA580C' : '#FAFAF8',
                    color: activo ? '#fff' : oculto ? '#B0A898' : '#475569',
                    border: `1px solid ${activo ? '#EA580C' : '#EEECE6'}`,
                    opacity: oculto ? 0.6 : 1,
                  }}
                  title={labelCampo(key, raw)}
                >
                  {chipLabel(key, raw)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cuerpo: props del seleccionado, o estado vacío */}
      <div className="p-3 flex-1">
        {!c || !sel ? (
          <div className="flex flex-col items-center justify-center text-center h-full py-8" style={{ color: '#B0A898' }}>
            <MousePointerClick size={26} style={{ color: '#D1D5DB', marginBottom: 8 }} />
            <p className="text-[12.5px] font-semibold" style={{ color: '#9CA3AF' }}>Haz clic en un elemento</p>
            <p className="text-[11.5px] mt-1 max-w-[220px]">
              Arrastra los elementos sobre el lienzo para ubicarlos y haz clic en uno para editar su texto, tamaño, color y fuente aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Cabecera del campo: label (texto) + visible/oculto + eliminar */}
            <div className="flex items-center gap-2">
              {t === 'texto' ? (
                <input
                  type="text"
                  value={c.label ?? ''}
                  onChange={e => setCampo(sel, { label: e.target.value })}
                  placeholder="Nombre del campo"
                  className="vx-input flex-1"
                  style={{ padding: '5px 8px', fontSize: 12, fontWeight: 700, color: '#0D0E12' }}
                />
              ) : (
                <p className="text-[12.5px] font-bold flex-1" style={{ color: '#0D0E12' }}>{labelCampo(sel, c)}</p>
              )}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                <input type="checkbox" checked={c.on !== false} onChange={e => setCampo(sel, { on: e.target.checked })} />
                <span className="text-[11px] font-semibold" style={{ color: c.on !== false ? '#15803D' : '#B0A898' }}>
                  {c.on !== false ? 'Visible' : 'Oculto'}
                </span>
              </label>
              {(t === 'texto' || t === 'linea' || t === 'firma') && (
                <button type="button" onClick={() => removeCampo(sel)} title="Quitar elemento"
                  className="p-1 rounded-md" style={{ color: '#B91C1C' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* ── TEXTO ── */}
            {t === 'texto' && (
              <>
                <textarea
                  value={c.text ?? ''}
                  onChange={e => setCampo(sel, { text: e.target.value })}
                  placeholder="Texto o {variable}  ·  Enter = salto de línea"
                  rows={c.text && c.text.includes('\n') ? 3 : 2}
                  className="vx-input w-full resize-y"
                  style={{ padding: '6px 10px', fontSize: 12, lineHeight: 1.5 }}
                />
                <div className="flex flex-wrap gap-1">
                  {VARIABLES_LIENZO.map(v => (
                    <button key={v.token} type="button" title={v.desc}
                      onClick={() => setCampo(sel, { text: (c.text ?? '') + v.token })}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', fontFamily: 'monospace' }}>
                      {v.token}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <NumBox label="X" value={c.x} onChange={n => setCampo(sel, { x: n })} />
                  <NumBox label="Y" value={c.y} onChange={n => setCampo(sel, { y: n })} />
                  <NumBox label="Ancho" value={c.w} onChange={n => setCampo(sel, { w: n })} />
                  <NumBox label="Tamaño" value={c.size} min={6} max={200} onChange={n => setCampo(sel, { size: n })} />
                  <ColorBox label="Color" value={c.color} fallback="#0f172a" onChange={v => setCampo(sel, { color: v })} />
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Alineado</span>
                    <select value={c.align ?? 'center'} onChange={e => setCampo(sel, { align: e.target.value as CampoTexto['align'] })}
                      className="vx-input" style={{ padding: '5px 6px', fontSize: 12 }}>
                      <option value="left">Izq.</option>
                      <option value="center">Centro</option>
                      <option value="right">Der.</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Fuente</span>
                    <select value={c.font ?? 'sans'} onChange={e => setCampo(sel, { font: e.target.value as CampoTexto['font'] })}
                      className="vx-input" style={{ padding: '5px 6px', fontSize: 12 }}>
                      <optgroup label="Modernas (limpias)">
                        <option value="sans">Montserrat</option>
                        <option value="poppins">Poppins</option>
                        <option value="barlow">Barlow Condensed</option>
                        <option value="bebas">Bebas Neue (títulos)</option>
                      </optgroup>
                      <optgroup label="Clásicas / formales (diploma)">
                        <option value="serif">Serif clásica</option>
                        <option value="cardo">Cardo</option>
                        <option value="crimson">Crimson Text</option>
                        <option value="cinzel">Cinzel (mayúsc. diploma)</option>
                        <option value="abril">Abril Fatface (título grueso)</option>
                      </optgroup>
                      <optgroup label="Manuscritas (para nombres)">
                        <option value="vibes">Great Vibes</option>
                        <option value="allura">Allura</option>
                        <option value="tangerine">Tangerine</option>
                        <option value="sacramento">Sacramento</option>
                        <option value="alexbrush">Alex Brush</option>
                        <option value="parisienne">Parisienne</option>
                        <option value="pacifico">Pacifico</option>
                        <option value="lobster">Lobster</option>
                      </optgroup>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Peso</span>
                    <select value={c.weight ?? (c.bold ? 700 : 400)} onChange={e => setCampo(sel, { weight: Number(e.target.value) as CampoTexto['weight'] })}
                      className="vx-input" style={{ padding: '5px 6px', fontSize: 12 }}>
                      <option value={400}>Normal</option>
                      <option value={500}>Medium</option>
                      <option value={600}>SemiBold</option>
                      <option value={700}>Bold</option>
                      <option value={800}>ExtraBold</option>
                    </select>
                  </label>
                  <NumBox label="Espaciado" value={c.tracking} min={0} max={20} onChange={n => setCampo(sel, { tracking: n })} />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {([['bold', 'Negrita'], ['italic', 'Cursiva'], ['uppercase', 'MAYÚS.']] as const).map(([prop, lbl]) => (
                    <label key={prop} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!c[prop]} onChange={e => setCampo(sel, { [prop]: e.target.checked })} />
                      <span className="text-[11px]" style={{ color: '#475569' }}>{lbl}</span>
                    </label>
                  ))}
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }} title="Encoge el texto para que entre en una línea (ideal para nombres largos)">
                    <input type="checkbox" checked={!!c.autoFit} onChange={e => setCampo(sel, { autoFit: e.target.checked })} />
                    <span className="text-[11px]" style={{ color: '#475569' }}>Auto-ajustar</span>
                  </label>
                </div>
              </>
            )}

            {/* ── LOGO ── */}
            {t === 'logo' && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-end gap-2">
                  <NumBox label="X" value={c.x} onChange={n => setCampo(sel, { x: n })} />
                  <NumBox label="Y" value={c.y} onChange={n => setCampo(sel, { y: n })} />
                  <NumBox label="Tamaño" value={c.size} min={20} max={400} onChange={n => setCampo(sel, { size: n })} />
                </div>
                <p className="text-[10.5px]" style={{ color: '#9CA3AF' }}>
                  Usa el logo #{indiceLogo(sel) + 1} de los que seleccionaste abajo. Si no seleccionaste ese, no se muestra.
                </p>
              </div>
            )}

            {/* ── FIRMA ── */}
            {t === 'firma' && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-end gap-2">
                  <NumBox label="X" value={c.x} onChange={n => setCampo(sel, { x: n })} />
                  <NumBox label="Y" value={c.y} onChange={n => setCampo(sel, { y: n })} />
                  <NumBox label="Ancho" value={c.w} min={80} max={600} onChange={n => setCampo(sel, { w: n })} />
                  <NumBox label="Alto firma" value={c.h} min={20} max={200} onChange={n => setCampo(sel, { h: n })} />
                </div>
                <p className="text-[10.5px]" style={{ color: '#9CA3AF' }}>
                  Usa la firma #{indiceFirma(sel) + 1} que subiste en <b>Firmas</b> (trae imagen + línea + nombre + cargo). Aquí solo la posicionas.
                </p>
              </div>
            )}

            {/* ── LÍNEA ── */}
            {t === 'linea' && (
              <div className="flex flex-wrap items-end gap-2">
                <NumBox label="X" value={c.x} onChange={n => setCampo(sel, { x: n })} />
                <NumBox label="Y" value={c.y} onChange={n => setCampo(sel, { y: n })} />
                <NumBox label="Largo" value={c.w} min={20} max={1122} onChange={n => setCampo(sel, { w: n })} />
                <NumBox label="Grosor" value={c.thickness} min={1} max={12} onChange={n => setCampo(sel, { thickness: n })} />
                <ColorBox label="Color" value={c.color} fallback="#c9a24b" onChange={v => setCampo(sel, { color: v })} />
              </div>
            )}

            {/* ── QR ── */}
            {t === 'qr' && (
              <div className="flex flex-wrap items-end gap-2">
                <NumBox label="X" value={c.x} onChange={n => setCampo(sel, { x: n })} />
                <NumBox label="Y" value={c.y} onChange={n => setCampo(sel, { y: n })} />
                <NumBox label="Tamaño" value={c.size} min={30} max={300} onChange={n => setCampo(sel, { size: n })} />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 6 }}>
                  <input type="checkbox" checked={(c as CampoQR).showCodigo !== false} onChange={e => setCampo(sel, { showCodigo: e.target.checked })} />
                  <span className="text-[11px]" style={{ color: '#475569' }}>Mostrar código</span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
