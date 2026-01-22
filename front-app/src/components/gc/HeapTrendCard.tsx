import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatBytes } from '../../lib/utils';
import { MetricInfoModal, type MetricInfo } from './MetricInfoModal';

interface HeapTrendCardProps {
  heapSizeAfterGen2GC: number;
  gen2CollectionFrequencyPerHour: number;
}

const metricInfo: MetricInfo = {
  title: 'Tendência de Heap Size (Pós-GC)',
  description: 'Tamanho do heap após cada Gen 2 GC ao longo do tempo.',
  importance:
    'Crítico para detectar memory leaks. Heap crescendo continuamente após GCs indica retenção. Permite comparar com baseline histórica e correlacionar com deploys.',
  thresholds: {
    normal: {
      value: 'Estabilizado após warm-up',
      description: 'Heap mantém tamanho consistente após warm-up',
    },
    warning: {
      value: 'Crescimento gradual',
      description: 'Heap crescendo lentamente, possível leak gradual',
    },
    critical: {
      value: 'Crescimento linear contínuo',
      description: 'Memory leak detectado, heap não reduz após GCs',
    },
  },
  interpretation:
    'Normal: Heap estabiliza após warm-up em valor consistente. Memory Leak: Crescimento linear contínuo ao longo de dias. Cache buildup: Crescimento seguido de queda (eviction funcionando).',
};

export function HeapTrendCard({ 
  heapSizeAfterGen2GC,
  gen2CollectionFrequencyPerHour
}: HeapTrendCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Validar valores
  const validHeapSize = typeof heapSizeAfterGen2GC === 'number' && isFinite(heapSizeAfterGen2GC) && heapSizeAfterGen2GC >= 0
    ? heapSizeAfterGen2GC 
    : 0;
  const validFrequency = typeof gen2CollectionFrequencyPerHour === 'number' && isFinite(gen2CollectionFrequencyPerHour) && gen2CollectionFrequencyPerHour >= 0
    ? gen2CollectionFrequencyPerHour 
    : 0;

  // Por enquanto, mostramos apenas o valor atual
  // Em uma implementação completa, isso seria um gráfico de linha com histórico
  type TrendType = 'stable' | 'increasing' | 'decreasing';
  const trend: TrendType = 'stable' as TrendType; // seria calculado com histórico

  const TrendIcon = trend === 'increasing' ? TrendingUp :
                    trend === 'decreasing' ? TrendingDown :
                    Minus;

  const trendColor = trend === 'increasing' ? 'text-yellow-500' :
                     trend === 'decreasing' ? 'text-green-500' :
                     'text-blue-500';

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Heap Size (Pós-GC Gen 2)</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsModalOpen(true)}
          >
            <Info className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{formatBytes(validHeapSize)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tamanho após última Gen 2 GC
              </p>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Tendência</span>
                <div className="flex items-center gap-1">
                  <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                  <span className={`text-sm font-semibold ${trendColor}`}>
                    {trend === 'increasing' ? 'Crescendo' :
                     trend === 'decreasing' ? 'Decaindo' :
                     'Estável'}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Gen 2 coletas: {validFrequency.toFixed(1)}/hora
              </div>
            </div>

            <div className="p-2 rounded-md bg-blue-500/10 border border-blue-500/50">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {validFrequency > 5
                  ? 'Gen 2 coletas frequentes. Monitorar crescimento do heap para detectar memory leaks.'
                  : 'Gen 2 coletas dentro do normal. Heap deve estabilizar após warm-up.'}
              </p>
            </div>

            {/* Placeholder para gráfico de tendência */}
            <div className="h-24 rounded border border-dashed flex items-center justify-center">
              <p className="text-xs text-muted-foreground">
                Gráfico de tendência (histórico será implementado)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <MetricInfoModal open={isModalOpen} onOpenChange={setIsModalOpen} metricInfo={metricInfo} />
    </>
  );
}
