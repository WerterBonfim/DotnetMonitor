import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Info, AlertTriangle } from 'lucide-react';
import { formatPercent, getThresholdBgColor, getThresholdColor } from '../../lib/utils';
import { MetricInfoModal, type MetricInfo } from './MetricInfoModal';
import { Progress } from '../ui/progress';

interface TimeInGCCardProps {
  timeInGCPercent: number;
}

const metricInfo: MetricInfo = {
  title: '% Time in GC',
  description: 'Porcentagem de tempo total que a aplicação está gastando em coletas GC.',
  importance:
    'Este é um indicador direto de impacto na performance. Valores altos indicam que o GC está competindo excessivamente com a aplicação, causando degradação de throughput e latência.',
  thresholds: {
    normal: {
      value: '< 5%',
      description: 'GC está funcionando eficientemente, impacto mínimo na performance',
    },
    warning: {
      value: '5-10%',
      description: 'GC começando a impactar performance, monitorar tendência',
    },
    critical: {
      value: '> 10%',
      description: 'GC impactando significativamente a performance, investigar imediatamente',
    },
  },
  interpretation:
    'Valores acima de 10% indicam que o GC está competindo excessivamente com a aplicação. Valores acima de 20% são muito críticos e podem causar timeouts e experiência ruim ao usuário. Este é um dos indicadores mais importantes para detectar problemas de throughput.',
};

export function TimeInGCCard({ timeInGCPercent }: TimeInGCCardProps) {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TimeInGCCard.tsx:36',message:'TimeInGCCard render',data:{timeInGCPercent,isNumber:typeof timeInGCPercent==='number',isNaN:isNaN(timeInGCPercent),isFinite:isFinite(timeInGCPercent)},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'G'})}).catch(()=>{});
  // #endregion
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Validar e normalizar o valor
  const validTimeInGC = typeof timeInGCPercent === 'number' && isFinite(timeInGCPercent) 
    ? Math.max(0, Math.min(100, timeInGCPercent)) 
    : 0;

  const thresholds = {
    normal: 5,
    warning: 10,
    critical: 20,
  };

  const getStatus = () => {
    if (validTimeInGC >= thresholds.critical) return 'critical';
    if (validTimeInGC >= thresholds.warning) return 'warning';
    return 'normal';
  };

  const status = getStatus();
  const colorClass = getThresholdColor(validTimeInGC, thresholds);
  const progressColorClass = 
    status === 'critical' ? 'bg-red-500' :
    status === 'warning' ? 'bg-yellow-500' :
    'bg-green-500';

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">% Time in GC</CardTitle>
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
              <div className={`text-3xl font-bold ${colorClass}`}>
                {formatPercent(validTimeInGC)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tempo gasto em coletas GC
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progresso</span>
                <span className={colorClass}>
                  {status === 'critical' && 'Crítico'}
                  {status === 'warning' && 'Atenção'}
                  {status === 'normal' && 'Normal'}
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full transition-all ${progressColorClass}`}
                  style={{
                    width: `${Math.min(100, (validTimeInGC / thresholds.critical) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>5%</span>
                <span>10%</span>
                <span>20%</span>
              </div>
            </div>

            {validTimeInGC >= thresholds.warning && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/10 border border-yellow-500/50">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  {validTimeInGC >= thresholds.critical
                    ? 'GC impactando significativamente a performance. Investigar imediatamente.'
                    : 'GC começando a impactar performance. Monitorar tendência.'}
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
