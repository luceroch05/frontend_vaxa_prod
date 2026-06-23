import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CreditCard, Loader2, CheckCircle, AlertCircle, Sparkles } from '@/components/ui/icon';
import { usePlan } from '../../shared/hooks/usePlan';
import { planesApi, type Plan } from '../../shared/api/planes.api';

const MES = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const sol = (n: number) => `S/ ${n.toFixed(2)}`;
/** Precio del certificado adicional = proporcional al plan (precio mensual ÷ cupo). */
const adicionalProporcional = (precioMensual: number, cupo: number) =>
  cupo > 0 ? Math.round((precioMensual / cupo) * 100) / 100 : 0;

export default function AdminPlan() {
  const { empresa } = useParams<{ empresa: string }>();
  const { estado, loading } = usePlan();
  const [catalogo, setCatalogo] = useState<Plan[]>([]);

  useEffect(() => {
    planesApi.catalogo(empresa!).then(setCatalogo).catch(() => setCatalogo([]));
  }, [empresa]);

  if (loading) {
    return <div className="flex justify-center py-20" style={{ color: '#D1D5DB' }}><Loader2 size={24} className="animate-spin" /></div>;
  }

  if (!estado || !estado.plan) {
    return (
      <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #EEECE6' }}>
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#FEF2F2', color: '#DC2626' }}>
          <AlertCircle size={22} />
        </div>
        <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>Sin plan activo</p>
        <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Contacta a Vaxa para activar tu suscripción.</p>
      </div>
    );
  }

  const { plan, suscripcion, consumo } = estado;
  const pct = consumo.incluidos > 0 ? Math.min((consumo.emitidos / consumo.incluidos) * 100, 100) : 0;
  const sinCupo = consumo.restantes <= 0;

  return (
    <div className="space-y-5 page-enter">
      {/* ── Plan actual + consumo ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Plan */}
        <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #0D0E12, #2A2D35)', boxShadow: '0 8px 24px rgba(13,14,18,0.25)' }}>
          <div className="flex items-center gap-1.5 text-[12px] mb-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <CreditCard size={14} /> Tu plan
          </div>
          <p className="text-[26px] font-bold leading-tight">{plan.nombre}</p>
          <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{sol(plan.precio_mensual)} / mes</p>
          {suscripcion && (
            <p className="text-[12px] mt-3" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {suscripcion.ciclo} · vigente hasta {new Date(suscripcion.fecha_fin).toLocaleDateString('es-PE')}
            </p>
          )}
        </div>

        {/* Cupo del mes con barra */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>Cupo de {MES[consumo.mes]}</p>
            <p className="text-[13px] font-semibold tabular-nums" style={{ color: sinCupo ? '#B45309' : '#15803D' }}>
              {consumo.emitidos} / {consumo.incluidos}
            </p>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: '#F0EEE9' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: sinCupo ? '#D97706' : '#15803D' }} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Disponibles', value: consumo.restantes, color: '#15803D' },
              { label: 'Emitidos', value: consumo.emitidos, color: '#0D0E12' },
              { label: 'Excedentes', value: consumo.adicionales, color: consumo.adicionales > 0 ? '#B45309' : '#0D0E12' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
                <p className="text-[22px] font-bold leading-none tabular-nums" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider mt-1.5" style={{ color: '#B0A898' }}>{s.label}</p>
              </div>
            ))}
          </div>
          {consumo.adicionales > 0 && (
            <p className="text-[12.5px] mt-3 px-3 py-2 rounded-xl" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
              Llevas <b>{consumo.adicionales}</b> certificado{consumo.adicionales === 1 ? '' : 's'} excedente{consumo.adicionales === 1 ? '' : 's'} este mes:
              <b> {sol(consumo.monto_adicional)}</b> adicionales (a {sol(adicionalProporcional(plan.precio_mensual, plan.limite_certificados_mes))} c/u).
            </p>
          )}
        </div>
      </div>

      {/* ── Catálogo de planes ────────────────────────────────── */}
      <div>
        <p className="text-[13px] font-bold mb-3" style={{ color: '#0D0E12' }}>Planes disponibles</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {catalogo.map(p => {
            const actual = p.id === plan.id;
            return (
              <div key={p.id} className="rounded-2xl p-4 flex flex-col"
                style={{ background: '#fff', border: `1.5px solid ${actual ? '#0D0E12' : '#EEECE6'}` }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>{p.nombre}</p>
                  {actual && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#B45309' }}>Actual</span>}
                </div>
                <p className="text-[20px] font-bold" style={{ color: '#0D0E12' }}>{sol(p.precio_mensual)}<span className="text-[12px] font-normal" style={{ color: '#9CA3AF' }}>/mes</span></p>
                <p className="text-[12px] mt-1" style={{ color: '#64748B' }}>
                  {p.limite_certificados_mes ? `${p.limite_certificados_mes} certificados/mes` : 'A medida'}
                </p>
                <p className="text-[11.5px] mt-0.5" style={{ color: '#9CA3AF' }}>
                  {p.limite_certificados_mes > 0
                    ? <>Adicional {sol(adicionalProporcional(p.precio_mensual, p.limite_certificados_mes))} c/u</>
                    : <>Cupo a medida</>}
                </p>
                <div className="mt-2 space-y-1">
                  {p.permite_diseno     && <Feat txt="Diseño personalizado" />}
                  {p.permite_subdominio && <Feat txt="Dominio propio" />}
                  {p.permite_carga_masiva && <Feat txt="Carga masiva / API" />}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[12.5px] mt-3 flex items-center gap-1.5" style={{ color: '#9CA3AF' }}>
          <Sparkles size={13} style={{ color: '#D97706' }} /> ¿Quieres cambiar de plan? Contacta a Vaxa.
        </p>
      </div>
    </div>
  );
}

function Feat({ txt }: { txt: string }) {
  return (
    <p className="flex items-center gap-1.5 text-[11.5px]" style={{ color: '#15803D' }}>
      <CheckCircle size={12} /> {txt}
    </p>
  );
}
