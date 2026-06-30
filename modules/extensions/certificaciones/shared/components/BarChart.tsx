/** Una barra del gráfico. */
export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  /** Color de la barra (default: dorado de marca). */
  color?: string;
  /** Texto cuando no hay datos. */
  empty?: string;
}

/**
 * Gráfico de barras horizontales, sin dependencias (CSS puro). Reutilizable para
 * "certificados por programa", "tendencia mensual", etc. Escala al valor máximo.
 */
export default function BarChart({ data, color = '#D97706', empty = 'Sin datos en el periodo' }: BarChartProps) {
  if (!data.length) {
    return <p className="text-[12.5px] text-center py-8" style={{ color: '#9CA3AF' }}>{empty}</p>;
  }
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-2.5">
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <div key={`${d.label}-${i}`} className="flex items-center gap-3">
            <div className="w-[38%] text-[12px] truncate text-right" style={{ color: '#64748B' }} title={d.label}>
              {d.label}
            </div>
            <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: '#F0EEE9' }}>
              <div
                className="h-full rounded-md transition-all duration-500 flex items-center justify-end px-2"
                style={{ width: `${Math.max(pct, 6)}%`, background: color }}
              >
                <span className="text-[11px] font-bold tabular-nums" style={{ color: '#fff' }}>{d.value}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
