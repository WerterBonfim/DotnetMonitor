import { useQuery } from '@tanstack/react-query';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Database, Info, CheckCircle, XCircle, BookOpen, Code, TrendingUp, AlertTriangle } from 'lucide-react';
import { postgresqlApi } from '../../../services/postgresqlApi';
import type { IndexTypeInfo } from '../../../types/postgresql';
import { formatBytes } from '../../../lib/utils';
import { RefreshCw } from 'lucide-react';

interface IndexTypesGuideProps {
  connectionId: string;
}

export function IndexTypesGuide({ connectionId }: IndexTypesGuideProps) {
  const { data: indexTypesInfo = [], isLoading, error } = useQuery<IndexTypeInfo[]>({
    queryKey: ['index-types-info', connectionId],
    queryFn: () => postgresqlApi.getIndexTypesInfo(connectionId),
    enabled: !!connectionId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando informações sobre tipos de índices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar informações sobre tipos de índices: {error instanceof Error ? error.message : 'Erro desconhecido'}
        </AlertDescription>
      </Alert>
    );
  }

  const usedTypes = indexTypesInfo.filter(it => it.isUsed);
  const unusedTypes = indexTypesInfo.filter(it => !it.isUsed);

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Resumo de Tipos de Índices</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Total de Tipos</div>
            <div className="font-medium text-lg">{indexTypesInfo.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tipos em Uso</div>
            <div className="font-medium text-lg text-green-600">{usedTypes.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tipos Não Utilizados</div>
            <div className="font-medium text-lg text-muted-foreground">{unusedTypes.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Armazenado</div>
            <div className="font-medium text-lg">
              {formatBytes(usedTypes.reduce((sum, it) => sum + it.totalSize, 0))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tipos em Uso */}
      {usedTypes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Tipos de Índices em Uso ({usedTypes.length})
          </h3>
          <div className="space-y-4">
            {usedTypes.map((indexType) => (
              <IndexTypeCard key={indexType.indexType} indexType={indexType} />
            ))}
          </div>
        </div>
      )}

      {/* Todos os Tipos Disponíveis */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Guia Completo de Tipos de Índices
        </h3>
        <div className="space-y-4">
          {indexTypesInfo.map((indexType) => (
            <IndexTypeCard key={indexType.indexType} indexType={indexType} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface IndexTypeCardProps {
  indexType: IndexTypeInfo;
}

function IndexTypeCard({ indexType }: IndexTypeCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-lg font-semibold flex items-center gap-2">
              {indexType.indexTypeName}
              {indexType.isUsed ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Em Uso ({indexType.usageCount})
                </Badge>
              ) : (
                <Badge variant="outline">
                  <XCircle className="h-3 w-3 mr-1" />
                  Não Utilizado
                </Badge>
              )}
            </h4>
            {indexType.isUsed && (
              <div className="text-sm text-muted-foreground mt-1">
                Tamanho total: {formatBytes(indexType.totalSize)} • {indexType.usageCount} índice(s)
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Descrição */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Descrição</span>
          </div>
          <p className="text-sm text-muted-foreground">{indexType.description}</p>
        </div>

        {/* Quando Usar */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Quando Usar</span>
          </div>
          <p className="text-sm text-muted-foreground">{indexType.whenToUse}</p>
        </div>

        {/* Vantagens e Desvantagens */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">Vantagens</span>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200">{indexType.advantages}</p>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-900 dark:text-orange-100">Limitações</span>
            </div>
            <p className="text-sm text-orange-800 dark:text-orange-200">{indexType.disadvantages}</p>
          </div>
        </div>

        {/* Exemplo */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Exemplo de Uso</span>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <code className="text-xs font-mono text-foreground">{indexType.example}</code>
          </div>
        </div>
      </div>
    </Card>
  );
}
