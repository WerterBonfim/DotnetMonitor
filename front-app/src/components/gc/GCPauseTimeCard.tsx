import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Info } from 'lucide-react';
import { formatTime } from '../../lib/utils';
import { MetricInfoModal, type MetricInfo } from './MetricInfoModal';

interface GCPauseTimeCardProps {
  pauseTimeTotalMs: number;
  pauseTimeAverageMs: number;
}

const metricInfo: MetricInfo = {
  title: 'GC Pause Time',
  description: 'Tempo total acumulado de pausas do GC desde o início do processo e tempo médio por coleta.',
  importance:
    'Impacto direto na latência da aplicação. Pausas longas causam timeouts e experiência ruim ao usuário. Permite calcular tempo médio de pausa por coleta.',
  thresholds: {
    normal: {
      value: 'Gen 0/1: < 1ms, Gen 2: < 50ms',
      description: 'Pausas curtas, impacto mínimo na latência',
    },
    warning: {
      value: 'Gen 2: 50-100ms',
      description: 'Pausas começando a impactar latência, monitorar',
    },
    critical: {
      value: 'Gen 2: > 100ms',
      description: 'Pausas longas causando problemas de latência, investigar',
    },
  },
  interpretation:
    'Pausas Gen 0/1 devem ser muito curtas (< 1ms). Pausas Gen 2 Foreground devem ser < 100ms, com atenção se > 50ms. Gen 2 Background pode durar muito tempo total, mas com pausas curtas. Pausas > 500ms são muito críticas.',
};

export function GCPauseTimeCard({ pauseTimeTotalMs, pauseTimeAverageMs }: GCPauseTimeCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Validar valores
  const validTotalMs = typeof pauseTimeTotalMs === 'number' && isFinite(pauseTimeTotalMs) ? pauseTimeTotalMs : 0;
  const validAverageMs = typeof pauseTimeAverageMs === 'number' && isFinite(pauseTimeAverageMs) ? pauseTimeAverageMs : 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">GC Pause Time</CardTitle>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{formatTime(validTotalMs)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Acumulado</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{formatTime(validAverageMs)}</div>
                <p className="text-xs text-muted-foreground mt-1">Média por Coleta</p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {validAverageMs < 1
                  ? 'Pausas muito curtas, excelente performance'
                  : validAverageMs < 50
                    ? 'Pausas dentro do normal'
                    : validAverageMs < 100
                      ? 'Pausas começando a impactar latência'
                      : 'Pausas longas, investigar imediatamente'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <MetricInfoModal open={isModalOpen} onOpenChange={setIsModalOpen} metricInfo={metricInfo} />
    </>
  );
}
