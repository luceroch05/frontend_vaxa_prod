import { useParams, useNavigate } from 'react-router-dom';
import { Users, FileBadge, BookOpen, Layers, GraduationCap, ChevronRight, TrendingUp, AlertCircle, CreditCard } from '@/components/ui/icon';
import { authStorage }      from '@/lib/auth';
import { certPath }         from '@/lib/paths';
import { useProgramas }     from '../../shared/hooks/useProgramas';
import { useGrupos }        from '../../shared/hooks/useGrupos';
import { useInscripciones } from '../../shared/hooks/useInscripciones';
import { useCertificados }  from '../../shared/hooks/useCertificados';
import { usePlan }          from '../../shared/hooks/usePlan';

/* ── Estado config ──────────────────────────────────────────── */
const ESTADOS = [
  { id: 1, label: 'Inscritos',    color: '#3B82F6' },
  { id: 2, label: 'En curso',     color: '#F59E0B' },
  { id: 3, label: 'Aprobados',    color: '#10B981' },
  { id: 4, label: 'Desaprobados', color: '#EF4444' },
  { id: 5, label: 'Retirados',    color: '#94A3B8' },
  { id: 6, label: 'Rechazados',   color: '#F97316' },
];

/* ── Stat card con fondo de color ───────────────────────────── */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  cardBg: string;
  cardBorder: string;
  iconBg: string;
  numColor: string;
  onClick?: () => void;
  dark?: boolean;
  sub?: string;
}

function StatCard({
  icon, label, value, cardBg, cardBorder, iconBg, numColor, onClick, dark, sub,
}: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl p-5 text-left w-full transition-all duration-200 hover:-translate-y-1"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        boxShadow: dark
          ? '0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)'
          : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = dark
          ? '0 8px 30px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.14)'
          : '0 6px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = dark
          ? '0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)'
          : '0 1px 3px rgba(0,0,0,0.04)';
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        <ChevronRight
          size={14}
          className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
          style={{ color: numColor }}
        />
      </div>
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5"
        style={{ color: dark ? 'rgba(255,255,255,0.45)' : '#9CA3AF' }}
      >
        {label}
      </p>
      <p
        className="text-[34px] font-bold leading-none tracking-tight"
        style={{ color: numColor }}
      >
        {value}
      </p>
      {sub && (
        <p
          className="text-[12px] mt-2 flex items-center gap-1"
          style={{ color: dark ? 'rgba(255,255,255,0.35)' : '#9CA3AF' }}
        >
          <TrendingUp size={12} />
          {sub}
        </p>
      )}
    </button>
  );
}

/* ── Bar chart inline ───────────────────────────────────────── */
interface BarChartProps {
  data: { id: number; label: string; color: string; count: number }[];
}

function BarChart({ data }: BarChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const CHART_H  = 96; // px

  return (
    <div>
      {/* Bars */}
      <div className="flex items-end gap-2 mb-2" style={{ height: `${CHART_H}px` }}>
        {data.map(d => {
          const h = d.count > 0 ? Math.max((d.count / maxCount) * CHART_H, 6) : 2;
          return (
            <div key={d.id} className="flex-1 flex flex-col items-center justify-end gap-1">
              {d.count > 0 && (
                <span className="text-[11px] font-bold tabular-nums" style={{ color: '#374151' }}>
                  {d.count}
                </span>
              )}
              <div
                className="w-full rounded-t-lg vx-bar"
                style={{
                  height: `${h}px`,
                  background: d.count > 0 ? d.color : '#EEECE6',
                  opacity: 0.85,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-2">
        {data.map(d => (
          <div key={d.id} className="flex-1 text-center">
            <span className="text-[9px] leading-tight block truncate" style={{ color: '#9CA3AF' }}>
              {d.label.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { empresa } = useParams<{ empresa: string }>();
  const navigate    = useNavigate();
  const base        = certPath(empresa!, '/panel');

  const user = authStorage.getUser(empresa!);

  const { programas }     = useProgramas(empresa!);
  const { grupos }        = useGrupos(empresa!);
  const { inscripciones } = useInscripciones(empresa!);
  const { certificados }  = useCertificados(empresa!);
  const { estado: plan } = usePlan();

  const creditos    = plan?.creditos;
  const ilimitado   = !!creditos?.ilimitado;                                                          // plan sin tope (Corporativo)
  const sinCreditos = !ilimitado && !!plan?.plan && !!creditos && creditos.disponibles <= 0;          // saldo agotado: bloquea la emisión
  const pocosCreditos = !ilimitado && !!creditos && creditos.disponibles > 0 && creditos.disponibles <= 10;  // poco saldo

  const aprobados  = inscripciones.filter(i => i.estado_id === 3).length;
  const emitidos   = certificados.filter(c => c.estado_id === 1).length;
  const pendientes = aprobados - emitidos;
  const totalInsc  = inscripciones.length;
  const activeGrps = grupos.filter(g => g.activo).length;

  const hora     = new Date().getHours();
  const saludo   = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const nombreWelcome = user ? user.nombres : (empresa ?? 'Admin');

  const estadosData = ESTADOS.map(e => ({
    ...e,
    count: inscripciones.filter(i => i.estado_id === e.id).length,
  }));

  return (
    <div className="space-y-6 page-enter">

      {/* ── Greeting ─────────────────────────────────────────── */}
      <div className="stagger-1 page-enter">
        <p className="text-[13px] font-medium mb-0.5" style={{ color: '#B0A898' }}>
          {saludo}, {nombreWelcome} 👋
        </p>
        <h2 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>
          Bienvenido al panel de certificados
        </h2>
        <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>
          Aquí tienes el resumen de tu sistema
        </p>
      </div>

      {/* ── Aviso: sin créditos (bloquea la emisión) ─────────── */}
      {sinCreditos && (
        <div
          className="rounded-2xl p-6 flex items-start gap-4 stagger-1 page-enter"
          style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
            <AlertCircle size={24} style={{ color: '#DC2626' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[18px] font-bold" style={{ color: '#B91C1C' }}>
              Te quedaste sin créditos
            </h3>
            <p className="text-[14px] mt-1 leading-relaxed" style={{ color: '#B91C1C' }}>
              Ya consumiste los <b>{creditos!.asignados}</b> créditos asignados. No podrás emitir nuevos certificados
              hasta recargar tu saldo. Contacta a Vaxa para comprar más créditos.
            </p>
          </div>
        </div>
      )}

      {/* ── Aviso: pocos créditos ────────────────────────────── */}
      {pocosCreditos && (
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-3 stagger-1 page-enter"
          style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}
        >
          <CreditCard size={20} style={{ color: '#D97706', flexShrink: 0 }} />
          <p className="text-[13.5px] font-medium" style={{ color: '#92400E' }}>
            Te quedan <b>{creditos!.disponibles}</b> crédito{creditos!.disponibles === 1 ? '' : 's'} para emitir certificados.
          </p>
        </div>
      )}

      {/* ── 4 Stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 stagger-2 page-enter">
        {/* Certificados emitidos — featured dark */}
        <StatCard
          icon={<FileBadge size={18} style={{ color: '#D97706' }} />}
          label="Certificados emitidos"
          value={emitidos}
          cardBg="#0D0E12"
          cardBorder="#1a1c23"
          iconBg="rgba(217,119,6,0.18)"
          numColor="#D97706"
          dark
          sub={pendientes > 0 ? `${pendientes} pendientes` : 'Al día'}
          onClick={() => navigate(`${base}/certificados`)}
        />

        {/* Programas — violet */}
        <StatCard
          icon={<BookOpen size={18} style={{ color: '#7C3AED' }} />}
          label="Programas"
          value={programas.length}
          cardBg="#F5F3FF"
          cardBorder="#DDD6FE"
          iconBg="#EDE9FE"
          numColor="#5B21B6"
          onClick={() => navigate(`${base}/programas`)}
        />

        {/* Inscritos — blue */}
        <StatCard
          icon={<Users size={18} style={{ color: '#2563EB' }} />}
          label="Inscritos"
          value={totalInsc}
          cardBg="#EFF6FF"
          cardBorder="#BFDBFE"
          iconBg="#DBEAFE"
          numColor="#1D4ED8"
          onClick={() => navigate(`${base}/inscripciones`)}
        />

        {/* Grupos — green */}
        <StatCard
          icon={<Layers size={18} style={{ color: '#059669' }} />}
          label="Aulas activas"
          value={activeGrps}
          cardBg="#F0FDF4"
          cardBorder="#BBF7D0"
          iconBg="#DCFCE7"
          numColor="#15803D"
          onClick={() => navigate(`${base}/programas`)}
        />
      </div>

      {/* ── Alerta pendientes ─────────────────────────────────── */}
      {pendientes > 0 && (
        <button
          onClick={() => navigate(`${base}/certificados`)}
          className="group w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200 stagger-3 page-enter hover:-translate-y-0.5"
          style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#FEF3C7' }}
            >
              <GraduationCap size={18} style={{ color: '#D97706' }} />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-semibold" style={{ color: '#92400E' }}>
                {pendientes} alumno{pendientes !== 1 ? 's' : ''} aprobado{pendientes !== 1 ? 's' : ''} sin certificado
              </p>
              <p className="text-[12px]" style={{ color: '#B45309' }}>
                Ir a certificados → emitir
              </p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5 flex-shrink-0"
            style={{ color: '#D97706' }}
          />
        </button>
      )}

      {/* ── Row: Bar chart + Grupos ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 stagger-4 page-enter">

        {/* Bar chart */}
        <div
          className="xl:col-span-3 bg-white rounded-2xl p-5"
          style={{ border: '1px solid #EEECE6' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>
                Inscripciones por estado
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: '#9CA3AF' }}>
                {totalInsc} inscritos en total
              </p>
            </div>
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}
            >
              {aprobados} aprobados
            </span>
          </div>

          {totalInsc === 0 ? (
            <div className="py-10 text-center" style={{ color: '#C8C3BB' }}>
              <p className="text-[13px]">Sin inscripciones todavía</p>
            </div>
          ) : (
            <BarChart data={estadosData} />
          )}

          {/* Legend */}
          {totalInsc > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-4" style={{ borderTop: '1px solid #F0EEE9' }}>
              {estadosData.filter(d => d.count > 0).map(d => (
                <div key={d.id} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-[11px]" style={{ color: '#64748B' }}>{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grupos tabla compacta */}
        <div
          className="xl:col-span-2 bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #EEECE6' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid #F5F4F0' }}
          >
            <p className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>
              Aulas activas
            </p>
            <button
              onClick={() => navigate(`${base}/programas`)}
              className="text-[12px] font-semibold flex items-center gap-0.5 transition-opacity hover:opacity-70"
              style={{ color: '#D97706' }}
            >
              Ver todos <ChevronRight size={12} />
            </button>
          </div>

          {grupos.filter(g => g.activo).length === 0 ? (
            <div className="px-5 py-10 text-center" style={{ color: '#C8C3BB' }}>
              <p className="text-[13px]">Sin aulas activas</p>
            </div>
          ) : (
            grupos.filter(g => g.activo).slice(0, 6).map((g, i, arr) => {
              const count = inscripciones.filter(i => i.grupo_id === g.id).length;
              return (
                <button
                  key={g.id}
                  onClick={() =>
                    navigate(`${base}/inscripciones?grupo=${g.id}&nombre=${encodeURIComponent(g.nombre_grupo)}`)
                  }
                  className="w-full flex items-center justify-between px-5 py-3.5 transition-colors group"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid #F5F4F0' : undefined }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="text-left min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: '#0D0E12' }}>
                      {g.nombre_grupo}
                    </p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: '#9CA3AF' }}>
                      {g.programa_nombre}
                    </p>
                  </div>
                  <span
                    className="flex-shrink-0 ml-3 text-[12px] font-bold px-2.5 py-1 rounded-full tabular-nums"
                    style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}
                  >
                    {count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
