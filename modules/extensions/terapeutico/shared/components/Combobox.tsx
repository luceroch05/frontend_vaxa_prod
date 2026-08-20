/* ────────────────────────────────────────────────────────────────
 * <Combobox> — selector BUSCABLE reutilizable (en vez de <select>).
 *  Escribes para filtrar; el menú va en un portal (no lo recorta el modal)
 *  y se abre hacia arriba si no hay espacio. Teclado: Enter elige el primero,
 *  Escape cierra. Pensado para listas largas (ej. buscar paciente rápido).
 * ──────────────────────────────────────────────────────────────── */
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from '@/components/ui/icon';

export interface ComboOption { id: number; label: string; sub?: string }

interface Props {
  options: ComboOption[];
  value: number;                 // id seleccionado (0 = ninguno)
  onChange: (id: number) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Texto cuando no hay coincidencias. */
  emptyText?: string;
}

const TEAL = '#0F766E';

export default function Combobox({ options, value, onChange, placeholder = 'Busca o elige…', disabled, emptyText = 'Sin resultados' }: Props) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
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

  const sel = options.find(o => o.id === value);
  const q = query.toLowerCase().trim();
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q) || (o.sub ?? '').toLowerCase().includes(q)) : options;
  const inputValue = open ? query : (sel ? sel.label : '');

  const pick = (id: number) => { onChange(id); setQuery(''); setOpen(false); };

  return (
    <div className="relative" ref={ref}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: sel || open ? TEAL : '#B0A898' }} />
      <input
        type="text"
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        className="vx-input vx-input-icon"
        style={{ paddingRight: '2.5rem' }}
        onFocus={() => { if (!disabled) { setOpen(true); setQuery(''); } }}
        onChange={e => { setQuery(e.target.value); if (!open) setOpen(true); }}
        onKeyDown={e => {
          if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur(); }
          if (e.key === 'Enter' && open && filtered.length) { e.preventDefault(); pick(filtered[0].id); }
        }}
      />
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />

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
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px]" style={{ color: '#94A3B8' }}>{emptyText}</p>
            ) : (
              filtered.map(o => (
                <button key={o.id} type="button" onClick={() => pick(o.id)}
                  className="w-full text-left px-3.5 py-2 transition-colors hover:bg-[#F0FDFA]"
                  style={{ background: o.id === value ? '#F0FDFA' : undefined }}>
                  <span className="block text-[13px] font-semibold" style={{ color: '#0E1A1A' }}>{o.label}</span>
                  {o.sub && <span className="block text-[11.5px]" style={{ color: '#94A3B8' }}>{o.sub}</span>}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
