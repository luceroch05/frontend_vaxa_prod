/* ────────────────────────────────────────────────────────────────
 * <SelectBox> — reemplazo ESTILIZADO de <select> (opciones con diseño).
 *  Los <option> nativos no se pueden diseñar; este render propio sí:
 *  el menú va en un PORTAL (no lo recorta ningún modal con overflow) y se
 *  abre hacia arriba si no hay espacio. Para listas largas/buscables, usar
 *  <Combobox>. El valor es STRING (los números se convierten en el padre).
 * ──────────────────────────────────────────────────────────────── */
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from '@/components/ui/icon';

export interface SelectOption { value: string; label: string; disabled?: boolean }

interface Props {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;   // para anchos (ej. "max-w-[220px]") u otros ajustes del trigger
}

const TEAL = '#0F766E';

export default function SelectBox({ options, value, onChange, placeholder = 'Selecciona…', disabled, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number; width: number; openUp: boolean } | null>(null);

  const actualizarCoords = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - r.bottom;
    const openUp = espacioAbajo < 260 && r.top > espacioAbajo;
    setCoords({ left: r.left, top: openUp ? r.top : r.bottom, width: r.width, openUp });
  };

  useEffect(() => {
    if (!open) return;
    actualizarCoords();
    const on = () => actualizarCoords();
    window.addEventListener('scroll', on, true);
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on, true); window.removeEventListener('resize', on); };
  }, [open]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const sel = options.find(o => o.value === value);
  const pick = (o: SelectOption) => { if (o.disabled) return; onChange(o.value); setOpen(false); };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        className="vx-input flex items-center justify-between gap-2 text-left disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ paddingRight: '2.25rem', cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <span className="truncate" style={{ color: sel ? '#0D0E12' : '#B0A898' }}>{sel ? sel.label : placeholder}</span>
      </button>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: '#64748B', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />

      {open && coords && createPortal(
        <div
          ref={menuRef}
          className="rounded-xl overflow-hidden"
          style={{
            position: 'fixed', left: coords.left, width: coords.width,
            top:    coords.openUp ? undefined : coords.top + 6,
            bottom: coords.openUp ? (window.innerHeight - coords.top + 6) : undefined,
            zIndex: 1000, background: '#FFFFFF', border: '1px solid #E5E9E7',
            boxShadow: '0 12px 32px rgba(13,26,26,0.18)',
          }}
        >
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map(o => {
              const activo = o.value === value;
              return (
                <button key={o.value} type="button" disabled={o.disabled} onClick={() => pick(o)}
                  className="w-full flex items-center justify-between gap-2 text-left px-3.5 py-2 transition-colors hover:bg-[#F0FDFA] disabled:opacity-45 disabled:cursor-not-allowed"
                  style={{ background: activo ? '#F0FDFA' : undefined }}>
                  <span className="block text-[13px] truncate" style={{ color: activo ? TEAL : '#0E1A1A', fontWeight: activo ? 600 : 400 }}>{o.label}</span>
                  {activo && <Check size={15} style={{ color: TEAL }} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
