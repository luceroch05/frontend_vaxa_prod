/* ────────────────────────────────────────────────────────────────
 * <EditorLienzo> — editor del modo "Diseño Personalizado (Lienzo)".
 *
 * Activa el modo a medida y deja posicionar cada campo dinámico por
 * coordenadas numéricas. Los campos son una LISTA dinámica: se pueden
 * cargar presets ya posicionados (ej. Constancia FAP), agregar y quitar.
 * Aislado: AdminConfig solo lo monta y recibe el LayoutLienzo por onChange.
 * ──────────────────────────────────────────────────────────────── */
import {
  CampoFirma, CampoLinea, CampoLogo, CampoQR, CampoTexto, LayoutLienzo,
  VARIABLES_LIENZO, PRESETS_LIENZO, layoutActivo, labelCampo, nuevoCampoTexto, nuevaLinea, tipoCampo,
} from './layout';
import { Plus, Trash2 } from '@/components/ui/icon';

interface Props {
  value: LayoutLienzo | null;
  onChange: (l: LayoutLienzo) => void;
}

/* Input numérico compacto con etiqueta arriba. */
function NumBox({ label, value, onChange, min = 0, max = 2000 }: {
  label: string; value: number | undefined; onChange: (n: number) => void; min?: number; max?: number;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{label}</span>
      <input
        type="number"
        value={value ?? 0}
        min={min}
        max={max}
        onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        className="vx-input"
        style={{ padding: '5px 8px', fontSize: 12, width: 72 }}
      />
    </label>
  );
}

export default function EditorLienzo({ value, onChange }: Props) {
  const layout: LayoutLienzo = value ?? { activo: false, campos: {} };
  const campos = layout.campos ?? {};
  const entries = Object.entries(campos);
  const activo = layoutActivo(layout);

  const setCampo = (key: string, patch: Partial<CampoTexto & CampoQR & CampoLogo & CampoFirma & CampoLinea>) =>
    onChange({ ...layout, activo: true, campos: { ...campos, [key]: { ...(campos[key] ?? {}), ...patch } } });

  const removeCampo = (key: string) => {
    const next = { ...campos };
    delete next[key];
    onChange({ ...layout, activo: true, campos: next });
  };

  const addCampo = () => {
    const { key, campo } = nuevoCampoTexto(entries.filter(([k]) => k !== 'qr').length + 1);
    onChange({ ...layout, activo: true, campos: { ...campos, [key]: campo } });
  };

  const addLinea = () => {
    const { key, campo } = nuevaLinea();
    onChange({ ...layout, activo: true, campos: { ...campos, [key]: campo } });
  };

  const toggleActivo = (on: boolean) => {
    if (!on) { onChange({ ...layout, activo: false }); return; }
    if (entries.length > 0) onChange({ ...layout, activo: true });
    else onChange(PRESETS_LIENZO[0].make());   // al activar en frío arranca con el preset FAP
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
      {/* Cabecera + switch */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold" style={{ color: '#9A3412' }}>Diseño personalizado (Lienzo)</p>
          <p className="text-[11.5px] mt-0.5 leading-relaxed" style={{ color: '#B45309', maxWidth: 480 }}>
            El fondo que subas arriba se usa a sangre completa y el sistema estampa encima estos campos.
            Carga un preset ya posicionado o ajusta las coordenadas. Al activarlo se ignora el diseño por defecto de Vaxa.
          </p>
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
          <input type="checkbox" checked={activo} onChange={e => toggleActivo(e.target.checked)} />
          <span className="text-[12px] font-semibold" style={{ color: activo ? '#9A3412' : '#B0A898' }}>
            {activo ? 'Activado' : 'Desactivado'}
          </span>
        </label>
      </div>

      {!activo && (
        <p className="text-[11px] mt-2" style={{ color: '#B45309' }}>
          Actívalo para cargar un preset y posicionar los campos sobre el fondo del cliente.
        </p>
      )}

      {activo && (
        <>
          {/* Presets + agregar campo */}
          <div className="flex flex-wrap items-center gap-2 mt-3 mb-3">
            <span className="text-[11px] font-semibold" style={{ color: '#9A3412' }}>Cargar preset:</span>
            {PRESETS_LIENZO.map(pr => (
              <button
                key={pr.key}
                type="button"
                onClick={() => onChange(pr.make())}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: '#fff', color: '#C2410C', border: '1px solid #FED7AA' }}
              >
                {pr.label}
              </button>
            ))}
            <span className="mx-1" style={{ color: '#FDBA74' }}>·</span>
            <button
              type="button"
              onClick={addCampo}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: '#fff', color: '#15803D', border: '1px solid #BBF7D0' }}
            >
              <Plus size={12} /> Agregar campo
            </button>
            <button
              type="button"
              onClick={addLinea}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: '#fff', color: '#2563EB', border: '1px solid #BFDBFE' }}
            >
              <Plus size={12} /> Agregar línea
            </button>
          </div>

          <div className="space-y-3">
            {entries.map(([key, raw]) => {
              const c = (raw ?? {}) as CampoTexto & CampoQR & CampoLogo & CampoFirma & CampoLinea;
              const on = c.on !== false;
              const t = tipoCampo(key);
              const esTexto = t === 'texto';
              const esQR = t === 'qr';
              const esLogo = t === 'logo';
              const esFirma = t === 'firma';
              const esLinea = t === 'linea';
              return (
                <div key={key} className="rounded-xl p-3" style={{ background: '#fff', border: '1px solid #FDE68A' }}>
                  {/* Cabecera del campo: label editable + visible/oculto + eliminar */}
                  <div className="flex items-center gap-2 mb-2">
                    {esTexto ? (
                      <input
                        type="text"
                        value={c.label ?? ''}
                        onChange={e => setCampo(key, { label: e.target.value })}
                        placeholder="Nombre del campo"
                        className="vx-input flex-1"
                        style={{ padding: '4px 8px', fontSize: 12, fontWeight: 700, color: '#0D0E12' }}
                      />
                    ) : (
                      <p className="text-[12px] font-bold flex-1" style={{ color: '#0D0E12' }}>{labelCampo(key, c)}</p>
                    )}
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                      <input type="checkbox" checked={on} onChange={e => setCampo(key, { on: e.target.checked })} />
                      <span className="text-[11px] font-semibold" style={{ color: on ? '#15803D' : '#B0A898' }}>
                        {on ? 'Visible' : 'Oculto'}
                      </span>
                    </label>
                    {(esTexto || esLinea) && (
                      <button type="button" onClick={() => removeCampo(key)} title="Quitar campo"
                        className="p-1 rounded-md" style={{ color: '#B91C1C' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {on && esLogo && (
                    <div className="flex flex-wrap items-end gap-2">
                      <NumBox label="X" value={c.x} onChange={n => setCampo(key, { x: n })} />
                      <NumBox label="Y" value={c.y} onChange={n => setCampo(key, { y: n })} />
                      <NumBox label="Tamaño" value={c.size} min={20} max={400} onChange={n => setCampo(key, { size: n })} />
                      <p className="text-[10.5px] mb-1.5" style={{ color: '#9CA3AF', maxWidth: 240 }}>
                        Usa el logo #{Number(key.replace(/\D/g, ''))} de los que seleccionaste abajo. Si no seleccionaste ese, no se muestra.
                      </p>
                    </div>
                  )}

                  {on && esFirma && (
                    <div className="flex flex-wrap items-end gap-2">
                      <NumBox label="X" value={c.x} onChange={n => setCampo(key, { x: n })} />
                      <NumBox label="Y" value={c.y} onChange={n => setCampo(key, { y: n })} />
                      <NumBox label="Ancho" value={c.w} min={80} max={600} onChange={n => setCampo(key, { w: n })} />
                      <NumBox label="Alto firma" value={c.h} min={20} max={200} onChange={n => setCampo(key, { h: n })} />
                      <p className="text-[10.5px] mb-1.5" style={{ color: '#9CA3AF', maxWidth: 240 }}>
                        Usa la firma #{Number(key.replace(/\D/g, ''))} que subiste en <b>Firmas</b> (trae imagen + línea + nombre + cargo). Aquí solo la posicionas.
                      </p>
                    </div>
                  )}

                  {on && esLinea && (
                    <div className="flex flex-wrap items-end gap-2">
                      <NumBox label="X" value={c.x} onChange={n => setCampo(key, { x: n })} />
                      <NumBox label="Y" value={c.y} onChange={n => setCampo(key, { y: n })} />
                      <NumBox label="Largo" value={c.w} min={20} max={1122} onChange={n => setCampo(key, { w: n })} />
                      <NumBox label="Grosor" value={c.thickness} min={1} max={12} onChange={n => setCampo(key, { thickness: n })} />
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Color</span>
                        <input type="color" value={c.color ?? '#c9a24b'} onChange={e => setCampo(key, { color: e.target.value })}
                          style={{ width: 40, height: 30, padding: 0, border: '1px solid #EEECE6', borderRadius: 6, background: '#fff', cursor: 'pointer' }} />
                      </label>
                    </div>
                  )}

                  {on && esTexto && (
                    <div className="space-y-2">
                      <textarea
                        value={c.text ?? ''}
                        onChange={e => setCampo(key, { text: e.target.value })}
                        placeholder="Texto o {variable}  ·  Enter = salto de línea"
                        rows={c.text && c.text.includes('\n') ? 3 : 1}
                        className="vx-input w-full resize-y"
                        style={{ padding: '6px 10px', fontSize: 12, lineHeight: 1.5 }}
                      />
                      <div className="flex flex-wrap gap-1">
                        {VARIABLES_LIENZO.map(v => (
                          <button key={v.token} type="button" title={v.desc}
                            onClick={() => setCampo(key, { text: (c.text ?? '') + v.token })}
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                            style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', fontFamily: 'monospace' }}>
                            {v.token}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-end gap-2">
                        <NumBox label="X" value={c.x} onChange={n => setCampo(key, { x: n })} />
                        <NumBox label="Y" value={c.y} onChange={n => setCampo(key, { y: n })} />
                        <NumBox label="Ancho" value={c.w} onChange={n => setCampo(key, { w: n })} />
                        <NumBox label="Tamaño" value={c.size} min={6} max={200} onChange={n => setCampo(key, { size: n })} />
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Color</span>
                          <input type="color" value={c.color ?? '#0f172a'} onChange={e => setCampo(key, { color: e.target.value })}
                            style={{ width: 40, height: 30, padding: 0, border: '1px solid #EEECE6', borderRadius: 6, background: '#fff', cursor: 'pointer' }} />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Alineado</span>
                          <select value={c.align ?? 'center'} onChange={e => setCampo(key, { align: e.target.value as CampoTexto['align'] })}
                            className="vx-input" style={{ padding: '5px 6px', fontSize: 12 }}>
                            <option value="left">Izq.</option>
                            <option value="center">Centro</option>
                            <option value="right">Der.</option>
                          </select>
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Fuente</span>
                          <select value={c.font ?? 'sans'} onChange={e => setCampo(key, { font: e.target.value as CampoTexto['font'] })}
                            className="vx-input" style={{ padding: '5px 6px', fontSize: 12 }}>
                            <option value="sans">Sans (Montserrat)</option>
                            <option value="serif">Serif</option>
                            <option value="bebas">Bebas Neue</option>
                            <option value="barlow">Barlow Condensed</option>
                          </select>
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Peso</span>
                          <select value={c.weight ?? (c.bold ? 700 : 400)} onChange={e => setCampo(key, { weight: Number(e.target.value) as CampoTexto['weight'] })}
                            className="vx-input" style={{ padding: '5px 6px', fontSize: 12 }}>
                            <option value={400}>Normal</option>
                            <option value={500}>Medium</option>
                            <option value={600}>SemiBold</option>
                            <option value={700}>Bold</option>
                            <option value={800}>ExtraBold</option>
                          </select>
                        </label>
                        <NumBox label="Espaciado" value={c.tracking} min={0} max={20} onChange={n => setCampo(key, { tracking: n })} />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {([['bold', 'Negrita'], ['italic', 'Cursiva'], ['uppercase', 'MAYÚS.']] as const).map(([prop, lbl]) => (
                          <label key={prop} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                            <input type="checkbox" checked={!!c[prop]} onChange={e => setCampo(key, { [prop]: e.target.checked })} />
                            <span className="text-[11px]" style={{ color: '#475569' }}>{lbl}</span>
                          </label>
                        ))}
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }} title="Encoge el texto para que entre en una línea (ideal para nombres largos)">
                          <input type="checkbox" checked={!!c.autoFit} onChange={e => setCampo(key, { autoFit: e.target.checked })} />
                          <span className="text-[11px]" style={{ color: '#475569' }}>Auto-ajustar</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {on && esQR && (
                    <div className="flex flex-wrap items-end gap-2">
                      <NumBox label="X" value={c.x} onChange={n => setCampo(key, { x: n })} />
                      <NumBox label="Y" value={c.y} onChange={n => setCampo(key, { y: n })} />
                      <NumBox label="Tamaño" value={c.size} min={30} max={300} onChange={n => setCampo(key, { size: n })} />
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 6 }}>
                        <input type="checkbox" checked={(c as CampoQR).showCodigo !== false} onChange={e => setCampo(key, { showCodigo: e.target.checked })} />
                        <span className="text-[11px]" style={{ color: '#475569' }}>Mostrar código</span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
