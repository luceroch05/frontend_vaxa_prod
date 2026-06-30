import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Loader2, AlertCircle } from '@/components/ui/icon';
import { usePlan } from '../../shared/hooks/usePlan';
import Pagination from '../../shared/components/Pagination';
import {
  auditoriaApi, type AuditEvento, type AuditAccion, type AuditEntidad,
} from '../../shared/api/auditoria.api';

const POR_PAGINA = 15;

/** Etiqueta + color por tipo de acción. */
const ACCION_META: Record<AuditAccion, { label: string; bg: string; fg: string }> = {
  crear:    { label: 'Creó',      bg: '#ECFDF5', fg: '#047857' },
  editar:   { label: 'Editó',     bg: '#EFF6FF', fg: '#2563EB' },
  eliminar: { label: 'Eliminó',   bg: '#FEF2F2', fg: '#B91C1C' },
  emitir:   { label: 'Emitió',    bg: '#F0FDFA', fg: '#0D7C66' },
  anular:   { label: 'Anuló',     bg: '#FFFBEB', fg: '#B45309' },
  importar: { label: 'Importó',   bg: '#EEF2FF', fg: '#4338CA' },
  login:    { label: 'Ingresó',   bg: '#F5F4F0', fg: '#64748B' },
};

const ENTIDAD_LABEL: Record<AuditEntidad, string> = {
  programa: 'Programa', aula: 'Aula', inscripcion: 'Inscripción', participante: 'Estudiante',
  nota: 'Notas', certificado: 'Certificado', config: 'Diseño', logo: 'Logo', firma: 'Firma',
  unidad: 'Unidad', sesion: 'Sesión',
};

const fmtFechaHora = (s: string) =>
  new Date(s).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Pastilla de color por acción. */
function AccionBadge({ accion }: { accion: AuditAccion }) {
  const m = ACCION_META[accion] ?? { label: accion, bg: '#F5F4F0', fg: '#64748B' };
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: m.bg, color: m.fg }}>
      {m.label}
    </span>
  );
}

/** Select de filtro reutilizable. */
function FiltroSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-[12.5px] rounded-lg px-2.5 outline-none"
      style={{ height: 34, minWidth: 150, border: '1px solid #EEECE6', background: '#fff', color: '#374151' }}
    >
      {children}
    </select>
  );
}

export default function AdminAuditoria() {
  const { empresa } = useParams<{ empresa: string }>();
  const { estado } = usePlan();

  const [items, setItems]   = useState<AuditEvento[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const [accion, setAccion]   = useState<AuditAccion | ''>('');
  const [entidad, setEntidad] = useState<AuditEntidad | ''>('');
  const [page, setPage]       = useState(1);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await auditoriaApi.list(empresa!, {
        accion: accion || undefined,
        entidad: entidad || undefined,
        limit: POR_PAGINA,
        offset: (page - 1) * POR_PAGINA,
      });
      setItems(r.items);
      setTotal(r.total);
    } catch (e) {
      setError((e as Error).message);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [empresa, accion, entidad, page]);

  useEffect(() => { cargar(); }, [cargar]);

  // El plan no incluye auditoría (Básico): aviso de mejora.
  if (estado?.plan && !estado.plan.permite_auditoria) {
    return (
      <div className="bg-white rounded-2xl py-16 text-center page-enter" style={{ border: '1px solid #EEECE6' }}>
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#FEF3C7', color: '#B45309' }}>
          <Shield size={22} />
        </div>
        <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>La auditoría no está incluida en tu plan</p>
        <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Disponible desde el plan Profesional. Contacta a Vaxa para mejorar tu plan.</p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / POR_PAGINA));
  const startIndex = (page - 1) * POR_PAGINA;

  return (
    <div className="space-y-4 page-enter">
      {/* Encabezado + filtros */}
      <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between gap-3 flex-wrap" style={{ border: '1px solid #EEECE6' }}>
        <div className="flex items-center gap-2">
          <Shield size={18} style={{ color: '#0D0E12' }} />
          <div>
            <p className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>Auditoría</p>
            <p className="text-[12px]" style={{ color: '#9CA3AF' }}>Registro de todas las acciones: quién, cuándo y qué cambió.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FiltroSelect value={accion} onChange={(v) => { setAccion(v as AuditAccion | ''); setPage(1); }}>
            <option value="">Todas las acciones</option>
            <option value="crear">Creaciones</option>
            <option value="editar">Ediciones</option>
            <option value="eliminar">Eliminaciones</option>
            <option value="emitir">Emisiones</option>
            <option value="anular">Anulaciones</option>
            <option value="importar">Importaciones</option>
            <option value="login">Inicios de sesión</option>
          </FiltroSelect>
          <FiltroSelect value={entidad} onChange={(v) => { setEntidad(v as AuditEntidad | ''); setPage(1); }}>
            <option value="">Todo</option>
            <option value="programa">Programas</option>
            <option value="aula">Aulas</option>
            <option value="participante">Estudiantes</option>
            <option value="inscripcion">Inscripciones</option>
            <option value="nota">Notas</option>
            <option value="certificado">Certificados</option>
            <option value="config">Diseño</option>
            <option value="logo">Logos</option>
            <option value="firma">Firmas</option>
            <option value="sesion">Sesiones</option>
          </FiltroSelect>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
        {loading ? (
          <div className="flex justify-center py-16" style={{ color: '#D1D5DB' }}><Loader2 size={24} className="animate-spin" /></div>
        ) : error ? (
          <div className="py-12 text-center">
            <AlertCircle size={20} style={{ color: '#DC2626', margin: '0 auto 8px' }} />
            <p className="text-[13px]" style={{ color: '#B91C1C' }}>{error}</p>
          </div>
        ) : items.length === 0 ? (
          <p className="text-[13px] text-center py-12" style={{ color: '#9CA3AF' }}>No hay movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898', background: '#FAFAF8' }}>
                  <th className="text-left px-4 py-2.5">Fecha</th>
                  <th className="text-left px-4 py-2.5">Usuario</th>
                  <th className="text-left px-4 py-2.5">Acción</th>
                  <th className="text-left px-4 py-2.5">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id} style={{ borderTop: '1px solid #F2F0EA' }}>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap align-top" style={{ color: '#64748B' }}>{fmtFechaHora(m.created_at)}</td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-semibold" style={{ color: '#0D0E12' }}>{m.usuario_nombre ?? 'Sistema'}</p>
                      {m.usuario_rol && <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{m.usuario_rol}</p>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-1.5">
                        <AccionBadge accion={m.accion} />
                        <span className="text-[11px]" style={{ color: '#9CA3AF' }}>{ENTIDAD_LABEL[m.entidad] ?? m.entidad}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top" style={{ color: '#374151' }}>{m.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && total > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          startIndex={startIndex}
          endIndex={Math.min(startIndex + POR_PAGINA, total)}
          total={total}
          itemLabel="acciones"
        />
      )}
    </div>
  );
}
