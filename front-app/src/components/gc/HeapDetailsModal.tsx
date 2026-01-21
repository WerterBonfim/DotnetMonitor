import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Package, Pin, Info, AlertTriangle } from 'lucide-react';
import { formatBytes, formatPercent } from '../../lib/utils';

interface HeapDetailsModalProps {
  type: 'LOH' | 'POH';
  sizeBytes: number;
  totalMemoryBytes: number;
  pinnedObjectsCount?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getHeapInfo = (type: 'LOH' | 'POH') => {
  if (type === 'LOH') {
    return {
      title: 'Large Object Heap (LOH)',
      description: 'Heap especial para objetos grandes (>= 85KB). Objetos grandes são alocados diretamente no LOH.',
      whatIs: 'O LOH é uma área separada do heap gerenciado onde objetos de 85KB ou mais são alocados automaticamente. Isso inclui arrays grandes, strings grandes, e outros objetos que excedem o limite.',
      whenObjectsGo: 'Objetos >= 85KB são automaticamente alocados no LOH. Isso acontece durante a alocação inicial, não durante a coleta.',
      impact: 'O LOH não é compactado durante coletas Gen 0 ou Gen 1. Apenas coletas Gen 2 full podem compactar o LOH. Isso pode causar fragmentação significativa se muitos objetos grandes são alocados e liberados.',
      thresholds: {
        normal: { value: '< 10% do heap total', description: 'Uso baixo do LOH, comportamento normal' },
        warning: { value: '10-20% do heap total', description: 'Uso moderado, monitorar crescimento' },
        critical: { value: '> 20% do heap total', description: 'Uso alto, possível fragmentação significativa' },
      },
      interpretation: 'LOH alto pode indicar muitos objetos grandes sendo alocados. Como o LOH não é compactado frequentemente, fragmentação pode se acumular. Objetos grandes que são alocados e liberados frequentemente são especialmente problemáticos.',
      recommendations: [
        'Se LOH > 20%: Investigar alocações de objetos grandes desnecessárias',
        'Considerar usar object pooling para objetos grandes reutilizáveis',
        'Evitar criar arrays ou strings muito grandes se não forem necessários',
        'Monitorar fragmentação do LOH usando ferramentas de diagnóstico',
        'Considerar usar ArrayPool<T> para arrays grandes temporários',
        'Revisar código para identificar alocações grandes que podem ser otimizadas',
      ],
      tips: [
        'Objetos >= 85KB vão automaticamente para LOH',
        'LOH não é compactado em coletas Gen 0/1',
        'Apenas Gen 2 full GC compacta o LOH',
        'Fragmentação no LOH pode causar crescimento do memory committed',
        'Objetos grandes de vida curta são especialmente problemáticos',
      ],
    };
  } else {
    return {
      title: 'Pinned Object Heap (POH)',
      description: 'Heap para objetos que estão "pinned" (fixados) na memória e não podem ser movidos pelo GC.',
      whatIs: 'O POH contém objetos que foram fixados na memória usando GCHandle.Alloc com GCHandleType.Pinned. Objetos pinned não podem ser movidos pelo GC durante a coleta, o que pode causar fragmentação.',
      whenObjectsGo: 'Objetos são pinned quando há interoperabilidade com código não gerenciado (P/Invoke) ou quando se precisa de um ponteiro fixo para a memória gerenciada. Isso é feito usando GCHandle.Alloc ou fixed statements.',
      impact: 'Objetos pinned impedem a compactação do heap na região onde estão localizados. Muitos objetos pinned podem causar fragmentação significativa e crescimento do memory committed. Objetos pinned também podem causar pausas mais longas no GC.',
      thresholds: {
        normal: { value: '< 1% do heap total, < 100 objetos', description: 'Poucos objetos pinned, impacto mínimo' },
        warning: { value: '1-5% do heap total, 100-500 objetos', description: 'Uso moderado, monitorar crescimento' },
        critical: { value: '> 5% do heap total, > 500 objetos', description: 'Muitos objetos pinned, fragmentação significativa' },
      },
      interpretation: 'POH alto indica muitos objetos pinned, o que pode causar fragmentação significativa. Objetos pinned devem ser usados apenas quando necessário para interoperabilidade. Pinned objects de longa duração são especialmente problemáticos.',
      recommendations: [
        'Se POH > 5%: Investigar uso excessivo de pinned objects',
        'Liberar GCHandle assim que não for mais necessário',
        'Evitar manter objetos pinned por longos períodos',
        'Considerar usar Span<T> ou Memory<T> em vez de pinned quando possível',
        'Revisar código P/Invoke para minimizar tempo de pinning',
        'Usar GCHandleType.Normal em vez de Pinned quando possível',
        'Monitorar número de objetos pinned e reduzir se possível',
      ],
      tips: [
        'Objetos pinned não podem ser movidos pelo GC',
        'Pinned objects causam fragmentação na região onde estão',
        'GCHandle.Alloc com GCHandleType.Pinned cria pinned objects',
        'fixed statements também criam pinned objects temporariamente',
        'Objetos pinned de longa duração são especialmente problemáticos',
        'Liberar GCHandle libera o pinning',
      ],
    };
  }
};

export function HeapDetailsModal({
  type,
  sizeBytes,
  totalMemoryBytes,
  pinnedObjectsCount,
  open,
  onOpenChange,
}: HeapDetailsModalProps) {
  const heapInfo = getHeapInfo(type);
  const percentage = totalMemoryBytes > 0 ? (sizeBytes / totalMemoryBytes) * 100 : 0;
  
  const status = type === 'LOH'
    ? (percentage < 10 ? 'normal' : percentage < 20 ? 'warning' : 'critical')
    : (percentage < 1 && (pinnedObjectsCount ?? 0) < 100
        ? 'normal'
        : percentage < 5 && (pinnedObjectsCount ?? 0) < 500
        ? 'warning'
        : 'critical');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto top-[5%] translate-y-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'LOH' ? (
              <Package className="h-5 w-5 text-amber-700 dark:text-amber-500" />
            ) : (
              <Pin className="h-5 w-5 text-red-500" />
            )}
            {heapInfo.title}
          </DialogTitle>
          <DialogDescription>{heapInfo.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Informações Básicas */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Tamanho</div>
                <div className="font-medium">{formatBytes(sizeBytes)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">% do Heap Total</div>
                <div className="font-medium">{formatPercent(percentage)}</div>
              </div>
              {type === 'POH' && pinnedObjectsCount !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground">Objetos Pinned</div>
                  <div className="font-medium">{pinnedObjectsCount.toLocaleString()}</div>
                </div>
              )}
            </div>
          </Card>

          {/* O que é */}
          <div>
            <h3 className="font-semibold text-lg mb-2">O que é {type === 'LOH' ? 'LOH' : 'POH'}?</h3>
            <p className="text-sm text-muted-foreground mb-2">{heapInfo.whatIs}</p>
            <p className="text-sm text-muted-foreground">
              <strong>Quando objetos vão para {type === 'LOH' ? 'LOH' : 'POH'}:</strong> {heapInfo.whenObjectsGo}
            </p>
          </div>

          {/* Impacto na Performance */}
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <span>📊</span> Impacto na Performance
            </h3>
            <p className="text-sm text-muted-foreground">{heapInfo.impact}</p>
          </div>

          {/* Thresholds Recomendados */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Thresholds Recomendados</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-green-500/10 border-green-500/50">
                <Badge variant="success" className="mt-0.5">Normal</Badge>
                <div className="flex-1">
                  <div className="font-medium">{heapInfo.thresholds.normal.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {heapInfo.thresholds.normal.description}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/50">
                <Badge variant="warning" className="mt-0.5">Atenção</Badge>
                <div className="flex-1">
                  <div className="font-medium">{heapInfo.thresholds.warning.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {heapInfo.thresholds.warning.description}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-red-500/10 border-red-500/50">
                <Badge variant="danger" className="mt-0.5">Crítico</Badge>
                <div className="flex-1">
                  <div className="font-medium">{heapInfo.thresholds.critical.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {heapInfo.thresholds.critical.description}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Atual */}
          <Alert
            variant={status === 'critical' ? 'destructive' : status === 'warning' ? 'default' : 'default'}
            className={
              status === 'critical'
                ? 'border-red-500/50 bg-red-500/10'
                : status === 'warning'
                ? 'border-yellow-500/50 bg-yellow-500/10'
                : 'border-green-500/50 bg-green-500/10'
            }
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Status Atual:</strong> {formatPercent(percentage)} do heap total
              {type === 'POH' && pinnedObjectsCount !== undefined && `, ${pinnedObjectsCount.toLocaleString()} objetos pinned`}
              {' - '}
              {status === 'critical'
                ? 'Crítico'
                : status === 'warning'
                ? 'Atenção'
                : 'Normal'}
            </AlertDescription>
          </Alert>

          {/* Interpretação */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Como interpretar</h3>
            <p className="text-sm text-muted-foreground">{heapInfo.interpretation}</p>
          </div>

          {/* Dicas */}
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <span>💡</span> Dicas Importantes
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {heapInfo.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>

          {/* Ações Recomendadas */}
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <span>⚙️</span> Ações Recomendadas
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {heapInfo.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
