import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart3, Loader2, AlertCircle, Download, FileSpreadsheet,
  Award, Users, ClipboardList, TrendingUp, CreditCard,
} from '@/components/ui/icon';
import type { Comparativo } from '../../shared/api/reportes.api';
import { usePlan } from '../../shared/hooks/usePlan';
import BarChart from '../../shared/components/BarChart';
import { reportesApi, type ReporteData } from '../../shared/api/reportes.api';
import { exportarReporteExcel } from '../../shared/utils/exportarReporteExcel';

/** Primer día del mes en curso y hoy (YYYY-MM-DD). */
function rangoPorDefecto() {
  const hoy = new Date();
  const iso = (d: Date) => d.toLocaleDateString('en-CA');  // YYYY-MM-DD local
  return { desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: iso(hoy) };
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
const fmtMes = (m: string) => {
  const [y, mm] = m.split('-');
  return `${MESES[Number(mm) - 1] ?? mm} ${y}`;
};

/** Tarjeta de indicador. */
function StatCard({ Icon, label, value, color, hint }: {
  Icon: typeof Award; label: string; value: string | number; color: string; hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #EEECE6' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>{label}</p>
      </div>
      <p className="text-[26px] font-bold leading-none tabular-nums" style={{ color: '#0D0E12' }}>{value}</p>
      {hint && <p className="text-[11px] mt-1.5" style={{ color: '#9CA3AF' }}>{hint}</p>}
    </div>
  );
}

/** Tarjeta de comparación contra el periodo anterior (valor + Δ%). */
function CompCard({ label, c }: { label: string; c: Comparativo['certificados'] }) {
  const sube = c.pct >= 0;
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center justify-between" style={{ border: '1px solid #EEECE6' }}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>{label}</p>
        <p className="text-[24px] font-bold tabular-nums leading-tight" style={{ color: '#0D0E12' }}>{c.actual}</p>
        <p className="text-[11.5px]" style={{ color: '#9CA3AF' }}>periodo anterior: {c.anterior}</p>
      </div>
      <span className="text-[13px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
        style={{ background: sube ? '#ECFDF5' : '#FEF2F2', color: sube ? '#047857' : '#B91C1C' }}>
        {sube ? '▲' : '▼'} {Math.abs(c.pct)}%
      </span>
    </div>
  );
}

export default function AdminReportes() {
  const { empresa } = useParams<{ empresa: string }>();
  const { estado } = usePlan();

  const [rango, setRango]   = useState(rangoPorDefecto);
  const [data, setData]     = useState<ReporteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await reportesApi.data(empresa!, rango));
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [empresa, rango]);

  useEffect(() => { cargar(); }, [cargar]);

  const descargarExcel = async () => {
    if (!data) return;
    setExportando(true);
    try {
      const certificados = await reportesApi.certificados(empresa!, rango);
      await exportarReporteExcel({
        empresa: empresa!, rango,
        resumen: data.resumen, porPrograma: data.porPrograma, certificados,
        comparativo: data.comparativo,
        aprobacionPorPrograma: data.aprobacionPorPrograma, productividad: data.productividad,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExportando(false);
    }
  };

  // El plan no incluye reportes (Básico): aviso de mejora.
  if (estado?.plan && !estado.plan.permite_metricas) {
    return (
      <div className="bg-white rounded-2xl py-16 text-center page-enter" style={{ border: '1px solid #EEECE6' }}>
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#FEF3C7', color: '#B45309' }}>
          <BarChart3 size={22} />
        </div>
        <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>Los reportes no están incluidos en tu plan</p>
        <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Disponibles desde el plan Profesional. Contacta a Vaxa para mejorar tu plan.</p>
      </div>
    );
  }

  const r = data?.resumen;

  return (
    <div className="space-y-4 page-enter">
      {/* Encabezado + filtro de fechas + exportar */}
      <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between gap-3 flex-wrap" style={{ border: '1px solid #EEECE6' }}>
        <div className="flex items-center gap-2">
          <BarChart3 size={18} style={{ color: '#0D0E12' }} />
          <div>
            <p className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>Reportes</p>
            <p className="text-[12px]" style={{ color: '#9CA3AF' }}>Indicadores de tu operación de capacitación por periodo.</p>
          </div>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#B0A898' }}>Desde</label>
            <input type="date" value={rango.desde} max={rango.hasta}
              onChange={(e) => setRango(p => ({ ...p, desde: e.target.value }))}
              className="text-[12.5px] rounded-lg px-2.5" style={{ height: 34, border: '1px solid #EEECE6', color: '#374151' }} />
          </div>
          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#B0A898' }}>Hasta</label>
            <input type="date" value={rango.hasta} min={rango.desde}
              onChange={(e) => setRango(p => ({ ...p, hasta: e.target.value }))}
              className="text-[12.5px] rounded-lg px-2.5" style={{ height: 34, border: '1px solid #EEECE6', color: '#374151' }} />
          </div>
          <button
            onClick={descargarExcel}
            disabled={exportando || loading || !data}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 rounded-lg disabled:opacity-50"
            style={{ height: 34, background: '#0D7C66', color: '#fff' }}
          >
            {exportando ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20" style={{ color: '#D1D5DB' }}><Loader2 size={24} className="animate-spin" /></div>
      ) : error ? (
        <div className="bg-white rounded-2xl py-12 text-center" style={{ border: '1px solid #EEECE6' }}>
          <AlertCircle size={20} style={{ color: '#DC2626', margin: '0 auto 8px' }} />
          <p className="text-[13px]" style={{ color: '#B91C1C' }}>{error}</p>
        </div>
      ) : r ? (
        <>
          {/* Tarjetas de indicadores */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard Icon={Award} label="Certificados" value={r.certificados_emitidos} color="#D97706"
              hint={`${r.certificados_vigentes} vigentes · ${r.certificados_anulados} anulados`} />
            <StatCard Icon={ClipboardList} label="Inscripciones" value={r.inscripciones_nuevas} color="#2563EB"
              hint={`${r.aprobados} aprobados · ${r.desaprobados} desaprobados`} />
            <StatCard Icon={TrendingUp} label="Aprobación" value={`${r.tasa_aprobacion}%`} color="#15803D"
              hint="de las inscripciones del periodo" />
            <StatCard Icon={Users} label="Estudiantes nuevos" value={r.estudiantes_nuevos} color="#7C3AED"
              hint={`${r.programas_activos} programas · ${r.aulas_activas} aulas activas`} />
          </div>

          {/* Comparativo vs periodo anterior */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CompCard label="Certificados vs periodo anterior" c={data.comparativo.certificados} />
            <CompCard label="Inscripciones vs periodo anterior" c={data.comparativo.inscripciones} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Certificados por programa */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #EEECE6' }}>
              <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheet size={15} style={{ color: '#B0A898' }} />
                <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>Certificados por programa</p>
              </div>
              <BarChart data={data.porPrograma.map(p => ({ label: p.programa, value: p.emitidos }))} color="#D97706" />
            </div>

            {/* Tendencia mensual */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #EEECE6' }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={15} style={{ color: '#B0A898' }} />
                <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>Emisión por mes</p>
              </div>
              <BarChart data={data.tendencia.map(t => ({ label: fmtMes(t.mes), value: t.emitidos }))} color="#0D7C66" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Tasa de aprobación por programa */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #EEECE6' }}>
              <div className="flex items-center gap-2 mb-4">
                <Award size={15} style={{ color: '#B0A898' }} />
                <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>Aprobación por programa</p>
              </div>
              {data.aprobacionPorPrograma.length === 0 ? (
                <p className="text-[12.5px] text-center py-6" style={{ color: '#9CA3AF' }}>Sin datos en el periodo</p>
              ) : (
                <div className="space-y-3">
                  {data.aprobacionPorPrograma.map((a, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-[12px] mb-1">
                        <span className="truncate" style={{ color: '#374151' }} title={a.programa}>{a.programa}</span>
                        <span className="font-bold tabular-nums flex-shrink-0 ml-2" style={{ color: a.tasa >= 60 ? '#15803D' : '#B45309' }}>{a.tasa}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F0EEE9' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${a.tasa}%`, background: a.tasa >= 60 ? '#15803D' : '#D97706' }} />
                      </div>
                      <p className="text-[10.5px] mt-0.5" style={{ color: '#B0A898' }}>{a.aprobados}/{a.inscritos} aprobados</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Productividad por operador */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #EEECE6' }}>
              <div className="flex items-center gap-2 mb-4">
                <Users size={15} style={{ color: '#B0A898' }} />
                <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>Productividad por operador</p>
              </div>
              <BarChart data={data.productividad.map(p => ({ label: p.operador, value: p.emitidos }))} color="#7C3AED" empty="Sin emisiones en el periodo" />
            </div>
          </div>

          {/* Consumo de créditos del periodo */}
          <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3" style={{ border: '1px solid #EEECE6' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#ECFDF5' }}>
              <CreditCard size={17} style={{ color: '#0D7C66' }} />
            </div>
            <div>
              <p className="text-[12px]" style={{ color: '#9CA3AF' }}>Créditos consumidos en el periodo</p>
              <p className="text-[18px] font-bold tabular-nums" style={{ color: '#0D0E12' }}>{r.creditos_consumidos}</p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
