import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Database, TrendingUp, Activity, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { postgresqlApi } from '../../../services/postgresqlApi';
import type { IndexDetails } from '../../../types/postgresql';
import { formatBytes } from '../../../lib/utils';

interface IndexDetailsModalProps {
  connectionId: string;
  schemaName: string;
  tableName: string;
  indexName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IndexDetailsModal({
  connectionId,
  schemaName,
  tableName,
  indexName,
  open,
  onOpenChange,
}: IndexDetailsModalProps) {
  const { data: indexDetails, isLoading, error } = useQuery<IndexDetails>({
    queryKey: ['index-details', connectionId, schemaName, tableName, indexName],
    queryFn: () => postgresqlApi.getIndexDetails(connectionId, schemaName, tableName, indexName),
    enabled: open && !!connectionId,
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto top-[5%] translate-y-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Detalhes do Índice: {indexName}
          </DialogTitle>
          <DialogDescription>
            {schemaName}.{tableName}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando detalhes do índice...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar detalhes do índice: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </AlertDescription>
          </Alert>
        )}

        {indexDetails && (
          <div className="space-y-4">
            {/* Informações Básicas do Índice */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Informações Básicas
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Tamanho do Índice</div>
                  <div className="font-medium">{formatBytes(indexDetails.indexSize)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Tamanho da Tabela</div>
                  <div className="font-medium">{formatBytes(indexDetails.tableSize)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">% da Tabela</div>
                  <div className="font-medium">{indexDetails.indexPercentOfTable.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="mt-1">
                    {indexDetails.isValid ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Válido
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Inválido
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Tipo</div>
                  <div className="mt-1 flex gap-1">
                    {indexDetails.isPrimary && (
                      <Badge variant="default">Primary Key</Badge>
                    )}
                    {indexDetails.isUnique && (
                      <Badge variant="outline">Unique</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Estatísticas de Uso */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Estatísticas de Uso
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Scans do Índice</div>
                  <div className="font-medium text-lg">{indexDetails.indexScans.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Tuplas Lidas</div>
                  <div className="font-medium text-lg">{indexDetails.indexTuplesRead.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Tuplas Obtidas</div>
                  <div className="font-medium text-lg">{indexDetails.indexTuplesFetched.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Uso do Índice</div>
                  <div className="font-medium text-lg">
                    {indexDetails.tableIndexUsageRatio.toFixed(1)}%
                  </div>
                </div>
              </div>
            </Card>

            {/* Comportamento da Tabela */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Comportamento da Tabela
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Seq Scans</div>
                    <div className="font-medium">{indexDetails.tableSeqScans.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Index Scans</div>
                    <div className="font-medium">{indexDetails.tableIndexScans.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Tuplas Vivas</div>
                    <div className="font-medium">{indexDetails.tableLiveTuples.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Tuplas Mortas</div>
                    <div className="font-medium">
                      {indexDetails.tableDeadTuples.toLocaleString()}
                      {indexDetails.tableDeadTupleRatio > 10 && (
                        <Badge variant="destructive" className="ml-2">
                          {indexDetails.tableDeadTupleRatio.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">INSERTs</div>
                    <div className="font-medium">{indexDetails.tableInserts.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">UPDATEs</div>
                    <div className="font-medium">{indexDetails.tableUpdates.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">DELETEs</div>
                    <div className="font-medium">{indexDetails.tableDeletes.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Reorganizações */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reorganizações e Manutenção
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Total de Reorganizações</div>
                    <div className="font-medium text-lg">{indexDetails.totalReorganizations.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      (VACUUM: {indexDetails.vacuumCount + indexDetails.autovacuumCount})
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">VACUUM Manual</div>
                    <div className="font-medium">{indexDetails.vacuumCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">AUTO VACUUM</div>
                    <div className="font-medium">{indexDetails.autovacuumCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">ANALYZE</div>
                    <div className="font-medium">
                      {(indexDetails.analyzeCount + indexDetails.autoanalyzeCount).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-muted-foreground">Último VACUUM Manual</div>
                    <div className="font-medium">
                      {indexDetails.lastVacuum
                        ? new Date(indexDetails.lastVacuum).toLocaleString('pt-BR')
                        : 'Nunca'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Último AUTO VACUUM</div>
                    <div className="font-medium">
                      {indexDetails.lastAutovacuum
                        ? new Date(indexDetails.lastAutovacuum).toLocaleString('pt-BR')
                        : 'Nunca'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Último ANALYZE Manual</div>
                    <div className="font-medium">
                      {indexDetails.lastAnalyze
                        ? new Date(indexDetails.lastAnalyze).toLocaleString('pt-BR')
                        : 'Nunca'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Último AUTO ANALYZE</div>
                    <div className="font-medium">
                      {indexDetails.lastAutoanalyze
                        ? new Date(indexDetails.lastAutoanalyze).toLocaleString('pt-BR')
                        : 'Nunca'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Definição do Índice */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Definição do Índice</h3>
              <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto">
                {indexDetails.indexDefinition}
              </pre>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
