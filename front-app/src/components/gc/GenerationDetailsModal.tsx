import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Info, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import type { GenerationInfo } from '../../types/gc';
import { formatBytes, formatPercent } from '../../lib/utils';

interface GenerationDetailsModalProps {
  generation: number;
  info: GenerationInfo;
  collectionRate: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getGenerationInfo = (generation: number) => {
  switch (generation) {
    case 0:
      return {
        title: 'Geração 0 (Gen 0)',
        description: 'A geração mais jovem do Garbage Collector. Contém objetos recém-alocados.',
        role: 'Gen 0 é onde a maioria dos objetos de vida curta é alocada. Coletas são muito frequentes e rápidas, tipicamente < 1ms.',
        impact: 'Coletas Gen 0 são extremamente eficientes e têm impacto mínimo na performance. Objetos que sobrevivem são promovidos para Gen 1.',
        thresholds: {
          normal: { value: 'Fragmentação < 10%', description: 'Fragmentação baixa, comportamento normal' },
          warning: { value: 'Fragmentação 10-20%', description: 'Fragmentação moderada, monitorar tendência' },
          critical: { value: 'Fragmentação > 20%', description: 'Fragmentação alta, pode indicar problemas de alocação' },
        },
        collectionRateThresholds: {
          normal: { value: '< 100/min', description: 'Taxa normal de coletas' },
          warning: { value: '100-200/min', description: 'Taxa elevada, monitorar' },
          critical: { value: '> 200/min', description: 'Taxa muito alta, possível problema de alocação' },
        },
        interpretation: 'Gen 0 deve ter coletas frequentes (isso é normal e esperado). Fragmentação baixa indica que objetos estão sendo coletados eficientemente. Alta fragmentação pode indicar objetos de tamanho variado ou alocações irregulares.',
        recommendations: [
          'Se fragmentação > 20%: Revisar padrões de alocação, considerar pool de objetos',
          'Se coletas > 200/min: Investigar alocações excessivas, usar object pooling',
          'Monitorar taxa de promoção para Gen 1 (deve ser baixa)',
          'Objetos de vida curta devem morrer em Gen 0',
        ],
      };
    case 1:
      return {
        title: 'Geração 1 (Gen 1)',
        description: 'Contém objetos que sobreviveram a pelo menos uma coleta Gen 0.',
        role: 'Gen 1 atua como buffer entre Gen 0 e Gen 2. Coletas são menos frequentes que Gen 0, mas ainda relativamente rápidas.',
        impact: 'Coletas Gen 1 têm impacto moderado. Objetos que sobrevivem são promovidos para Gen 2, onde coletas são mais custosas.',
        thresholds: {
          normal: { value: 'Fragmentação < 15%', description: 'Fragmentação controlada' },
          warning: { value: 'Fragmentação 15-25%', description: 'Fragmentação aumentando, atenção necessária' },
          critical: { value: 'Fragmentação > 25%', description: 'Fragmentação alta, investigar retenção de objetos' },
        },
        collectionRateThresholds: {
          normal: { value: '< 20/min', description: 'Taxa normal de coletas' },
          warning: { value: '20-50/min', description: 'Taxa elevada, muitos objetos sobrevivendo Gen 0' },
          critical: { value: '> 50/min', description: 'Taxa muito alta, possível promoção prematura' },
        },
        interpretation: 'Gen 1 deve ter menos coletas que Gen 0. Muitas coletas Gen 1 indicam que muitos objetos estão sobrevivendo Gen 0 quando não deveriam (promoção prematura). Fragmentação moderada é aceitável.',
        recommendations: [
          'Se coletas > 50/min: Investigar por que objetos estão sobrevivendo Gen 0',
          'Se fragmentação > 25%: Revisar retenção de objetos intermediários',
          'Objetos devem morrer em Gen 0 ou Gen 1, não chegar a Gen 2',
          'Considerar reduzir tempo de vida de objetos intermediários',
        ],
      };
    case 2:
      return {
        title: 'Geração 2 (Gen 2)',
        description: 'Contém objetos de longa duração que sobreviveram a múltiplas coletas.',
        role: 'Gen 2 contém objetos de longa duração (cache, singletons, objetos de aplicação). Coletas são raras mas custosas, podendo causar pausas significativas.',
        impact: 'Coletas Gen 2 têm alto impacto na performance. Podem causar pausas de 50-500ms ou mais. Muitas coletas Gen 2 indicam problemas de retenção de memória.',
        thresholds: {
          normal: { value: 'Fragmentação < 20%', description: 'Fragmentação controlada para objetos de longa duração' },
          warning: { value: 'Fragmentação 20-30%', description: 'Fragmentação aumentando, possível memory leak' },
          critical: { value: 'Fragmentação > 30%', description: 'Fragmentação crítica, investigar memory leaks imediatamente' },
        },
        collectionRateThresholds: {
          normal: { value: '< 5/hora', description: 'Coletas esporádicas, comportamento normal' },
          warning: { value: '5-10/hora', description: 'Coletas aumentando, revisar retenção' },
          critical: { value: '> 10/hora', description: 'Coletas muito frequentes, possível memory leak' },
        },
        interpretation: 'Gen 2 deve ter coletas raras. Muitas coletas Gen 2 indicam que objetos estão sendo promovidos prematuramente ou há memory leaks. Fragmentação alta em Gen 2 é especialmente problemática pois pode causar pausas longas.',
        recommendations: [
          'Se coletas > 10/hora: Investigar memory leaks, revisar retenção de objetos',
          'Se fragmentação > 30%: Executar análise de heap, identificar objetos retidos',
          'Monitorar crescimento do heap após Gen 2 GCs (deve estabilizar)',
          'Considerar usar GC Server mode para aplicações de servidor',
          'Revisar uso de cache e singletons que podem estar retendo objetos',
        ],
      };
    default:
      return {
        title: `Geração ${generation}`,
        description: 'Informações sobre esta geração do Garbage Collector.',
        role: '',
        impact: '',
        thresholds: {
          normal: { value: '', description: '' },
          warning: { value: '', description: '' },
          critical: { value: '', description: '' },
        },
        collectionRateThresholds: {
          normal: { value: '', description: '' },
          warning: { value: '', description: '' },
          critical: { value: '', description: '' },
        },
        interpretation: '',
        recommendations: [],
      };
  }
};

export function GenerationDetailsModal({
  generation,
  info,
  collectionRate,
  open,
  onOpenChange,
}: GenerationDetailsModalProps) {
  const genInfo = getGenerationInfo(generation);
  const fragmentationStatus = info.fragmentationPercent < (generation === 0 ? 10 : generation === 1 ? 15 : 20)
    ? 'normal'
    : info.fragmentationPercent < (generation === 0 ? 20 : generation === 1 ? 25 : 30)
    ? 'warning'
    : 'critical';

  const collectionRateStatus = generation === 2
    ? (collectionRate < 5 ? 'normal' : collectionRate < 10 ? 'warning' : 'critical')
    : (generation === 0
        ? (collectionRate < 100 ? 'normal' : collectionRate < 200 ? 'warning' : 'critical')
        : (collectionRate < 20 ? 'normal' : collectionRate < 50 ? 'warning' : 'critical'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto top-[5%] translate-y-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {genInfo.title}
          </DialogTitle>
          <DialogDescription>{genInfo.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Informações Básicas */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Tamanho</div>
                <div className="font-medium">{formatBytes(info.sizeAfterBytes)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Fragmentação</div>
                <div className="font-medium">{formatPercent(info.fragmentationPercent)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Bytes Fragmentados</div>
                <div className="font-medium">{formatBytes(info.fragmentedBytes)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total de Coletas</div>
                <div className="font-medium">{info.collectionCount.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          {/* Taxa de Coleta */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taxa de Coleta
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Coletas por minuto</span>
                <span className="font-medium text-lg">
                  {generation === 2 ? `${collectionRate.toFixed(1)}/hora` : `${collectionRate.toFixed(1)}/min`}
                </span>
              </div>
              <Alert
                variant={collectionRateStatus === 'critical' ? 'destructive' : collectionRateStatus === 'warning' ? 'default' : 'default'}
                className={
                  collectionRateStatus === 'critical'
                    ? 'border-red-500/50 bg-red-500/10'
                    : collectionRateStatus === 'warning'
                    ? 'border-yellow-500/50 bg-yellow-500/10'
                    : 'border-green-500/50 bg-green-500/10'
                }
              >
                <AlertDescription>
                  <strong>Status:</strong>{' '}
                  {collectionRateStatus === 'critical'
                    ? 'Crítico'
                    : collectionRateStatus === 'warning'
                    ? 'Atenção'
                    : 'Normal'}
                  {' - '}
                  {genInfo.collectionRateThresholds[collectionRateStatus].description}
                </AlertDescription>
              </Alert>
            </div>
          </Card>

          {/* Impacto na Performance */}
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <span>📊</span> Impacto na Performance
            </h3>
            <p className="text-sm text-muted-foreground mb-2">{genInfo.role}</p>
            <p className="text-sm text-muted-foreground">{genInfo.impact}</p>
          </div>

          {/* Thresholds Recomendados */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Thresholds Recomendados</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-green-500/10 border-green-500/50">
                <Badge variant="success" className="mt-0.5">Normal</Badge>
                <div className="flex-1">
                  <div className="font-medium">{genInfo.thresholds.normal.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {genInfo.thresholds.normal.description}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/50">
                <Badge variant="warning" className="mt-0.5">Atenção</Badge>
                <div className="flex-1">
                  <div className="font-medium">{genInfo.thresholds.warning.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {genInfo.thresholds.warning.description}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-red-500/10 border-red-500/50">
                <Badge variant="danger" className="mt-0.5">Crítico</Badge>
                <div className="flex-1">
                  <div className="font-medium">{genInfo.thresholds.critical.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {genInfo.thresholds.critical.description}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Atual */}
          <Alert
            variant={fragmentationStatus === 'critical' ? 'destructive' : fragmentationStatus === 'warning' ? 'default' : 'default'}
            className={
              fragmentationStatus === 'critical'
                ? 'border-red-500/50 bg-red-500/10'
                : fragmentationStatus === 'warning'
                ? 'border-yellow-500/50 bg-yellow-500/10'
                : 'border-green-500/50 bg-green-500/10'
            }
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Status Atual:</strong> Fragmentação de {formatPercent(info.fragmentationPercent)} -{' '}
              {fragmentationStatus === 'critical'
                ? 'Crítico'
                : fragmentationStatus === 'warning'
                ? 'Atenção'
                : 'Normal'}
            </AlertDescription>
          </Alert>

          {/* Interpretação */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Como interpretar</h3>
            <p className="text-sm text-muted-foreground">{genInfo.interpretation}</p>
          </div>

          {/* Ações Recomendadas */}
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <span>⚙️</span> Ações Recomendadas
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {genInfo.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
