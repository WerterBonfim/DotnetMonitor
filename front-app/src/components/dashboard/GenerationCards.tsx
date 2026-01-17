import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { GenerationInfo } from '../../types/gc';
import { formatBytes, formatPercent } from '../../lib/utils';

interface GenerationCardProps {
  generation: number;
  info: GenerationInfo;
}

function GenerationCard({ generation, info }: GenerationCardProps) {
  const getStatus = () => {
    if (info.fragmentationPercent < 10) return 'success';
    if (info.fragmentationPercent < 20) return 'warning';
    return 'danger';
  };

  const statusLabel = info.fragmentationPercent < 10 ? 'OK' : 'Alerta';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Gen {generation}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-sm text-muted-foreground">Tamanho</div>
          <div className="text-lg font-semibold">{formatBytes(info.sizeAfterBytes)}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Fragmentação</div>
          <div className="text-lg font-semibold">{formatPercent(info.fragmentationPercent)}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Coletas</div>
          <div className="text-lg font-semibold">{info.collectionCount}</div>
        </div>
        <div className="pt-2">
          <Badge variant={getStatus()}>{statusLabel}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface GenerationCardsProps {
  gen0: GenerationInfo;
  gen1: GenerationInfo;
  gen2: GenerationInfo;
}

export function GenerationCards({ gen0, gen1, gen2 }: GenerationCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <GenerationCard generation={0} info={gen0} />
      <GenerationCard generation={1} info={gen1} />
      <GenerationCard generation={2} info={gen2} />
    </div>
  );
}
