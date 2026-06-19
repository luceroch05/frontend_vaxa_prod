import { useState, useEffect } from 'react';
import { Clock } from '@/components/ui/icon';

interface TimeFieldProps {
  /** Valor en formato "HH:MM" (admite "HH:MM:SS", se recorta). Vacío = sin valor. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

/* ── Campo de hora escribible ───────────────────────────────────
 * Se escribe con el teclado: tecleas "1930" y se formatea solo a
 * "19:30". Sin selectores. Valor de salida en "HH:MM".
 * Reutilizable en cualquier formulario.
 * ─────────────────────────────────────────────────────────────── */
export default function TimeField({ value, onChange, placeholder = '--:--', disabled }: TimeFieldProps) {
  const [text, setText] = useState(value ? value.slice(0, 5) : '');

  // Si el valor cambia desde fuera (reset del form, etc.), reflejarlo.
  useEffect(() => { setText(value ? value.slice(0, 5) : ''); }, [value]);

  const handle = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 4);          // solo dígitos, máx 4
    const formatted = d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
    setText(formatted);

    if (d.length === 4) {
      const h = Math.min(23, Number(d.slice(0, 2)));
      const m = Math.min(59, Number(d.slice(2)));
      onChange(`${pad(h)}:${pad(m)}`);
    } else {
      onChange('');                                         // incompleto → sin valor
    }
  };

  // Al salir del campo, normaliza lo que se vea (p.ej. "9:5" → vacío, "2599" → "23:59").
  const handleBlur = () => setText(value ? value.slice(0, 5) : '');

  return (
    <div className="relative">
      <Clock
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: text ? '#D97706' : '#B0A898' }}
      />
      <input
        type="text"
        inputMode="numeric"
        value={text}
        disabled={disabled}
        onChange={e => handle(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="vx-input vx-input-icon tabular-nums"
      />
    </div>
  );
}
