import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Loader2, X, AlertCircle, ChevronRight, Ban, RefreshCw, Trash2 } from '@/components/ui/icon';
import { useProgramas }  from '../../shared/hooks/useProgramas';
import { useCatalogos }  from '../../shared/hooks/useCatalogos';
import { useConfirm }    from '../../shared/hooks/useConfirm';
import { usePagination } from '../../shared/hooks/usePagination';
import Pagination from '../../shared/components/Pagination';
import type { CreateProgramaDto } from '../../shared/types';

const NOMBRE_MAX = 100;
const DESC_MAX   = 300;

/* ── Form ───────────────────────────────────────────────────── */
function ProgramaForm({
  onSubmit, onCancel, loading,
}: {
  onSubmit: (data: CreateProgramaDto) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { empresa } = useParams<{ empresa: string }>();
  const { catalogos } = useCatalogos(empresa!);
  const [form, setForm] = useState<CreateProgramaDto>({
    tipo_programa_id:  0,
    nombre:            '',
    descripcion:       '',
    horas_academicas:  0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div
      className="bg-white rounded-2xl p-5 page-fade"
      style={{ border: '1px solid rgba(15,24,41,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[15px] font-semibold" style={{ color: '#0D0E12' }}>Nuevo programa</p>
          <p className="text-[12px] mt-0.5" style={{ color: '#9CA3AF' }}>Completa los datos del programa</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: '#9CA3AF' }}
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#374151' }}>
              Tipo de programa
            </label>
            <select
              required
              value={form.tipo_programa_id}
              onChange={e => setForm(f => ({ ...f, tipo_programa_id: +e.target.value }))}
              className="vx-input"
            >
              <option value={0} disabled>Seleccionar...</option>
              {catalogos?.tipos_programa.map(tp => (
                <option key={tp.id} value={tp.id}>{tp.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#374151' }}>
              Horas académicas
            </label>
            <input
              type="number"
              min={1}
              required
              value={form.horas_academicas || ''}
              onChange={e => setForm(f => ({ ...f, horas_academicas: +e.target.value }))}
              className="vx-input"
              placeholder="Ej: 40"
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#374151' }}>
            Nombre del programa
            <span className="ml-1.5 normal-case font-normal tracking-normal" style={{ color: '#9CA3AF' }}>
              ({form.nombre.length}/{NOMBRE_MAX})
            </span>
          </label>
          <input
            type="text"
            required
            maxLength={NOMBRE_MAX}
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: Curso de Excel Avanzado"
            className="vx-input"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#374151' }}>
            Descripción
            <span className="ml-1.5 normal-case font-normal tracking-normal" style={{ color: '#9CA3AF' }}>
              opcional · {(form.descripcion ?? '').length}/{DESC_MAX}
            </span>
          </label>
          <textarea
            rows={2}
            maxLength={DESC_MAX}
            value={form.descripcion ?? ''}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            className="vx-input resize-none"
            placeholder="Breve descripción del programa..."
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="vx-btn vx-btn-ghost px-4 py-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="vx-btn vx-btn-primary px-5 py-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Guardar programa
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function AdminProgramas() {
  const { empresa } = useParams<{ empresa: string }>();
  const navigate    = useNavigate();
  const { programas, loading, error, create, setActivo, eliminar } = useProgramas(empresa!, true);
  const confirm = useConfirm();
  const [showForm,   setShowForm]  = useState(false);
  const [saving,     setSaving]    = useState(false);
  const [saveError,  setSaveError] = useState<string | null>(null);

  const toggleActivo = async (p: { id: number; nombre: string; activo: number }) => {
    const desactivar = !!p.activo;
    const ok = await confirm({
      title: desactivar ? 'Desactivar programa' : 'Activar programa',
      message: desactivar
        ? `"${p.nombre}" se desactivará (no se borra). Dejará de aparecer en la inscripción pública. Podrás activarlo cuando quieras.`
        : `"${p.nombre}" volverá a estar activo y disponible.`,
      confirmText: desactivar ? 'Desactivar' : 'Activar',
      variant: desactivar ? 'danger' : undefined,
    });
    if (!ok) return;
    try { await setActivo(p.id, !p.activo); }
    catch (e: unknown) { setSaveError((e as Error).message); }
  };

  const handleEliminar = async (p: { id: number; nombre: string }) => {
    const ok = await confirm({
      title: 'Borrar programa',
      message: `Se BORRARÁ "${p.nombre}" y todo lo suyo (aulas, inscripciones, notas y certificados emitidos; se devuelve el cupo). Esta acción NO se puede deshacer.`,
      confirmText: 'Borrar definitivamente',
      variant: 'danger',
    });
    if (!ok) return;
    try { await eliminar(p.id); }
    catch (e: unknown) { setSaveError((e as Error).message); }
  };

  const { page, setPage, totalPages, pageItems, startIndex, endIndex, total } =
    usePagination(programas, 10);

  const handleCreate = async (data: CreateProgramaDto) => {
    setSaving(true);
    setSaveError(null);
    try {
      await create(data);
      setShowForm(false);
    } catch (e: unknown) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const abrirPrograma = (id: number) =>
    navigate(`/${empresa}/certificados/panel/programas/${id}`);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[13px]" style={{ color: '#9CA3AF' }}>
          {programas.length} programa{programas.length !== 1 ? 's' : ''} registrado{programas.length !== 1 ? 's' : ''}
        </p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="vx-btn vx-btn-primary px-4 py-2"
          >
            <Plus size={15} />
            Nuevo programa
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div>
          {saveError && (
            <div
              className="flex items-center gap-2 text-[13px] px-3.5 py-2.5 rounded-xl mb-3"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
            >
              <AlertCircle size={14} className="flex-shrink-0" />
              {saveError}
            </div>
          )}
          <ProgramaForm
            onSubmit={handleCreate}
            onCancel={() => { setShowForm(false); setSaveError(null); }}
            loading={saving}
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16" style={{ color: '#D1D5DB' }}>
          <Loader2 size={22} className="animate-spin" />
        </div>
      )}

      {/* API error */}
      {error && (
        <div
          className="text-[13px] px-4 py-3 rounded-xl"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && programas.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid rgba(15,24,41,0.07)' }}>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: '#F3F0FF', color: '#7C3AED' }}
          >
            <BookOpen size={22} />
          </div>
          <p className="text-[14px] font-medium" style={{ color: '#374151' }}>Sin programas registrados</p>
          <p className="text-[13px] mt-1 mb-4" style={{ color: '#9CA3AF' }}>Crea el primer programa para empezar</p>
          <button onClick={() => setShowForm(true)} className="vx-btn vx-btn-primary px-5 py-2">
            <Plus size={15} />
            Crear programa
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && programas.length > 0 && (
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(15,24,41,0.07)' }}
        >
          {/* Table header */}
          <div
            className="hidden sm:grid grid-cols-[1fr_140px_80px_70px_auto] px-5 py-3 border-b"
            style={{ background: '#FAFAF8', borderColor: 'rgba(15,24,41,0.07)' }}
          >
            {['Programa', 'Tipo', 'Horas', 'Estado'].map(h => (
              <p key={h} className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
                {h}
              </p>
            ))}
          </div>

          {/* Rows — clic abre el programa (sus aulas + evaluación) */}
          {pageItems.map((p, idx) => (
            <div
              key={p.id}
              className="flex flex-col sm:grid sm:grid-cols-[1fr_140px_80px_70px_auto] items-start sm:items-center px-5 py-4 transition-colors cursor-pointer"
              style={{ borderBottom: idx < pageItems.length - 1 ? '1px solid rgba(15,24,41,0.05)' : undefined }}
              onClick={() => abrirPrograma(p.id)}
              onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F3'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Nombre + descripcion */}
              <div className="min-w-0 mb-2 sm:mb-0 pr-3">
                <p className="text-[13px] font-semibold truncate" style={{ color: '#0D0E12' }}>
                  {p.nombre}
                </p>
                {p.descripcion && (
                  <p className="text-[12px] truncate mt-0.5" style={{ color: '#9CA3AF' }}>
                    {p.descripcion}
                  </p>
                )}
              </div>

              {/* Tipo */}
              <div className="flex sm:block items-center gap-2 sm:gap-0 mb-1 sm:mb-0">
                <span className="sm:hidden text-[11px] font-semibold uppercase tracking-wider mr-1" style={{ color: '#9CA3AF' }}>
                  Tipo:
                </span>
                <p className="text-[13px]" style={{ color: '#4B5563' }}>
                  {p.tipo_programa_nombre}
                </p>
              </div>

              {/* Horas */}
              <div className="flex sm:block items-center gap-2 sm:gap-0 mb-2 sm:mb-0">
                <span className="sm:hidden text-[11px] font-semibold uppercase tracking-wider mr-1" style={{ color: '#9CA3AF' }}>
                  Horas:
                </span>
                <p className="text-[13px] font-medium tabular-nums" style={{ color: '#4B5563' }}>
                  {p.horas_academicas}h
                </p>
              </div>

              {/* Estado badge */}
              <div>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={p.activo
                    ? { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }
                    : { background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }
                  }
                >
                  {p.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Acciones: archivar/reactivar + entrar */}
              <div className="flex items-center gap-2 justify-end mt-2 sm:mt-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => toggleActivo(p)}
                  className="flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg transition-all"
                  style={p.activo
                    ? { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }
                    : { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}
                  title={p.activo ? 'Desactivar programa' : 'Activar programa'}
                >
                  {p.activo ? <Ban size={12} /> : <RefreshCw size={12} />}
                  {p.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleEliminar(p)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                  style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}
                  title="Borrar programa"
                >
                  <Trash2 size={12} />
                </button>
                <ChevronRight size={16} className="hidden sm:block" style={{ color: '#9CA3AF' }} />
              </div>
            </div>
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
          itemLabel="programas"
          accentColor="#7C3AED"
        />
      )}
    </div>
  );
}
