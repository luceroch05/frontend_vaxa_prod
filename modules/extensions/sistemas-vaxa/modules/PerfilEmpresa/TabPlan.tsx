'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Loader2, AlertCircle, CheckCircle, Sparkles, Plus, FileText, X, Package, Clock, Search } from '@/components/ui/icon';
import {
  creditosAdminApi, type EmpresaCreditos, type PlanCatalogo, type EstadoPlanEmpresa, type PagoHist, type MovimientoCredito,
} from '../../shared/api/creditos.admin.api';
import Pager from '../../shared/components/Pager';

interface TabPlanProps {
  empresa: EmpresaCreditos;
  /** Refresca el perfil tras cambiar el plan (para actualizar el header). */
  onChange?: () => void;
}

/** Ciclos de contrato (catálogo fijo: id 1/2/3). */
const CICLOS = [
  { id: 1, label: 'Mensual' },
  { id: 2, label: 'Semestral (paga 5, recibe 6)' },
  { id: 3, label: 'Anual (paga 10, recibe 12)' },
];

const MES = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Paquetes de créditos del Tarifario (precio con descuento). El monto se cobra tal cual.
 *  `planSlug` = a qué plan corresponde; la empresa solo ve el paquete de SU plan. */
const PAQUETES = [
  { nombre: 'Básico',      planSlug: 'basico',      creditos: 100, precio: 270 },
  { nombre: 'Profesional', planSlug: 'profesional', creditos: 300, precio: 750 },
  { nombre: 'Empresarial', planSlug: 'empresarial', creditos: 700, precio: 1500 },
];

/** Etiqueta legible por tipo de movimiento de crédito. */
const MOV_LABEL: Record<MovimientoCredito['tipo'], string> = {
  asignacion: 'Créditos del plan',
  recarga:    'Recarga de créditos',
  consumo:    'Emisión de certificado',
  devolucion: 'Devolución (certificado eliminado)',
  ajuste:     'Ajuste',
};
const fmtFechaHora = (s: string) => new Date(s).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const sol = (n: number) => `S/ ${Number(n ?? 0).toFixed(2)}`;
/** Precio del certificado adicional = proporcional al plan (precio mensual ÷ cupo). */
const adicionalProporcional = (precioMensual: number, cupo: number) =>
  cupo > 0 ? Math.round((precioMensual / cupo) * 100) / 100 : 0;
const fmtFecha = (s: string) => new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

/** Estilo y texto del semáforo de cobranza. */
const COBRANZA = {
  vigente:    { bg: '#ECFDF5', bd: '#A7F3D0', fg: '#047857', label: 'Al día' },
  por_vencer: { bg: '#FFFBEB', bd: '#FDE68A', fg: '#B45309', label: 'Por vencer' },
  vencido:    { bg: '#FEF2F2', bd: '#FECACA', fg: '#B91C1C', label: 'Vencido' },
} as const;

export default function TabPlan({ empresa, onChange }: TabPlanProps) {
  const [estado, setEstado]   = useState<EstadoPlanEmpresa | null>(null);
  const [planes, setPlanes]   = useState<PlanCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [okMsg, setOkMsg]     = useState<string | null>(null);

  const [planId, setPlanId]   = useState<number>(0);
  const [cicloId, setCicloId] = useState<number>(1);
  const [saving, setSaving]   = useState(false);

  // Recarga de créditos: cantidad libre (precio por crédito) o un paquete con descuento.
  const [recarga, setRecarga]       = useState<string>('');
  const [paqueteSel, setPaqueteSel] = useState<number | null>(null);  // índice en PAQUETES (null = cantidad libre)
  const [recargando, setRecargando] = useState(false);

  // Confirmación del pago del ciclo (renueva el vencimiento; NO emite factura).
  const [pagando, setPagando]                 = useState(false);
  const [ventaModal, setVentaModal]           = useState(false);

  // Historial de pagos (con filtro de texto + paginación).
  const [pagos, setPagos] = useState<PagoHist[]>([]);
  const [facturandoId, setFacturandoId] = useState<number | null>(null);
  const [pagoBuscar, setPagoBuscar] = useState('');
  const [pagoPage, setPagoPage] = useState(1);
  const cargarPagos = useCallback(async () => {
    try { setPagos(await creditosAdminApi.listPagos(empresa.id)); } catch { /* noop */ }
  }, [empresa.id]);
  useEffect(() => { cargarPagos(); }, [cargarPagos]);

  // Historial de movimientos de créditos (ledger: asignación / recarga / consumo / devolución).
  const [movs, setMovs] = useState<MovimientoCredito[]>([]);
  const [movTipo, setMovTipo] = useState<'todos' | MovimientoCredito['tipo']>('todos');
  const [movPage, setMovPage] = useState(1);
  const cargarMovs = useCallback(async () => {
    try { setMovs(await creditosAdminApi.movimientos(empresa.id)); } catch { /* noop */ }
  }, [empresa.id]);
  useEffect(() => { cargarMovs(); }, [cargarMovs]);

  const POR_PAGINA = 8;
  // Pagos filtrados por texto (concepto, detalle facturado o número de comprobante).
  const pagosFiltrados = pagos.filter((p) => {
    const q = pagoBuscar.trim().toLowerCase();
    if (!q) return true;
    return [p.concepto, p.detalle, p.cpe_numero, p.estado].some((v) => (v ?? '').toLowerCase().includes(q));
  });
  const pagoPages = Math.max(1, Math.ceil(pagosFiltrados.length / POR_PAGINA));
  const pagoPageSafe = Math.min(pagoPage, pagoPages);
  const pagosPagina = pagosFiltrados.slice((pagoPageSafe - 1) * POR_PAGINA, pagoPageSafe * POR_PAGINA);

  // Movimientos filtrados por tipo.
  const movsFiltrados = movs.filter((m) => movTipo === 'todos' || m.tipo === movTipo);
  const movPages = Math.max(1, Math.ceil(movsFiltrados.length / POR_PAGINA));
  const movPageSafe = Math.min(movPage, movPages);
  const movsPagina = movsFiltrados.slice((movPageSafe - 1) * POR_PAGINA, movPageSafe * POR_PAGINA);

  // Emite la factura electrónica de un pago (plan o certificados adicionales).
  const facturarPago = async (pagoId: number) => {
    if (facturandoId) return;
    setFacturandoId(pagoId); setError(null); setOkMsg(null);
    try {
      const r = await creditosAdminApi.facturarPago(pagoId);
      await cargarPagos();
      const ok = r.estado === 'ACEPTADO' || r.estado === 'OBSERVADO';
      if (ok) { setOkMsg(`Factura ${r.numero} emitida · ${r.estado_nombre}`); setTimeout(() => setOkMsg(null), 4000); }
      else setError(`${r.numero}: ${r.sunat_resp_desc ?? r.estado_nombre}`);
    } catch (e) { setError((e as Error).message); }
    finally { setFacturandoId(null); }
  };

  const cargar = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [est, cat] = await Promise.all([
        creditosAdminApi.getPlanEmpresa(empresa.id),
        creditosAdminApi.listPlanes(),
      ]);
      setEstado(est);
      setPlanes(cat);
      setPlanId(est.plan?.id ?? cat[0]?.id ?? 0);
      // Inicializa el ciclo al de la suscripción vigente (para detectar cambios reales).
      setCicloId(CICLOS.find((c) => c.label === est.suscripcion?.ciclo)?.id ?? 1);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [empresa.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const asignar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!planId) return;
    setSaving(true); setError(null); setOkMsg(null);
    try {
      const est = await creditosAdminApi.asignarPlan(empresa.id, planId, cicloId);
      setEstado(est);
      setOkMsg('Plan actualizado correctamente');
      onChange?.();
      setTimeout(() => setOkMsg(null), 2500);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  // Precio por crédito suelto escalonado (tarifario oficial 2026, incluye IGV):
  //   1–49 → S/3.00 · 50 o más → S/2.85. A partir de 100 conviene un paquete.
  const precioCreditoSuelto = (cant: number) => (cant >= 50 ? 2.85 : 3.00);
  // Validación: solo enteros positivos.
  const cantidadRecarga = Math.floor(Number(recarga));
  const recargaValida = Number.isFinite(cantidadRecarga) && cantidadRecarga > 0 && String(recarga).trim() !== '';
  const precioUnit = precioCreditoSuelto(recargaValida ? cantidadRecarga : 1);

  // Paquete elegido (si hay) y monto/cantidad/validez efectivos de la recarga.
  const paquete = paqueteSel != null ? PAQUETES[paqueteSel] : null;
  const recargaCantidad = paquete ? paquete.creditos : cantidadRecarga;
  const recargaMonto = paquete ? paquete.precio : (recargaValida ? precioUnit * cantidadRecarga : 0);
  // A partir de 100 créditos sueltos conviene un paquete (más barato por unidad).
  const sugerirPaquete = !paquete && recargaValida && cantidadRecarga >= 100;
  const puedeRecargar = paquete != null || recargaValida;

  /** Recarga núcleo: `monto` opcional = precio de paquete (con descuento); si no, precio por crédito suelto. */
  const doRecargar = async (cantidad: number, monto?: number) => {
    if (recargando) return;
    setRecargando(true); setError(null); setOkMsg(null);
    try {
      const r = await creditosAdminApi.recargarCupo(empresa.id, cantidad, monto);
      await cargar();
      await cargarPagos();
      await cargarMovs();
      setRecarga('');
      setPaqueteSel(null);
      setOkMsg(`Se agregaron ${r.agregados} créditos al saldo (valor ref. ${sol(r.monto)}). El cobro se registra aparte en "Nueva venta".`);
      onChange?.();
      setTimeout(() => setOkMsg(null), 3500);
    } catch (e) { setError((e as Error).message); }
    finally { setRecargando(false); }
  };

  const recargar = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!puedeRecargar) return;
    doRecargar(recargaCantidad, paquete ? paquete.precio : undefined);
  };

  const marcarPagado = async () => {
    if (pagando) return;
    setPagando(true); setError(null); setOkMsg(null);
    try {
      // SOLO renueva el mes. NO registra pago (el único que registra pagos es
      // "Nueva venta") ni emite factura.
      const est = await creditosAdminApi.marcarPagado(empresa.id, {
        emitir_comprobante: false,
        registrar_pago: false,
      });
      setEstado(est);
      await cargarPagos();
      setOkMsg(`Mantenimiento renovado hasta ${est.suscripcion ? fmtFecha(est.suscripcion.fecha_fin) : '—'}`);
      onChange?.();
      setTimeout(() => setOkMsg(null), 3500);
    } catch (e) { setError((e as Error).message); }
    finally { setPagando(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-12" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const c = estado?.consumo;
  const cr = estado?.creditos;
  const planSel = planes.find(p => p.id === planId);
  // Ciclo vigente (id) según la suscripción actual, para el dirty-check del botón.
  const cicloVigenteId = CICLOS.find((x) => x.label === estado?.suscripcion?.ciclo)?.id ?? 1;
  // Hay cambios si cambió el plan o el ciclo respecto a lo vigente.
  const planCambiado = planId !== (estado?.plan?.id ?? 0) || cicloId !== cicloVigenteId;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      {okMsg && (
        <div className="p-3 rounded-xl flex items-center gap-2 text-sm" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
          <CheckCircle className="w-4 h-4" /> {okMsg}
        </div>
      )}

      {/* ── Acción principal: registrar una venta ───────────── */}
      {estado?.plan && (
        <div className="rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap"
          style={{ background: 'linear-gradient(135deg, #0D0E12, #2A2D35)' }}>
          <div className="text-white">
            <p className="text-[13.5px] font-bold">Registrar una venta</p>
            <p className="text-[11.5px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Mantenimiento + créditos + implementación, con descuento → emite la <b>factura</b>. La renovación del mes se hace aparte al confirmar el pago.
            </p>
          </div>
          <button type="button" onClick={() => setVentaModal(true)} className="sv-btn px-5 text-white flex-shrink-0"
            style={{ background: '#059669' }}>
            <Plus className="w-4 h-4" /> Nueva venta
          </button>
        </div>
      )}

      {/* ── Plan vigente + consumo del mes ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Plan vigente */}
        <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 8px 24px rgba(5,150,105,0.25)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <CreditCard className="w-3.5 h-3.5" /> Plan actual
            </div>
            {estado?.suscripcion && (
              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: COBRANZA[estado.suscripcion.estado_cobranza].bg, color: COBRANZA[estado.suscripcion.estado_cobranza].fg }}>
                {COBRANZA[estado.suscripcion.estado_cobranza].label}
              </span>
            )}
          </div>
          <p className="text-[26px] font-bold leading-tight">{estado?.plan?.nombre ?? 'Sin plan'}</p>
          {estado?.suscripcion && (
            <p className="text-[12px] mt-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {estado.suscripcion.ciclo} · vence {fmtFecha(estado.suscripcion.fecha_fin)}
            </p>
          )}
        </div>

        {/* Créditos disponibles */}
        {cr?.ilimitado ? (
          <div className="rounded-2xl p-5" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
              Créditos disponibles
            </p>
            <p className="text-[32px] font-bold leading-none" style={{ color: '#047857' }}>∞</p>
            <p className="text-[12px] mt-2" style={{ color: '#047857' }}>
              Plan ilimitado · emite sin tope
            </p>
          </div>
        ) : (
        <div className="rounded-2xl p-5" style={{ background: (cr?.disponibles ?? 0) > 0 ? '#FAFAF8' : '#FFFBEB', border: `1px solid ${(cr?.disponibles ?? 0) > 0 ? '#EEECE6' : '#FDE68A'}` }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
            Créditos disponibles
          </p>
          <p className="text-[32px] font-bold leading-none tabular-nums" style={{ color: (cr?.disponibles ?? 0) > 0 ? '#0D0E12' : '#B45309' }}>
            {cr?.disponibles ?? 0}
          </p>
          {/* Conteo aparte: cuántos de los asignados son recarga extra (no del plan). */}
          {(cr?.recargados ?? 0) > 0 ? (
            <p className="text-[12px] mt-2" style={{ color: '#0D7C66' }}>
              Incluye <b>{cr?.recargados}</b> crédito{(cr?.recargados ?? 0) === 1 ? '' : 's'} recargado{(cr?.recargados ?? 0) === 1 ? '' : 's'} aparte
            </p>
          ) : (
            <p className="text-[12px] mt-2" style={{ color: '#64748B' }}>
              {(cr?.disponibles ?? 0) > 0 ? '1 crédito = 1 certificado' : 'Sin saldo · no puede emitir'}
            </p>
          )}
        </div>
        )}

        {/* Consumo (en planes ilimitados no descuenta saldo pero SÍ se cuenta lo emitido) */}
        <div className="rounded-2xl p-5" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
            {cr?.ilimitado ? 'Certificados emitidos' : 'Créditos consumidos'}
          </p>
          {cr?.ilimitado ? (
            <>
              <p className="text-[32px] font-bold leading-none tabular-nums" style={{ color: '#0D0E12' }}>{cr?.consumidos ?? 0}</p>
              <p className="text-[12px] mt-2" style={{ color: '#64748B' }}>emitidos en total · sin tope</p>
            </>
          ) : (
            <>
              <p className="text-[32px] font-bold leading-none tabular-nums" style={{ color: '#0D0E12' }}>
                {cr?.consumidos ?? 0}<span className="text-[18px]" style={{ color: '#9CA3AF' }}> / {cr?.asignados ?? 0}</span>
              </p>
              <p className="text-[12px] mt-2" style={{ color: '#64748B' }}>certificados emitidos en total</p>
            </>
          )}
        </div>
      </div>

      {/* ── Cobranza / Renovación del ciclo ─────────────────── */}
      {estado?.suscripcion && (
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>Cobranza del ciclo</h3>
              <p className="text-[12px] mt-0.5" style={{ color: '#9CA3AF' }}>
                Vence {fmtFecha(estado.suscripcion.fecha_fin)} · pago máximo {fmtFecha(estado.suscripcion.fecha_limite_pago)}
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: COBRANZA[estado.suscripcion.estado_cobranza].bg, color: COBRANZA[estado.suscripcion.estado_cobranza].fg, border: `1px solid ${COBRANZA[estado.suscripcion.estado_cobranza].bd}` }}>
              {estado.suscripcion.estado_cobranza === 'vencido'
                ? `Venció hace ${Math.abs(estado.suscripcion.dias_para_vencer)} día${Math.abs(estado.suscripcion.dias_para_vencer) === 1 ? '' : 's'}`
                : `Faltan ${estado.suscripcion.dias_para_vencer} día${estado.suscripcion.dias_para_vencer === 1 ? '' : 's'}`}
            </span>
          </div>

          {/* La factura NO se emite aquí (controlado): se hace con "Nueva venta". */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl mb-3"
            style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
            <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#9CA3AF', marginTop: 1 }} />
            <span className="text-[12.5px]" style={{ color: '#374151' }}>
              ¿Aún no facturaste este mantenimiento? Emite la <b>factura</b> con <b>“Nueva venta”</b> (arriba).
              <span className="block text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
                Aquí solo confirmas el pago una vez que el cliente te pagó.
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[11.5px]" style={{ color: '#9CA3AF' }}>
              Solo renueva el vencimiento un ciclo ({estado.suscripcion.ciclo.toLowerCase()}). No registra un pago: ese se registra con “Nueva venta”.
            </p>
            <button type="button" onClick={marcarPagado} disabled={pagando} className="sv-btn sv-btn-primary px-5">
              {pagando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Confirmar pago del mantenimiento
            </button>
          </div>
        </div>
      )}

      {/* ── Recargar créditos (suma al saldo) — no aplica a planes ilimitados ── */}
      {estado?.plan && !cr?.ilimitado && (
        <form onSubmit={recargar} className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
          <div className="flex items-center gap-2 mb-1">
            <Plus className="w-4 h-4" style={{ color: '#059669' }} />
            <h3 className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>Recargar créditos</h3>
          </div>
          <p className="text-[12.5px] mb-4" style={{ color: '#9CA3AF' }}>
            Suma créditos al saldo de la empresa (acumulables, no vencen).
            Crédito suelto: <b style={{ color: '#64748B' }}>{sol(3.00)}</b> (1–49) ·
            <b style={{ color: '#64748B' }}> {sol(2.85)}</b> (50+), o un paquete con descuento.
          </p>

          {/* Paquetes con descuento: seleccionar marca el paquete (recién se aplica con "Recargar") */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#374151' }}>Paquetes (precio con descuento)</p>
            <div className="grid grid-cols-3 gap-2">
              {PAQUETES.map((pq, i) => ({ pq, i }))
                .filter(({ pq }) => pq.planSlug === estado?.plan?.slug)
                .map(({ pq, i }) => {
                const sel = paqueteSel === i;
                return (
                  <button
                    key={pq.creditos}
                    type="button"
                    disabled={recargando}
                    onClick={() => { setPaqueteSel(sel ? null : i); setRecarga(''); }}
                    className="rounded-xl p-3 text-left transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    style={{ background: sel ? '#ECFDF5' : '#FAFAF8', border: `1.5px solid ${sel ? '#059669' : '#EEECE6'}` }}
                    title={`Paquete ${pq.nombre}: ${pq.creditos} créditos por ${sol(pq.precio)} (${sol(pq.precio / pq.creditos)} c/u)`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#B0A898' }}>{pq.nombre}</p>
                    <p className="text-[16px] font-bold leading-none tabular-nums mt-0.5" style={{ color: '#0D0E12' }}>{pq.creditos}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: '#B0A898' }}>créditos</p>
                    <p className="text-[12.5px] font-bold mt-1.5" style={{ color: '#059669' }}>{sol(pq.precio)}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>{sol(pq.precio / pq.creditos)} c/u</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Cantidad libre</label>
              <input
                type="number" min={1} step={1} value={recarga}
                onChange={(e) => { setRecarga(e.target.value); setPaqueteSel(null); }}
                placeholder="Ej. 50" className="sv-input w-full"
                disabled={paquete != null}
              />
            </div>
            <div className="rounded-xl px-4 py-2.5" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>Valor referencial</p>
              <p className="text-[18px] font-bold tabular-nums" style={{ color: puedeRecargar ? '#059669' : '#9CA3AF' }}>
                {sol(recargaMonto)}
              </p>
            </div>
            <button type="submit" disabled={!puedeRecargar || recargando} className="sv-btn sv-btn-primary px-5">
              {recargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Recargar
              {paquete ? ` ${paquete.creditos}` : recargaValida ? ` ${cantidadRecarga}` : ''}
            </button>
          </div>

          {sugerirPaquete && (
            <p className="text-[12px] mt-3" style={{ color: '#B45309' }}>
              Para 100 créditos o más conviene adquirir un <b>paquete</b>: sale más barato por crédito.
            </p>
          )}
        </form>
      )}

      {/* ── Cambiar plan ────────────────────────────────────── */}
      <form onSubmit={asignar} className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
        <h3 className="text-[14px] font-bold mb-4" style={{ color: '#0D0E12' }}>Asignar / cambiar plan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Plan</label>
            <select value={planId} onChange={(e) => setPlanId(Number(e.target.value))} className="sv-input w-full">
              {planes.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {sol(p.precio_mensual)}/mes
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Ciclo</label>
            <select value={cicloId} onChange={(e) => setCicloId(Number(e.target.value))} className="sv-input w-full">
              {CICLOS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {planSel && (
          <div className="mt-3 text-[12.5px] rounded-xl px-3.5 py-2.5" style={{ background: '#FAFAF8', border: '1px solid #EEECE6', color: '#475569' }}>
            <b>{planSel.nombre}</b>: mantenimiento <b>{sol(planSel.mantenimiento_mensual)}</b>/mes ·
            implementación <b>{sol(planSel.implementacion)}</b> ·
            <b> {planSel.creditos_incluidos}</b> créditos incluidos ·
            <b> {planSel.usuarios_incluidos === 0 ? '∞' : planSel.usuarios_incluidos}</b> usuario{planSel.usuarios_incluidos === 1 ? '' : 's'}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button type="submit" disabled={saving || !planId || !planCambiado} className="sv-btn sv-btn-primary px-5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Asignar plan
          </button>
        </div>
        <p className="text-[11.5px] mt-2" style={{ color: '#9CA3AF' }}>
          Al cambiar el plan se cierra la suscripción anterior y se crea una nueva vigente desde hoy (queda en el historial).
        </p>
      </form>

      {/* ── Historial de pagos ──────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h3 className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>Historial de pagos</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px]" style={{ color: '#B0A898' }} />
            <input
              type="text" placeholder="Buscar concepto, detalle, N°…"
              value={pagoBuscar} onChange={(e) => { setPagoBuscar(e.target.value); setPagoPage(1); }}
              className="sv-input text-[12.5px]" style={{ paddingLeft: '2rem', height: 34, minWidth: 220 }}
            />
          </div>
        </div>
        {pagos.length === 0 ? (
          <p className="text-[12.5px] py-6 text-center" style={{ color: '#B0A898' }}>Aún no hay pagos registrados.</p>
        ) : pagosFiltrados.length === 0 ? (
          <p className="text-[12.5px] py-6 text-center" style={{ color: '#B0A898' }}>Ningún pago coincide con “{pagoBuscar}”.</p>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>
                  <th className="text-left pb-2 pr-3">Fecha</th>
                  <th className="text-left pb-2 pr-3">Concepto / Detalle</th>
                  <th className="text-right pb-2 pr-3">Monto</th>
                  <th className="text-left pb-2 pr-3">Comprobante</th>
                  <th className="text-left pb-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagosPagina.map((p) => {
                  const pag = p.estado.toLowerCase() === 'pagado';
                  return (
                    <tr key={p.id} style={{ borderTop: '1px solid #F2F0EA' }}>
                      <td className="py-2.5 pr-3 tabular-nums align-top" style={{ color: '#374151' }}>{p.fecha ? fmtFecha(p.fecha) : '—'}</td>
                      <td className="py-2.5 pr-3 align-top" style={{ color: '#374151' }}>
                        <span className="font-semibold" style={{ color: '#0D0E12' }}>{p.concepto}</span>
                        {p.detalle && (
                          <span className="block text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{p.detalle}</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums font-semibold align-top" style={{ color: '#0D0E12' }}>{sol(p.monto)}</td>
                      <td className="py-2.5 pr-3 align-top">
                        {p.cpe_numero ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="font-semibold tabular-nums" style={{ color: '#0D0E12' }}>{p.cpe_numero}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={p.cpe_estado === 'ACEPTADO'
                                ? { background: '#ECFDF5', color: '#047857' }
                                : { background: '#FEF2F2', color: '#B91C1C' }}>
                              {p.cpe_estado}
                            </span>
                          </span>
                        ) : (
                          <button onClick={() => facturarPago(p.id)} disabled={facturandoId === p.id}
                            className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70" style={{ color: '#059669' }}>
                            {facturandoId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                            {facturandoId === p.id ? 'Emitiendo...' : 'Emitir factura'}
                          </button>
                        )}
                      </td>
                      <td className="py-2.5 align-top">
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                          style={pag
                            ? { background: '#ECFDF5', color: '#047857' }
                            : { background: '#FFFBEB', color: '#B45309' }}>
                          {p.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pager page={pagoPageSafe} pages={pagoPages} total={pagosFiltrados.length} onPage={setPagoPage} />
          </>
        )}
      </div>

      {/* ── Movimientos de créditos (ledger por empresa) ────── */}
      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: '#B0A898' }} />
            <h3 className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>Movimientos de créditos</h3>
          </div>
          <select
            value={movTipo}
            onChange={(e) => { setMovTipo(e.target.value as typeof movTipo); setMovPage(1); }}
            className="sv-input text-[12.5px]" style={{ height: 34, minWidth: 160 }}
          >
            <option value="todos">Todos los tipos</option>
            <option value="recarga">Recargas</option>
            <option value="consumo">Consumos (emisión)</option>
            <option value="devolucion">Devoluciones</option>
            <option value="asignacion">Asignaciones del plan</option>
            <option value="ajuste">Ajustes</option>
          </select>
        </div>
        {movs.length === 0 ? (
          <p className="text-[12.5px] py-6 text-center" style={{ color: '#B0A898' }}>Aún no hay movimientos.</p>
        ) : movsFiltrados.length === 0 ? (
          <p className="text-[12.5px] py-6 text-center" style={{ color: '#B0A898' }}>No hay movimientos de ese tipo.</p>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>
                  <th className="text-left pb-2 pr-3">Fecha</th>
                  <th className="text-left pb-2 pr-3">Detalle</th>
                  <th className="text-right pb-2 pr-3">Créditos</th>
                  <th className="text-right pb-2">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {movsPagina.map((m) => {
                  const suma = m.cantidad > 0;
                  return (
                    <tr key={m.id} style={{ borderTop: '1px solid #F2F0EA' }}>
                      <td className="py-2.5 pr-3 tabular-nums" style={{ color: '#374151' }}>{fmtFechaHora(m.created_at)}</td>
                      <td className="py-2.5 pr-3" style={{ color: '#374151' }}>{m.descripcion || MOV_LABEL[m.tipo]}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums font-bold" style={{ color: suma ? '#15803D' : '#B91C1C' }}>{suma ? '+' : ''}{m.cantidad}</td>
                      <td className="py-2.5 text-right tabular-nums" style={{ color: '#64748B' }}>{m.saldo_resultante}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pager page={movPageSafe} pages={movPages} total={movsFiltrados.length} onPage={setMovPage} />
          </>
        )}
      </div>

      {ventaModal && estado?.plan && (
        <NuevaVentaModal
          empresa={empresa}
          plan={estado.plan}
          ciclo={estado.suscripcion?.ciclo ?? 'Mensual'}
          onClose={() => setVentaModal(false)}
          onDone={() => { setVentaModal(false); cargar(); cargarPagos(); cargarMovs(); onChange?.(); }}
        />
      )}
    </div>
  );
}

/** Una línea agregada a la venta. */
interface LineaVenta { descripcion: string; cantidad: number; precioUnitario: number; creditos?: number; renueva?: boolean; }

/** Modal "Nueva venta": constructor de comprobante (agregas líneas como una boleta). */
function NuevaVentaModal({ empresa, plan, ciclo, onClose, onDone }: {
  empresa: EmpresaCreditos;
  plan: PlanCatalogo;
  ciclo: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const meses = /semestral/i.test(ciclo) ? 5 : /anual/i.test(ciclo) ? 10 : 1;
  const mantTotal = Math.round(plan.mantenimiento_mensual * meses * 100) / 100;

  // Catálogo de productos sugeridos (rellenan la fila de agregar al elegirlos).
  const CATALOGO: Array<{ id: string; label: string; precio: number; creditos?: number; renueva?: boolean }> = [
    // Mantenimiento: SOLO factura. NO renueva el mes — la renovación se hace al
    // "Confirmar pago del mantenimiento" (decisión del usuario: factura primero, pago después).
    { id: 'mant', label: `Mantenimiento ${plan.nombre} (${ciclo})`, precio: mantTotal },
    { id: 'impl', label: `Implementación ${plan.nombre}`, precio: plan.implementacion },
    { id: 'p100', label: 'Paquete 100 créditos', precio: 270, creditos: 100 },
    { id: 'p300', label: 'Paquete 300 créditos', precio: 750, creditos: 300 },
    { id: 'p700', label: 'Paquete 700 créditos', precio: 1500, creditos: 700 },
    // Usuarios adicionales (Tarifario 2026): S/50 activación única + S/5/mes.
    { id: 'usr-act', label: 'Activación usuario adicional', precio: 50 },
    { id: 'usr-mant', label: `Mantenimiento usuario adicional (${ciclo})`, precio: Math.round(5 * meses * 100) / 100 },
  ];

  const [lineas, setLineas] = useState<LineaVenta[]>([]);
  // Fila de "agregar producto".
  const [sel, setSel]       = useState('');       // id del catálogo o '' (personalizado)
  const [desc, setDesc]     = useState('');
  const [cant, setCant]     = useState('1');
  const [precio, setPrecio] = useState('');
  const [meta, setMeta]     = useState<{ creditos?: number; renueva?: boolean }>({});

  // Por defecto Nota de venta (NV), NO factura — pedido del usuario.
  const [tipoComp, setTipoComp] = useState<'01' | '03' | 'NV'>('NV');
  const [descTipo, setDescTipo] = useState<'monto' | 'pct'>('pct');
  const [descVal, setDescVal]   = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);

  const elegirCatalogo = (id: string) => {
    setSel(id);
    const item = CATALOGO.find(x => x.id === id);
    if (item) { setDesc(item.label); setPrecio(String(item.precio)); setMeta({ creditos: item.creditos, renueva: item.renueva }); }
    else { setMeta({}); }
  };

  const agregar = () => {
    const p = Number(precio); const q = Math.max(1, Math.floor(Number(cant) || 1));
    if (!desc.trim() || !Number.isFinite(p) || p <= 0) return;
    setLineas(ls => [...ls, { descripcion: desc.trim(), cantidad: q, precioUnitario: Math.round(p * 100) / 100, creditos: meta.creditos ? meta.creditos * q : undefined, renueva: meta.renueva }]);
    setSel(''); setDesc(''); setCant('1'); setPrecio(''); setMeta({});
  };

  const quitar = (i: number) => setLineas(ls => ls.filter((_, idx) => idx !== i));

  const subtotal = Math.round(lineas.reduce((a, l) => a + l.cantidad * l.precioUnitario, 0) * 100) / 100;
  const descValor = Number(descVal) || 0;
  const descuento = descValor > 0
    ? (descTipo === 'pct' ? Math.round(subtotal * Math.min(descValor, 100) / 100 * 100) / 100 : Math.min(descValor, subtotal))
    : 0;
  const total = Math.round((subtotal - descuento) * 100) / 100;
  const esNotaVenta = tipoComp === 'NV';
  // Nota de venta = monto simple (sin IGV); factura/boleta = con IGV.
  const base = esNotaVenta ? total : Math.round((total / 1.18) * 100) / 100;
  const igv = esNotaVenta ? 0 : Math.round((total - base) * 100) / 100;
  const sinRuc = !empresa.ruc;

  const registrar = async () => {
    if (lineas.length === 0 || enviando) return;
    setEnviando(true); setResultado(null);
    try {
      const r = await creditosAdminApi.registrarVenta(empresa.id, {
        items: lineas.map(l => ({ descripcion: l.descripcion, cantidad: l.cantidad, precioUnitario: l.precioUnitario, creditos: l.creditos, renueva: l.renueva })),
        descuento: descuento > 0 ? { tipo: descTipo, valor: descValor } : undefined,
        tipo_comprobante: tipoComp,
      });
      const c = r.comprobante;
      const ok = c.estado === 'ACEPTADO' || c.estado === 'OBSERVADO' || c.estado === 'EMITIDA';
      setResultado({ ok, msg: ok ? `Venta registrada · ${c.numero} ${c.estado_nombre}${r.creditosAgregados ? ` · +${r.creditosAgregados} créditos` : ''}` : `${c.numero}: ${c.sunat_resp_desc ?? c.estado_nombre}` });
      if (ok) setTimeout(onDone, 1800);
    } catch (e) {
      setResultado({ ok: false, msg: (e as Error).message });
    } finally { setEnviando(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)', backdropFilter: 'blur(4px)' }} onMouseDown={onClose}>
      <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[94vh] overflow-y-auto" style={{ background: '#fff', boxShadow: '0 24px 70px -12px rgba(13,14,18,0.4)' }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>Nueva venta</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#9CA3AF' }} /></button>
        </div>
        <p className="text-[12px] mb-3" style={{ color: '#9CA3AF' }}>{empresa.razon_social}{empresa.ruc ? ` · RUC ${empresa.ruc}` : ''}</p>

        {/* Tipo de comprobante */}
        <div className="flex rounded-xl overflow-hidden mb-3" style={{ border: '1px solid #EEECE6' }}>
          {([['01', 'Factura'], ['03', 'Boleta'], ['NV', 'Nota de venta']] as const).map(([v, label]) => (
            <button key={v} type="button" onClick={() => setTipoComp(v)} className="flex-1 py-2 text-[13px] font-semibold transition-colors"
              style={tipoComp === v ? { background: '#059669', color: '#fff' } : { background: '#fff', color: '#64748B' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Fila de agregar producto */}
        <div className="rounded-xl p-3 mb-3" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
          <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 70px 110px 40px' }}>
            <div>
              <select value={sel} onChange={e => elegirCatalogo(e.target.value)} className="sv-input w-full mb-1 text-[12px]">
                <option value="">+ Agregar producto…</option>
                {CATALOGO.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción"
                className="sv-input w-full text-[13px]" />
            </div>
            <input type="number" min={1} value={cant} onChange={e => setCant(e.target.value)} placeholder="Cant."
              className="sv-input text-right self-end text-[13px]" title="Cantidad" />
            <input type="number" min={0} step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Precio"
              className="sv-input text-right self-end text-[13px]" title="Precio unitario (con IGV)" />
            <button type="button" onClick={agregar} title="Agregar"
              className="self-end flex items-center justify-center rounded-lg text-white" style={{ background: '#059669', height: 38 }}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10.5px] mt-1.5" style={{ color: '#9CA3AF' }}>Elige un producto sugerido o escribe uno libre. {esNotaVenta ? 'Precio sin IGV (monto simple).' : 'El precio incluye IGV.'}</p>
        </div>

        {/* Tabla de líneas */}
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid #EEECE6' }}>
          <div className="grid px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: '1fr 50px 90px 90px 28px', background: '#0D0E12', color: '#fff' }}>
            <span>Producto</span><span className="text-right">Cant.</span><span className="text-right">P. Unit.</span><span className="text-right">Total</span><span />
          </div>
          {lineas.length === 0 ? (
            <p className="text-[12.5px] py-6 text-center" style={{ color: '#B0A898' }}>Agrega productos a la venta ↑</p>
          ) : lineas.map((l, i) => (
            <div key={i} className="grid items-center px-3 py-2.5 text-[12.5px]" style={{ gridTemplateColumns: '1fr 50px 90px 90px 28px', borderTop: '1px solid #F2F0EA' }}>
              <div>
                <p style={{ color: '#0D0E12' }}>{l.descripcion}</p>
                {(l.creditos || l.renueva) && <p className="text-[10px]" style={{ color: '#059669' }}>{l.creditos ? `+${l.creditos} créditos` : 'renueva suscripción'}</p>}
              </div>
              <span className="text-right tabular-nums" style={{ color: '#64748B' }}>{l.cantidad}</span>
              <span className="text-right tabular-nums" style={{ color: '#64748B' }}>{sol(l.precioUnitario)}</span>
              <span className="text-right tabular-nums font-semibold" style={{ color: '#0D0E12' }}>{sol(l.cantidad * l.precioUnitario)}</span>
              <button onClick={() => quitar(i)} className="justify-self-end"><X className="w-3.5 h-3.5" style={{ color: '#C8C3BB' }} /></button>
            </div>
          ))}
        </div>

        {/* Descuento + Totales */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center justify-between w-full max-w-[280px] text-[12.5px]" style={{ color: '#64748B' }}>
            <span>Subtotal</span><span className="tabular-nums">{sol(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between w-full max-w-[280px] gap-2 text-[12.5px]" style={{ color: '#64748B' }}>
            <span className="flex items-center gap-1.5">
              Descuento
              <span className="flex rounded-md overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
                <button type="button" onClick={() => setDescTipo('monto')} className="px-1.5 text-[11px] font-semibold" style={descTipo === 'monto' ? { background: '#059669', color: '#fff' } : { color: '#9CA3AF' }}>S/</button>
                <button type="button" onClick={() => setDescTipo('pct')} className="px-1.5 text-[11px] font-semibold" style={descTipo === 'pct' ? { background: '#059669', color: '#fff' } : { color: '#9CA3AF' }}>%</button>
              </span>
            </span>
            <input type="number" min={0} value={descVal} onChange={e => setDescVal(e.target.value)} placeholder="0" className="sv-input w-24 text-right text-[12px]" />
          </div>
          {!esNotaVenta && (
            <>
              <div className="flex items-center justify-between w-full max-w-[280px] text-[11.5px]" style={{ color: '#9CA3AF' }}>
                <span>Op. gravada</span><span className="tabular-nums">{sol(base)}</span>
              </div>
              <div className="flex items-center justify-between w-full max-w-[280px] text-[11.5px]" style={{ color: '#9CA3AF' }}>
                <span>IGV (18%)</span><span className="tabular-nums">{sol(igv)}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between w-full max-w-[280px] text-[16px] font-bold pt-1.5 mt-1" style={{ color: '#0D0E12', borderTop: '1px solid #EEECE6' }}>
            <span>Total</span><span className="tabular-nums">{sol(total)}</span>
          </div>
        </div>

        {sinRuc && tipoComp === '01' && <p className="text-[11.5px] mt-3" style={{ color: '#B45309' }}>⚠️ La empresa no tiene RUC; la factura será rechazada. Agrégalo en Información.</p>}
        {resultado && (
          <div className="mt-3 p-3 rounded-xl flex items-center gap-2 text-[12.5px]"
            style={resultado.ok ? { background: '#ECFDF5', color: '#047857' } : { background: '#FEF2F2', color: '#B91C1C' }}>
            {resultado.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {resultado.msg}
          </div>
        )}

        <button onClick={registrar} disabled={lineas.length === 0 || enviando} className="sv-btn sv-btn-primary w-full py-2.5 mt-4">
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {enviando ? (esNotaVenta ? 'Registrando...' : 'Registrando y enviando a SUNAT...') : `Registrar venta · ${sol(total)}`}
        </button>
        <p className="text-[11px] text-center mt-2" style={{ color: '#9CA3AF' }}>
          {esNotaVenta
            ? 'Nota de venta interna (NO se declara a SUNAT). Registra el pago y suma créditos. La renovación del mes se confirma aparte.'
            : 'Emite el comprobante a SUNAT, registra el pago y suma créditos. La renovación del mes se confirma aparte.'}
        </p>
      </div>
    </div>,
    document.body,
  );
}
