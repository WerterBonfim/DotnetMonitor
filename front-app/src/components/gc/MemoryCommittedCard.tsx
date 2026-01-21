import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Info } from 'lucide-react';
import { formatBytes } from '../../lib/utils';
import { MetricInfoModal, type MetricInfo } from './MetricInfoModal';

interface MemoryCommittedCardProps {
  memoryCommittedSizeBytes: number;
  totalMemoryBytes: number;
}

const metricInfo: MetricInfo = {
  title: 'Memória Commitada',
  description: 'Memória virtual commitada pelo GC durante a última coleta.',
  importance:
    'Indica pressão no sistema operacional. Pode crescer mesmo se heap size for estável. Útil para detectar fragmentação de memória virtual.',
  thresholds: {
    normal: {
      value: 'Próximo ao heap size',
      description: 'Memória commitada alinhada com uso real',
    },
    warning: {
      value: '20-30% acima do heap',
      description: 'Possível fragmentação de memória virtual',
    },
    critical: {
      value: '> 30% acima do heap',
      description: 'Fragmentação significativa, investigar LOH e pinned objects',
    },
  },
  interpretation:
    'Se memory committed está crescendo enquanto heap size está estável, indica fragmentação de memória virtual. Isso pode ser causado por LOH não compactado ou objetos fixados (pinned objects).',
};

export function MemoryCommittedCard({ 
  memoryCommittedSizeBytes, 
  totalMemoryBytes 
}: MemoryCommittedCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Validar valores
  const validCommitted = typeof memoryCommittedSizeBytes === 'number' && isFinite(memoryCommittedSizeBytes) && memoryCommittedSizeBytes >= 0
    ? memoryCommittedSizeBytes 
    : 0;
  const validTotal = typeof totalMemoryBytes === 'number' && isFinite(totalMemoryBytes) && totalMemoryBytes >= 0
    ? totalMemoryBytes 
    : 0;

  const overheadPercent = validTotal > 0
    ? ((validCommitted - validTotal) / validTotal) * 100
    : 0;

  const getStatus = () => {
    if (overheadPercent > 30) return 'critical';
    if (overheadPercent > 20) return 'warning';
    return 'normal';
  };

  const status = getStatus();
  const statusColor = status === 'critical' ? 'text-red-500' :
                      status === 'warning' ? 'text-yellow-500' :
                      'text-green-500';

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memória Commitada</CardTitle>
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
              <div className="text-3xl font-bold">{formatBytes(validCommitted)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Memória virtual commitada
              </p>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Overhead vs Heap</span>
                <span className={`text-sm font-semibold ${statusColor}`}>
                  {overheadPercent > 0 ? '+' : ''}{overheadPercent.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Heap: {formatBytes(validTotal)}
              </div>
            </div>

            {status !== 'normal' && (
              <div className={`p-2 rounded-md ${
                status === 'critical' ? 'bg-red-500/10 border border-red-500/50' :
                'bg-yellow-500/10 border border-yellow-500/50'
              }`}>
                <p className={`text-xs ${
                  status === 'critical' ? 'text-red-700 dark:text-red-400' :
                  'text-yellow-700 dark:text-yellow-400'
                }`}>
                  {status === 'critical'
                    ? 'Fragmentação significativa de memória virtual detectada.'
                    : 'Possível fragmentação de memória virtual.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <MetricInfoModal open={isModalOpen} onOpenChange={setIsModalOpen} metricInfo={metricInfo} />
    </>
  );
}
