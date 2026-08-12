import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { certPath } from '@/lib/paths';
import {
  ClipboardList, Loader2, AlertCircle, Search,
  ChevronLeft, Users, UserCheck, Trash2, X,
} from '@/components/ui/icon';
import { useInscripciones } from '../../shared/hooks/useInscripciones';
import { useGrupos }        from '../../shared/hooks/useGrupos';
import { usePagination }    from '../../shared/hooks/usePagination';
import { useConfirm }       from '../../shared/hooks/useConfirm';
import { useEsAdmin }       from '../../shared/hooks/useEsAdmin';
import { unidadesApi }      from '../../shared/api/unidades.api';
import Pagination from '../../shared/components/Pagination';
import CalidadBadge from '../../shared/components/CalidadBadge';
import NotasGrupo from './NotasGrupo';
import type { Inscripcion } from '../../shared/types';

/* ── Estado config ──────────────────────────────────────────── */
const ESTADOS: Record<number, { label: string; bg: string; color: string; border: string }> = {
  1: { label: 'Inscrito',    bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  2: { label: 'En curso',    bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  3: { label: 'Aprobado',    bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  4: { label: 'Desaprobado', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  5: { label: 'Retirado',    bg: '#F5F4F0', color: '#64748B', border: '#E2E8F0' },
  6: { label: 'Rechazado',   bg: '#FFF7ED', color: '#C2410C', border: '#FDBA74' },
};

function EstadoBadge({ estadoId }: { estadoId: number }) {
  const e = ESTADOS[estadoId] ?? { label: 'Desconocido', bg: '#F5F4F0', color: '#64748B', border: '#E2E8F0' };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: e.bg, color: e.color, border: `1px solid ${e.border}` }}
    >
      {e.label}
    </span>
  );
}

/* ── Inscripcion row ────────────────────────────────────────── */
function InscripcionRow({ inscripcion, onCambiarEstado, onEliminar, isLast, tieneUnidades, esAdmin, selected, onToggleSel }: {
  inscripcion: Inscripcion;
  onCambiarEstado: (id: number, estado: number) => void;
  onEliminar: (i: Inscripcion) => void;
  isLast: boolean;
  /** true: programa con unidades (aprobación por notas) · false: sin unidades (manual) · null: desconocido */
  tieneUnidades: boolean | null;
  esAdmin: boolean;
  selected: boolean;
  onToggleSel: () => void;
}) {
  const [rowLoading, setRowLoading] = useState(false);

  const handleCambio = async (nuevoEstado: number) => {
    if (nuevoEstado === inscripcion.estado_id) return;
    setRowLoading(true);
    try { await onCambiarEstado(inscripcion.id, nuevoEstado); }
    finally { setRowLoading(false); }
  };

  // Aprobado(3)/Desaprobado(4) son manuales cuando el programa NO usa notas.
  // Si tiene unidades, los decide el sistema con las notas. Mostramos la opción
  // mientras no se confirme que tiene unidades (false o desconocido), y el backend
  // igual rechaza con un mensaje claro si el programa realmente usa notas.
  // El estado actual siempre se incluye para que se muestre seleccionado.
  const opciones = [1, 2, 3, 4, 5, 6].filter(id =>
    id === inscripcion.estado_id ||
    ((id === 3 || id === 4) ? tieneUnidades !== true : true),
  );

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 transition-colors"
      style={{ borderBottom: isLast ? undefined : '1px solid #F5F4F0', background: selected ? '#F5F3FF' : undefined }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#FAFAF8'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Participante info */}
      <div className="flex items-center gap-3 min-w-0">
        {esAdmin && (
          <input type="checkbox" className="w-4 h-4 rounded cursor-pointer flex-shrink-0" style={{ accentColor: '#7C3AED' }}
            checked={selected} onChange={onToggleSel} title="Seleccionar" />
        )}
        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: '#F5F3FF' }}>
          <Users size={15} style={{ color: '#7C3AED' }} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-[14px] font-semibold truncate" style={{ color: '#0D0E12' }}>
              {inscripcion.participante_nombre}
            </p>
            <CalidadBadge calidad={inscripcion.calidad} />
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
            {inscripcion.numero_documento}
            {inscripcion.programa_nombre && ` · ${inscripcion.programa_nombre}`}
            {inscripcion.nombre_grupo && ` · ${inscripcion.nombre_grupo}`}
          </p>
        </div>
      </div>

      {/* Estado + selector de cambio */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <EstadoBadge estadoId={inscripcion.estado_id} />
        <div className="flex items-center gap-1.5">
          <select
            value={inscripcion.estado_id}
            onChange={e => handleCambio(Number(e.target.value))}
            disabled={rowLoading}
            className="vx-input"
            style={{ padding: '0.35rem 0.6rem', fontSize: 12, minWidth: 135 }}
            title="Cambiar estado del participante"
          >
            {opciones.map(id => (
              <option key={id} value={id}>{ESTADOS[id]?.label}</option>
            ))}
          </select>
          {rowLoading && <Loader2 size={13} className="animate-spin" style={{ color: '#9CA3AF' }} />}
          {esAdmin && (
          <button
            onClick={() => onEliminar(inscripcion)}
            disabled={rowLoading}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all flex-shrink-0"
            style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}
            title="Borrar inscripción"
          >
            <Trash2 size={13} />
          </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function AdminInscripciones() {
  const { empresa }      = useParams<{ empresa: string }>();
  const esAdmin = useEsAdmin();   // ADMISION no puede eliminar inscripciones
  const navigate         = useNavigate();
  const [searchParams]   = useSearchParams();

  const grupoIdParam  = searchParams.get('grupo');
  const grupoNombre   = searchParams.get('nombre');
  const grupoId       = grupoIdParam ? Number(grupoIdParam) : undefined;

  const { inscripciones, loading, error, cambiarEstado, cambiarEstadoMasivo, eliminar, refetch } = useInscripciones(empresa!, grupoId);
  const { grupos } = useGrupos(empresa!);
  const confirm = useConfirm();

  const [filtroEstado, setFiltroEstado] = useState<number | 'todos'>('todos');
  const [filtroCalidad, setFiltroCalidad] = useState<string>('todas');
  const [busqueda,     setBusqueda]     = useState('');
  const [vista,        setVista]        = useState<'inscripciones' | 'notas'>('inscripciones');
  const [aprobandoTodos, setAprobandoTodos] = useState(false);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [borrando, setBorrando] = useState(false);

  const toggleOne = (id: number) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleAllPage = (ids: number[]) => setSelected(prev => {
    const all = ids.length > 0 && ids.every(id => prev.has(id));
    const n = new Set(prev);
    if (all) ids.forEach(id => n.delete(id)); else ids.forEach(id => n.add(id));
    return n;
  });
  const clearSel = () => setSelected(new Set());

  // ¿El programa del grupo seleccionado tiene unidades? → define si Aprobado/Desaprobado son manuales.
  const programaId = grupoId ? grupos.find(g => g.id === grupoId)?.programa_id : undefined;
  const [tieneUnidades, setTieneUnidades] = useState<boolean | null>(null);
  useEffect(() => {
    if (!programaId) { setTieneUnidades(null); return; }
    let cancel = false;
    unidadesApi.list(empresa!, programaId)
      .then(u => { if (!cancel) setTieneUnidades(u.length > 0); })
      .catch(() => { if (!cancel) setTieneUnidades(null); });
    return () => { cancel = true; };
  }, [empresa, programaId]);

  const handleCambiarEstado = async (id: number, estado: number) => {
    setAccionError(null);
    try { await cambiarEstado(id, estado); }
    catch (e: unknown) { setAccionError((e as Error).message); }
  };

  const handleEliminar = async (i: Inscripcion) => {
    const ok = await confirm({
      title: 'Borrar inscripción',
      message: `Se BORRARÁ la inscripción de ${i.participante_nombre}${i.nombre_grupo ? ` en ${i.nombre_grupo}` : ''} y sus notas. Si tiene certificado emitido, también se borrará y se te devolverá el crédito. Esta acción no se puede deshacer.`,
      confirmText: 'Borrar definitivamente',
      variant: 'danger',
    });
    if (!ok) return;
    setAccionError(null);
    try { await eliminar(i.id); }
    catch (e: unknown) { setAccionError((e as Error).message); }
  };

  /** Eliminar en lote: recorre las inscripciones seleccionadas una a una. */
  const handleEliminarMasa = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const ok = await confirm({
      title: 'Borrar inscripciones',
      message: `Se BORRARÁN ${ids.length} inscripción${ids.length !== 1 ? 'es' : ''} con sus notas. Si tienen certificado emitido, también se borra y se devuelve el crédito. No se puede deshacer.`,
      confirmText: `Borrar ${ids.length}`,
      variant: 'danger',
    });
    if (!ok) return;
    setBorrando(true); setAccionError(null);
    const errores: string[] = [];
    for (const id of ids) {
      try { await eliminar(id); }
      catch (e: unknown) { errores.push((e as Error).message); }
    }
    setBorrando(false);
    clearSel();
    if (errores.length) setAccionError(`No se pudieron borrar ${errores.length} de ${ids.length}. Motivo: ${errores[0]}`);
  };

  const handleGrupoChange = (val: string) => {
    if (!val) {
      navigate(certPath(empresa!, '/panel/inscripciones'));
    } else {
      const g = grupos.find(g => g.id === Number(val));
      const n = g ? `&nombre=${encodeURIComponent(g.nombre_grupo)}` : '';
      navigate(certPath(empresa!, `/panel/inscripciones?grupo=${val}${n}`));
    }
  };

  // Calidades presentes en la lista (para el desplegable de filtro).
  const calidadesPresentes = Array.from(
    new Set(inscripciones.map(i => (i.calidad ?? 'Participante').trim() || 'Participante')),
  ).sort();

  const filtradas = inscripciones.filter(i => {
    const okEstado = filtroEstado === 'todos' || i.estado_id === filtroEstado;
    const cal = (i.calidad ?? 'Participante').trim() || 'Participante';
    const okCalidad = filtroCalidad === 'todas' || cal === filtroCalidad;
    const q = busqueda.toLowerCase();
    const okBusq = !q || i.participante_nombre.toLowerCase().includes(q) || i.numero_documento.includes(q);
    return okEstado && okCalidad && okBusq;
  });

  const resumen = Object.entries(ESTADOS)
    .map(([id, e]) => ({
      estadoId: Number(id),
      count: inscripciones.filter(i => i.estado_id === Number(id)).length,
      ...e,
    }))
    .filter(r => r.count > 0);

  // Candidatos a aprobación masiva: aún no aprobados (Inscrito=1, En curso=2),
  // dentro de lo filtrado. Pensado para programas por asistencia (sin notas).
  const candidatosAprobar = filtradas.filter(i => i.estado_id === 1 || i.estado_id === 2);

  const handleAprobarTodos = async () => {
    const ids = candidatosAprobar.map(i => i.id);
    if (!ids.length) return;
    const ok = await confirm({
      title: `¿Aprobar ${ids.length} participante${ids.length !== 1 ? 's' : ''}?`,
      message: 'Se marcarán como Aprobados y quedarán listos para emitir su certificado. Úsalo en programas por asistencia (sin notas).',
      confirmText: `Sí, aprobar ${ids.length}`,
    });
    if (!ok) return;
    setAprobandoTodos(true);
    try { await cambiarEstadoMasivo(ids, 3); }
    catch (e: unknown) { alert((e as Error).message); }
    finally { setAprobandoTodos(false); }
  };

  const { page, setPage, totalPages, pageItems, startIndex, endIndex, total } =
    usePagination(filtradas, 10);

  return (
    <div className="space-y-5 page-enter">
      {/* Aviso de error de acción (en vez del alert del navegador) */}
      {accionError && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-[13px]"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span className="flex-1">{accionError}</span>
          <button onClick={() => setAccionError(null)} className="font-bold" style={{ color: '#B91C1C' }}>✕</button>
        </div>
      )}

      {/* Back — vuelve al programa del aula (las aulas viven dentro del programa) */}
      {grupoId && (
        <button
          onClick={() => {
            const g = grupos.find(x => x.id === Number(grupoId));
            navigate(g
              ? certPath(empresa!, `/panel/programas/${g.programa_id}`)
              : certPath(empresa!, '/panel/programas'));
          }}
          className="flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:opacity-70"
          style={{ color: '#9CA3AF' }}
        >
          <ChevronLeft size={14} /> Volver al programa
        </button>
      )}

      {/* Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Selector de grupo */}
        <select
          value={grupoId ?? ''}
          onChange={e => handleGrupoChange(e.target.value)}
          className="vx-input"
          style={{ maxWidth: 240 }}
        >
          <option value="">Todos los grupos</option>
          {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre_grupo}</option>)}
        </select>

        {/* Buscador */}
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="vx-input vx-input-icon"
          />
        </div>

        {/* Filtro estado */}
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value === 'todos' ? 'todos' : +e.target.value)}
          className="vx-input"
          style={{ maxWidth: 180 }}
        >
          <option value="todos">Todos los estados</option>
          {Object.entries(ESTADOS).map(([id, { label }]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>

        {/* Filtro calidad (Participante, Ponente, Organizador…) */}
        <select
          value={filtroCalidad}
          onChange={e => setFiltroCalidad(e.target.value)}
          className="vx-input"
          style={{ maxWidth: 180 }}
        >
          <option value="todas">Todas las calidades</option>
          {calidadesPresentes.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Tabs: Inscripciones / Notas (siempre visibles) */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: '#F0EEE9' }}>
        {([['inscripciones', 'Inscripciones'], ['notas', 'Notas']] as const).map(([key, lbl]) => (
          <button
            key={key}
            onClick={() => setVista(key)}
            className="px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all"
            style={vista === key
              ? { background: '#fff', color: '#0D0E12', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
              : { background: 'transparent', color: '#9CA3AF' }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* ════════ VISTA NOTAS ════════ */}
      {vista === 'notas' && (
        grupoId ? (
          <NotasGrupo empresa={empresa!} grupoId={grupoId} onEstadoCambiado={refetch} />
        ) : (
          <div className="bg-white rounded-2xl py-14 text-center" style={{ border: '1px solid #EEECE6' }}>
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#F3F0FF', color: '#7C3AED' }}>
              <ClipboardList size={22} />
            </div>
            <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>Elige un grupo para registrar notas</p>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>
              Usa el selector <span className="font-semibold">“Todos los grupos”</span> de arriba y elige el grupo que vas a calificar.
            </p>
          </div>
        )
      )}

      {/* ════════ VISTA INSCRIPCIONES ════════ */}
      {vista === 'inscripciones' && (<>

      {/* Pills resumen */}
      {!loading && resumen.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {resumen.map(r => (
            <button
              key={r.estadoId}
              onClick={() => setFiltroEstado(filtroEstado === r.estadoId ? 'todos' : r.estadoId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
              style={{
                background: filtroEstado === r.estadoId ? r.color : r.bg,
                color: filtroEstado === r.estadoId ? '#fff' : r.color,
                border: `1.5px solid ${filtroEstado === r.estadoId ? r.color : r.border}`,
                transform: filtroEstado === r.estadoId ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              <UserCheck size={11} />
              {r.label}
              <span className="font-bold">{r.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Aprobar a todos de golpe — para programas por asistencia (sin notas).
          Se oculta si el programa usa notas (la aprobación va por las notas). */}
      {!loading && tieneUnidades !== true && candidatosAprobar.length > 0 && (
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
        >
          <div className="flex items-start gap-2.5">
            <UserCheck size={16} style={{ color: '#15803D', marginTop: 1, flexShrink: 0 }} />
            <p className="text-[13px]" style={{ color: '#15803D' }}>
              <span className="font-bold">{candidatosAprobar.length}</span> sin aprobar
              {grupoId ? ' en este grupo' : ' (todos los grupos)'}.
              ¿Programa por asistencia? Apruébalos a todos de una vez.
            </p>
          </div>
          <button
            onClick={handleAprobarTodos}
            disabled={aprobandoTodos}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold flex-shrink-0 transition-all"
            style={{ background: '#15803D', color: '#fff', opacity: aprobandoTodos ? 0.6 : 1 }}
          >
            {aprobandoTodos ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
            Aprobar todos ({candidatosAprobar.length})
          </button>
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
      {!loading && filtradas.length === 0 && (
        <div className="bg-white rounded-2xl py-14 text-center" style={{ border: '1px solid #EEECE6' }}>
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#F5F4F0', color: '#B0A898' }}>
            <ClipboardList size={22} />
          </div>
          <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>Sin inscripciones</p>
          <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>
            {busqueda || filtroEstado !== 'todos' ? 'Prueba con otros filtros' : 'Este grupo no tiene inscritos aún'}
          </p>
        </div>
      )}

      {/* Barra de acción en lote (solo ADMINISTRADOR) */}
      {esAdmin && selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl" style={{ background: '#0D0E12', color: '#fff' }}>
          <div className="flex items-center gap-2">
            <button onClick={clearSel} className="p-1 rounded-lg transition-colors hover:bg-white/10" style={{ color: '#9CA3AF' }}><X size={15} /></button>
            <span className="text-[13px] font-semibold">{selected.size} seleccionada{selected.size !== 1 ? 's' : ''}</span>
          </div>
          <button onClick={handleEliminarMasa} disabled={borrando}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-60"
            style={{ background: '#DC2626', color: '#fff' }}>
            {borrando ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Eliminar seleccionadas
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && filtradas.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
          {/* Header */}
          <div className="hidden sm:flex items-center gap-3 px-5 py-3" style={{ background: '#FAFAF8', borderBottom: '1px solid #EEECE6' }}>
            {esAdmin && (
              <input type="checkbox" className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: '#7C3AED' }}
                checked={pageItems.length > 0 && pageItems.every(i => selected.has(i.id))}
                onChange={() => toggleAllPage(pageItems.map(i => i.id))} title="Seleccionar todos (página)" />
            )}
            <p className="flex-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Participante</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Estado / Acciones</p>
          </div>
          {pageItems.map((i, idx) => (
            <InscripcionRow
              key={i.id}
              inscripcion={i}
              onCambiarEstado={handleCambiarEstado}
              onEliminar={handleEliminar}
              isLast={idx === pageItems.length - 1}
              tieneUnidades={tieneUnidades}
              esAdmin={esAdmin}
              selected={selected.has(i.id)}
              onToggleSel={() => toggleOne(i.id)}
            />
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
          itemLabel="inscripciones"
          accentColor="#0EA5E9"
        />
      )}

      </>)}
    </div>
  );
}
