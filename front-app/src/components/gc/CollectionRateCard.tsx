import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Info, AlertTriangle } from 'lucide-react';
import { MetricInfoModal, type MetricInfo } from './MetricInfoModal';
import type { CollectionRatePerMinute } from '../../types/gc';

interface CollectionRateCardProps {
  collectionRatePerMinute: CollectionRatePerMinute;
}

const metricInfo: MetricInfo = {
  title: 'Taxa de Coletas GC',
  description: 'Número de coletas GC por minuto, separado por geração.',
  importance:
    'Gen 2 frequentes indicam promoção prematura de objetos. Taxa de crescimento revela padrões de alocação. Razão Gen2/Gen0 indica efetividade do sistema de gerações.',
  thresholds: {
    normal: {
      value: 'Gen 2: < 5/hora',
      description: 'Coletas Gen 2 esporádicas, comportamento normal',
    },
    warning: {
      value: 'Gen 2: 5-10/hora',
      description: 'Gen 2 coletas aumentando, revisar retenção de objetos',
    },
    critical: {
      value: 'Gen 2: > 10/hora',
      description: 'Gen 2 coletas muito frequentes, possível problema de memória',
    },
  },
  interpretation:
    'Razão Gen2/Gen0 normalmente deve ser < 0.01 (Gen2 muito menos frequente que Gen0). Se Gen2 está crescendo mais rápido que Gen0/1, indica objetos promovendo muito rápido ou retenção excessiva.',
};

export function CollectionRateCard({ collectionRatePerMinute }: CollectionRateCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Validar valores
  const safeGen0 = typeof collectionRatePerMinute?.gen0 === 'number' && isFinite(collectionRatePerMinute.gen0) ? collectionRatePerMinute.gen0 : 0;
  const safeGen1 = typeof collectionRatePerMinute?.gen1 === 'number' && isFinite(collectionRatePerMinute.gen1) ? collectionRatePerMinute.gen1 : 0;
  const safeGen2 = typeof collectionRatePerMinute?.gen2 === 'number' && isFinite(collectionRatePerMinute.gen2) ? collectionRatePerMinute.gen2 : 0;

  const gen2PerHour = safeGen2 * 60;
  const gen2Gen0Ratio = safeGen0 > 0 
    ? safeGen2 / safeGen0 
    : 0;

  const isWarning = gen2PerHour >= 5 && gen2PerHour < 10;
  const isCritical = gen2PerHour >= 10;
  const ratioWarning = gen2Gen0Ratio > 0.01;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Coletas</CardTitle>
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
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded border">
                <div className="text-lg font-bold">Gen 0</div>
                <div className="text-sm text-muted-foreground">
                  {safeGen0.toFixed(1)}/min
                </div>
              </div>
              <div className="text-center p-2 rounded border">
                <div className="text-lg font-bold">Gen 1</div>
                <div className="text-sm text-muted-foreground">
                  {safeGen1.toFixed(1)}/min
                </div>
              </div>
              <div className={`text-center p-2 rounded border ${
                isCritical ? 'bg-red-500/10 border-red-500/50' :
                isWarning ? 'bg-yellow-500/10 border-yellow-500/50' :
                'bg-green-500/10 border-green-500/50'
              }`}>
                <div className="text-lg font-bold">Gen 2</div>
                <div className="text-sm font-medium">
                  {safeGen2.toFixed(1)}/min
                </div>
                <div className="text-xs text-muted-foreground">
                  ({gen2PerHour.toFixed(1)}/hora)
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Razão Gen2/Gen0</span>
                <span className={`text-sm font-semibold ${ratioWarning ? 'text-yellow-500' : 'text-green-500'}`}>
                  {gen2Gen0Ratio.toFixed(4)}
                </span>
              </div>
              {ratioWarning && (
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Razão alta indica objetos promovendo muito rápido
                </p>
              )}
            </div>

            {(isWarning || isCritical) && (
              <div className={`flex items-center gap-2 p-2 rounded-md ${
                isCritical ? 'bg-red-500/10 border border-red-500/50' :
                'bg-yellow-500/10 border border-yellow-500/50'
              }`}>
                <AlertTriangle className={`h-4 w-4 ${
                  isCritical ? 'text-red-500' : 'text-yellow-500'
                }`} />
                <p className={`text-xs ${
                  isCritical ? 'text-red-700 dark:text-red-400' :
                  'text-yellow-700 dark:text-yellow-400'
                }`}>
                  {isCritical
                    ? 'Gen 2 coletas muito frequentes. Possível problema de memória.'
                    : 'Gen 2 coletas aumentando. Revisar retenção de objetos.'}
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
