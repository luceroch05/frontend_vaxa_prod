import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, X, AlertCircle } from '@/components/ui/icon';
import { useProgramas } from '../hooks/useProgramas';
import { useCatalogos } from '../hooks/useCatalogos';
import TimeField from './TimeField';
import DateField from './DateField';
import type { CreateGrupoDto } from '../types';

// Días de la semana en ISO: 1=Lunes .. 7=Domingo
const DIAS_CORTO: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' };
const DIAS = [1, 2, 3, 4, 5, 6, 7].map(n => ({ n, label: DIAS_CORTO[n] }));

/* ── Formulario de aula (grupo) ─────────────────────────────────
 * Si recibe `lockedPrograma`, el programa queda fijado (caso "crear aula
 * dentro de un programa"). Si no, muestra el selector de programa.
 * ─────────────────────────────────────────────────────────────── */
export default function GrupoForm({ onSubmit, onCancel, loading, lockedPrograma }: {
  onSubmit: (d: CreateGrupoDto) => void;
  onCancel: () => void;
  loading: boolean;
  lockedPrograma?: { id: number; nombre: string };
}) {
  const { empresa } = useParams<{ empresa: string }>();
  const { programas } = useProgramas(empresa!);
  const { catalogos } = useCatalogos(empresa!);
  const [form, setForm] = useState<CreateGrupoDto>({
    programa_id: lockedPrograma?.id ?? 0, nombre_grupo: '', fecha_inicio: '', fecha_fin: '', modalidad_id: 0,
    dias_semana: '', hora_inicio: '', hora_fin: '',
  });
  const [dias, setDias] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const set = (k: keyof CreateGrupoDto, v: string | number) => setForm(f => ({ ...f, [k]: v }));
  const toggleDia = (n: number) => setDias(d => (d.includes(n) ? d.filter(x => x !== n) : [...d, n].sort((a, b) => a - b)));

  // Requeridos completos (el orden de fechas/horas se valida al enviar).
  const puedeGuardar =
    !!form.programa_id && !!form.modalidad_id && form.nombre_grupo.trim() !== '' &&
    !!form.fecha_inicio && !!form.fecha_fin && dias.length > 0 &&
    !!form.hora_inicio && !!form.hora_fin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.programa_id) { setFormError('Selecciona el programa.'); return; }
    if (!form.fecha_inicio || !form.fecha_fin) { setFormError('Indica la fecha de inicio y de fin.'); return; }
    if (form.fecha_fin < form.fecha_inicio) { setFormError('La fecha de fin no puede ser anterior a la de inicio.'); return; }
    if (!dias.length) { setFormError('Selecciona al menos un día de clase.'); return; }
    if (!form.hora_inicio || !form.hora_fin) { setFormError('Indica la hora de inicio y de fin.'); return; }
    if (form.hora_fin <= form.hora_inicio) { setFormError('La hora de fin debe ser posterior a la de inicio.'); return; }
    setFormError(null);
    onSubmit({ ...form, dias_semana: dias.join(',') });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-6 page-fade"
      style={{ border: '1px solid #EEECE6', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Nueva aula</p>
          <p className="text-[12px] mt-0.5" style={{ color: '#9CA3AF' }}>
            {lockedPrograma ? `Programa: ${lockedPrograma.nombre}` : 'Completa los datos del aula'}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-[#F5F3EE] transition-colors" style={{ color: '#9CA3AF' }}>
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Programa: selector solo si NO viene fijado */}
          {lockedPrograma ? (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Programa</label>
              <div className="vx-input flex items-center" style={{ background: '#FAFAF8', color: '#6B7280', cursor: 'not-allowed' }}>
                {lockedPrograma.nombre}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Programa</label>
              <select required value={form.programa_id} onChange={e => set('programa_id', +e.target.value)} className="vx-input">
                <option value={0} disabled>Seleccionar...</option>
                {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Modalidad</label>
            <select required value={form.modalidad_id} onChange={e => set('modalidad_id', +e.target.value)} className="vx-input">
              <option value={0} disabled>Seleccionar...</option>
              {catalogos?.modalidades.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Nombre del aula</label>
          <input type="text" required maxLength={100} value={form.nombre_grupo}
            onChange={e => set('nombre_grupo', e.target.value)}
            placeholder="Ej: Grupo A — Enero 2026" className="vx-input" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Fecha inicio</label>
            <DateField value={form.fecha_inicio} onChange={v => set('fecha_inicio', v)} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Fecha fin</label>
            <DateField value={form.fecha_fin} onChange={v => set('fecha_fin', v)} />
          </div>
        </div>

        {/* Horario: días de la semana */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Días de clase</label>
          <div className="flex gap-1.5 flex-wrap">
            {DIAS.map(d => {
              const on = dias.includes(d.n);
              return (
                <button
                  key={d.n}
                  type="button"
                  onClick={() => toggleDia(d.n)}
                  title={DIAS_CORTO[d.n]}
                  className="px-3 h-9 min-w-[46px] rounded-xl text-[12px] font-bold transition-all"
                  style={on
                    ? { background: '#0D0E12', color: '#FFFFFF', border: '1.5px solid #0D0E12' }
                    : { background: '#FAFAF8', color: '#9CA3AF', border: '1.5px solid #E9E6DF' }
                  }
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Horario: horas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Hora inicio</label>
            <TimeField value={form.hora_inicio ?? ''} onChange={v => set('hora_inicio', v)} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Hora fin</label>
            <TimeField value={form.hora_fin ?? ''} onChange={v => set('hora_fin', v)} />
          </div>
        </div>

        {formError && (
          <div className="flex items-center gap-2 text-[12px] px-3.5 py-2.5 rounded-xl"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
            <AlertCircle size={13} className="flex-shrink-0" /> {formError}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCancel} className="vx-btn vx-btn-ghost px-4 py-2">Cancelar</button>
          <button type="submit" disabled={loading || !puedeGuardar} className="vx-btn vx-btn-primary px-5 py-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Guardar aula
          </button>
        </div>
      </div>
    </form>
  );
}

export { DIAS_CORTO };
