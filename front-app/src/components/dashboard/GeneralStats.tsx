import { Card, CardContent } from '../ui/card';
import { formatBytes, formatPercent } from '../../lib/utils';

interface GeneralStatsProps {
  totalMemoryBytes: number;
  availableMemoryBytes: number;
  overallFragmentationPercent: number;
  pinnedObjectsCount: number;
}

export function GeneralStats({
  totalMemoryBytes,
  availableMemoryBytes,
  overallFragmentationPercent,
  pinnedObjectsCount,
}: GeneralStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Memória Total</div>
          <div className="text-2xl font-bold">{formatBytes(totalMemoryBytes)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Memória Disponível</div>
          <div className="text-2xl font-bold">{formatBytes(availableMemoryBytes)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Fragmentação Geral</div>
          <div className="text-2xl font-bold">{formatPercent(overallFragmentationPercent)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Objetos Pinned</div>
          <div className="text-2xl font-bold">{pinnedObjectsCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
