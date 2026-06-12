import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Layers, Loader2, X, AlertCircle, Users, Calendar, Clock, ChevronRight } from '@/components/ui/icon';
import { useGrupos }   from '../../shared/hooks/useGrupos';
import { useProgramas } from '../../shared/hooks/useProgramas';
import { useCatalogos } from '../../shared/hooks/useCatalogos';
import { usePagination } from '../../shared/hooks/usePagination';
import Pagination from '../../shared/components/Pagination';
import type { CreateGrupoDto, Grupo } from '../../shared/types';

const fmt = (d: string | Date) => {
  if (!d) return '—';
  const s = typeof d === 'string' ? d.substring(0, 10) : d.toISOString().substring(0, 10);
  return new Date(s + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Días de la semana en ISO: 1=Lunes .. 7=Domingo
const DIAS = [
  { n: 1, label: 'L' }, { n: 2, label: 'M' }, { n: 3, label: 'X' },
  { n: 4, label: 'J' }, { n: 5, label: 'V' }, { n: 6, label: 'S' }, { n: 7, label: 'D' },
];
const DIAS_CORTO: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' };
const fmtHora = (h?: string | null) => (h ? h.slice(0, 5) : '');  // "HH:MM:SS" → "HH:MM"

/** Texto legible del horario del grupo. Ej: "Lun, Mié, Vie · 19:00–22:00" */
function fmtHorario(g: { dias_semana?: string | null; hora_inicio?: string | null; hora_fin?: string | null }): string | null {
  if (!g.dias_semana) return null;
  const dias = g.dias_semana.split(',').map(Number).filter(Boolean).map(n => DIAS_CORTO[n]).join(', ');
  const horas = g.hora_inicio && g.hora_fin ? ` · ${fmtHora(g.hora_inicio)}–${fmtHora(g.hora_fin)}` : '';
  return `${dias}${horas}`;
}

/* ── Form ───────────────────────────────────────────────────── */
function GrupoForm({ onSubmit, onCancel, loading }: {
  onSubmit: (d: CreateGrupoDto) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { empresa } = useParams<{ empresa: string }>();
  const { programas } = useProgramas(empresa!);
  const { catalogos } = useCatalogos(empresa!);
  const [form, setForm] = useState<CreateGrupoDto>({
    programa_id: 0, nombre_grupo: '', fecha_inicio: '', fecha_fin: '', modalidad_id: 0,
    dias_semana: '', hora_inicio: '', hora_fin: '',
  });
  const [dias, setDias] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const set = (k: keyof CreateGrupoDto, v: string | number) => setForm(f => ({ ...f, [k]: v }));
  const toggleDia = (n: number) => setDias(d => (d.includes(n) ? d.filter(x => x !== n) : [...d, n].sort((a, b) => a - b)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          <p className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Nuevo grupo</p>
          <p className="text-[12px] mt-0.5" style={{ color: '#9CA3AF' }}>Completa los datos del grupo</p>
        </div>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-[#F5F3EE] transition-colors" style={{ color: '#9CA3AF' }}>
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Programa</label>
            <select required value={form.programa_id} onChange={e => set('programa_id', +e.target.value)} className="vx-input">
              <option value={0} disabled>Seleccionar...</option>
              {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Modalidad</label>
            <select required value={form.modalidad_id} onChange={e => set('modalidad_id', +e.target.value)} className="vx-input">
              <option value={0} disabled>Seleccionar...</option>
              {catalogos?.modalidades.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Nombre del grupo</label>
          <input type="text" required maxLength={100} value={form.nombre_grupo}
            onChange={e => set('nombre_grupo', e.target.value)}
            placeholder="Ej: Grupo A — Enero 2026" className="vx-input" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Fecha inicio</label>
            <input type="date" required value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} className="vx-input" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Fecha fin</label>
            <input type="date" required value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)} className="vx-input" />
          </div>
        </div>

        {/* Horario: días de la semana */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Días de clase</label>
          <div className="flex gap-1.5">
            {DIAS.map(d => {
              const on = dias.includes(d.n);
              return (
                <button
                  key={d.n}
                  type="button"
                  onClick={() => toggleDia(d.n)}
                  title={DIAS_CORTO[d.n]}
                  className="w-9 h-9 rounded-xl text-[13px] font-bold transition-all"
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
            <input type="time" value={form.hora_inicio ?? ''} onChange={e => set('hora_inicio', e.target.value)} className="vx-input" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Hora fin</label>
            <input type="time" value={form.hora_fin ?? ''} onChange={e => set('hora_fin', e.target.value)} className="vx-input" />
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
          <button type="submit" disabled={loading} className="vx-btn vx-btn-primary px-5 py-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Guardar grupo
          </button>
        </div>
      </div>
    </form>
  );
}

/* ── Grupo row ──────────────────────────────────────────────── */
function GrupoRow({ grupo, onVerInscritos, isLast }: { grupo: Grupo; onVerInscritos: (g: Grupo) => void; isLast: boolean }) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 transition-colors"
      style={{ borderBottom: isLast ? undefined : '1px solid #F5F4F0' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: grupo.activo ? '#DCFCE7' : '#F5F4F0' }}
        >
          <Layers size={16} style={{ color: grupo.activo ? '#15803D' : '#B0A898' }} />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold truncate" style={{ color: '#0D0E12' }}>{grupo.nombre_grupo}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              {grupo.programa_nombre}
            </span>
            <span className="text-[11px]" style={{ color: '#9CA3AF' }}>{grupo.modalidad_nombre}</span>
          </div>
          {fmtHorario(grupo) && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px]" style={{ color: '#C9962C' }}>
              <Clock size={11} className="flex-shrink-0" />
              <span className="font-medium">{fmtHorario(grupo)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:flex-shrink-0">
        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: '#9CA3AF' }}>
          <Calendar size={12} />
          <span>{fmt(grupo.fecha_inicio)} — {fmt(grupo.fecha_fin)}</span>
        </div>
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={grupo.activo
            ? { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }
            : { background: '#F5F4F0', color: '#9CA3AF', border: '1px solid #EEECE6' }
          }
        >
          {grupo.activo ? 'Activo' : 'Inactivo'}
        </span>
        <button
          onClick={() => onVerInscritos(grupo)}
          className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
          style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = '#2563EB'; }}
        >
          <Users size={12} />
          Inscritos
          <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function AdminGrupos() {
  const { empresa } = useParams<{ empresa: string }>();
  const navigate    = useNavigate();
  const { grupos, loading, error, create } = useGrupos(empresa!);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleCreate = async (data: CreateGrupoDto) => {
    setSaving(true); setSaveError(null);
    try { await create(data); setShowForm(false); }
    catch (e: unknown) { setSaveError((e as Error).message); }
    finally { setSaving(false); }
  };

  const handleVerInscritos = (g: Grupo) =>
    navigate(`/${empresa}/certificados/panel/inscripciones?grupo=${g.id}&nombre=${encodeURIComponent(g.nombre_grupo)}`);

  const activos   = grupos.filter(g => g.activo).length;
  const inactivos = grupos.filter(g => !g.activo).length;

  const { page, setPage, totalPages, pageItems, startIndex, endIndex, total } =
    usePagination(grupos, 10);

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-[13px]" style={{ color: '#9CA3AF' }}>
            {activos} activo{activos !== 1 ? 's' : ''} · {inactivos} inactivo{inactivos !== 1 ? 's' : ''}
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="vx-btn vx-btn-primary px-4 py-2">
            <Plus size={15} /> Nuevo grupo
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div>
          {saveError && (
            <div className="flex items-center gap-2 text-[13px] px-3.5 py-2.5 rounded-xl mb-3"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
              <AlertCircle size={14} className="flex-shrink-0" /> {saveError}
            </div>
          )}
          <GrupoForm onSubmit={handleCreate} onCancel={() => { setShowForm(false); setSaveError(null); }} loading={saving} />
        </div>
      )}

      {/* Loading / Error */}
      {loading && <div className="flex justify-center py-16" style={{ color: '#D1D5DB' }}><Loader2 size={22} className="animate-spin" /></div>}
      {error && (
        <div className="flex items-center gap-2 text-[13px] px-4 py-3 rounded-xl"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Empty */}
      {!loading && grupos.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #EEECE6' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <Layers size={22} />
          </div>
          <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>Sin grupos registrados</p>
          <p className="text-[13px] mt-1 mb-4" style={{ color: '#9CA3AF' }}>Crea el primer grupo para empezar</p>
          <button onClick={() => setShowForm(true)} className="vx-btn vx-btn-primary px-5 py-2">
            <Plus size={15} /> Crear grupo
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && grupos.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
          {/* Table header */}
          <div className="hidden sm:flex items-center px-5 py-3" style={{ background: '#FAFAF8', borderBottom: '1px solid #EEECE6' }}>
            <p className="flex-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Grupo</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider mr-4" style={{ color: '#9CA3AF' }}>Fechas</p>
            <p className="w-20 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Estado</p>
            <p className="w-24 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Acción</p>
          </div>
          {pageItems.map((g, i) => (
            <GrupoRow key={g.id} grupo={g} onVerInscritos={handleVerInscritos} isLast={i === pageItems.length - 1} />
          ))}
        </div>
      )}

      {/* Paginación */}
      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          startIndex={startIndex}
          endIndex={endIndex}
          total={total}
          itemLabel="grupos"
          accentColor="#10B981"
        />
      )}
    </div>
  );
}
