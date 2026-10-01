import { useEffect, useState, useCallback } from 'react';
import { Loader2, Shield } from '@/components/ui/icon';
import { authStorage } from '@/lib/auth';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import { terapApi, type HcAuditoriaEvento } from '../../shared/api/terapeutico.api';
import { EncabezadoPagina, Campo } from '../../shared/finanzas';

const TEAL = '#0F766E';
const PAGE = 30;
/** Sombra/borde de tarjeta premium (mismo patrón de Ventas/Caja/Reportes). */
const CARD: React.CSSProperties = { border: '1px solid #EAEFEE', boxShadow: '0 1px 2px rgba(16,48,44,.04), 0 12px 32px -16px rgba(16,48,44,.14)' };

/** Color del "chip" según la acción, para leer la bitácora de un vistazo. */
const colorAccion = (a: string): { bg: string; fg: string } => {
  switch (a) {
    case 'crear':    return { bg: '#ECFDF5', fg: '#047857' };
    case 'editar':   return { bg: '#EFF6FF', fg: '#1D4ED8' };
    case 'eliminar': return { bg: '#FEF2F2', fg: '#B91C1C' };
    case 'ver':      return { bg: '#F5F3FF', fg: '#6D28D9' };
    case 'adjuntar': return { bg: '#FFF7ED', fg: '#C2410C' };
    default:         return { bg: '#F1F5F9', fg: '#475569' };   // asignar, revocar…
  }
};

const fmtFecha = (s: string) => {
  const d = new Date((s || '').replace(' ', 'T'));
  return isNaN(d.getTime()) ? s : d.toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export default function Auditoria() {
  const slug = useEmpresaSlug()!;
  const esAdmin = (authStorage.getUser(slug)?.rol ?? '').toUpperCase() === 'ADMINISTRADOR';

  const [items, setItems] = useState<HcAuditoriaEvento[]>([]);
  const [total, setTotal] = useState(0);
  const [accion, setAccion] = useState('');
  const [entidad, setEntidad] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback((reset: boolean) => {
    setLoading(true); setError(null);
    const offset = reset ? 0 : items.length;
    terapApi.auditoria(slug, { accion: accion || undefined, entidad: entidad || undefined, limit: PAGE, offset })
      .then(r => {
        setItems(prev => reset ? r.items : [...prev, ...r.items]);
        setTotal(r.total);
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, accion, entidad]);

  // Recarga desde cero al cambiar filtros.
  useEffect(() => { cargar(true); }, [cargar]);

  if (!esAdmin) {
    return <p className="text-[13.5px]" style={{ color: '#6B7280' }}>Solo el administrador puede ver la auditoría.</p>;
  }

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        icon={<Shield size={19} color="#fff" />}
        titulo="Auditoría"
        subtitulo={`Quién hizo qué y cuándo sobre los datos clínicos · ${total} registro${total === 1 ? '' : 's'}`}
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-end">
        <Campo label="Acción">
          <select value={accion} onChange={e => setAccion(e.target.value)} className="vx-input">
            <option value="">Todas</option>
            {['crear', 'editar', 'eliminar', 'ver', 'asignar', 'revocar', 'adjuntar'].map(a =>
              <option key={a} value={a}>{a}</option>)}
          </select>
        </Campo>
        <Campo label="Entidad">
          <select value={entidad} onChange={e => setEntidad(e.target.value)} className="vx-input">
            <option value="">Todas</option>
            {['paciente', 'historia', 'diagnostico', 'objetivo', 'avance', 'sesion', 'tarea', 'tratamiento', 'servicio', 'cita', 'adjunto', 'acceso', 'asignacion'].map(e =>
              <option key={e} value={e}>{e}</option>)}
          </select>
        </Campo>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-[13px]" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>{error}</div>
      )}

      <div className="rounded-2xl bg-white overflow-hidden" style={CARD}>
        {/* Cabecera */}
        <div className="hidden md:grid px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider"
          style={{ gridTemplateColumns: '150px 180px 90px 1fr 120px', color: '#64748B', background: '#F6FAF9', borderBottom: '1px solid #F1F5F4' }}>
          <span>Fecha</span><span>Usuario</span><span>Acción</span><span>Detalle</span><span>IP</span>
        </div>

        {loading && items.length === 0 ? (
          <div className="p-10 flex justify-center"><Loader2 size={22} className="animate-spin" style={{ color: TEAL }} /></div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-[13.5px]" style={{ color: '#9CA3AF' }}>Sin registros todavía.</div>
        ) : (
          items.map((ev, i) => {
            const col = colorAccion(ev.accion);
            return (
              <div key={ev.id} className="grid px-4 py-3 text-[13px] items-center"
                style={{ gridTemplateColumns: '150px 180px 90px 1fr 120px',
                  borderBottom: i < items.length - 1 ? '1px solid #F5F7F6' : undefined }}>
                <span className="tabular-nums" style={{ color: '#475569' }}>{fmtFecha(ev.created_at)}</span>
                <span className="truncate" style={{ color: '#0E1A1A' }}>
                  {ev.usuario_nombre || '—'}
                  {ev.usuario_rol && <span className="text-[11px] ml-1" style={{ color: '#94A3B8' }}>· {ev.usuario_rol}</span>}
                </span>
                <span>
                  <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold" style={{ background: col.bg, color: col.fg }}>{ev.accion}</span>
                </span>
                <span style={{ color: '#374151' }}>{ev.descripcion}</span>
                <span className="text-[11.5px] tabular-nums" style={{ color: '#94A3B8' }}>{ev.ip || '—'}</span>
              </div>
            );
          })
        )}
      </div>

      {items.length < total && (
        <div className="flex justify-center">
          <button onClick={() => cargar(false)} disabled={loading}
            className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ background: '#fff', color: TEAL, border: '1px solid #E2E8F0' }}>
            {loading && <Loader2 size={14} className="animate-spin" />} Cargar más ({items.length} de {total})
          </button>
        </div>
      )}
    </div>
  );
}
