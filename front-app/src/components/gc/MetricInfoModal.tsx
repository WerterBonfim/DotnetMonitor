import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';

export interface MetricInfo {
  title: string;
  description: string;
  importance: string;
  thresholds: {
    normal: { value: string; description: string };
    warning: { value: string; description: string };
    critical: { value: string; description: string };
  };
  interpretation: string;
}

interface MetricInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricInfo: MetricInfo;
}

export function MetricInfoModal({ open, onOpenChange, metricInfo }: MetricInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto top-[5%] translate-y-0">
        <DialogHeader>
          <DialogTitle className="text-2xl">{metricInfo.title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {metricInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Por que é importante?</h3>
            <p className="text-sm text-muted-foreground">{metricInfo.importance}</p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Thresholds Recomendados</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-green-500/10 border-green-500/50">
                <Badge variant="success" className="mt-0.5">Normal</Badge>
                <div className="flex-1">
                  <div className="font-medium">{metricInfo.thresholds.normal.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {metricInfo.thresholds.normal.description}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/50">
                <Badge variant="warning" className="mt-0.5">Atenção</Badge>
                <div className="flex-1">
                  <div className="font-medium">{metricInfo.thresholds.warning.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {metricInfo.thresholds.warning.description}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-red-500/10 border-red-500/50">
                <Badge variant="danger" className="mt-0.5">Crítico</Badge>
                <div className="flex-1">
                  <div className="font-medium">{metricInfo.thresholds.critical.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {metricInfo.thresholds.critical.description}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Como interpretar</h3>
            <p className="text-sm text-muted-foreground">{metricInfo.interpretation}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
