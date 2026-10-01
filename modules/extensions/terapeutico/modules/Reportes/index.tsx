import { useEffect, useState } from 'react';
import { BarChart3, Users, Calendar, DollarSign, Award, Activity, Layers, Download } from '@/components/ui/icon';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import { useTerapCtx } from '../../shared/TerapShell';
import { terapApi, type ReportesData, type HcModulos } from '../../shared/api/terapeutico.api';
import { TEAL, soles, primerDiaMes, ultimoDiaMes, EncabezadoPagina, Resumen, Campo, Cargando, Vacio } from '../../shared/finanzas';

/** Paleta para las barras (se cicla). Tonos teal/slate del panel. */
const COLORES = ['#0F766E', '#14B8A6', '#0EA5A0', '#2DD4BF', '#5EEAD4', '#99F6E4'];
const nombreMes = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
};

export default function Reportes() {
  const slug = useEmpresaSlug()!;
  const { modulos } = useTerapCtx();
  // Mientras carga la config (null), se asume todo activo para no parpadear.
  const on = (m: keyof HcModulos) => (modulos ? modulos[m] : true);
  const verCitas = on('agenda');       // KPIs/columnas/panel de citas (demanda por servicio)
  const verSesiones = on('historia');  // sesiones/evoluciones (contenido clínico)
  const verIngresos = on('ventas');    // ingresos facturados por servicio
  const verServicios = on('servicios') && (verCitas || verSesiones || verIngresos);

  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(ultimoDiaMes());
  const [data, setData] = useState<ReportesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    terapApi.reportes(slug, { desde, hasta }).then(setData).finally(() => setLoading(false));
  }, [slug, desde, hasta]);

  const exportarServicios = () => {
    if (!data) return;
    const cab = ['Servicio', ...(verCitas ? ['Pacientes', 'Citas'] : []), ...(verSesiones ? ['Sesiones'] : []), ...(verIngresos ? ['Ingresos (S/)'] : [])];
    const filas = [
      cab,
      ...data.servicios.map(s => [
        s.nombre,
        ...(verCitas ? [s.pacientes, s.citas] : []),
        ...(verSesiones ? [s.sesiones] : []),
        ...(verIngresos ? [s.ingresos.toFixed(2)] : []),
      ]),
    ];
    const csv = filas.map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `reporte-servicios_${desde}_${hasta}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const r = data?.resumen;
  const maxPac = Math.max(1, ...(data?.servicios ?? []).map(s => s.pacientes));

  return (
    <div>
      <EncabezadoPagina
        icon={<BarChart3 size={19} color="#fff" />}
        titulo="Reportes" subtitulo="Qué servicios llevan más pacientes, atención y demanda del centro"
        accion={verServicios ? (
          <button onClick={exportarServicios} disabled={!data || data.servicios.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[13.5px] font-semibold disabled:opacity-50" style={{ background: TEAL }}>
            <Download size={16} /> Exportar servicios
          </button>
        ) : undefined}
      />

      <div className="flex items-end gap-2 mb-4 flex-wrap">
        <Campo label="Desde"><input type="date" className="vx-input" value={desde} onChange={e => setDesde(e.target.value)} /></Campo>
        <Campo label="Hasta"><input type="date" className="vx-input" value={hasta} onChange={e => setHasta(e.target.value)} /></Campo>
      </div>

      {loading ? <Cargando /> : !data ? (
        <div className="rounded-2xl bg-white overflow-hidden" style={CARD}>
          <Vacio icon={<BarChart3 size={26} />} titulo="Sin datos" texto="No se pudieron cargar los reportes." />
        </div>
      ) : (
        <div className="space-y-4">
          {/* KPIs — solo los de los módulos activos */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Resumen label="Pacientes activos" value={String(r!.pacientes_activos)} tint="#CCFBF1" fg={TEAL} icon={<Users size={15} />} />
            <Resumen label="Pacientes nuevos" value={String(r!.pacientes_nuevos)} tint="#DBEAFE" fg="#1D4ED8" icon={<Users size={15} />} />
            {verSesiones && <Resumen label="Sesiones" value={String(r!.sesiones)} tint="#EDE9FE" fg="#6D28D9" icon={<Activity size={15} />} />}
            {verCitas && <Resumen label="Citas" value={String(r!.citas)} tint="#FEF3C7" fg="#B45309" icon={<Calendar size={15} />} />}
            {verIngresos && <Resumen label="Ingresos por servicios" value={soles(r!.ingresos_servicios)} tint="#DCFCE7" fg="#15803D" icon={<DollarSign size={15} />} />}
            {verCitas && <Resumen label="Servicio más solicitado" value={r!.servicio_top ?? '—'} tint="#FCE7F3" fg="#BE185D" icon={<Award size={15} />} />}
          </div>

          {/* Servicios: ranking por demanda (solo si el módulo Servicios está activo) */}
          {verServicios && (
            <Panel titulo="Servicios más solicitados"
              subtitulo={verCitas ? 'Ordenados por pacientes distintos que pidieron cita' : 'Actividad por servicio en el rango'}
              icon={<Layers size={16} />}>
              {data.servicios.length === 0 ? (
                <Vacio icon={<Layers size={26} />} titulo="Sin servicios" texto="Aún no hay servicios con actividad en este rango." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr style={{ background: '#F6FAF9', color: '#64748B' }} className="text-[11px] uppercase tracking-wider">
                        <th className="text-left px-4 py-2.5 font-semibold">Servicio</th>
                        {verCitas && <th className="text-left px-4 py-2.5 font-semibold w-[38%]">Pacientes</th>}
                        {verCitas && <th className="text-right px-4 py-2.5 font-semibold">Citas</th>}
                        {verSesiones && <th className="text-right px-4 py-2.5 font-semibold">Sesiones</th>}
                        {verIngresos && <th className="text-right px-4 py-2.5 font-semibold">Ingresos</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.servicios.map((s, i) => (
                        <tr key={s.servicio_id} style={{ borderTop: '1px solid #F1F5F4' }}>
                          <td className="px-4 py-2.5 font-medium" style={{ color: '#0E1A1A' }}>
                            {verCitas && i === 0 && s.pacientes > 0 && <Award size={13} className="inline mr-1 -mt-0.5" style={{ color: '#BE185D' }} />}
                            {s.nombre}
                          </td>
                          {verCitas && (
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#EDF2F1' }}>
                                  <div className="h-full rounded-full" style={{ width: `${(s.pacientes / maxPac) * 100}%`, background: 'linear-gradient(90deg,#14B8A6,#0F766E)', minWidth: s.pacientes ? 6 : 0 }} />
                                </div>
                                <span className="text-[12.5px] font-bold tabular-nums w-6 text-right" style={{ color: '#0E1A1A' }}>{s.pacientes}</span>
                              </div>
                            </td>
                          )}
                          {verCitas && <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: '#6B7280' }}>{s.citas}</td>}
                          {verSesiones && <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: '#6B7280' }}>{s.sesiones}</td>}
                          {verIngresos && <td className="px-4 py-2.5 text-right font-semibold tabular-nums" style={{ color: '#15803D' }}>{soles(s.ingresos)}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          )}

          {/* Pacientes por sexo (siempre) + citas por estado (solo si agenda activa) */}
          <div className={`grid gap-4 ${verCitas ? 'md:grid-cols-2' : ''}`}>
            <Panel titulo="Pacientes por sexo" subtitulo="Sobre los pacientes activos" icon={<Users size={16} />}>
              <BarrasSimples
                filas={data.pacientes_por_sexo.map(x => ({ etiqueta: x.sexo, valor: x.total }))}
                vacio="Sin pacientes registrados."
              />
            </Panel>

            {verCitas && (
              <Panel titulo="Citas por estado" subtitulo="Asistencia y agenda en el rango" icon={<Calendar size={16} />}>
                <BarrasSimples
                  filas={data.citas_por_estado.map(x => ({ etiqueta: x.estado, valor: x.total }))}
                  vacio="No hay citas en este rango."
                />
              </Panel>
            )}
          </div>

          {/* Pacientes nuevos por mes (depende de pacientes, siempre disponible) */}
          <Panel titulo="Pacientes nuevos por mes" subtitulo="Altas dentro del rango elegido" icon={<Activity size={16} />}>
            {data.pacientes_por_mes.length === 0 ? (
              <p className="text-[13px] px-1 py-6 text-center" style={{ color: '#94A3B8' }}>No hubo altas en este rango.</p>
            ) : (
              <div className="flex items-end gap-3 h-40 px-1 pt-2">
                {data.pacientes_por_mes.map((m, i) => {
                  const max = Math.max(1, ...data.pacientes_por_mes.map(x => x.total));
                  return (
                    <div key={m.mes} className="flex-1 flex flex-col items-center justify-end gap-1.5 min-w-0">
                      <span className="text-[11.5px] font-bold tabular-nums" style={{ color: '#0E1A1A' }}>{m.total}</span>
                      <div className="w-full rounded-t-lg" style={{ height: `${(m.total / max) * 100}%`, minHeight: 4, background: COLORES[i % COLORES.length] }} />
                      <span className="text-[10.5px] capitalize truncate w-full text-center" style={{ color: '#6B7280' }}>{nombreMes(m.mes)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

const CARD: React.CSSProperties = { border: '1px solid #EAEFEE', boxShadow: '0 1px 2px rgba(16,48,44,.04), 0 12px 32px -16px rgba(16,48,44,.14)' };

/** Tarjeta contenedora con cabecera de sección. */
function Panel({ titulo, subtitulo, icon, children }: { titulo: string; subtitulo: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white overflow-hidden" style={CARD}>
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: '1px solid #F1F5F4' }}>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: 'linear-gradient(135deg,#14B8A6,#0F766E)' }}>{icon}</div>
        <div className="leading-tight">
          <h2 className="text-[14.5px] font-bold" style={{ color: '#0E1A1A' }}>{titulo}</h2>
          <p className="text-[11.5px]" style={{ color: '#94A3B8' }}>{subtitulo}</p>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/** Barras horizontales para distribuciones (sexo, estado de citas…). */
function BarrasSimples({ filas, vacio }: { filas: { etiqueta: string; valor: number }[]; vacio: string }) {
  if (filas.length === 0) return <p className="text-[13px] px-1 py-6 text-center" style={{ color: '#94A3B8' }}>{vacio}</p>;
  const total = filas.reduce((a, f) => a + f.valor, 0) || 1;
  const max = Math.max(1, ...filas.map(f => f.valor));
  return (
    <div className="space-y-3">
      {filas.map((f, i) => (
        <div key={f.etiqueta}>
          <div className="flex justify-between text-[12.5px] mb-1">
            <span className="capitalize font-medium" style={{ color: '#374151' }}>{f.etiqueta}</span>
            <span className="tabular-nums" style={{ color: '#6B7280' }}>{f.valor} · {Math.round((f.valor / total) * 100)}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#EDF2F1' }}>
            <div className="h-full rounded-full" style={{ width: `${(f.valor / max) * 100}%`, minWidth: f.valor ? 6 : 0, background: COLORES[i % COLORES.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}
