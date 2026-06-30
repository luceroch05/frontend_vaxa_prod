import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CreditCard, Loader2, CheckCircle, AlertCircle, Sparkles, Package, MessageCircle, Clock } from '@/components/ui/icon';
import { usePlan } from '../../shared/hooks/usePlan';
import { planesApi, PAQUETES_CREDITOS, CREDITOS_INDIVIDUALES, type MovimientoCredito } from '../../shared/api/planes.api';
import Pagination from '../../shared/components/Pagination';

/** Contacto de Vaxa para solicitar la recarga (la compra es manual por ahora). */
const VAXA_WA = '51974280156';

const sol = (n: number) => `S/ ${n.toFixed(2)}`;
const fmtFecha = (s: string) => new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
/** Fecha + hora corta para el historial de movimientos. */
const fmtFechaHora = (s: string) => new Date(s).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Etiqueta legible por tipo de movimiento de crédito. */
const MOV_LABEL: Record<MovimientoCredito['tipo'], string> = {
  asignacion: 'Créditos del plan',
  recarga:    'Recarga de créditos',
  consumo:    'Emisión de certificado',
  devolucion: 'Devolución (certificado eliminado)',
  ajuste:     'Ajuste',
};

/** Estilo y texto del semáforo de cobranza. */
const COBRANZA = {
  vigente:    { bg: '#ECFDF5', bd: '#A7F3D0', fg: '#047857', label: 'Al día' },
  por_vencer: { bg: '#FFFBEB', bd: '#FDE68A', fg: '#B45309', label: 'Por vencer' },
  vencido:    { bg: '#FEF2F2', bd: '#FECACA', fg: '#B91C1C', label: 'Vencido' },
} as const;

export default function AdminPlan() {
  const { empresa } = useParams<{ empresa: string }>();
  const { estado, loading } = usePlan();
  const [movimientos, setMovimientos] = useState<MovimientoCredito[]>([]);
  const [movTipo, setMovTipo] = useState<'todos' | MovimientoCredito['tipo']>('todos');
  const [movPage, setMovPage] = useState(1);

  useEffect(() => {
    planesApi.movimientos(empresa!, 300).then(setMovimientos).catch(() => setMovimientos([]));
  }, [empresa]);

  // El saldo del provider cambia al emitir/eliminar; recargar el historial al vuelo.
  const saldoActual = estado?.creditos?.disponibles;
  useEffect(() => {
    if (saldoActual === undefined) return;
    planesApi.movimientos(empresa!, 300).then(setMovimientos).catch(() => { /* deja el último historial */ });
  }, [empresa, saldoActual]);

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

  const { plan, suscripcion, creditos } = estado;
  const ilimitado = creditos.ilimitado;
  // Avance del saldo consumido sobre el total histórico asignado.
  const pct = creditos.asignados > 0 ? Math.min((creditos.consumidos / creditos.asignados) * 100, 100) : 0;
  const sinCreditos = !ilimitado && creditos.disponibles <= 0;
  const pocos = !ilimitado && !sinCreditos && creditos.disponibles <= 10;

  // Movimientos: filtro por tipo + paginación (cliente).
  const MOV_POR_PAGINA = 8;
  const movsFiltrados = movimientos.filter(m => movTipo === 'todos' || m.tipo === movTipo);
  const movTotalPages = Math.max(1, Math.ceil(movsFiltrados.length / MOV_POR_PAGINA));
  const movPageSafe = Math.min(movPage, movTotalPages);
  const movStart = (movPageSafe - 1) * MOV_POR_PAGINA;
  const movsPagina = movsFiltrados.slice(movStart, movStart + MOV_POR_PAGINA);

  return (
    <div className="space-y-5 page-enter">
      {/* ── Plan actual + consumo ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Plan */}
        <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #0D0E12, #2A2D35)', boxShadow: '0 8px 24px rgba(13,14,18,0.25)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <CreditCard size={14} /> Tu plan
            </div>
            {suscripcion && (
              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: COBRANZA[suscripcion.estado_cobranza].bg, color: COBRANZA[suscripcion.estado_cobranza].fg }}>
                {COBRANZA[suscripcion.estado_cobranza].label}
              </span>
            )}
          </div>
          <p className="text-[26px] font-bold leading-tight">{plan.nombre}</p>
          <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{sol(plan.mantenimiento_mensual || plan.precio_mensual)} / mes · mantenimiento</p>
          {suscripcion && (
            <p className="text-[12px] mt-3" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {suscripcion.ciclo} · vigente hasta {fmtFecha(suscripcion.fecha_fin)}
            </p>
          )}
        </div>

        {/* Saldo de créditos con barra */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
          {ilimitado ? (
            /* Plan ilimitado (Corporativo): sin tope de certificados */
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>Tus créditos</p>
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#ECFDF5', color: '#047857' }}>Ilimitado</span>
              </div>
              <div className="flex items-baseline gap-3">
                <p className="text-[40px] font-bold leading-none" style={{ color: '#0D7C66' }}>∞</p>
                <p className="text-[13px]" style={{ color: '#64748B' }}>certificados sin límite</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { label: 'Emitidos en total', value: creditos.consumidos },
                  { label: 'Plan', value: plan.nombre },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
                    <p className="text-[18px] font-bold leading-none truncate" style={{ color: '#0D0E12' }}>{s.value}</p>
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider mt-1.5" style={{ color: '#B0A898' }}>{s.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[12.5px] mt-3" style={{ color: '#9CA3AF' }}>
                Tu plan <b>{plan.nombre}</b> no tiene límite de certificados: emite los que necesites sin gastar créditos.
              </p>
            </>
          ) : (
          <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>Tus créditos</p>
            <p className="text-[13px] font-semibold tabular-nums" style={{ color: sinCreditos ? '#B91C1C' : pocos ? '#B45309' : '#15803D' }}>
              {creditos.consumidos} / {creditos.asignados} usados
            </p>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: '#F0EEE9' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: sinCreditos ? '#DC2626' : pocos ? '#D97706' : '#15803D' }} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Disponibles', value: creditos.disponibles, color: sinCreditos ? '#B91C1C' : '#15803D' },
              { label: 'Consumidos', value: creditos.consumidos, color: '#0D0E12' },
              { label: 'Extra recargados', value: creditos.recargados, color: creditos.recargados > 0 ? '#0D7C66' : '#0D0E12' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
                <p className="text-[22px] font-bold leading-none tabular-nums" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider mt-1.5" style={{ color: '#B0A898' }}>{s.label}</p>
              </div>
            ))}
          </div>
          {/* Desglose del total asignado: cuánto vino del plan y cuánto es recarga extra. */}
          <p className="text-[11.5px] mt-2.5" style={{ color: '#9CA3AF' }}>
            De <b style={{ color: '#64748B' }}>{creditos.asignados}</b> créditos asignados: <b style={{ color: '#64748B' }}>{Math.max(creditos.asignados - creditos.recargados, 0)}</b> de tu plan
            {creditos.recargados > 0 && <> + <b style={{ color: '#0D7C66' }}>{creditos.recargados}</b> recargados aparte</>}.
          </p>
          {sinCreditos ? (
            <p className="text-[12.5px] mt-3 px-3 py-2 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
              Te quedaste <b>sin créditos</b>. No podrás emitir nuevos certificados hasta recargar. Contacta a Vaxa para comprar más créditos.
            </p>
          ) : pocos ? (
            <p className="text-[12.5px] mt-3 px-3 py-2 rounded-xl" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
              Te quedan pocos créditos (<b>{creditos.disponibles}</b>). Considera recargar con Vaxa para no quedarte sin emitir.
            </p>
          ) : (
            <p className="text-[12.5px] mt-3" style={{ color: '#9CA3AF' }}>
              Cada certificado emitido consume <b>1 crédito</b>. Los créditos no vencen mientras tu mantenimiento esté activo; si eliminas un certificado, el crédito se devuelve.
            </p>
          )}
          </>
          )}
        </div>
      </div>

      {/* ── Aviso de pago / vencimiento ───────────────────────── */}
      {suscripcion && suscripcion.estado_cobranza !== 'vigente' && (
        <div className="rounded-2xl px-4 py-3.5 flex items-start gap-2.5"
          style={{ background: COBRANZA[suscripcion.estado_cobranza].bg, border: `1px solid ${COBRANZA[suscripcion.estado_cobranza].bd}` }}>
          <AlertCircle size={18} style={{ color: COBRANZA[suscripcion.estado_cobranza].fg, marginTop: 1 }} />
          <div className="text-[12.5px]" style={{ color: COBRANZA[suscripcion.estado_cobranza].fg }}>
            {suscripcion.estado_cobranza === 'vencido' ? (
              <>Tu plan <b>venció</b> el {fmtFecha(suscripcion.fecha_fin)}. Realiza el pago para seguir emitiendo sin interrupciones — contacta a Vaxa.</>
            ) : (
              <>Tu plan vence el <b>{fmtFecha(suscripcion.fecha_fin)}</b>. Para renovar sin cortes, paga como máximo el <b>{fmtFecha(suscripcion.fecha_limite_pago)}</b>
              {suscripcion.dias_para_vencer >= 0 && <> (faltan {suscripcion.dias_para_vencer} día{suscripcion.dias_para_vencer === 1 ? '' : 's'})</>}.</>
            )}
          </div>
        </div>
      )}

      {/* ── Recargar créditos (paquetes; la compra la activa Vaxa) — no aplica a planes ilimitados ── */}
      {!ilimitado && (
      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
        <div className="flex items-center gap-2 mb-1">
          <Package size={16} style={{ color: '#0D7C66' }} />
          <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>¿Necesitas más créditos?</p>
        </div>
        <p className="text-[12.5px] mb-4" style={{ color: '#9CA3AF' }}>
          Recarga el paquete de tu plan y escríbenos para activarlo. Se suma a tu saldo, es acumulable y no vence.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PAQUETES_CREDITOS.filter(pq => pq.planSlug === plan.slug).map(pq => {
            const costoCert = pq.precio / pq.creditos;   // costo por certificado del paquete
            return (
              <a
                key={pq.creditos}
                href={`https://wa.me/${VAXA_WA}?text=${encodeURIComponent(`Hola Vaxa 👋, soy de "${empresa}" y quiero recargar el paquete ${pq.nombre} de ${pq.creditos} créditos (${sol(pq.precio)}).`)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl p-4 flex flex-col transition-all hover:-translate-y-0.5"
                style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#B0A898' }}>{pq.nombre}</p>
                <p className="text-[22px] font-bold leading-none tabular-nums mt-1" style={{ color: '#0D0E12' }}>{pq.creditos}</p>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: '#B0A898' }}>créditos</p>
                <p className="text-[14px] font-bold mt-2" style={{ color: '#0D7C66' }}>{sol(pq.precio)}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{sol(costoCert)} por certificado</p>
                <span className="mt-3 inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: '#25D366', color: '#04110C' }}>
                  <MessageCircle size={13} /> Solicitar
                </span>
              </a>
            );
          })}
        </div>

        {/* Compra de créditos individuales (clientes con plan activo que necesitan pocos) */}
        <div className="rounded-xl px-4 py-3 mt-3" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
          <p className="text-[11.5px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Créditos individuales</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]" style={{ color: '#64748B' }}>
            {CREDITOS_INDIVIDUALES.map(t => (
              <span key={t.desde}><b style={{ color: '#0D0E12' }}>{t.desde}–{t.hasta}</b> créditos · {sol(t.precio)} c/u</span>
            ))}
            <span><b style={{ color: '#0D0E12' }}>100 o más</b> · conviene un paquete</span>
          </div>
        </div>

        <p className="text-[11.5px] mt-3" style={{ color: '#9CA3AF' }}>
          1 crédito = 1 certificado. La recarga la activa Vaxa al confirmar el pago (boleta o factura).
        </p>
      </div>
      )}

      {/* ── Historial de movimientos de créditos (filtro + paginación) ── */}
      {!ilimitado && (
      <>
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-3.5" style={{ borderBottom: '1px solid #F0EEE9' }}>
          <div className="flex items-center gap-2">
            <Clock size={15} style={{ color: '#B0A898' }} />
            <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>Movimientos de créditos</p>
          </div>
          <select
            value={movTipo}
            onChange={(e) => { setMovTipo(e.target.value as typeof movTipo); setMovPage(1); }}
            className="text-[12.5px] rounded-lg px-2.5 outline-none"
            style={{ height: 34, minWidth: 180, border: '1px solid #EEECE6', background: '#fff', color: '#374151' }}
          >
            <option value="todos">Todos los tipos</option>
            <option value="recarga">Recargas</option>
            <option value="consumo">Emisiones</option>
            <option value="devolucion">Devoluciones</option>
            <option value="asignacion">Créditos del plan</option>
            <option value="ajuste">Ajustes</option>
          </select>
        </div>
        {movimientos.length === 0 ? (
          <p className="text-[12.5px] text-center py-8" style={{ color: '#9CA3AF' }}>Aún no hay movimientos.</p>
        ) : movsFiltrados.length === 0 ? (
          <p className="text-[12.5px] text-center py-8" style={{ color: '#9CA3AF' }}>No hay movimientos de ese tipo.</p>
        ) : (
          movsPagina.map((m, idx) => {
            const suma = m.cantidad > 0;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between px-5 py-3 gap-3"
                style={{ borderTop: idx === 0 ? undefined : '1px solid #F5F4F0' }}
              >
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold truncate" style={{ color: '#0D0E12' }}>
                    {m.descripcion || MOV_LABEL[m.tipo]}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{fmtFechaHora(m.created_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[14px] font-bold tabular-nums" style={{ color: suma ? '#15803D' : '#B91C1C' }}>
                    {suma ? '+' : ''}{m.cantidad}
                  </p>
                  <p className="text-[10.5px] tabular-nums" style={{ color: '#B0A898' }}>saldo {m.saldo_resultante}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      {movsFiltrados.length > 0 && (
        <Pagination
          page={movPageSafe}
          totalPages={movTotalPages}
          onChange={setMovPage}
          startIndex={movStart}
          endIndex={Math.min(movStart + MOV_POR_PAGINA, movsFiltrados.length)}
          total={movsFiltrados.length}
          itemLabel="movimientos"
        />
      )}
      </>
      )}

      {/* ── Detalle de tu plan (solo el plan contratado, no el catálogo) ── */}
      <div>
        <p className="text-[13px] font-bold mb-3" style={{ color: '#0D0E12' }}>Detalle de tu plan</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl p-4 flex flex-col"
            style={{ background: '#fff', border: '1.5px solid #0D0E12' }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>{plan.nombre}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#B45309' }}>Actual</span>
            </div>
            <p className="text-[20px] font-bold leading-none" style={{ color: '#0D0E12' }}>{sol(plan.precio_mensual)}<span className="text-[12px] font-normal" style={{ color: '#9CA3AF' }}>/mes</span></p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: '#B0A898' }}>Mantenimiento</p>

            {/* Desglose completo: implementación + certificados + usuarios */}
            <div className="rounded-xl px-3 py-2 mt-2 space-y-1" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
              <Linea label="Implementación" valor={plan.setup_inicial > 0 ? sol(plan.setup_inicial) : 'Incluida'} />
              <Linea label="Certificados" valor={plan.creditos_incluidos > 0 ? String(plan.creditos_incluidos) : 'Ilimitados'} />
              <Linea label="Usuarios" valor={plan.usuarios_incluidos > 0 ? String(plan.usuarios_incluidos) : 'Ilimitados'} />
            </div>

            <div className="mt-2 space-y-1">
              {plan.permite_diseno      && <Feat txt="Diseño personalizado" />}
              {plan.permite_subdominio  && <Feat txt="Dominio propio" />}
              {plan.permite_carga_masiva && <Feat txt="Carga masiva por Excel" />}
            </div>
          </div>
        </div>
        <p className="text-[11.5px] mt-3" style={{ color: '#9CA3AF' }}>
          Implementación = pago único · Mantenimiento mensual · Certificados incluidos según el plan.
        </p>
        <p className="text-[12.5px] mt-1.5 flex items-center gap-1.5" style={{ color: '#9CA3AF' }}>
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

/** Fila etiqueta · valor del desglose de precios del plan. */
function Linea({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[12px] min-w-0">
      <span className="whitespace-nowrap" style={{ color: '#64748B' }}>{label}</span>
      <span className="font-semibold tabular-nums text-right truncate" style={{ color: '#0D0E12' }}>{valor}</span>
    </div>
  );
}
