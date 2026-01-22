import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  Table,
  Database,
  Repeat,
  GitBranch,
  Filter,
  ArrowUpDown,
  Zap,
  Search,
  Layers,
  Network,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import type { QueryPlanNodeData } from '../../../lib/queryPlanTransformer';

const nodeTypeIcons: Record<string, LucideIcon> = {
  'Seq Scan': Table,
  'Index Scan': Database,
  'Index Only Scan': Zap,
  'Bitmap Index Scan': Search,
  'Bitmap Heap Scan': Layers,
  'Nested Loop': Repeat,
  'Hash Join': GitBranch,
  'Merge Join': Network,
  'Filter': Filter,
  'Sort': ArrowUpDown,
  'Limit': FileText,
  'Aggregate': Layers,
  'Group': Layers,
  'Hash': GitBranch,
  'Materialize': Database,
  'CTE Scan': Search,
  'Subquery Scan': Search,
  'Function Scan': Zap,
  'Values Scan': Table,
};

function getNodeIcon(nodeType: string): LucideIcon {
  return nodeTypeIcons[nodeType] || Database;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return num.toFixed(0);
}

function formatTime(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${ms.toFixed(2)}ms`;
}

export const QueryPlanNode = memo(function QueryPlanNode({
  data,
  selected,
}: NodeProps<QueryPlanNodeData>) {
  const Icon = getNodeIcon(data.nodeType);

  return (
    <div
      className={`bg-card border-2 rounded-lg shadow-lg min-w-[280px] transition-all ${
        selected ? 'border-primary shadow-xl' : 'border-border'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="p-4 space-y-3">
        {/* Header com ícone e tipo */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <Badge variant="outline" className="text-xs font-semibold">
              {data.nodeType}
            </Badge>
          </div>
        </div>

        {/* Nome da relação/tabela */}
        {data.relationName && (
          <div className="text-sm">
            <span className="text-muted-foreground">Tabela: </span>
            <span className="font-medium">{data.relationName}</span>
            {data.alias && data.alias !== data.relationName && (
              <span className="text-muted-foreground"> ({data.alias})</span>
            )}
          </div>
        )}

        {/* Barra de progresso do custo */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Peso no custo total</span>
            <span>{data.costPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={data.costPercentage} className="h-2" />
        </div>

        {/* Informações de custo */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Custo: </span>
            <span className="font-medium">
              {data.cost.startup.toFixed(2)}..{data.cost.total.toFixed(2)}
            </span>
          </div>
          {data.actualTime && (
            <div>
              <span className="text-muted-foreground">Tempo: </span>
              <span className="font-medium">
                {formatTime(data.actualTime.first)}..{formatTime(data.actualTime.total)}
              </span>
            </div>
          )}
        </div>

        {/* Informações de linhas */}
        <div className="text-xs">
          <span className="text-muted-foreground">Linhas: </span>
          <span className="font-medium">
            {formatNumber(data.rows.estimated)}
            {data.rows.actual !== undefined && (
              <span className="text-muted-foreground">
                {' '}
                (real: {formatNumber(data.rows.actual)})
              </span>
            )}
          </span>
        </div>

        {/* Buffers (se disponível) */}
        {data.buffers && (
          <div className="text-xs text-muted-foreground">
            <div>
              Cache: {formatNumber(data.buffers.sharedHit)} hit,{' '}
              {formatNumber(data.buffers.sharedRead)} read
            </div>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});
