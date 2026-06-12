import { useState, useRef, useEffect } from 'react';
import { ChevronDown, BookOpen, Clock, Calendar } from '@/components/ui/icon';
import type { Grupo } from '../types';

const DIAS_CORTO: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' };
const fmtHora  = (h?: string | null) => (h ? h.slice(0, 5) : '');
const fmtDias  = (s?: string | null) => (s ? s.split(',').map(Number).filter(Boolean).map(n => DIAS_CORTO[n]).join(', ') : '');
const fmtFecha = (d?: string) => (d ? new Date(d.substring(0, 10) + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '');

interface Props {
  grupos: Grupo[];
  value: number;                  // grupo_id seleccionado
  onChange: (grupoId: number) => void;
}

/**
 * Selección en dos pasos para inscribirse:
 *  1) elegir el PROGRAMA (combobox buscable),
 *  2) elegir uno de sus GRUPOS activos (radio), mostrando su horario
 *     (cuándo empieza, qué días y a qué hora) en vez del nombre del grupo.
 */
export default function ProgramaGrupoPicker({ grupos, value, onChange }: Props) {
  // Programas únicos a partir de los grupos disponibles.
  const programas = Array.from(
    new Map(grupos.map(g => [g.programa_id, { id: g.programa_id, nombre: g.programa_nombre }])).values()
  );

  const grupoSel = grupos.find(g => g.id === value);
  const [programaId, setProgramaId] = useState<number>(grupoSel?.programa_id ?? 0);

  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const programaSel = programas.find(p => p.id === programaId);
  const filtered    = programas.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase().trim()));
  const inputValue  = open ? query : (programaSel ? programaSel.nombre : '');

  const pickPrograma = (id: number) => {
    setProgramaId(id);
    setQuery(''); setOpen(false);
    onChange(0);   // al cambiar de programa, se limpia el grupo elegido
  };

  const gruposDelPrograma = grupos.filter(g => g.programa_id === programaId);

  return (
    <div className="space-y-4">
      {/* Paso 1 · Programa (combobox buscable) */}
      <div className="relative" ref={ref}>
        <BookOpen size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: programaSel || open ? '#C9962C' : '#C8C3BB' }} />
        <input
          type="text"
          value={inputValue}
          placeholder="Busca o elige el programa…"
          className="vx-input vx-input-icon"
          style={{ paddingRight: '2.5rem' }}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onChange={e => { setQuery(e.target.value); if (!open) setOpen(true); }}
          onKeyDown={e => {
            if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur(); }
            if (e.key === 'Enter' && open && filtered.length) { e.preventDefault(); pickPrograma(filtered[0].id); }
          }}
        />
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />

        {open && (
          <div className="absolute z-30 mt-1.5 w-full rounded-xl overflow-hidden page-enter" style={{ background: '#FFFFFF', border: '1px solid #EAE7DF', boxShadow: '0 12px 32px rgba(13,14,18,0.12)' }}>
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px]" style={{ color: '#B0A898' }}>Sin resultados</p>
              ) : (
                filtered.map(p => (
                  <button key={p.id} type="button" onClick={() => pickPrograma(p.id)}
                    className="w-full text-left px-3.5 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[#FAF8F2]"
                    style={{ background: p.id === programaId ? '#FBF7EC' : undefined, color: '#0D0E12' }}>
                    {p.nombre}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Paso 2 · Grupos del programa (radio con horario) */}
      {programaId !== 0 && (
        gruposDelPrograma.length === 0 ? (
          <p className="text-[12px]" style={{ color: '#C9962C' }}>Este programa no tiene grupos disponibles por ahora.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Elige el horario</p>
            {gruposDelPrograma.map(g => {
              const active   = g.id === value;
              const dias     = fmtDias(g.dias_semana);
              const conHoras = g.hora_inicio && g.hora_fin;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onChange(g.id)}
                  className="w-full text-left rounded-xl p-3.5 flex items-start gap-3 transition-all"
                  style={active
                    ? { border: '1.5px solid #C9962C', background: '#FBF7EC' }
                    : { border: '1.5px solid #E9E6DF', background: '#FAFAF8' }
                  }
                >
                  {/* Radio */}
                  <span className="mt-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0" style={{ border: `1.5px solid ${active ? '#C9962C' : '#C8C3BB'}`, background: '#FFFFFF' }}>
                    {active && <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#C9962C' }} />}
                  </span>

                  <span className="min-w-0 flex-1">
                    {/* Días + horas (lo principal) */}
                    {dias ? (
                      <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: '#0D0E12' }}>
                        <Clock size={13} style={{ color: '#C9962C', flexShrink: 0 }} />
                        <span>{dias}{conHoras ? ` · ${fmtHora(g.hora_inicio)}–${fmtHora(g.hora_fin)}` : ''}</span>
                      </span>
                    ) : (
                      <span className="text-[13.5px] font-bold" style={{ color: '#0D0E12' }}>{g.nombre_grupo}</span>
                    )}

                    {/* Fechas + modalidad */}
                    <span className="flex items-center gap-1.5 text-[11.5px] mt-1" style={{ color: '#9CA3AF' }}>
                      <Calendar size={11} className="flex-shrink-0" />
                      <span>Inicia {fmtFecha(g.fecha_inicio)} · {g.modalidad_nombre}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
