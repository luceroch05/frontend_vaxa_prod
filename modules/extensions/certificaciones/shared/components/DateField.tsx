import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from '@/components/ui/icon';

interface DateFieldProps {
  /** Valor en formato ISO "YYYY-MM-DD" (lo que espera el backend). Vacío = sin valor. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DOW   = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

/** ISO "YYYY-MM-DD" → texto "DD/MM/YYYY" para mostrar. */
function isoToText(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/* ── Campo de fecha: se escribe Y se selecciona ─────────────────
 * - Escribes "15012026" y se formatea solo a "15/01/2026".
 * - O abres el calendario (ícono) y eliges el día con el mouse.
 * Valor de salida ISO "YYYY-MM-DD". Reutilizable.
 * ─────────────────────────────────────────────────────────────── */
export default function DateField({ value, onChange, placeholder = 'DD/MM/AAAA', disabled }: DateFieldProps) {
  const [text, setText] = useState(isoToText(value));
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => parseView(value));   // mes mostrado en el calendario
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setText(isoToText(value)); }, [value]);

  // Al abrir / al escribir una fecha completa, posicionar el calendario en ese mes.
  useEffect(() => {
    if (!open) return;
    if (value) setView(parseView(value));
  }, [open, value]);

  // Cerrar al hacer clic fuera.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handle = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = d;
    if (d.length > 4)      formatted = `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
    else if (d.length > 2) formatted = `${d.slice(0, 2)}/${d.slice(2)}`;
    setText(formatted);

    if (d.length === 8) {
      const dd   = Math.min(31, Math.max(1, Number(d.slice(0, 2))));
      const mm   = Math.min(12, Math.max(1, Number(d.slice(2, 4))));
      const yyyy = d.slice(4);
      onChange(`${yyyy}-${pad(mm)}-${pad(dd)}`);
    } else {
      onChange('');
    }
  };

  const handleBlur = () => setText(isoToText(value));

  const pickDay = (day: number) => {
    onChange(`${view.y}-${pad(view.m + 1)}-${pad(day)}`);
    setOpen(false);
  };

  // Construcción de la grilla del mes (lunes primero).
  const first  = new Date(view.y, view.m, 1);
  const offset = (first.getDay() + 6) % 7;                    // 0 = lunes
  const diasMes = new Date(view.y, view.m + 1, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: diasMes }, (_, i) => i + 1),
  ];

  const sel = parseSelected(value);
  const hoy = new Date();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        title="Abrir calendario"
        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-colors hover:bg-[#F0EEE9] z-10"
        style={{ color: text ? '#D97706' : '#B0A898' }}
      >
        <Calendar size={15} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        disabled={disabled}
        onChange={e => handle(e.target.value)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="vx-input vx-input-icon tabular-nums"
      />

      {/* Calendario */}
      {open && (
        <div
          className="absolute z-30 mt-1.5 left-0 bg-white rounded-2xl p-3 page-fade"
          style={{ border: '1px solid #EEECE6', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', width: 264 }}
        >
          {/* Cabecera mes/año */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setView(shift(view, -1))}
              className="p-1.5 rounded-lg transition-colors hover:bg-[#F5F3EE]" style={{ color: '#64748B' }}>
              <ChevronLeft size={16} />
            </button>
            <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>
              {MESES[view.m]} {view.y}
            </p>
            <button type="button" onClick={() => setView(shift(view, 1))}
              className="p-1.5 rounded-lg transition-colors hover:bg-[#F5F3EE]" style={{ color: '#64748B' }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DOW.map(d => (
              <span key={d} className="text-center text-[10px] font-semibold uppercase py-1" style={{ color: '#C8C3BB' }}>{d}</span>
            ))}
          </div>

          {/* Grilla */}
          <div className="grid grid-cols-7 gap-0.5">
            {celdas.map((day, i) => {
              if (day === null) return <span key={`b${i}`} />;
              const esSel = sel && sel.y === view.y && sel.m === view.m && sel.d === day;
              const esHoy = hoy.getFullYear() === view.y && hoy.getMonth() === view.m && hoy.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pickDay(day)}
                  className="h-8 rounded-lg text-[12px] font-medium transition-colors tabular-nums"
                  style={esSel
                    ? { background: '#0D0E12', color: '#fff' }
                    : { color: '#374151', border: esHoy ? '1.5px solid #FDE68A' : '1.5px solid transparent' }}
                  onMouseEnter={e => { if (!esSel) e.currentTarget.style.background = '#F5F3EE'; }}
                  onMouseLeave={e => { if (!esSel) e.currentTarget.style.background = 'transparent'; }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── helpers ── */
function parseView(iso: string): { y: number; m: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) return { y: Number(m[1]), m: Number(m[2]) - 1 };
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth() };
}
function parseSelected(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
}
function shift(v: { y: number; m: number }, delta: number): { y: number; m: number } {
  const d = new Date(v.y, v.m + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}
