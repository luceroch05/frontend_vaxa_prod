import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Loader2, AlertCircle, Search, Users } from '@/components/ui/icon';
import { useInscripciones } from '../../shared/hooks/useInscripciones';
import CalidadBadge from '../../shared/components/CalidadBadge';

/* ── Ponentes / Staff ───────────────────────────────────────────
 * Lista SOLO a las personas con un rol distinto a "Participante"
 * (Ponente, Organizador, Colaborador…) de TODOS los eventos, para
 * gestionarlas aparte. Reusa las inscripciones existentes; la calidad
 * sale de inscripciones.calidad. Módulo aislado, no toca lo demás.
 * ─────────────────────────────────────────────────────────────── */
const esParticipante = (calidad?: string) =>
  ((calidad ?? 'Participante').trim() || 'Participante').toLowerCase() === 'participante';

export default function PonentesStaff() {
  const { empresa } = useParams<{ empresa: string }>();
  const { inscripciones, loading, error } = useInscripciones(empresa!);

  const [busqueda, setBusqueda]         = useState('');
  const [filtroCalidad, setFiltroCalidad] = useState('todas');

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
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: '#0D0E12' }}>Ponentes y Staff</h1>
          <p className="text-[13px]" style={{ color: '#9CA3AF' }}>
            Personas con un rol distinto a Participante en todos los eventos.
          </p>
        </div>
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

      {error && (
        <div className="mb-4 flex items-center gap-2 text-[13px] px-3.5 py-2.5 rounded-xl"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={14} /> {error}
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
                <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: '#94A3B8' }}>
                  {i.estado_nombre}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
