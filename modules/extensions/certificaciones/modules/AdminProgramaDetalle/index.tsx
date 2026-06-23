import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Layers, Loader2, AlertCircle, Users, Calendar, Clock,
  ChevronRight, GraduationCap, ClipboardList, Link2, Ban, RefreshCw, Trash2, FileSpreadsheet,
} from '@/components/ui/icon';
import { useProgramas } from '../../shared/hooks/useProgramas';
import { useGrupos }    from '../../shared/hooks/useGrupos';
import { useConfirm }   from '../../shared/hooks/useConfirm';
import GrupoForm, { DIAS_CORTO } from '../../shared/components/GrupoForm';
import UnidadesEditor from '../../shared/components/UnidadesEditor';
import CopyLinkButton from '../../shared/components/CopyLinkButton';
import ImportarExcelModal from '../../shared/components/ImportarExcelModal';
import type { CreateGrupoDto, Grupo } from '../../shared/types';

/** Base pública de links para compartir (inscripción / validación). */
const publicBase = (empresa: string) => `${window.location.origin}/${empresa}/certificados`;

const fmt = (d: string | Date) => {
  if (!d) return '—';
  const s = typeof d === 'string' ? d.substring(0, 10) : d.toISOString().substring(0, 10);
  return new Date(s + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtHora = (h?: string | null) => (h ? h.slice(0, 5) : '');

/** Texto legible del horario del aula. Ej: "Lun, Mié, Vie · 19:00–22:00" */
function fmtHorario(g: { dias_semana?: string | null; hora_inicio?: string | null; hora_fin?: string | null }): string | null {
  if (!g.dias_semana) return null;
  const dias = g.dias_semana.split(',').map(Number).filter(Boolean).map(n => DIAS_CORTO[n]).join(', ');
  const horas = g.hora_inicio && g.hora_fin ? ` · ${fmtHora(g.hora_inicio)}–${fmtHora(g.hora_fin)}` : '';
  return `${dias}${horas}`;
}

/* ── Fila de aula ───────────────────────────────────────────────── */
function AulaRow({ aula, empresa, onVerInscritos, onImportar, onToggleActivo, onEliminar, isLast }: { aula: Grupo; empresa: string; onVerInscritos: (g: Grupo) => void; onImportar: (g: Grupo) => void; onToggleActivo: (g: Grupo) => void; onEliminar: (g: Grupo) => void; isLast: boolean }) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 transition-colors"
      style={{ borderBottom: isLast ? undefined : '1px solid #F5F4F0' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: aula.activo ? '#DCFCE7' : '#F5F4F0' }}>
          <Layers size={16} style={{ color: aula.activo ? '#15803D' : '#B0A898' }} />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold truncate" style={{ color: '#0D0E12' }}>{aula.nombre_grupo}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px]" style={{ color: '#9CA3AF' }}>{aula.modalidad_nombre}</span>
          </div>
          {fmtHorario(aula) && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px]" style={{ color: '#C9962C' }}>
              <Clock size={11} className="flex-shrink-0" />
              <span className="font-medium">{fmtHorario(aula)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:flex-shrink-0">
        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: '#9CA3AF' }}>
          <Calendar size={12} />
          <span>{fmt(aula.fecha_inicio)} — {fmt(aula.fecha_fin)}</span>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={aula.activo
            ? { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }
            : { background: '#F5F4F0', color: '#9CA3AF', border: '1px solid #EEECE6' }
          }>
          {aula.activo ? 'Activo' : 'Inactivo'}
        </span>
        {/* Link directo de inscripción a ESTA aula (para mandar al alumno) */}
        <CopyLinkButton url={`${publicBase(empresa)}?grupo=${aula.id}`} compact />
        <button
          onClick={() => onVerInscritos(aula)}
          className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
          style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = '#2563EB'; }}
        >
          <Users size={12} /> Inscritos <ChevronRight size={11} />
        </button>
        {/* Importar participantes por Excel (carga masiva) */}
        <button
          onClick={() => onImportar(aula)}
          className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
          style={{ background: '#ECFDF5', color: '#15803D', border: '1px solid #A7F3D0' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#15803D'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#15803D'; }}
          title="Importar participantes desde Excel"
        >
          <FileSpreadsheet size={12} /> Importar
        </button>
        {/* Archivar / reactivar aula (soft-delete) */}
        <button
          onClick={() => onToggleActivo(aula)}
          className="flex items-center justify-center w-8 h-8 rounded-xl transition-all flex-shrink-0"
          style={aula.activo
            ? { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }
            : { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}
          title={aula.activo ? 'Desactivar aula' : 'Activar aula'}
        >
          {aula.activo ? <Ban size={13} /> : <RefreshCw size={13} />}
        </button>
        {/* Borrar aula */}
        <button
          onClick={() => onEliminar(aula)}
          className="flex items-center justify-center w-8 h-8 rounded-xl transition-all flex-shrink-0"
          style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}
          title="Borrar aula"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Página: detalle de programa ───────────────────────────────── */
export default function AdminProgramaDetalle() {
  const { empresa, programaId } = useParams<{ empresa: string; programaId: string }>();
  const navigate = useNavigate();
  const pid = Number(programaId);

  const { programas, loading: progLoading, update, setActivo: setActivoPrograma, eliminar: eliminarPrograma } = useProgramas(empresa!, true);
  const { grupos, loading: gruposLoading, error, create, setActivo: setActivoGrupo, eliminar: eliminarGrupo } = useGrupos(empresa!, true);
  const confirm = useConfirm();

  const [tab,       setTab]       = useState<'aulas' | 'evaluacion'>('aulas');
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importAula, setImportAula] = useState<Grupo | null>(null);   // aula sobre la que se importa por Excel

  const programa = programas.find(p => p.id === pid);
  const aulas    = grupos.filter(g => g.programa_id === pid);

  const volver = () => navigate(`/${empresa}/certificados/panel/programas`);

  const handleToggleAula = async (g: Grupo) => {
    const desactivar = !!g.activo;
    const ok = await confirm({
      title: desactivar ? 'Desactivar aula' : 'Activar aula',
      message: desactivar
        ? `"${g.nombre_grupo}" se desactivará (no se borra) y dejará de aparecer en inscripción. Podrás activarla cuando quieras.`
        : `"${g.nombre_grupo}" volverá a estar activa.`,
      confirmText: desactivar ? 'Desactivar' : 'Activar',
      variant: desactivar ? 'danger' : undefined,
    });
    if (!ok) return;
    try { await setActivoGrupo(g.id, !g.activo); }
    catch (e: unknown) { setSaveError((e as Error).message); }
  };

  const handleEliminarAula = async (g: Grupo) => {
    const ok = await confirm({
      title: 'Borrar aula',
      message: `Se BORRARÁ "${g.nombre_grupo}" y sus inscripciones, notas y certificados emitidos (se devuelve el cupo). No se puede deshacer.`,
      confirmText: 'Borrar definitivamente',
      variant: 'danger',
    });
    if (!ok) return;
    try { await eliminarGrupo(g.id); }
    catch (e: unknown) { setSaveError((e as Error).message); }
  };

  const handleEliminarPrograma = async () => {
    if (!programa) return;
    const ok = await confirm({
      title: 'Borrar programa',
      message: `Se BORRARÁ "${programa.nombre}" y todo lo suyo (aulas, inscripciones, notas y certificados emitidos; se devuelve el cupo). No se puede deshacer.`,
      confirmText: 'Borrar definitivamente',
      variant: 'danger',
    });
    if (!ok) return;
    try { await eliminarPrograma(programa.id); volver(); }
    catch (e: unknown) { setSaveError((e as Error).message); }
  };

  const handleTogglePrograma = async () => {
    if (!programa) return;
    const desactivar = !!programa.activo;
    const ok = await confirm({
      title: desactivar ? 'Desactivar programa' : 'Activar programa',
      message: desactivar
        ? `"${programa.nombre}" se desactivará (no se borra). Dejará de aparecer en la inscripción pública. Podrás activarlo cuando quieras.`
        : `"${programa.nombre}" volverá a estar activo.`,
      confirmText: desactivar ? 'Desactivar' : 'Activar',
      variant: desactivar ? 'danger' : undefined,
    });
    if (!ok) return;
    try { await setActivoPrograma(programa.id, !programa.activo); }
    catch (e: unknown) { setSaveError((e as Error).message); }
  };

  const handleCreate = async (data: CreateGrupoDto) => {
    setSaving(true); setSaveError(null);
    try { await create(data); setShowForm(false); }
    catch (e: unknown) { setSaveError((e as Error).message); }
    finally { setSaving(false); }
  };

  const handleVerInscritos = (g: Grupo) =>
    navigate(`/${empresa}/certificados/panel/inscripciones?grupo=${g.id}&nombre=${encodeURIComponent(g.nombre_grupo)}`);

  /* Cargando el programa */
  if (progLoading && !programa) {
    return <div className="flex justify-center py-20" style={{ color: '#D1D5DB' }}><Loader2 size={22} className="animate-spin" /></div>;
  }

  /* Programa inexistente */
  if (!progLoading && !programa) {
    return (
      <div className="space-y-4 page-enter">
        <button onClick={volver} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: '#64748B' }}>
          <ArrowLeft size={15} /> Programas
        </button>
        <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #EEECE6' }}>
          <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>Programa no encontrado</p>
          <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Puede que haya sido eliminado.</p>
        </div>
      </div>
    );
  }

  const tabBtn = (key: 'aulas' | 'evaluacion', label: string, Icon: typeof Layers) => {
    const active = tab === key;
    return (
      <button
        onClick={() => setTab(key)}
        className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition-all"
        style={{
          color: active ? '#0D0E12' : '#9CA3AF',
          borderBottom: active ? '2px solid #0D0E12' : '2px solid transparent',
        }}
      >
        <Icon size={15} style={{ color: active ? '#D97706' : '#B0A898' }} /> {label}
      </button>
    );
  };

  return (
    <div className="space-y-5 page-enter">
      {/* Volver */}
      <button onClick={volver} className="flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:opacity-70" style={{ color: '#64748B' }}>
        <ArrowLeft size={15} /> Programas
      </button>

      {/* Cabecera del programa */}
      <div className="bg-white rounded-2xl p-5 flex items-center gap-4" style={{ border: '1px solid #EEECE6' }}>
        <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center" style={{ background: '#F3F0FF', color: '#7C3AED' }}>
          <GraduationCap size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] font-bold truncate" style={{ color: '#0D0E12' }}>{programa!.nombre}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[12px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              {programa!.tipo_programa_nombre}
            </span>
            {programa!.horas_academicas > 0 && (
              <span className="text-[12px]" style={{ color: '#9CA3AF' }}>{programa!.horas_academicas}h</span>
            )}
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={programa!.activo
                ? { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }
                : { background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}>
              {programa!.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {programa!.descripcion && (
            <p className="text-[12px] mt-1.5 truncate" style={{ color: '#9CA3AF' }}>{programa!.descripcion}</p>
          )}
        </div>

        {/* Archivar / reactivar el programa (soft-delete) */}
        <button
          onClick={handleTogglePrograma}
          className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl flex-shrink-0 transition-all"
          style={programa!.activo
            ? { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }
            : { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}
          title={programa!.activo ? 'Desactivar programa' : 'Activar programa'}
        >
          {programa!.activo ? <Ban size={13} /> : <RefreshCw size={13} />}
          {programa!.activo ? 'Desactivar' : 'Activar'}
        </button>
        <button
          onClick={handleEliminarPrograma}
          className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl flex-shrink-0 transition-all"
          style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}
          title="Borrar programa"
        >
          <Trash2 size={13} /> Borrar
        </button>
      </div>

      {/* Compartir: links listos para mandar al cliente/alumno */}
      <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1px solid #EEECE6' }}>
        <div className="flex items-center gap-2">
          <Link2 size={15} style={{ color: '#C9962C' }} />
          <h3 className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>Links para compartir</h3>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9CA3AF' }}>
            Inscripción a este programa
          </p>
          <CopyLinkButton
            url={`${publicBase(empresa!)}?programa=${programa!.id}`}
            label="Copiar link de inscripción"
          />
          <p className="text-[11px] mt-1.5" style={{ color: '#B0A898' }}>
            Mándaselo al alumno: abre la inscripción con este programa ya elegido.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#9CA3AF' }}>
            Validar un certificado
          </p>
          <CopyLinkButton
            url={`${publicBase(empresa!)}/validar`}
            label="Copiar link de validación"
          />
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex items-center gap-1" style={{ borderBottom: '1px solid #EEECE6' }}>
        {tabBtn('aulas', `Aulas${aulas.length ? ` (${aulas.length})` : ''}`, Layers)}
        {tabBtn('evaluacion', 'Evaluación', ClipboardList)}
      </div>

      {/* ── Pestaña: Aulas ── */}
      {tab === 'aulas' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-[13px]" style={{ color: '#9CA3AF' }}>
              Aulas donde se inscriben los estudiantes de este programa.
            </p>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="vx-btn vx-btn-primary px-4 py-2">
                <Plus size={15} /> Nueva aula
              </button>
            )}
          </div>

          {showForm && (
            <div>
              {saveError && (
                <div className="flex items-center gap-2 text-[13px] px-3.5 py-2.5 rounded-xl mb-3"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
                  <AlertCircle size={14} className="flex-shrink-0" /> {saveError}
                </div>
              )}
              <GrupoForm
                lockedPrograma={{ id: programa!.id, nombre: programa!.nombre }}
                onSubmit={handleCreate}
                onCancel={() => { setShowForm(false); setSaveError(null); }}
                loading={saving}
              />
            </div>
          )}

          {gruposLoading && <div className="flex justify-center py-12" style={{ color: '#D1D5DB' }}><Loader2 size={20} className="animate-spin" /></div>}
          {error && (
            <div className="flex items-center gap-2 text-[13px] px-4 py-3 rounded-xl"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {!gruposLoading && aulas.length === 0 && !showForm && (
            <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #EEECE6' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <Layers size={22} />
              </div>
              <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>Este programa aún no tiene aulas</p>
              <p className="text-[13px] mt-1 mb-4" style={{ color: '#9CA3AF' }}>Crea la primera aula para que los estudiantes se inscriban</p>
              <button onClick={() => setShowForm(true)} className="vx-btn vx-btn-primary px-5 py-2">
                <Plus size={15} /> Crear aula
              </button>
            </div>
          )}

          {!gruposLoading && aulas.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
              {aulas.map((a, i) => (
                <AulaRow key={a.id} aula={a} empresa={empresa!} onVerInscritos={handleVerInscritos} onImportar={setImportAula} onToggleActivo={handleToggleAula} onEliminar={handleEliminarAula} isLast={i === aulas.length - 1} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Pestaña: Evaluación ── */}
      {tab === 'evaluacion' && (
        <UnidadesEditor empresa={empresa!} programa={programa!} onSaveProg={update} />
      )}

      {/* Modal de carga masiva por Excel */}
      {importAula && (
        <ImportarExcelModal
          empresa={empresa!}
          aula={importAula}
          programaNombre={programa!.nombre}
          onClose={() => setImportAula(null)}
        />
      )}
    </div>
  );
}
