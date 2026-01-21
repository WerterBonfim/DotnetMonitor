import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Package, Pin, Info } from 'lucide-react';
import { formatBytes, formatPercent } from '../../lib/utils';
import { HeapDetailsModal } from '../gc/HeapDetailsModal';

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
  const [lohModalOpen, setLohModalOpen] = useState(false);
  const [pohModalOpen, setPohModalOpen] = useState(false);
  
  const lohPercentage = totalMemoryBytes > 0 ? (lohSizeBytes / totalMemoryBytes) * 100 : 0;
  const pohPercentage = totalMemoryBytes > 0 ? (pohSizeBytes / totalMemoryBytes) * 100 : 0;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-700 dark:text-amber-500" />
                <CardTitle className="text-lg">Large Object Heap (LOH)</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={() => setLohModalOpen(true)}
                title="Informações sobre LOH"
              >
                <Info className="h-4 w-4" />
              </Button>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pin className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg">Pinned Object Heap (POH)</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={() => setPohModalOpen(true)}
                title="Informações sobre POH"
              >
                <Info className="h-4 w-4" />
              </Button>
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
      
      <HeapDetailsModal
        type="LOH"
        sizeBytes={lohSizeBytes}
        totalMemoryBytes={totalMemoryBytes}
        open={lohModalOpen}
        onOpenChange={setLohModalOpen}
      />
      
      <HeapDetailsModal
        type="POH"
        sizeBytes={pohSizeBytes}
        totalMemoryBytes={totalMemoryBytes}
        pinnedObjectsCount={pinnedObjectsCount}
        open={pohModalOpen}
        onOpenChange={setPohModalOpen}
      />
    </>
  );
}
