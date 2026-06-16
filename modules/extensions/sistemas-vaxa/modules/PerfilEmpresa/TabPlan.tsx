'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Loader2, Plus, Clock, AlertCircle } from '@/components/ui/icon';
import {
  creditosAdminApi, type EmpresaCreditos, type MovimientoCredito,
} from '../../shared/api/creditos.admin.api';

interface TabPlanProps {
  empresa: EmpresaCreditos;
  /** Refresca el perfil tras recargar (para actualizar el header). */
  onChange?: () => void;
}

const TIPO_LABEL: Record<MovimientoCredito['tipo'], { txt: string; color: string; bg: string }> = {
  asignacion: { txt: 'Asignación', color: '#1D4ED8', bg: '#EFF6FF' },
  recarga:    { txt: 'Recarga',    color: '#15803D', bg: '#F0FDF4' },
  consumo:    { txt: 'Consumo',    color: '#B91C1C', bg: '#FEF2F2' },
  devolucion: { txt: 'Devolución', color: '#B45309', bg: '#FFFBEB' },
  ajuste:     { txt: 'Ajuste',     color: '#6B7280', bg: '#F3F4F6' },
};

const fmtFecha = (s: string) =>
  new Date(s).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function TabPlan({ empresa, onChange }: TabPlanProps) {
  const [movs, setMovs] = useState<MovimientoCredito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [saving, setSaving] = useState(false);

  const cargarMovs = useCallback(async () => {
    setLoading(true);
    try { setMovs(await creditosAdminApi.movimientos(empresa.id, 20)); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [empresa.id]);

  useEffect(() => { cargarMovs(); }, [cargarMovs]);

  const recargar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const n = Number(cantidad);
    if (!Number.isInteger(n) || n <= 0) return;
    setSaving(true); setError(null);
    try {
      await creditosAdminApi.recargar(empresa.id, n, 'Recarga desde perfil de empresa');
      setCantidad('');
      onChange?.();          // refresca header del perfil
      await cargarMovs();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1 rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 8px 24px rgba(5,150,105,0.25)' }}>
          <div className="flex items-center gap-1.5 text-[12px] mb-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <CreditCard className="w-3.5 h-3.5" /> Saldo disponible
          </div>
          <p className="text-[38px] font-bold leading-none tabular-nums">{empresa.creditos_disponibles}</p>
          <p className="text-[12px] mt-2.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {empresa.creditos_consumidos} consumidos · {empresa.creditos_asignados_total} asignados
          </p>
        </div>

        <form onSubmit={recargar} className="md:col-span-2 rounded-2xl p-5 flex flex-col justify-center" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#374151' }}>Recargar créditos</label>
          <div className="flex gap-2">
            <input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)}
              placeholder="Cantidad a agregar (ej. 100)" className="sv-input flex-1" />
            <button type="submit" disabled={saving || !cantidad} className="sv-btn sv-btn-primary flex-shrink-0 px-5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Recargar
            </button>
          </div>
          {cantidad && Number(cantidad) > 0 && (
            <p className="text-[12.5px] mt-2" style={{ color: '#64748B' }}>Nuevo saldo: <b style={{ color: '#059669' }}>{empresa.creditos_disponibles + Number(cantidad)}</b></p>
          )}
        </form>
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-[14px] font-bold mb-3" style={{ color: '#0D0E12' }}>
          <Clock className="w-4 h-4" style={{ color: '#B0A898' }} /> Últimos movimientos
        </h3>
        {loading ? (
          <div className="flex justify-center py-8" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : movs.length === 0 ? (
          <p className="text-[13px] py-6 text-center rounded-xl" style={{ color: '#9CA3AF', background: '#FAFAF8', border: '1px solid #EEECE6' }}>Sin movimientos todavía.</p>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
            {movs.map((m, idx) => {
              const t = TIPO_LABEL[m.tipo];
              return (
                <div key={m.id} className="flex items-center justify-between px-4 py-3 gap-3" style={{ borderBottom: idx < movs.length - 1 ? '1px solid #F5F4F0' : undefined }}>
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10.5px] font-semibold" style={{ background: t.bg, color: t.color }}>{t.txt}</span>
                    <p className="text-[11.5px] mt-1 truncate" style={{ color: '#9CA3AF' }}>{m.descripcion ?? '—'} · {fmtFecha(m.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-bold tabular-nums" style={{ color: m.cantidad >= 0 ? '#15803D' : '#B91C1C' }}>
                      {m.cantidad >= 0 ? '+' : ''}{m.cantidad}
                    </p>
                    <p className="text-[10.5px]" style={{ color: '#B0A898' }}>saldo {m.saldo_resultante}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
