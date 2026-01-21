import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp, Code, FileText, MapPin } from 'lucide-react';
import type { AllocationOrigin } from '../../types/gc';

interface AllocationOriginInfoProps {
  allocationOrigins: AllocationOrigin[];
}

export function AllocationOriginInfo({
  allocationOrigins,
}: AllocationOriginInfoProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!allocationOrigins || allocationOrigins.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-3 rounded border bg-muted/50">
        Nenhuma origem capturada. Inicie o rastreamento e execute ações na aplicação.
      </div>
    );
  }

  const isDeveloperCode = (ns: string | null) => {
    if (!ns) return false;
    return (
      !ns.startsWith('System.') &&
      !ns.startsWith('Microsoft.') &&
      !ns.startsWith('<') &&
      ns !== 'Unknown'
    );
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium mb-2">
        Origens de Alocação ({allocationOrigins.length})
      </div>
      {allocationOrigins.map((origin, index) => {
        const isDevCode = isDeveloperCode(origin.namespace);
        const isExpanded = expandedIndex === index;

        return (
          <div
            key={index}
            className="border rounded-lg p-3 space-y-2 bg-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {origin.className ? `${origin.className}.` : ''}
                    {origin.methodName}
                  </span>
                  {isDevCode && (
                    <Badge variant="success" className="text-xs">
                      Código do Dev
                    </Badge>
                  )}
                  {!isDevCode && origin.namespace && (
                    <Badge variant="secondary" className="text-xs">
                      Framework
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {origin.allocationCount} alocação{origin.allocationCount !== 1 ? 'ões' : ''}
                  </Badge>
                </div>
                {origin.namespace && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Code className="h-3 w-3" />
                    {origin.namespace}
                  </div>
                )}
                {origin.fileName && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {origin.fileName}
                    {origin.lineNumber && (
                      <>
                        <span className="mx-1">:</span>
                        <MapPin className="h-3 w-3" />
                        {origin.lineNumber}
                      </>
                    )}
                  </div>
                )}
              </div>
              {origin.stackFrames && origin.stackFrames.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setExpandedIndex(isExpanded ? null : index)
                  }
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Stack trace expandido */}
            {isExpanded && origin.stackFrames && origin.stackFrames.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Stack Trace:
                </div>
                <div className="bg-muted/50 rounded p-2 font-mono text-xs space-y-0.5 max-h-40 overflow-y-auto">
                  {origin.stackFrames.slice(0, 10).map((frame, frameIndex) => (
                    <div key={frameIndex} className="text-muted-foreground">
                      {frameIndex + 1}. {frame}
                    </div>
                  ))}
                  {origin.stackFrames.length > 10 && (
                    <div className="text-muted-foreground italic">
                      ... e mais {origin.stackFrames.length - 10} frames
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
