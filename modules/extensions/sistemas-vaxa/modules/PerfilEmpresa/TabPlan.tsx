'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Loader2, AlertCircle, CheckCircle, Sparkles } from '@/components/ui/icon';
import {
  creditosAdminApi, type EmpresaCreditos, type PlanCatalogo, type EstadoPlanEmpresa,
} from '../../shared/api/creditos.admin.api';

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
const sol = (n: number) => `S/ ${n.toFixed(2)}`;
/** Precio del certificado adicional = proporcional al plan (precio mensual ÷ cupo). */
const adicionalProporcional = (precioMensual: number, cupo: number) =>
  cupo > 0 ? Math.round((precioMensual / cupo) * 100) / 100 : 0;

export default function TabPlan({ empresa, onChange }: TabPlanProps) {
  const [estado, setEstado]   = useState<EstadoPlanEmpresa | null>(null);
  const [planes, setPlanes]   = useState<PlanCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [okMsg, setOkMsg]     = useState<string | null>(null);

  const [planId, setPlanId]   = useState<number>(0);
  const [cicloId, setCicloId] = useState<number>(1);
  const [saving, setSaving]   = useState(false);

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

  if (loading) {
    return <div className="flex justify-center py-12" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const c = estado?.consumo;
  const planSel = planes.find(p => p.id === planId);

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

      {/* ── Plan vigente + consumo del mes ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Plan vigente */}
        <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 8px 24px rgba(5,150,105,0.25)' }}>
          <div className="flex items-center gap-1.5 text-[12px] mb-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <CreditCard className="w-3.5 h-3.5" /> Plan actual
          </div>
          <p className="text-[26px] font-bold leading-tight">{estado?.plan?.nombre ?? 'Sin plan'}</p>
          {estado?.suscripcion && (
            <p className="text-[12px] mt-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {estado.suscripcion.ciclo} · vence {new Date(estado.suscripcion.fecha_fin).toLocaleDateString('es-PE')}
            </p>
          )}
        </div>

        {/* Cupo del mes */}
        <div className="rounded-2xl p-5" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
            Cupo de {MES[c?.mes ?? 0]}
          </p>
          <p className="text-[32px] font-bold leading-none tabular-nums" style={{ color: '#0D0E12' }}>
            {c?.emitidos ?? 0}<span className="text-[18px]" style={{ color: '#9CA3AF' }}> / {c?.incluidos ?? 0}</span>
          </p>
          <p className="text-[12px] mt-2" style={{ color: '#64748B' }}>
            {(c?.restantes ?? 0) > 0 ? `${c?.restantes} disponibles` : 'Cupo alcanzado'}
          </p>
        </div>

        {/* Excedentes */}
        <div className="rounded-2xl p-5" style={{ background: (c?.adicionales ?? 0) > 0 ? '#FFFBEB' : '#FAFAF8', border: `1px solid ${(c?.adicionales ?? 0) > 0 ? '#FDE68A' : '#EEECE6'}` }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Excedentes del mes</p>
          <p className="text-[32px] font-bold leading-none tabular-nums" style={{ color: (c?.adicionales ?? 0) > 0 ? '#B45309' : '#0D0E12' }}>
            {c?.adicionales ?? 0}
          </p>
          <p className="text-[12px] mt-2" style={{ color: '#64748B' }}>
            {(c?.adicionales ?? 0) > 0 ? `${sol(c!.monto_adicional)} a cobrar` : 'Sin excedentes'}
          </p>
        </div>
      </div>

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
            <b>{planSel.nombre}</b>: hasta <b>{planSel.limite_certificados_mes || '—'}</b> certificados/mes ·
            {planSel.limite_certificados_mes > 0
              ? <> adicional <b>{sol(adicionalProporcional(planSel.precio_mensual, planSel.limite_certificados_mes))}</b> c/u</>
              : <> cupo a medida</>}
            {planSel.setup_inicial > 0 && <> · setup <b>{sol(planSel.setup_inicial)}</b></>}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button type="submit" disabled={saving || !planId} className="sv-btn sv-btn-primary px-5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Asignar plan
          </button>
        </div>
        <p className="text-[11.5px] mt-2" style={{ color: '#9CA3AF' }}>
          Al cambiar el plan se cierra la suscripción anterior y se crea una nueva vigente desde hoy (queda en el historial).
        </p>
      </form>
    </div>
  );
}
