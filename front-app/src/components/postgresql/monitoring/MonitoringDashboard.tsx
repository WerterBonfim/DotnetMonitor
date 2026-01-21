import type { MonitoringMetric } from '../../../types/postgresql';
import { MetricCard } from './MetricCard';
import { EfficiencyGauge } from './EfficiencyGauge';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
  Database,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Activity,
  Zap,
} from 'lucide-react';
import { formatBytes } from '../../../lib/utils';

interface MonitoringDashboardProps {
  metrics: MonitoringMetric[];
}

export function MonitoringDashboard({ metrics }: MonitoringDashboardProps) {
  if (metrics.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Nenhuma métrica coletada. Clique em "Coletar Métricas" para começar.
      </Card>
    );
  }

  const latestMetric = metrics[0];

  const totalIndexes = latestMetric.indexStats?.length || 0;
  const unusedIndexes = latestMetric.indexStats?.filter((i) => i.status === 'unused').length || 0;
  const totalIndexSize = latestMetric.indexStats?.reduce((sum, i) => sum + i.indexSize, 0) || 0;

  const recommendations = latestMetric.indexRecommendations || [];
  const highImpactRecommendations = recommendations.filter((r) => r.expectedImpact === 'high').length;

  const tablesNeedingAttention = latestMetric.tableEfficiency?.filter((t) => t.needsAttention).length || 0;
  const avgCacheHitRatio =
    latestMetric.tableEfficiency?.reduce((sum, t) => sum + t.cacheHitRatio, 0) /
      (latestMetric.tableEfficiency?.length || 1) || 0;

  const globalCacheHitRatio = latestMetric.databaseEfficiency?.globalCacheHitRatio || 0;

  const slowQueries = latestMetric.slowQueries?.length || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard de Monitoramento</h2>

      {/* Visão Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <EfficiencyGauge
          value={globalCacheHitRatio}
          label="Cache Hit Ratio Global"
          thresholds={{ good: 95, warning: 90 }}
          infoType="cache-hit"
        />
        <MetricCard
          title="Conexões Ativas"
          value={latestMetric.connectionStats?.activeConnections || 0}
          description={`Total: ${latestMetric.connectionStats?.totalConnections || 0}`}
          icon={Activity}
          variant={latestMetric.connectionStats && latestMetric.connectionStats.activeConnections > 50 ? 'warning' : 'default'}
          infoType="active-connections"
        />
        <MetricCard
          title="Queries Lentas"
          value={slowQueries}
          description="Queries com tempo médio > 100ms"
          icon={AlertTriangle}
          variant={slowQueries > 5 ? 'destructive' : slowQueries > 0 ? 'warning' : 'success'}
          infoType="slow-queries"
        />
        <MetricCard
          title="Índices Não Utilizados"
          value={unusedIndexes}
          description={`De ${totalIndexes} índices`}
          icon={Database}
          variant={unusedIndexes > 0 ? 'warning' : 'success'}
          infoType="unused-indexes"
        />
      </div>

      {/* Índices e Eficiência */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Índices"
          value={totalIndexes}
          description={`Tamanho total: ${formatBytes(totalIndexSize)}`}
          icon={Database}
          infoType="total-indexes"
        />
        <MetricCard
          title="Recomendações"
          value={recommendations.length}
          description={`${highImpactRecommendations} de alto impacto`}
          icon={Lightbulb}
          variant={highImpactRecommendations > 0 ? 'warning' : 'default'}
          infoType="recommendations"
        />
        <MetricCard
          title="Tabelas com Problemas"
          value={tablesNeedingAttention}
          description="Requerem atenção"
          icon={TrendingUp}
          variant={tablesNeedingAttention > 0 ? 'warning' : 'success'}
          infoType="tables-problems"
        />
        <MetricCard
          title="Cache Hit Ratio Médio"
          value={`${avgCacheHitRatio.toFixed(1)}%`}
          description="Média entre tabelas"
          icon={Zap}
          variant={avgCacheHitRatio >= 95 ? 'success' : avgCacheHitRatio >= 90 ? 'warning' : 'destructive'}
          infoType="avg-cache-hit"
        />
      </div>

      {/* Top Índices */}
      {latestMetric.indexStats && latestMetric.indexStats.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top 5 Índices Mais Utilizados</h3>
          <div className="space-y-2">
            {latestMetric.indexStats
              .filter((i) => i.status !== 'unused')
              .sort((a, b) => b.indexScans - a.indexScans)
              .slice(0, 5)
              .map((index, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div>
                    <div className="font-medium">
                      {index.schemaName}.{index.tableName}
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">{index.indexName}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant="default">{index.indexScans.toLocaleString()} scans</Badge>
                    <div className="text-xs text-muted-foreground mt-1">{formatBytes(index.indexSize)}</div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
