import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileBadge, Loader2, AlertCircle, Ban, Download, Sparkles, CheckCircle,
  Search, Check, X, ChevronDown, Layers, Eye, Trash2,
} from '@/components/ui/icon';
import { useCertificados }  from '../../shared/hooks/useCertificados';
import { useInscripciones } from '../../shared/hooks/useInscripciones';
import { useGrupos }        from '../../shared/hooks/useGrupos';
import { usePagination }    from '../../shared/hooks/usePagination';
import { useConfirm }        from '../../shared/hooks/useConfirm';
import { useCreditos }       from '../../shared/hooks/useCreditos';
import Pagination from '../../shared/components/Pagination';
import { configApi } from '../../shared/api/config.api';
import { certificadosApi } from '../../shared/api/certificados.api';
import type { Certificado, ConfigCertificado } from '../../shared/types';
import { CertificadoPDF } from '../../shared/components/CertificadoPDF';

const ESTADO_APROBADO = 3;

type Tab = 'pendientes' | 'emitidos' | 'anulados';

/* ── Checkbox ───────────────────────────────────────────────── */
function Checkbox({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className="w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0"
      style={{
        background: checked ? '#0D0E12' : '#fff',
        border: `1.5px solid ${checked ? '#0D0E12' : '#D1D5DB'}`,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {checked && <Check size={13} style={{ color: '#fff', strokeWidth: 3 }} />}
    </button>
  );
}

/* ── Tab button ─────────────────────────────────────────────── */
function TabBtn({
  active, label, count, accent, onClick,
}: { active: boolean; label: string; count: number; accent: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
      style={{
        background: active ? '#0D0E12' : '#fff',
        color: active ? '#fff' : '#374151',
        border: `1.5px solid ${active ? '#0D0E12' : '#EEECE6'}`,
      }}
    >
      {label}
      <span
        className="px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums"
        style={{
          background: active ? 'rgba(255,255,255,0.15)' : `${accent}18`,
          color: active ? '#fff' : accent,
        }}
      >
        {count}
      </span>
    </button>
  );
}

/* ── Pagina ─────────────────────────────────────────────────── */
export default function AdminCertificados() {
  const { empresa } = useParams<{ empresa: string }>();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { certificados, loading, error, generar, anular, eliminar } = useCertificados(empresa!);
  const { refetch: refrescarCreditos } = useCreditos();

  const SIN_CREDITOS_MSG = 'Te quedaste sin créditos. Contacta a Vaxa para renovar tu plan y seguir emitiendo certificados.';

  /** Si falta el diseño del programa, muestra un modal de advertencia con acceso a Configuración. */
  const avisarFaltaConfig = async (msg: string) => {
    const ir = await confirm({
      title: '⚠ No se puede emitir',
      message: msg,
      confirmText: 'Ir a Configuración',
      cancelText: 'Cerrar',
      variant: 'danger',
    });
    if (ir) navigate(`/${empresa}/certificados/panel/config`);
  };
  const { inscripciones } = useInscripciones(empresa!);
  const { grupos } = useGrupos(empresa!);

  const [tab,       setTab]       = useState<Tab>('pendientes');
  const [busqueda,  setBusqueda]  = useState('');
  const [grupoFilter, setGrupoFilter] = useState<number | 'todos'>('todos');

  const [selected,  setSelected]  = useState<Set<number>>(new Set());
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0, errors: 0 });

  const [generando, setGenerando] = useState<number | null>(null);
  const [anulando,  setAnulando]  = useState<number | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);

  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);
  const [okMsg,     setOkMsg]     = useState<string | null>(null);
  const [sinCreditosModal, setSinCreditosModal] = useState(false);

  const [preview,   setPreview]   = useState<{
    cert: Certificado & { empresa_nombre: string };
    config: ConfigCertificado;
  } | null>(null);

  /* ── Derivados ─────────────────────────────────────────── */
  const aprobadosSinCert = useMemo(() => inscripciones.filter(i =>
    i.estado_id === ESTADO_APROBADO &&
    !certificados.some(c => c.inscripcion_id === i.id && c.estado_id === 1)
  ), [inscripciones, certificados]);

  const certActivos  = useMemo(() => certificados.filter(c => c.estado_id === 1), [certificados]);
  const certAnulados = useMemo(() => certificados.filter(c => c.estado_id !== 1), [certificados]);

  const filtrar = <T extends { participante_nombre?: string; numero_documento?: string; nombre_grupo?: string; grupo_id?: number }>(arr: T[]) => {
    const q = busqueda.toLowerCase().trim();
    return arr.filter(item => {
      const okBusq = !q ||
        item.participante_nombre?.toLowerCase().includes(q) ||
        item.numero_documento?.includes(q);
      const okGrupo = grupoFilter === 'todos' || item.grupo_id === grupoFilter;
      return okBusq && okGrupo;
    });
  };

  const pendientesFiltradas = filtrar(aprobadosSinCert);
  const emitidosFiltrados   = filtrar(certActivos);
  const anuladosFiltrados   = filtrar(certAnulados);

  /* ── Selección ─────────────────────────────────────────── */
  const toggleAll = (ids: number[]) => {
    const allSelected = ids.every(id => selected.has(id));
    const next = new Set(selected);
    if (allSelected) ids.forEach(id => next.delete(id));
    else ids.forEach(id => next.add(id));
    setSelected(next);
  };

  const toggleOne = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const clearSelection = () => setSelected(new Set());

  /* ── Acciones ──────────────────────────────────────────── */
  const handleGenerarUno = async (inscripcionId: number) => {
    setGenerando(inscripcionId);
    setErrorMsg(null); setOkMsg(null);
    try {
      await generar(inscripcionId);
      refrescarCreditos();
      setOkMsg('Certificado emitido correctamente');
      setTimeout(() => setOkMsg(null), 2500);
    } catch (e: unknown) {
      const raw = (e as Error).message;
      if (raw.startsWith('FALTA_CONFIG:')) await avisarFaltaConfig(raw.replace('FALTA_CONFIG:', '').trim());
      else if (raw.startsWith('SIN_CREDITOS')) setSinCreditosModal(true);
      else setErrorMsg(raw);
    }
    finally { setGenerando(null); }
  };

  const handleEliminar = async (id: number) => {
    if (!(await confirm({
      title: 'Eliminar certificado',
      message: 'Se eliminará el certificado por completo y se DEVOLVERÁ 1 crédito a tu saldo. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar y devolver crédito',
      variant: 'danger',
    }))) return;
    setEliminando(id);
    setErrorMsg(null); setOkMsg(null);
    try {
      await eliminar(id);
      refrescarCreditos();
      setOkMsg('Certificado eliminado · 1 crédito devuelto');
      setTimeout(() => setOkMsg(null), 2500);
    } catch (e: unknown) { setErrorMsg((e as Error).message); }
    finally { setEliminando(null); }
  };

  const handleAnular = async (id: number) => {
    if (!(await confirm({
      title: 'Anular certificado',
      message: 'Esta acción no se puede deshacer. El certificado quedará anulado.',
      confirmText: 'Anular',
      variant: 'danger',
    }))) return;
    setAnulando(id);
    setErrorMsg(null); setOkMsg(null);
    try {
      await anular(id);
      setOkMsg('Certificado anulado');
      setTimeout(() => setOkMsg(null), 2500);
    } catch (e: unknown) { setErrorMsg((e as Error).message); }
    finally { setAnulando(null); }
  };

  const handleEmitirMasa = async (ids: number[]) => {
    if (ids.length === 0) return;
    if (!(await confirm({
      title: 'Emitir certificados',
      message: `Se emitirán ${ids.length} certificado${ids.length !== 1 ? 's' : ''} ahora.`,
      confirmText: 'Emitir',
    }))) return;

    setBatchRunning(true);
    setBatchProgress({ done: 0, total: ids.length, errors: 0 });
    setErrorMsg(null); setOkMsg(null);

    let done = 0;
    let errors = 0;
    let configMsg: string | null = null;
    let sinCreditos = false;
    for (const id of ids) {
      try {
        await generar(id);
      } catch (e: unknown) {
        errors += 1;
        const raw = (e as Error).message;
        if (raw.startsWith('FALTA_CONFIG:') && !configMsg) configMsg = raw.replace('FALTA_CONFIG:', '').trim();
        else if (raw.startsWith('SIN_CREDITOS')) { sinCreditos = true; break; }  // sin saldo: no tiene sentido seguir
      }
      done += 1;
      setBatchProgress({ done, total: ids.length, errors });
    }

    setBatchRunning(false);
    clearSelection();
    refrescarCreditos();

    // Si el programa no tiene diseño, el motivo principal es ése → modal de advertencia.
    if (configMsg) { await avisarFaltaConfig(configMsg); return; }
    if (sinCreditos) { setSinCreditosModal(true); return; }

    if (errors === 0) {
      setOkMsg(`${done} certificados emitidos correctamente`);
    } else {
      setErrorMsg(`${done - errors} emitidos · ${errors} con error`);
    }
    setTimeout(() => { setOkMsg(null); setErrorMsg(null); }, 4000);
  };

  const [generandoPdf, setGenerandoPdf] = useState<number | null>(null);

  const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

  const handleVerPDF = async (cert: Certificado) => {
    // Si ya tiene URL, abrir directo
    if (cert.url) {
      window.open(`${apiBase}${cert.url}`, '_blank');
      return;
    }
    // Si no tiene URL → pedirle al backend que lo regenere/genere
    setGenerandoPdf(cert.id);
    setErrorMsg(null);
    try {
      const { url } = await certificadosApi.regenerarPDF(empresa!, cert.id);
      window.open(`${apiBase}${url}`, '_blank');
    } catch (e: unknown) {
      setErrorMsg('No se pudo generar el PDF: ' + (e as Error).message);
    } finally {
      setGenerandoPdf(null);
    }
  };

  // Solo se usa como fallback manual si quieres preview con html2canvas
  const handlePreviewLocal = async (cert: Certificado) => {
    if (!cert.programa_id) { setErrorMsg('Falta programa_id en el certificado.'); return; }
    try {
      const config = await configApi.get(empresa!, cert.programa_id);
      setPreview({ cert: { ...cert, empresa_nombre: empresa! }, config });
    } catch (e: unknown) {
      setErrorMsg('No se pudo cargar la configuración: ' + (e as Error).message);
    }
  };

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="space-y-5 page-enter">

      {/* ── Mini stat cards ──────────────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 stagger-1 page-enter">
          <button
            onClick={() => { setTab('pendientes'); clearSelection(); }}
            className="rounded-2xl p-4 text-center transition-all hover:-translate-y-0.5"
            style={{
              background: '#FFFBEB', border: '1px solid #FDE68A',
              boxShadow: tab === 'pendientes' ? '0 4px 16px rgba(217,119,6,0.18)' : '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <p className="text-[28px] font-bold leading-none" style={{ color: '#D97706' }}>{aprobadosSinCert.length}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider mt-1.5" style={{ color: '#B45309' }}>Por emitir</p>
          </button>
          <button
            onClick={() => { setTab('emitidos'); clearSelection(); }}
            className="rounded-2xl p-4 text-center transition-all hover:-translate-y-0.5"
            style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              boxShadow: tab === 'emitidos' ? '0 4px 16px rgba(21,128,61,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <p className="text-[28px] font-bold leading-none" style={{ color: '#15803D' }}>{certActivos.length}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider mt-1.5" style={{ color: '#15803D' }}>Emitidos</p>
          </button>
          <button
            onClick={() => { setTab('anulados'); clearSelection(); }}
            className="rounded-2xl p-4 text-center transition-all hover:-translate-y-0.5"
            style={{
              background: '#F5F4F0', border: '1px solid #EEECE6',
              boxShadow: tab === 'anulados' ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <p className="text-[28px] font-bold leading-none" style={{ color: '#9CA3AF' }}>{certAnulados.length}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider mt-1.5" style={{ color: '#B0A898' }}>Anulados</p>
          </button>
        </div>
      )}

      {/* ── Mensajes ─────────────────────────────────────────── */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px]"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={14} className="flex-shrink-0" /> {errorMsg}
        </div>
      )}
      {okMsg && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px]"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
          <CheckCircle size={14} className="flex-shrink-0" /> {okMsg}
        </div>
      )}

      {/* ── Progress emisión masiva ──────────────────────────── */}
      {batchRunning && (
        <div className="rounded-2xl p-4" style={{ background: '#0D0E12' }}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[13px] font-bold" style={{ color: '#F1F5F9' }}>
              Emitiendo certificados...
            </p>
            <p className="text-[13px] font-bold tabular-nums" style={{ color: '#D97706' }}>
              {batchProgress.done} / {batchProgress.total}
            </p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${(batchProgress.done / batchProgress.total) * 100}%`,
                background: '#D97706',
              }}
            />
          </div>
          {batchProgress.errors > 0 && (
            <p className="text-[11px] mt-2" style={{ color: '#FCA5A5' }}>
              {batchProgress.errors} con error
            </p>
          )}
        </div>
      )}

      {/* ── Toolbar: tabs + search ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          <TabBtn active={tab === 'pendientes'} label="Pendientes" count={aprobadosSinCert.length} accent="#D97706"
            onClick={() => { setTab('pendientes'); clearSelection(); }} />
          <TabBtn active={tab === 'emitidos'}   label="Emitidos"   count={certActivos.length}     accent="#15803D"
            onClick={() => { setTab('emitidos'); clearSelection(); }} />
          <TabBtn active={tab === 'anulados'}   label="Anulados"   count={certAnulados.length}    accent="#9CA3AF"
            onClick={() => { setTab('anulados'); clearSelection(); }} />
        </div>

        <div className="flex-1 flex gap-2">
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
          <select
            value={grupoFilter}
            onChange={e => setGrupoFilter(e.target.value === 'todos' ? 'todos' : +e.target.value)}
            className="vx-input"
            style={{ maxWidth: 220 }}
          >
            <option value="todos">Todos los grupos</option>
            {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre_grupo}</option>)}
          </select>
        </div>
      </div>

      {/* ── Loading ──────────────────────────────────────────── */}
      {loading && <div className="flex justify-center py-16" style={{ color: '#D1D5DB' }}><Loader2 size={22} className="animate-spin" /></div>}
      {error && (
        <div className="flex items-center gap-2 text-[13px] px-4 py-3 rounded-xl"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* ═══════════ TAB: PENDIENTES ═══════════ */}
      {!loading && tab === 'pendientes' && (
        <TablaPendientes
          items={pendientesFiltradas}
          selected={selected}
          generando={generando}
          batchRunning={batchRunning}
          onToggleAll={() => toggleAll(pendientesFiltradas.map(i => i.id))}
          onToggleOne={toggleOne}
          onClearSelection={clearSelection}
          onGenerarUno={handleGenerarUno}
          onEmitirSeleccion={() => handleEmitirMasa(Array.from(selected))}
          onEmitirTodos={() => handleEmitirMasa(pendientesFiltradas.map(i => i.id))}
          onEmitirIds={handleEmitirMasa}
        />
      )}

      {/* ═══════════ TAB: EMITIDOS ═══════════ */}
      {!loading && tab === 'emitidos' && (
        <TablaEmitidos
          items={emitidosFiltrados}
          anulando={anulando}
          generandoPdf={generandoPdf}
          apiBase={apiBase}
          onVerPDF={handleVerPDF}
          onAnular={handleAnular}
        />
      )}

      {/* ═══════════ TAB: ANULADOS ═══════════ */}
      {!loading && tab === 'anulados' && (
        <TablaAnulados items={anuladosFiltrados} eliminando={eliminando} onEliminar={handleEliminar} />
      )}

      {/* ── Preview PDF ──────────────────────────────────────── */}
      {preview && (
        <CertificadoPDF
          certificado={preview.cert}
          config={preview.config}
          onClose={() => setPreview(null)}
        />
      )}

      {/* ── Modal: sin créditos ──────────────────────────────── */}
      {sinCreditosModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13,14,18,0.5)', backdropFilter: 'blur(4px)' }}
          onMouseDown={() => setSinCreditosModal(false)}
        >
          <div
            className="w-full max-w-[420px] bg-white rounded-2xl p-7 text-center"
            style={{ boxShadow: '0 20px 60px -12px rgba(13,14,18,0.4)' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
              <AlertCircle size={30} style={{ color: '#DC2626' }} />
            </div>
            <h3 className="text-[20px] font-bold" style={{ color: '#0D0E12' }}>
              Te quedaste sin créditos
            </h3>
            <p className="text-[14px] mt-2 leading-relaxed" style={{ color: '#6B7280' }}>
              {SIN_CREDITOS_MSG}
            </p>
            <button
              onClick={() => setSinCreditosModal(false)}
              className="w-full mt-6 py-3 rounded-xl text-[14px] font-semibold text-white"
              style={{ background: '#DC2626' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTES DE TABLAS
   ═══════════════════════════════════════════════════════════ */

/* ── Pendientes ────────────────────────────────────────────── */
interface PendientesProps {
  items: any[];
  selected: Set<number>;
  generando: number | null;
  batchRunning: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: number) => void;
  onClearSelection: () => void;
  onGenerarUno: (id: number) => void;
  onEmitirSeleccion: () => void;
  onEmitirTodos: () => void;
  onEmitirIds: (ids: number[]) => void;
}

function TablaPendientes({
  items, selected, generando, batchRunning,
  onToggleOne, onClearSelection,
  onGenerarUno, onEmitirSeleccion, onEmitirIds,
}: PendientesProps) {
  // Agrupar items por grupo
  const grupos = useMemo(() => {
    const map = new Map<number, { nombre: string; programa: string; items: any[] }>();
    items.forEach(it => {
      const key = it.grupo_id;
      if (!map.has(key)) {
        map.set(key, {
          nombre:   it.nombre_grupo ?? `Grupo #${key}`,
          programa: it.programa_nombre ?? '',
          items:    [],
        });
      }
      map.get(key)!.items.push(it);
    });
    return Array.from(map.entries()).map(([id, g]) => ({ id, ...g }));
  }, [items]);

  const [expanded, setExpanded] = useState<Set<number>>(() => new Set(grupos.map(g => g.id)));

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl py-14 text-center" style={{ border: '1px solid #EEECE6' }}>
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#F0FDF4', color: '#15803D' }}>
          <CheckCircle size={22} />
        </div>
        <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>Todo al día</p>
        <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>No hay aprobados pendientes de certificar</p>
      </div>
    );
  }

  const selCount = items.filter(i => selected.has(i.id)).length;

  const toggleGrupo = (grupoId: number) => {
    const next = new Set(expanded);
    if (next.has(grupoId)) next.delete(grupoId);
    else next.add(grupoId);
    setExpanded(next);
  };

  /* Selecciona todos los items de un grupo si no están todos seleccionados,
     o los desmarca si todos ya estaban seleccionados.
     Lo simulamos haciendo toggle de cada item individualmente.        */
  const handleToggleGrupo = (grupo: { items: any[] }) => {
    const ids = grupo.items.map(i => i.id);
    const allSelected = ids.every(id => selected.has(id));
    if (allSelected) ids.forEach(id => { if (selected.has(id)) onToggleOne(id); });
    else ids.forEach(id => { if (!selected.has(id)) onToggleOne(id); });
  };

  const handleEmitirGrupo = (grupo: { items: any[] }) => {
    onEmitirIds(grupo.items.map(i => i.id));
  };

  return (
    <>
      {/* ── Barra superior cuando hay selección ──────────── */}
      {selCount > 0 && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-2xl page-fade"
          style={{ background: '#0D0E12' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClearSelection}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: '#9CA3AF' }}
            >
              <X size={14} />
            </button>
            <p className="text-[13px] font-semibold" style={{ color: '#F1F5F9' }}>
              {selCount} seleccionado{selCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onEmitirSeleccion}
            disabled={batchRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
            style={{ background: '#D97706', color: '#fff', opacity: batchRunning ? 0.5 : 1 }}
          >
            <Sparkles size={13} />
            Emitir seleccionados
          </button>
        </div>
      )}

      {/* ── Grupos colapsables ───────────────────────────── */}
      <div className="space-y-3">
        {grupos.map(grupo => {
          const isOpen   = expanded.has(grupo.id);
          const ids      = grupo.items.map(i => i.id);
          const selGrupo = ids.filter(id => selected.has(id)).length;
          const allSel   = selGrupo === ids.length && ids.length > 0;
          const someSel  = selGrupo > 0 && !allSel;

          return (
            <div key={grupo.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EEECE6' }}>

              {/* ── Header del grupo ───────────────────── */}
              <div
                className="flex items-center px-5 py-3.5 gap-3"
                style={{
                  background: allSel ? '#FFFBEB' : '#FAFAF8',
                  borderBottom: isOpen ? '1px solid #EEECE6' : undefined,
                }}
              >
                <Checkbox
                  checked={allSel || someSel}
                  onChange={() => handleToggleGrupo(grupo)}
                  disabled={batchRunning}
                />

                <button
                  onClick={() => toggleGrupo(grupo.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    <Layers size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold truncate" style={{ color: '#0D0E12' }}>
                      {grupo.nombre}
                    </p>
                    {grupo.programa && (
                      <p className="text-[11.5px] truncate mt-0.5" style={{ color: '#9CA3AF' }}>
                        {grupo.programa}
                      </p>
                    )}
                  </div>
                </button>

                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full tabular-nums"
                  style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}
                >
                  {selGrupo > 0 ? `${selGrupo} / ${grupo.items.length}` : `${grupo.items.length} pendientes`}
                </span>

                <button
                  onClick={() => handleEmitirGrupo(grupo)}
                  disabled={batchRunning}
                  className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                  style={{
                    background: '#0D0E12', color: '#fff',
                    opacity: batchRunning ? 0.5 : 1,
                  }}
                >
                  <Sparkles size={11} style={{ color: '#D97706' }} />
                  Emitir todo el grupo
                </button>

                <button
                  onClick={() => toggleGrupo(grupo.id)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-white"
                  style={{ color: '#9CA3AF' }}
                >
                  <ChevronDown
                    size={16}
                    style={{
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 200ms ease',
                    }}
                  />
                </button>
              </div>

              {/* ── Filas del grupo ────────────────────── */}
              {isOpen && (
                <div>
                  {grupo.items.map((i, idx) => {
                    const isSelected = selected.has(i.id);
                    return (
                      <div
                        key={i.id}
                        className="flex items-center px-5 py-3 gap-3 transition-colors"
                        style={{
                          background: isSelected ? '#FFFBEB' : 'transparent',
                          borderBottom: idx < grupo.items.length - 1 ? '1px solid #F5F4F0' : undefined,
                          paddingLeft: 32,
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#FAFAF8'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <Checkbox checked={isSelected} onChange={() => onToggleOne(i.id)} disabled={generando === i.id} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-semibold truncate" style={{ color: '#0D0E12' }}>
                            {i.participante_nombre}
                          </p>
                          <p className="text-[11.5px] mt-0.5 truncate" style={{ color: '#9CA3AF' }}>
                            DNI {i.numero_documento}
                          </p>
                        </div>
                        <button
                          onClick={() => onGenerarUno(i.id)}
                          disabled={generando === i.id || batchRunning}
                          className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                          style={{
                            background: '#0D0E12', color: '#fff',
                            opacity: (generando === i.id || batchRunning) ? 0.5 : 1,
                          }}
                        >
                          {generando === i.id ? <Loader2 size={12} className="animate-spin" /> : <FileBadge size={12} />}
                          Emitir
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── Emitidos ──────────────────────────────────────────────── */
function TablaEmitidos({
  items, anulando, generandoPdf, apiBase, onVerPDF, onAnular,
}: {
  items: Certificado[];
  anulando: number | null;
  generandoPdf: number | null;
  apiBase: string;
  onVerPDF: (c: Certificado) => void;
  onAnular: (id: number) => void;
}) {
  const { page, setPage, totalPages, pageItems, startIndex, endIndex, total } =
    usePagination(items, 15);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl py-14 text-center" style={{ border: '1px solid #EEECE6' }}>
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
          <FileBadge size={22} />
        </div>
        <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>Sin certificados emitidos</p>
        <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Emite el primer certificado desde "Pendientes"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
      <div className="hidden sm:grid px-5 py-3 gap-3" style={{
        gridTemplateColumns: '1fr 200px 100px auto',
        background: '#FAFAF8', borderBottom: '1px solid #EEECE6',
      }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Participante</p>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Programa</p>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Fecha</p>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: '#9CA3AF' }}>Acciones</p>
      </div>

      <div>
        {pageItems.map((c, idx) => (
          <div
            key={c.id}
            className="flex flex-col sm:grid sm:items-center px-5 py-3 gap-3 transition-colors"
            style={{
              gridTemplateColumns: '1fr 200px 100px auto',
              borderBottom: idx < pageItems.length - 1 ? '1px solid #F5F4F0' : undefined,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* Participante */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#F0FDF4' }}>
                <CheckCircle size={13} style={{ color: '#15803D' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: '#0D0E12' }}>{c.participante_nombre}</p>
                <p className="text-[10.5px] font-mono tracking-wider truncate" style={{ color: '#D1D5DB' }}>{c.codigo_unico}</p>
              </div>
            </div>

            {/* Programa */}
            <p className="text-[12px] truncate hidden sm:block" style={{ color: '#6B7280' }}>
              {c.programa_nombre}
            </p>

            {/* Fecha */}
            <p className="text-[11.5px] hidden sm:block tabular-nums" style={{ color: '#9CA3AF' }}>
              {new Date(c.fecha_emision).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' })}
            </p>

            {/* Acciones */}
            <div className="flex items-center gap-1.5 flex-shrink-0 justify-end">
              {/* Ver — abre el PDF en pestaña nueva */}
              <button
                onClick={() => onVerPDF(c)}
                disabled={generandoPdf === c.id}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                style={{
                  background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE',
                  opacity: generandoPdf === c.id ? 0.6 : 1,
                }}
                title="Abrir PDF en nueva pestaña"
              >
                {generandoPdf === c.id
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Eye size={12} />}
                Ver
              </button>

              {/* Descargar — link directo si ya hay URL */}
              {c.url && (
                <a
                  href={`${apiBase}${c.url}`}
                  download={`certificado-${c.codigo_unico}.pdf`}
                  className="flex items-center justify-center w-8 h-8 rounded-xl transition-all"
                  style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}
                  title="Descargar PDF"
                >
                  <Download size={12} />
                </a>
              )}

              {/* Anular */}
              <button
                onClick={() => onAnular(c.id)}
                disabled={anulando === c.id}
                className="flex items-center justify-center w-8 h-8 rounded-xl transition-all"
                style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}
                title="Anular certificado"
              >
                {anulando === c.id ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    <Pagination
      page={page}
      totalPages={totalPages}
      onChange={setPage}
      startIndex={startIndex}
      endIndex={endIndex}
      total={total}
      itemLabel="certificados"
      accentColor="#C9962C"
    />
    </div>
  );
}

/* ── Anulados ──────────────────────────────────────────────── */
function TablaAnulados({
  items, eliminando, onEliminar,
}: {
  items: Certificado[];
  eliminando: number | null;
  onEliminar: (id: number) => void;
}) {
  const { page, setPage, totalPages, pageItems, startIndex, endIndex, total } =
    usePagination(items, 15);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl py-14 text-center" style={{ border: '1px solid #EEECE6' }}>
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#F5F4F0', color: '#B0A898' }}>
          <Ban size={22} />
        </div>
        <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>Sin certificados anulados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
      <div>
        {pageItems.map((c, idx) => (
          <div
            key={c.id}
            className="flex items-center justify-between px-5 py-3.5 gap-3"
            style={{ borderBottom: idx < pageItems.length - 1 ? '1px solid #F5F4F0' : undefined }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium line-through truncate" style={{ color: '#6B7280' }}>
                {c.participante_nombre}
              </p>
              <p className="text-[10.5px] font-mono mt-0.5 truncate" style={{ color: '#D1D5DB' }}>{c.codigo_unico}</p>
            </div>
            <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
              {c.estado_nombre}
            </span>
            <button
              onClick={() => onEliminar(c.id)}
              disabled={eliminando === c.id}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all flex-shrink-0"
              style={{ background: '#0D0E12', color: '#fff', opacity: eliminando === c.id ? 0.5 : 1 }}
              title="Eliminar definitivamente y devolver el crédito"
            >
              {eliminando === c.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
    <Pagination
      page={page}
      totalPages={totalPages}
      onChange={setPage}
      startIndex={startIndex}
      endIndex={endIndex}
      total={total}
      itemLabel="certificados anulados"
      accentColor="#C9962C"
    />
    </div>
  );
}
