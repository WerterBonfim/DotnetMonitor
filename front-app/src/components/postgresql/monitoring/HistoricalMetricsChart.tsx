import { Card } from '../../ui/card';
import type { HistoricalMetric } from '../../../types/postgresql';

interface HistoricalMetricsChartProps {
  metrics: HistoricalMetric[];
}

export function HistoricalMetricsChart({ metrics }: HistoricalMetricsChartProps) {
  if (metrics.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Nenhum dado histórico disponível para visualização em gráfico.
      </Card>
    );
  }

  // Preparar dados para o gráfico
  const chartData = metrics.map((m) => {
    const data = m.aggregatedData;
    return {
      period: new Date(m.periodStart).toLocaleString('pt-BR', {
        month: 'short',
        day: 'numeric',
        hour: m.periodType === 'Hourly' ? '2-digit' : undefined,
      }),
      cacheHitRatio: (data.avgGlobalCacheHitRatio as number | undefined) || 0,
      activeConnections: (data.avgActiveConnections as number | undefined) || 0,
      lockCount: (data.avgLockCount as number | undefined) || 0,
    };
  });

  // Gráfico simples usando divs (sem dependência externa)
  const maxCacheHit = Math.max(...chartData.map((d) => d.cacheHitRatio), 100);
  const maxConnections = Math.max(...chartData.map((d) => d.activeConnections), 1);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Cache Hit Ratio ao Longo do Tempo</h3>
        <div className="space-y-2">
          {chartData.map((data, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-24 text-xs text-muted-foreground">{data.period}</div>
              <div className="flex-1 bg-muted rounded-full h-6 relative">
                <div
                  className="bg-primary h-6 rounded-full flex items-center justify-end pr-2"
                  style={{
                    width: `${(data.cacheHitRatio / maxCacheHit) * 100}%`,
                  }}
                >
                  <span className="text-xs text-primary-foreground font-medium">
                    {data.cacheHitRatio.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Conexões Ativas Médias</h3>
        <div className="space-y-2">
          {chartData.map((data, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-24 text-xs text-muted-foreground">{data.period}</div>
              <div className="flex-1 bg-muted rounded-full h-6 relative">
                <div
                  className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{
                    width: `${(data.activeConnections / maxConnections) * 100}%`,
                  }}
                >
                  <span className="text-xs text-white font-medium">
                    {data.activeConnections.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
