import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, X, Loader2, UserPlus, CheckCircle, AlertCircle, Users } from '@/components/ui/icon';
import { participantesApi } from '../../shared/api/participantes.api';
import { inscripcionesApi } from '../../shared/api/inscripciones.api';
import { useCatalogos } from '../../shared/hooks/useCatalogos';
import { useProgramas } from '../../shared/hooks/useProgramas';
import { useGrupos } from '../../shared/hooks/useGrupos';
import { usePagination } from '../../shared/hooks/usePagination';
import Pagination from '../../shared/components/Pagination';
import type { Participante } from '../../shared/types';

/* ── Modal: Inscribir alumno ─────────────────────────────────── */
function InscribirModal({ empresa, onClose, onDone }: {
  empresa: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { catalogos } = useCatalogos(empresa);
  const { programas }  = useProgramas(empresa);
  const { grupos }     = useGrupos(empresa);

  const tiposDoc = catalogos?.tipos_documento ?? [];
  const dniId = tiposDoc.find(t => t.codigo === 'DNI')?.id ?? tiposDoc[0]?.id ?? 1;

  const [tipoDoc,   setTipoDoc]   = useState<number>(0);
  const [doc,       setDoc]       = useState('');
  const [nombres,   setNombres]   = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email,     setEmail]     = useState('');
  const [telefono,  setTelefono]  = useState('');
  const [programaId, setProgramaId] = useState<number>(0);
  const [grupoId,    setGrupoId]    = useState<number>(0);

  const [yaRegistrado, setYaRegistrado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [okMsg,    setOkMsg]    = useState<string | null>(null);

  useEffect(() => { if (tipoDoc === 0 && dniId) setTipoDoc(dniId); }, [dniId, tipoDoc]);

  const gruposDelPrograma = grupos.filter(g => g.programa_id === programaId);

  // Busca por número de documento (sin filtrar por tipo, así lo encuentra siempre) y autocompleta.
  const doLookup = useCallback(async (documento: string) => {
    const d = documento.trim();
    if (!d) return;
    setBuscando(true);
    try {
      const p = await participantesApi.buscar(empresa, d);
      setNombres(p.nombres); setApellidos(p.apellidos);
      setEmail(p.email ?? ''); setTelefono(p.telefono ?? '');
      if (p.tipo_documento_id) setTipoDoc(p.tipo_documento_id);
      setYaRegistrado(true);
    } catch {
      setYaRegistrado(false);   // no registrado → alta nueva, campos editables
    } finally { setBuscando(false); }
  }, [empresa]);

  // Autobúsqueda en cuanto el usuario termina de escribir el documento (debounce).
  useEffect(() => {
    const d = doc.trim();
    if (d.length < 6) return;
    const t = setTimeout(() => doLookup(d), 450);
    return () => clearTimeout(t);
  }, [doc, doLookup]);

  const submit = async () => {
    if (!doc.trim() || !nombres.trim() || !apellidos.trim() || !grupoId) {
      setError('Completa documento, nombres, apellidos y grupo.'); return;
    }
    setSaving(true); setError(null); setOkMsg(null);
    try {
      await inscripcionesApi.inscribir(empresa, {
        tipo_documento_id: tipoDoc || dniId,
        numero_documento: doc.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim() || undefined,
        telefono: telefono.trim() || undefined,
        grupo_id: grupoId,
      });
      onDone();                                   // refresca la lista detrás
      setOkMsg('✓ Inscrito correctamente');
      setTimeout(onClose, 1100);                  // cierra tras mostrar el mensaje
    } catch (e: unknown) {
      setError((e as Error).message);             // ej. "ya está inscrito en este programa"
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,14,18,0.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={onClose}>
      <div className="w-full max-w-[480px] bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(15,24,41,0.08)', boxShadow: '0 20px 60px -12px rgba(13,14,18,0.35)' }}
        onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #EEECE6' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <UserPlus size={15} />
            </div>
            <p className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Inscribir alumno</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F5F4F0]" style={{ color: '#B0A898' }}><X size={16} /></button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 text-[12.5px] px-3 py-2 rounded-xl"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}
          {okMsg && (
            <div className="flex items-center gap-2 text-[12.5px] px-3 py-2 rounded-xl"
              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
              <CheckCircle size={13} /> {okMsg}
            </div>
          )}

          {/* Documento */}
          <div className="flex gap-2">
            <select value={tipoDoc} onChange={e => setTipoDoc(+e.target.value)} className="vx-input" style={{ maxWidth: 110 }} disabled={yaRegistrado}>
              {tiposDoc.map(t => <option key={t.id} value={t.id}>{t.codigo}</option>)}
            </select>
            <input value={doc}
              onChange={e => { setDoc(e.target.value); setYaRegistrado(false); }}
              placeholder="N° de documento (se busca solo)" className="vx-input flex-1" autoFocus />
            {buscando && (
              <span className="flex items-center px-2 flex-shrink-0"><Loader2 size={15} className="animate-spin" style={{ color: '#7C3AED' }} /></span>
            )}
          </div>
          {yaRegistrado && (
            <p className="text-[11.5px] flex items-center gap-1" style={{ color: '#15803D' }}>
              <CheckCircle size={12} /> Estudiante ya registrado — datos autocompletados (no editables).
            </p>
          )}

          {(() => {
            const roStyle = yaRegistrado ? { background: '#F5F4F0', color: '#6B7280' } : undefined;
            return (
              <>
                {/* Nombres / Apellidos */}
                <div className="grid grid-cols-2 gap-2">
                  <input value={nombres} onChange={e => setNombres(e.target.value)} readOnly={yaRegistrado} style={roStyle} placeholder="Nombres" className="vx-input" />
                  <input value={apellidos} onChange={e => setApellidos(e.target.value)} readOnly={yaRegistrado} style={roStyle} placeholder="Apellidos" className="vx-input" />
                </div>
                {/* Contacto */}
                <div className="grid grid-cols-2 gap-2">
                  <input value={email} onChange={e => setEmail(e.target.value)} readOnly={yaRegistrado} style={roStyle} placeholder="Email (opcional)" className="vx-input" />
                  <input value={telefono} onChange={e => setTelefono(e.target.value)} readOnly={yaRegistrado} style={roStyle} placeholder="Teléfono (opcional)" className="vx-input" />
                </div>
              </>
            );
          })()}

          <div className="h-px my-1" style={{ background: '#F0EEE9' }} />

          {/* Programa / Grupo */}
          <div className="grid grid-cols-2 gap-2">
            <select value={programaId} onChange={e => { setProgramaId(+e.target.value); setGrupoId(0); }} className="vx-input">
              <option value={0} disabled>Programa…</option>
              {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <select value={grupoId} onChange={e => setGrupoId(+e.target.value)} className="vx-input" disabled={!programaId}>
              <option value={0} disabled>Grupo…</option>
              {gruposDelPrograma.map(g => <option key={g.id} value={g.id}>{g.nombre_grupo}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-4" style={{ borderTop: '1px solid #EEECE6' }}>
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-semibold rounded-xl"
            style={{ color: '#4B5563', border: '1px solid rgba(15,24,41,0.12)' }}>Cancelar</button>
          <button onClick={submit} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-xl text-white"
            style={{ background: '#7C3AED' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Inscribir
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function AdminEstudiantes() {
  const { empresa } = useParams<{ empresa: string }>();
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(false);

  const cargar = useCallback(() => {
    setLoading(true);
    participantesApi.list(empresa!)
      // Más reciente primero (id autoincremental: id mayor = más nuevo)
      .then(data => setParticipantes([...data].sort((a, b) => b.id - a.id)))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [empresa]);

  useEffect(cargar, [cargar]);

  const q = busqueda.trim().toLowerCase();
  const filtrados = participantes.filter(p =>
    !q ||
    `${p.nombres} ${p.apellidos}`.toLowerCase().includes(q) ||
    p.numero_documento.includes(q) ||
    (p.email ?? '').toLowerCase().includes(q),
  );

  const { page, setPage, totalPages, pageItems, startIndex, endIndex, total } = usePagination(filtrados, 12);

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[13px]" style={{ color: '#9CA3AF' }}>
          {participantes.length} estudiante{participantes.length !== 1 ? 's' : ''} registrado{participantes.length !== 1 ? 's' : ''}
        </p>
        <button onClick={() => setModal(true)} className="vx-btn vx-btn-primary px-4 py-2">
          <UserPlus size={15} /> Inscribir alumno
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898' }} />
        <input type="text" placeholder="Buscar por nombre, documento o email..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} className="vx-input vx-input-icon" />
      </div>

      {loading && <div className="flex justify-center py-16" style={{ color: '#D1D5DB' }}><Loader2 size={22} className="animate-spin" /></div>}
      {error && (
        <div className="flex items-center gap-2 text-[13px] px-4 py-3 rounded-xl"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {!loading && filtrados.length === 0 && (
        <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #EEECE6' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
            <Users size={22} />
          </div>
          <p className="text-[14px] font-medium" style={{ color: '#374151' }}>
            {busqueda ? 'Sin resultados' : 'Aún no hay estudiantes'}
          </p>
          <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>
            {busqueda ? 'Prueba con otro término' : 'Inscribe al primer alumno para empezar'}
          </p>
        </div>
      )}

      {!loading && filtrados.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
          <div className="hidden sm:grid grid-cols-[120px_1fr_1fr_120px] px-5 py-3" style={{ background: '#FAFAF8', borderBottom: '1px solid #EEECE6' }}>
            {['Documento', 'Nombre', 'Email', 'Teléfono'].map(h => (
              <p key={h} className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{h}</p>
            ))}
          </div>
          {pageItems.map((p, idx) => (
            <div key={p.id} className="flex flex-col sm:grid sm:grid-cols-[120px_1fr_1fr_120px] sm:items-center px-5 py-3"
              style={{ borderBottom: idx < pageItems.length - 1 ? '1px solid #F5F4F0' : undefined }}>
              <p className="text-[13px] font-mono tabular-nums" style={{ color: '#4B5563' }}>{p.numero_documento}</p>
              <p className="text-[13px] font-semibold truncate" style={{ color: '#0D0E12' }}>{p.nombres} {p.apellidos}</p>
              <p className="text-[12.5px] truncate" style={{ color: '#6B7280' }}>{p.email || '—'}</p>
              <p className="text-[12.5px]" style={{ color: '#6B7280' }}>{p.telefono || '—'}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage}
          startIndex={startIndex} endIndex={endIndex} total={total} itemLabel="estudiantes" accentColor="#7C3AED" />
      )}

      {modal && <InscribirModal empresa={empresa!} onClose={() => setModal(false)} onDone={cargar} />}
    </div>
  );
}
