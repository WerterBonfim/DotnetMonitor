import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { AlertTriangle, Info, Clock, Database, Zap } from 'lucide-react';
import type { QueryHistory } from '../../../types/postgresql';

interface QueryHistoryTableProps {
  queryHistory: QueryHistory[];
}

export function QueryHistoryTable({ queryHistory }: QueryHistoryTableProps) {
  if (queryHistory.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Nenhuma query no histórico. As queries serão salvas automaticamente quando coletadas.
      </Card>
    );
  }

  const getImpactBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getImpactIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return AlertTriangle;
      case 'medium':
        return Info;
      default:
        return Info;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Histórico de Queries</h3>
        <Badge variant="secondary">{queryHistory.length} queries</Badge>
      </div>

      <div className="space-y-4">
        {queryHistory.map((query) => {
          const ImpactIcon = getImpactIcon(query.impactLevel);
          const totalBlks = query.sharedBlksHit + query.sharedBlksRead;
          const cacheHitRatio = totalBlks > 0 
            ? ((query.sharedBlksHit / totalBlks) * 100).toFixed(1)
            : '100.0';

          return (
            <Card key={query.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <ImpactIcon className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={getImpactBadgeVariant(query.impactLevel)}>
                    {query.impactLevel.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(query.executedAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Impacto:</p>
                <p className="text-xs text-muted-foreground">{query.impactDescription}</p>
              </div>

              <div className="mb-3">
                <pre className="text-xs overflow-x-auto bg-muted/50 p-3 rounded-md font-mono whitespace-pre-wrap break-words">
                  {query.query}
                </pre>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{query.meanTime.toFixed(2)}ms</div>
                    <div className="text-muted-foreground">Tempo médio</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{query.calls.toLocaleString()}</div>
                    <div className="text-muted-foreground">Chamadas</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{cacheHitRatio}%</div>
                    <div className="text-muted-foreground">Cache Hit</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{query.rows.toLocaleString()}</div>
                    <div className="text-muted-foreground">Linhas</div>
                  </div>
                </div>
              </div>

              {(query.tempBlksRead > 0 || query.tempBlksWritten > 0) && (
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    ⚠️ Esta query utiliza arquivos temporários (temp blocks: {query.tempBlksRead} lidos, {query.tempBlksWritten} escritos)
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
