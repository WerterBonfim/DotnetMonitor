import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Info } from 'lucide-react';
import { formatRate } from '../../lib/utils';
import { MetricInfoModal, type MetricInfo } from './MetricInfoModal';

interface AllocationRateCardProps {
  allocationRateBytesPerSecond: number;
}

const metricInfo: MetricInfo = {
  title: 'Taxa de Alocação',
  description: 'Total de bytes alocados no heap gerenciado por segundo.',
  importance:
    'Taxa de alocação indica intensidade do workload. Spikes indicam operações custosas. Comparação com heap size atual revela taxa de sobrevivência de objetos.',
  thresholds: {
    normal: {
      value: 'Variável',
      description: 'Depende do workload da aplicação',
    },
    warning: {
      value: 'Spikes súbitos',
      description: 'Aumentos súbitos não relacionados a carga normal',
    },
    critical: {
      value: 'Alta taxa sustentada',
      description: 'Taxa muito alta causando coletas frequentes',
    },
  },
  interpretation:
    'Não há um valor absoluto "correto", mas mudanças súbitas ou taxas muito altas podem indicar problemas. Comparar com taxa de coleta: razão alta indica muitos objetos morrendo rápido (normal), razão baixa indica objetos vivendo muito tempo (pode ser problema).',
};

export function AllocationRateCard({ allocationRateBytesPerSecond }: AllocationRateCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Validar valor
  const validRate = typeof allocationRateBytesPerSecond === 'number' && isFinite(allocationRateBytesPerSecond) && allocationRateBytesPerSecond >= 0
    ? allocationRateBytesPerSecond 
    : 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Alocação</CardTitle>
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
              <div className="text-3xl font-bold">{formatRate(validRate)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Bytes alocados por segundo
              </p>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Taxa de alocação indica a intensidade do workload. 
                Spikes podem indicar operações custosas ou problemas de design.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <MetricInfoModal open={isModalOpen} onOpenChange={setIsModalOpen} metricInfo={metricInfo} />
    </>
  );
}
