import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import type { HistoricalMetric } from '../../../types/postgresql';

interface HistoricalMetricsTableProps {
  metrics: HistoricalMetric[];
}

export function HistoricalMetricsTable({ metrics }: HistoricalMetricsTableProps) {
  if (metrics.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Nenhum dado histórico disponível para o período selecionado.
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Métricas Históricas Consolidadas</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Período</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Conexões Médias</th>
              <th className="text-left p-2">Cache Hit Ratio</th>
              <th className="text-left p-2">Locks Médios</th>
              <th className="text-left p-2">Métricas</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => {
              const data = metric.aggregatedData;
              const avgActiveConnections = data.avgActiveConnections as number | undefined;
              const avgGlobalCacheHitRatio = data.avgGlobalCacheHitRatio as number | undefined;
              const avgLockCount = data.avgLockCount as number | undefined;
              const metricCount = data.metricCount as number | undefined;

              return (
                <tr key={metric.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <div className="text-xs">
                      <div>{new Date(metric.periodStart).toLocaleString('pt-BR')}</div>
                      <div className="text-muted-foreground">
                        até {new Date(metric.periodEnd).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <Badge variant="outline">{metric.periodType}</Badge>
                  </td>
                  <td className="p-2">
                    {avgActiveConnections !== undefined
                      ? avgActiveConnections.toFixed(1)
                      : '-'}
                  </td>
                  <td className="p-2">
                    {avgGlobalCacheHitRatio !== undefined ? (
                      <Badge
                        variant={
                          avgGlobalCacheHitRatio > 95
                            ? 'default'
                            : avgGlobalCacheHitRatio > 80
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {avgGlobalCacheHitRatio.toFixed(1)}%
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-2">
                    {avgLockCount !== undefined ? avgLockCount.toFixed(1) : '-'}
                  </td>
                  <td className="p-2">
                    {metricCount !== undefined ? (
                      <Badge variant="secondary">{metricCount} coletas</Badge>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
