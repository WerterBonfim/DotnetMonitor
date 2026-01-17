import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Package, Pin } from 'lucide-react';
import { formatBytes, formatPercent } from '../../lib/utils';

interface SpecialHeapsProps {
  lohSizeBytes: number;
  pohSizeBytes: number;
  totalMemoryBytes: number;
  pinnedObjectsCount: number;
}

export function SpecialHeaps({
  lohSizeBytes,
  pohSizeBytes,
  totalMemoryBytes,
  pinnedObjectsCount,
}: SpecialHeapsProps) {
  const lohPercentage = totalMemoryBytes > 0 ? (lohSizeBytes / totalMemoryBytes) * 100 : 0;
  const pohPercentage = totalMemoryBytes > 0 ? (pohSizeBytes / totalMemoryBytes) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-700 dark:text-amber-500" />
            <CardTitle className="text-lg">Large Object Heap (LOH)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground">Tamanho</div>
            <div className="text-lg font-semibold">{formatBytes(lohSizeBytes)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-2">
              Uso em relação ao Heap Total
            </div>
            <Progress value={lohPercentage} className="h-2" />
            <div className="text-sm text-muted-foreground mt-1">
              {formatPercent(lohPercentage)}
            </div>
          </div>
          <div className="pt-2">
            <Badge variant="success">OK</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Pin className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg">Pinned Object Heap (POH)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground">Tamanho</div>
            <div className="text-lg font-semibold">{formatBytes(pohSizeBytes)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-2">
              Uso em relação ao Heap Total
            </div>
            <Progress value={pohPercentage} className="h-2" />
            <div className="text-sm text-muted-foreground mt-1">
              {formatPercent(pohPercentage)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Objetos Pinned</div>
            <div className="text-lg font-semibold">{pinnedObjectsCount}</div>
          </div>
          <div className="pt-2">
            <Badge variant="success">OK</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
