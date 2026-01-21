import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Info } from 'lucide-react';
import type { GenerationInfo, CollectionRatePerMinute } from '../../types/gc';
import { formatBytes, formatPercent } from '../../lib/utils';
import { GenerationDetailsModal } from '../gc/GenerationDetailsModal';

interface GenerationCardProps {
  generation: number;
  info: GenerationInfo;
  collectionRate: number;
}

function GenerationCard({ generation, info, collectionRate }: GenerationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatus = () => {
    if (info.fragmentationPercent < 10) return 'success';
    if (info.fragmentationPercent < 20) return 'warning';
    return 'danger';
  };

  const statusLabel = info.fragmentationPercent < 10 ? 'OK' : 'Alerta';

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Gen {generation}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={() => setIsModalOpen(true)}
            title={`Informações sobre Gen ${generation}`}
          >
            <Info className="h-4 w-4" />
          </Button>
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
      <GenerationDetailsModal
        generation={generation}
        info={info}
        collectionRate={collectionRate}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}

interface GenerationCardsProps {
  gen0: GenerationInfo;
  gen1: GenerationInfo;
  gen2: GenerationInfo;
  collectionRatePerMinute: CollectionRatePerMinute;
}

export function GenerationCards({ gen0, gen1, gen2, collectionRatePerMinute }: GenerationCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <GenerationCard generation={0} info={gen0} collectionRate={collectionRatePerMinute.gen0} />
      <GenerationCard generation={1} info={gen1} collectionRate={collectionRatePerMinute.gen1} />
      <GenerationCard generation={2} info={gen2} collectionRate={collectionRatePerMinute.gen2} />
    </div>
  );
}
