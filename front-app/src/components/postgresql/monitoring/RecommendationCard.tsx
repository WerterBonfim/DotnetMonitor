import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Copy, Lightbulb, Trash2, Database } from 'lucide-react';
import { toast } from '../../ui/toaster';
import type { IndexRecommendation } from '../../../types/postgresql';

interface RecommendationCardProps {
  recommendation: IndexRecommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const getIcon = () => {
    switch (recommendation.recommendationType) {
      case 'create_index':
        return Database;
      case 'remove_index':
        return Trash2;
      case 'analyze_table':
        return Lightbulb;
      default:
        return Lightbulb;
    }
  };

  const getImpactColor = () => {
    switch (recommendation.expectedImpact) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(recommendation.sqlScript);
    toast({
      title: 'SQL Copiado',
      description: 'O script SQL foi copiado para a área de transferência',
      variant: 'success',
    });
  };

  const Icon = getIcon();

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <h4 className="font-semibold">
              {recommendation.schemaName}.{recommendation.tableName}
              {recommendation.columnName && (
                <span className="text-muted-foreground">.{recommendation.columnName}</span>
              )}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">{recommendation.reason}</p>
          </div>
        </div>
        <Badge variant={getImpactColor()}>
          Impacto {recommendation.expectedImpact === 'high' ? 'Alto' : recommendation.expectedImpact === 'medium' ? 'Médio' : 'Baixo'}
        </Badge>
      </div>

      <div className="mt-4 p-3 bg-muted/50 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">SQL Sugerido:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopySQL}
            className="h-6 px-2 text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copiar
          </Button>
        </div>
        <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
          {recommendation.sqlScript}
        </pre>
      </div>
    </Card>
  );
}
