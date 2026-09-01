import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { Star, Loader2, AlertCircle, Search, Users, Settings, Plus, X } from '@/components/ui/icon';
import { useInscripciones } from '../../shared/hooks/useInscripciones';
import { useCalidades } from '../../shared/hooks/useCalidades';
import CalidadBadge from '../../shared/components/CalidadBadge';

/* ── Ponentes / Staff ───────────────────────────────────────────
 * Lista SOLO a las personas con un rol distinto a "Participante"
 * (Ponente, Organizador, Colaborador…) de TODOS los eventos, para
 * gestionarlas aparte. Reusa las inscripciones existentes; la calidad
 * sale de inscripciones.calidad. Módulo aislado, no toca lo demás.
 * ─────────────────────────────────────────────────────────────── */
// Un "Asistente" se trata igual que un Participante: no es staff, así que
// no aparece en esta página (se gestiona con el resto de participantes).
const NO_STAFF = new Set(['participante', 'asistente']);
const esParticipante = (calidad?: string) =>
  NO_STAFF.has(((calidad ?? 'Participante').trim() || 'Participante').toLowerCase());

export default function PonentesStaff() {
  const { empresa } = useParams<{ empresa: string }>();
  const { inscripciones, loading, error, cambiarCalidad } = useInscripciones(empresa!);
  const { nombres: CALIDADES, calidades, crear, actualizar } = useCalidades(empresa!);

  const [busqueda, setBusqueda]         = useState('');
  const [filtroCalidad, setFiltroCalidad] = useState('todas');
  const [calSaving, setCalSaving]       = useState<number | null>(null);
  const [calError, setCalError]         = useState<string | null>(null);
  const [gestionar, setGestionar]       = useState(false);

  const handleCambiarCalidad = async (id: number, calidad: string) => {
    setCalError(null);
    setCalSaving(id);
    try { await cambiarCalidad(id, calidad); }
    catch (e: unknown) { setCalError((e as Error).message); }
    finally { setCalSaving(null); }
  };

  // Solo staff (no participantes).
  const staff = useMemo(
    () => inscripciones.filter(i => !esParticipante(i.calidad)),
    [inscripciones],
  );

  const calidadesPresentes = useMemo(
    () => Array.from(new Set(staff.map(i => (i.calidad ?? '').trim()).filter(Boolean))).sort(),
    [staff],
  );

  const filtrados = staff.filter(i => {
    const cal = (i.calidad ?? '').trim();
    const okCalidad = filtroCalidad === 'todas' || cal === filtroCalidad;
    const q = busqueda.toLowerCase();
    const okBusq = !q || i.participante_nombre.toLowerCase().includes(q) || i.numero_documento.includes(q);
    return okCalidad && okBusq;
  });

  return (
    <div className="page-enter">
      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-1.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F3F0FF' }}>
          <Star size={18} style={{ color: '#7C3AED' }} />
        </div>
        <div className="flex-1">
          <h1 className="text-[20px] font-bold" style={{ color: '#0D0E12' }}>Ponentes y Staff</h1>
          <p className="text-[13px]" style={{ color: '#9CA3AF' }}>
            Personas con un rol distinto a Participante en todos los eventos.
          </p>
        </div>
        <button onClick={() => setGestionar(true)}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-2 rounded-lg shrink-0"
          style={{ border: '1px solid #E5E7EB', color: '#4B5563' }}
          title="Administrar las calidades disponibles">
          <Settings size={14} /> Gestionar calidades
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2.5 mt-5 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B0A898' }} />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o documento…"
            className="vx-input vx-input-icon w-full"
          />
        </div>
        <select
          value={filtroCalidad}
          onChange={e => setFiltroCalidad(e.target.value)}
          className="vx-input"
          style={{ maxWidth: 200 }}
        >
          <option value="todas">Todas las calidades</option>
          {calidadesPresentes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {(error || calError) && (
        <div className="mb-4 flex items-center gap-2 text-[13px] px-3.5 py-2.5 rounded-xl"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={14} /> {error || calError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20" style={{ color: '#D1D5DB' }}><Loader2 size={22} className="animate-spin" /></div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #EEECE6' }}>
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#F3F0FF', color: '#7C3AED' }}>
            <Users size={22} />
          </div>
          <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>
            {staff.length === 0 ? 'Aún no hay ponentes ni staff' : 'Nada coincide con el filtro'}
          </p>
          <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>
            {staff.length === 0
              ? 'Al inscribir o importar, elige una calidad distinta a Participante (Ponente, Organizador…).'
              : 'Prueba con otra calidad o limpia la búsqueda.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-[12px] mb-2" style={{ color: '#9CA3AF' }}>
            {filtrados.length} persona{filtrados.length !== 1 ? 's' : ''}
          </p>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
            {filtrados.map((i, idx) => (
              <div key={i.id}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors"
                style={{ borderBottom: idx < filtrados.length - 1 ? '1px solid #F5F4F0' : undefined }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: '#F5F3FF' }}>
                    <Users size={15} style={{ color: '#7C3AED' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: '#0D0E12' }}>{i.participante_nombre}</p>
                      <CalidadBadge calidad={i.calidad} />
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
                      {i.numero_documento}
                      {i.nombre_grupo && ` · ${i.nombre_grupo}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {calSaving === i.id && <Loader2 size={13} className="animate-spin" style={{ color: '#9CA3AF' }} />}
                  <select
                    value={(i.calidad ?? 'Participante').trim() || 'Participante'}
                    onChange={e => handleCambiarCalidad(i.id, e.target.value)}
                    disabled={calSaving === i.id}
                    className="vx-input"
                    style={{ padding: '0.3rem 0.55rem', fontSize: 12, minWidth: 130 }}
                    title="Cambiar la calidad (Participante lo quita de esta lista)"
                  >
                    {(CALIDADES.includes((i.calidad ?? 'Participante').trim() || 'Participante')
                      ? CALIDADES
                      : [...CALIDADES, (i.calidad ?? '').trim()]
                    ).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="text-[11px] font-semibold" style={{ color: '#94A3B8' }}>
                    {i.estado_nombre}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {gestionar && (
        <GestionarCalidades
          calidades={calidades}
          onClose={() => setGestionar(false)}
          onCrear={crear}
          onActualizar={actualizar}
        />
      )}
    </div>
  );
}

// ── Modal: administrar el catálogo de calidades ───────────────────────────────
function GestionarCalidades({ calidades, onClose, onCrear, onActualizar }: {
  calidades: import('../../shared/api/calidades.api').Calidad[];
  onClose: () => void;
  onCrear: (nombre: string) => Promise<unknown>;
  onActualizar: (id: number, data: { nombre?: string; activo?: boolean }) => Promise<unknown>;
}) {
  const [nuevo, setNuevo] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const agregar = async () => {
    const nom = nuevo.trim();
    if (!nom) return;
    setBusy(true); setErr(null);
    try { await onCrear(nom); setNuevo(''); }
    catch (e: unknown) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  const esParticipante = (n: string) => n.trim().toLowerCase() === 'participante';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)' }}>
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #EEF0F2' }}>
          <h2 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>Calidades de participación</h2>
          <button onClick={onClose}><X size={18} style={{ color: '#6B7280' }} /></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <input className="vx-input flex-1" placeholder="Nueva calidad (ej. Moderador)" value={nuevo}
              onChange={e => setNuevo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') agregar(); }} />
            <button onClick={agregar} disabled={busy || !nuevo.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-[12.5px] font-semibold disabled:opacity-50" style={{ background: '#7C3AED' }}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Agregar
            </button>
          </div>
          {err && <p className="text-[12.5px] mb-2" style={{ color: '#B91C1C' }}>{err}</p>}

          {calidades.length === 0 ? (
            <p className="text-[12.5px]" style={{ color: '#9CA3AF' }}>Aún no hay calidades. Agrega la primera arriba.</p>
          ) : (
            <ul className="space-y-1.5 max-h-[320px] overflow-y-auto">
              {calidades.map(c => (
                <li key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px]"
                  style={{ background: c.activo ? '#F8F9FB' : '#F3F4F6', opacity: c.activo ? 1 : 0.6 }}>
                  <span style={{ color: '#0D0E12' }}>{c.nombre}{!c.activo && ' (inactiva)'}</span>
                  {esParticipante(c.nombre) ? (
                    <span className="text-[11px]" style={{ color: '#9CA3AF' }}>por defecto</span>
                  ) : (
                    <button onClick={() => onActualizar(c.id, { activo: !c.activo })}
                      className="text-[12px] font-semibold" style={{ color: c.activo ? '#B91C1C' : '#7C3AED' }}>
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11.5px] mt-3" style={{ color: '#9CA3AF' }}>
            Desactivar una calidad la quita del desplegable; las inscripciones que ya la tienen no se modifican.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
