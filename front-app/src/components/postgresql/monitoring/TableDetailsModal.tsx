import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Database, TrendingUp, Activity, RefreshCw, AlertTriangle, CheckCircle, Info, Columns } from 'lucide-react';
import { postgresqlApi } from '../../../services/postgresqlApi';
import type { TableDetails } from '../../../types/postgresql';
import { formatBytes } from '../../../lib/utils';

interface TableDetailsModalProps {
  connectionId: string;
  schemaName: string;
  tableName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TableDetailsModal({
  connectionId,
  schemaName,
  tableName,
  open,
  onOpenChange,
}: TableDetailsModalProps) {
  const { data: tableDetails, isLoading, error } = useQuery<TableDetails>({
    queryKey: ['table-details', connectionId, schemaName, tableName],
    queryFn: () => postgresqlApi.getTableDetails(connectionId, schemaName, tableName),
    enabled: open && !!connectionId,
  });

  if (!open) return null;

  const getImpactBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical':
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto top-[5%] translate-y-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Detalhes da Tabela: {tableName}
          </DialogTitle>
          <DialogDescription>
            {schemaName}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando detalhes da tabela...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar detalhes da tabela: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </AlertDescription>
          </Alert>
        )}

        {tableDetails && (
          <div className="space-y-4">
            {/* Impacto */}
            <Alert variant={getImpactBadgeVariant(tableDetails.impactLevel) === 'destructive' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center gap-2 mb-1">
                  <strong>Nível de Impacto:</strong>
                  <Badge variant={getImpactBadgeVariant(tableDetails.impactLevel)}>
                    {tableDetails.impactLevel.toUpperCase()}
                  </Badge>
                </div>
                <div>{tableDetails.impactDescription}</div>
              </AlertDescription>
            </Alert>

            {/* Informações Básicas */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Informações Básicas
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Tamanho Total</div>
                  <div className="font-medium">{formatBytes(tableDetails.totalSize)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Tamanho da Tabela</div>
                  <div className="font-medium">{formatBytes(tableDetails.tableSize)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Tamanho dos Índices</div>
                  <div className="font-medium">{formatBytes(tableDetails.indexSize)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total de Linhas</div>
                  <div className="font-medium">{tableDetails.rowCount.toLocaleString()}</div>
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
                  <div className="text-xs text-muted-foreground">Seq Scans</div>
                  <div className="font-medium text-lg">{tableDetails.seqScans.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Index Scans</div>
                  <div className="font-medium text-lg">{tableDetails.indexScans.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Uso do Índice</div>
                  <div className="font-medium text-lg">
                    {tableDetails.indexUsageRatio.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Cache Hit Ratio</div>
                  <div className="font-medium text-lg">
                    {tableDetails.cacheHitRatio.toFixed(1)}%
                  </div>
                </div>
              </div>
            </Card>

            {/* Tuplas e Operações */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Tuplas e Operações
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Tuplas Vivas</div>
                    <div className="font-medium">{tableDetails.liveTuples.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Tuplas Mortas</div>
                    <div className="font-medium">
                      {tableDetails.deadTuples.toLocaleString()}
                      {tableDetails.deadTupleRatio > 10 && (
                        <Badge variant="destructive" className="ml-2">
                          {tableDetails.deadTupleRatio.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">INSERTs</div>
                    <div className="font-medium">{tableDetails.inserts.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">UPDATEs</div>
                    <div className="font-medium">{tableDetails.updates.toLocaleString()}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">DELETEs</div>
                    <div className="font-medium">{tableDetails.deletes.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Tuplas Lidas (Seq)</div>
                    <div className="font-medium">{tableDetails.seqTupRead.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Tuplas Obtidas (Idx)</div>
                    <div className="font-medium">{tableDetails.indexTupFetch.toLocaleString()}</div>
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
                    <div className="font-medium text-lg">{tableDetails.totalReorganizations.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      (VACUUM: {tableDetails.vacuumCount + tableDetails.autovacuumCount})
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">VACUUM Manual</div>
                    <div className="font-medium">{tableDetails.vacuumCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">AUTO VACUUM</div>
                    <div className="font-medium">{tableDetails.autovacuumCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">ANALYZE</div>
                    <div className="font-medium">
                      {(tableDetails.analyzeCount + tableDetails.autoanalyzeCount).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-muted-foreground">Último VACUUM Manual</div>
                    <div className="font-medium">
                      {tableDetails.lastVacuum
                        ? new Date(tableDetails.lastVacuum).toLocaleString('pt-BR')
                        : 'Nunca'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Último AUTO VACUUM</div>
                    <div className="font-medium">
                      {tableDetails.lastAutovacuum
                        ? new Date(tableDetails.lastAutovacuum).toLocaleString('pt-BR')
                        : 'Nunca'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Último ANALYZE Manual</div>
                    <div className="font-medium">
                      {tableDetails.lastAnalyze
                        ? new Date(tableDetails.lastAnalyze).toLocaleString('pt-BR')
                        : 'Nunca'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Último AUTO ANALYZE</div>
                    <div className="font-medium">
                      {tableDetails.lastAutoanalyze
                        ? new Date(tableDetails.lastAutoanalyze).toLocaleString('pt-BR')
                        : 'Nunca'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Colunas */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Columns className="h-4 w-4" />
                Colunas ({tableDetails.columns.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-center p-2">Nullable</th>
                      <th className="text-left p-2">Default</th>
                      <th className="text-center p-2">Primary Key</th>
                      <th className="text-left p-2">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableDetails.columns.map((column, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{column.columnName}</td>
                        <td className="p-2 font-mono text-xs">
                          {column.dataType}
                          {column.characterMaximumLength && `(${column.characterMaximumLength})`}
                          {column.numericPrecision && column.numericScale && 
                            `(${column.numericPrecision},${column.numericScale})`}
                          {column.numericPrecision && !column.numericScale && 
                            `(${column.numericPrecision})`}
                        </td>
                        <td className="p-2 text-center">
                          {column.isNullable ? (
                            <Badge variant="outline">Sim</Badge>
                          ) : (
                            <Badge variant="secondary">Não</Badge>
                          )}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {column.defaultValue || '-'}
                        </td>
                        <td className="p-2 text-center">
                          {column.isPrimaryKey ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              PK
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {column.characterMaximumLength && `Max length: ${column.characterMaximumLength}`}
                          {column.numericPrecision && `Precision: ${column.numericPrecision}`}
                          {column.numericScale && ` Scale: ${column.numericScale}`}
                          {!column.characterMaximumLength && !column.numericPrecision && '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
