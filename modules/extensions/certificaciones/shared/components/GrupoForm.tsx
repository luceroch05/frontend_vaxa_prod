import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, X, AlertCircle } from '@/components/ui/icon';
import { useProgramas } from '../hooks/useProgramas';
import { useCatalogos } from '../hooks/useCatalogos';
import TimeField from './TimeField';
import DateField from './DateField';
import type { CreateGrupoDto, Grupo } from '../types';

// Días de la semana en ISO: 1=Lunes .. 7=Domingo
const DIAS_CORTO: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' };
const DIAS = [1, 2, 3, 4, 5, 6, 7].map(n => ({ n, label: DIAS_CORTO[n] }));

const soloFecha = (s?: string | null) => (s ? s.substring(0, 10) : '');
const soloHora  = (s?: string | null) => (s ? s.slice(0, 5) : '');

/* ── Formulario de aula (grupo) ─────────────────────────────────
 * Si recibe `lockedPrograma`, el programa queda fijado (caso "crear/editar
 * aula dentro de un programa"). Si no, muestra el selector de programa.
 * Si recibe `initial`, el formulario arranca precargado (modo EDICIÓN).
 * ─────────────────────────────────────────────────────────────── */
export default function GrupoForm({ onSubmit, onCancel, loading, lockedPrograma, initial }: {
  onSubmit: (d: CreateGrupoDto) => void;
  onCancel: () => void;
  loading: boolean;
  lockedPrograma?: { id: number; nombre: string };
  initial?: Grupo;
}) {
  const esEdicion = !!initial;
  const { empresa } = useParams<{ empresa: string }>();
  const { programas } = useProgramas(empresa!);
  const { catalogos } = useCatalogos(empresa!);
  // Modo de fechas: 'puntual' = hasta 3 días exactos (pueden no ser seguidos);
  // 'rango' = del X al Y (varios días corridos). Se detecta del aula al editar.
  const [modo, setModo] = useState<'puntual' | 'rango'>(() =>
    initial && !initial.fecha_dia2 && !initial.fecha_dia3 && initial.fecha_fin ? 'rango' : 'puntual');
  const [form, setForm] = useState<CreateGrupoDto>(() => initial ? {
    programa_id: initial.programa_id, nombre_grupo: initial.nombre_grupo,
    fecha_inicio: soloFecha(initial.fecha_inicio),
    fecha_fin:  soloFecha(initial.fecha_fin),
    fecha_dia2: soloFecha(initial.fecha_dia2),
    fecha_dia3: soloFecha(initial.fecha_dia3),
    modalidad_id: initial.modalidad_id, dias_semana: initial.dias_semana ?? '',
    hora_inicio: soloHora(initial.hora_inicio), hora_fin: soloHora(initial.hora_fin),
  } : {
    programa_id: lockedPrograma?.id ?? 0, nombre_grupo: '', fecha_inicio: '', fecha_dia2: '', fecha_dia3: '', fecha_fin: '', modalidad_id: 0,
    dias_semana: '', hora_inicio: '', hora_fin: '',
  });
  const [dias, setDias] = useState<number[]>(() =>
    initial?.dias_semana ? initial.dias_semana.split(',').map(Number).filter(Boolean) : []);
  const [formError, setFormError] = useState<string | null>(null);
  const set = (k: keyof CreateGrupoDto, v: string | number) => setForm(f => ({ ...f, [k]: v }));
  const toggleDia = (n: number) => setDias(d => (d.includes(n) ? d.filter(x => x !== n) : [...d, n].sort((a, b) => a - b)));

  // Requeridos: Día 1 obligatorio. Día 2 y Día 3 son puntuales opcionales.
  const puedeGuardar =
    !!form.programa_id && !!form.modalidad_id && form.nombre_grupo.trim() !== '' &&
    !!form.fecha_inicio && dias.length > 0 &&
    !!form.hora_inicio && !!form.hora_fin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.programa_id) { setFormError('Selecciona el programa.'); return; }
    if (!form.fecha_inicio) { setFormError(modo === 'rango' ? 'Indica la fecha de inicio.' : 'Indica el Día 1 del curso.'); return; }

    // Según el modo se envía UN set de fechas u el otro (nunca los dos mezclados).
    let fechasPayload: Pick<CreateGrupoDto, 'fecha_fin' | 'fecha_dia2' | 'fecha_dia3'>;
    if (modo === 'rango') {
      if (form.fecha_fin && form.fecha_fin < form.fecha_inicio) { setFormError('La fecha de fin no puede ser anterior a la de inicio.'); return; }
      fechasPayload = { fecha_fin: form.fecha_fin || null, fecha_dia2: null, fecha_dia3: null };
    } else {
      const diasCurso = [form.fecha_inicio, form.fecha_dia2, form.fecha_dia3].filter(Boolean);
      if (new Set(diasCurso).size !== diasCurso.length) { setFormError('Hay días repetidos; usa fechas distintas.'); return; }
      // No permitir Día 3 sin Día 2 (evita "poner por poner").
      if (form.fecha_dia3 && !form.fecha_dia2) { setFormError('Completa el Día 2 antes del Día 3.'); return; }
      fechasPayload = { fecha_fin: null, fecha_dia2: form.fecha_dia2 || null, fecha_dia3: form.fecha_dia3 || null };
    }

    if (!dias.length) { setFormError('Selecciona al menos un día de clase.'); return; }
    if (!form.hora_inicio || !form.hora_fin) { setFormError('Indica la hora de inicio y de fin.'); return; }
    if (form.hora_fin <= form.hora_inicio) { setFormError('La hora de fin debe ser posterior a la de inicio.'); return; }
    setFormError(null);
    onSubmit({ ...form, ...fechasPayload, dias_semana: dias.join(',') });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-6 page-fade"
      style={{ border: '1px solid #EEECE6', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>{esEdicion ? 'Editar aula' : 'Nueva aula'}</p>
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

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Duración del curso</label>
          {/* Selector de modo: días puntuales (hasta 3) vs rango continuo. */}
          <div className="inline-flex p-0.5 rounded-xl mb-3" style={{ background: '#F5F3EE', border: '1px solid #E9E6DF' }}>
            {([['puntual', 'Días puntuales'], ['rango', 'Rango de fechas']] as const).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setModo(m)}
                className="px-3 h-8 rounded-lg text-[12px] font-semibold transition-all"
                style={modo === m
                  ? { background: '#0D0E12', color: '#fff' }
                  : { background: 'transparent', color: '#9CA3AF' }}
              >
                {label}
              </button>
            ))}
          </div>

          {modo === 'puntual' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10.5px] font-semibold mb-1" style={{ color: '#6B7280' }}>Día 1</p>
                  <DateField value={form.fecha_inicio} onChange={v => set('fecha_inicio', v)} />
                </div>
                <div>
                  <p className="text-[10.5px] font-semibold mb-1" style={{ color: '#9CA3AF' }}>Día 2 <span className="font-normal">(opcional)</span></p>
                  <DateField value={form.fecha_dia2 ?? ''} onChange={v => set('fecha_dia2', v)} />
                </div>
                <div>
                  <p className="text-[10.5px] font-semibold mb-1" style={{ color: '#9CA3AF' }}>Día 3 <span className="font-normal">(opcional)</span></p>
                  <DateField value={form.fecha_dia3 ?? ''} onChange={v => set('fecha_dia3', v)} />
                </div>
              </div>
              <p className="text-[10.5px] mt-1.5" style={{ color: '#9CA3AF' }}>
                Para cursos de 1 a 3 días exactos (pueden no ser seguidos, ej. 21, 25 y 1). Deja vacíos los que no uses.
              </p>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10.5px] font-semibold mb-1" style={{ color: '#6B7280' }}>Fecha inicio</p>
                  <DateField value={form.fecha_inicio} onChange={v => set('fecha_inicio', v)} />
                </div>
                <div>
                  <p className="text-[10.5px] font-semibold mb-1" style={{ color: '#9CA3AF' }}>Fecha fin <span className="font-normal">(opcional)</span></p>
                  <DateField value={form.fecha_fin ?? ''} onChange={v => set('fecha_fin', v)} />
                </div>
              </div>
              <p className="text-[10.5px] mt-1.5" style={{ color: '#9CA3AF' }}>
                Para cursos de varios días seguidos (ej. del 15 al 30). Deja el fin vacío si es un solo día.
              </p>
            </>
          )}
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
            {esEdicion ? 'Guardar cambios' : 'Guardar aula'}
          </button>
        </div>
      </div>
    </form>
  );
}

export { DIAS_CORTO };
