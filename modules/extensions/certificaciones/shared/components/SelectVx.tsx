import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from '@/components/ui/icon';

export interface SelectVxOption {
  value: string;
  label: string;
  /** Nodo extra a la derecha (ej. una pista). */
  hint?: ReactNode;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectVxOption[];
  placeholder?: string;
  /** Ícono opcional a la izquierda del campo. */
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Select con el diseño de la app (tema dorado, menú flotante en portal para que
 * no lo recorte el overflow de un modal, chevron animado, hover dorado). Mismo
 * patrón visual que <ProgramaGrupoPicker> pero genérico y reutilizable.
 */
export default function SelectVx({ value, onChange, options, placeholder = 'Selecciona…', icon, className = '', disabled }: Props) {
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

  const selected = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: value || open ? '#C9962C' : '#C8C3BB' }}>
          {icon}
        </span>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`vx-input w-full text-left ${icon ? 'vx-input-icon' : ''}`}
        style={{ paddingRight: '2.5rem', color: selected ? '#0D0E12' : '#B0A898', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
      >
        {selected ? selected.label : placeholder}
      </button>
      <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: '#B0A898', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />

      {open && coords && createPortal(
        <div
          ref={menuRef}
          className="rounded-xl overflow-hidden"
          style={{
            position: 'fixed',
            left: coords.left,
            width: coords.width,
            top:    coords.openUp ? undefined : coords.top + 6,
            bottom: coords.openUp ? (window.innerHeight - coords.top + 6) : undefined,
            zIndex: 1000,
            background: '#FFFFFF',
            border: '1px solid #EAE7DF',
            boxShadow: '0 12px 32px rgba(13,14,18,0.18)',
          }}
        >
          <div className="max-h-56 overflow-y-auto py-1">
            {options.map(o => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[#FAF8F2] flex items-center justify-between gap-2"
                  style={{ background: active ? '#FBF7EC' : undefined, color: '#0D0E12' }}
                >
                  <span>{o.label}</span>
                  {active ? <Check size={15} style={{ color: '#C9962C', flexShrink: 0 }} /> : (o.hint ?? null)}
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
