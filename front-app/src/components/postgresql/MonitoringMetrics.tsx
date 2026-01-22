import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { postgresqlApi } from '../../services/postgresqlApi';
import type { PostgresConnection } from '../../types/postgresql';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RefreshCw, Database, Lightbulb, Zap, Search, Table as TableIcon, Activity, Lock, HardDrive, History, AlertTriangle, Info, FileText } from 'lucide-react';
import { toast } from '../ui/toaster';
import { MonitoringDashboard } from './monitoring/MonitoringDashboard';
import { IndexStatsTable } from './monitoring/IndexStatsTable';
import { RecommendationCard } from './monitoring/RecommendationCard';
import { EfficiencyGauge } from './monitoring/EfficiencyGauge';
import { QueryDetailsTable } from './monitoring/QueryDetailsTable';
import { TransactionsTable } from './monitoring/TransactionsTable';
import { LocksVisualization } from './monitoring/LocksVisualization';
import { WalStatsCard } from './monitoring/WalStatsCard';
import { TablespacesList } from './monitoring/TablespacesList';
import { MemoryConfigCard } from './monitoring/MemoryConfigCard';
import { HistoricalMetricsChart } from './monitoring/HistoricalMetricsChart';
import { HistoricalMetricsTable } from './monitoring/HistoricalMetricsTable';
import { PgStatStatementsInfo } from './PgStatStatementsInfo';
import { EfficiencyInfoButton } from './monitoring/EfficiencyInfoButton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { QueryHistoryTable } from './monitoring/QueryHistoryTable';
import { PostgresLogsViewer } from './monitoring/PostgresLogsViewer';
import { formatBytes } from '../../lib/utils';

interface MonitoringMetricsProps {
  connections: PostgresConnection[];
}

export function MonitoringMetrics({ connections }: MonitoringMetricsProps) {
  // Encontrar conexão padrão ou usar a primeira
  const defaultConnection = connections.find(c => c.isDefault) || connections[0];
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>(
    defaultConnection?.id || ''
  );
  const [isCollecting, setIsCollecting] = useState(false);
  const [showPgStatInfo, setShowPgStatInfo] = useState(false);
  const [historicalPeriod, setHistoricalPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [pollingInterval, setPollingInterval] = useState<number>(3000); // Padrão: 3 segundos
  const [pollingEnabled, setPollingEnabled] = useState<boolean>(true);
  const queryClient = useQueryClient();

  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ['postgresql-metrics', selectedConnectionId],
    queryFn: () => postgresqlApi.getMonitoringMetrics(selectedConnectionId),
    enabled: !!selectedConnectionId,
    refetchInterval: pollingEnabled && selectedConnectionId ? pollingInterval : false,
    staleTime: 1000,
  });

  const { data: queryHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['postgresql-query-history', selectedConnectionId],
    queryFn: () => postgresqlApi.getQueryHistory(selectedConnectionId),
    enabled: !!selectedConnectionId,
    refetchInterval: pollingEnabled && selectedConnectionId ? pollingInterval : false,
    staleTime: 1000,
  });

  const { data: logs = [], isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['postgresql-logs', selectedConnectionId],
    queryFn: () => postgresqlApi.getLogs(selectedConnectionId, 100),
    enabled: !!selectedConnectionId,
    refetchInterval: pollingEnabled && selectedConnectionId ? pollingInterval : false,
    staleTime: 2000,
  });

  const { data: historicalMetrics = [] } = useQuery({
    queryKey: ['postgresql-historical', selectedConnectionId, historicalPeriod],
    queryFn: () => postgresqlApi.getHistoricalMetrics(selectedConnectionId, historicalPeriod),
    enabled: !!selectedConnectionId,
    refetchInterval: pollingEnabled && selectedConnectionId ? pollingInterval : false,
    staleTime: 1000,
  });

  const handleCollectMetrics = async () => {
    if (!selectedConnectionId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma conexão antes de coletar métricas',
        variant: 'destructive',
      });
      return;
    }

    setIsCollecting(true);
    try {
      await postgresqlApi.collectMonitoringMetrics(selectedConnectionId);
      toast({
        title: 'Sucesso',
        description: 'Métricas coletadas com sucesso!',
        variant: 'success',
      });
      await queryClient.invalidateQueries({ queryKey: ['postgresql-metrics', selectedConnectionId] });
    } catch (error) {
      toast({
        title: 'Erro ao coletar métricas',
        description: error instanceof Error ? error.message : 'Não foi possível coletar as métricas',
        variant: 'destructive',
      });
    } finally {
      setIsCollecting(false);
    }
  };

  if (connections.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Configure pelo menos uma conexão para visualizar métricas.
      </Card>
    );
  }

  const latestMetric = metrics.length > 0 ? metrics[0] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Métricas de Monitoramento</h2>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Conexão</label>
              <select
                value={selectedConnectionId}
                onChange={(e) => setSelectedConnectionId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Selecione uma conexão</option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} {conn.isDefault && '(Padrão)'} ({conn.host}:{conn.port}/{conn.database})
                  </option>
                ))}
              </select>
            </div>
            {selectedConnectionId && (
              <Button
                onClick={handleCollectMetrics}
                disabled={isCollecting}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isCollecting ? 'animate-spin' : ''}`} />
                {isCollecting ? 'Coletando...' : 'Coletar Métricas'}
              </Button>
            )}
          </div>
          
          {selectedConnectionId && (
            <div className="flex gap-4 items-center pt-2 border-t">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pollingEnabled"
                  checked={pollingEnabled}
                  onChange={(e) => setPollingEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="pollingEnabled" className="text-sm font-medium">
                  Atualização Automática
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="pollingInterval" className="text-sm text-muted-foreground">
                  Intervalo:
                </label>
                <input
                  type="number"
                  id="pollingInterval"
                  min="1000"
                  step="1000"
                  value={pollingInterval}
                  onChange={(e) => setPollingInterval(Math.max(1000, parseInt(e.target.value) || 3000))}
                  className="w-24 px-2 py-1 border rounded-md bg-background text-sm"
                  disabled={!pollingEnabled}
                />
                <span className="text-sm text-muted-foreground">ms</span>
              </div>
              {pollingEnabled && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Atualizando a cada {(pollingInterval / 1000).toFixed(1)}s</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {isLoading && selectedConnectionId && (
        <div className="text-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      )}

      {!selectedConnectionId && (
        <Card className="p-6 text-center text-muted-foreground">
          Selecione uma conexão para visualizar as métricas de monitoramento.
        </Card>
      )}

      {showPgStatInfo && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Configuração do pg_stat_statements</h3>
            <Button variant="ghost" onClick={() => setShowPgStatInfo(false)}>Fechar</Button>
          </div>
          <PgStatStatementsInfo />
        </Card>
      )}

      {latestMetric && !isLoading && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="indexes" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Índices
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recomendações
              {latestMetric.indexRecommendations?.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {latestMetric.indexRecommendations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="efficiency" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Eficiência
            </TabsTrigger>
            <TabsTrigger value="queries" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Queries
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              Tabelas
            </TabsTrigger>
            <TabsTrigger value="query-details" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Queries Detalhadas
              {!latestMetric.pgStatStatementsAvailable && (
                <Badge variant="destructive" className="ml-1">
                  <AlertTriangle className="h-3 w-3" />
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Transações
            </TabsTrigger>
            <TabsTrigger value="locks" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Locks
            </TabsTrigger>
            <TabsTrigger value="wal-system" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              WAL & Sistema
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <MonitoringDashboard metrics={metrics} />
          </TabsContent>

          <TabsContent value="indexes" className="space-y-4 mt-4">
            {latestMetric.indexStats && latestMetric.indexStats.length > 0 ? (
              <IndexStatsTable 
                indexStats={latestMetric.indexStats} 
                connectionId={selectedConnectionId}
              />
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhuma estatística de índice disponível.
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4 mt-4">
            {latestMetric.indexRecommendations && latestMetric.indexRecommendations.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Recomendações ({latestMetric.indexRecommendations.length})
                  </h3>
                  <Badge variant="secondary">
                    {latestMetric.indexRecommendations.filter((r) => r.expectedImpact === 'high').length} de alto impacto
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {latestMetric.indexRecommendations.map((rec, idx) => (
                    <RecommendationCard key={idx} recommendation={rec} />
                  ))}
                </div>
              </div>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhuma recomendação disponível no momento.
              </Card>
            )}
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-4 mt-4">
            {/* Alerta especial para Ratio Commits/Rollbacks quando requer ação */}
            {latestMetric.databaseEfficiency && 
             latestMetric.databaseEfficiency.commitRollbackRatio < 90 && (
              <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span>Ratio Commits/Rollbacks Requer Atenção</span>
                  <EfficiencyInfoButton
                    type="commit-rollback"
                    value={latestMetric.databaseEfficiency.commitRollbackRatio}
                    status="critical"
                  />
                </AlertTitle>
                <AlertDescription className="mt-2">
                  O ratio de commits/rollbacks está abaixo de 90%, indicando um número significativo de transações sendo revertidas. 
                  Isso pode impactar a performance e indicar problemas de concorrência, deadlocks ou erros na aplicação.
                  <span className="block mt-2 font-medium">
                    Clique no ícone de informação acima para ver detalhes, motivos e ações recomendadas.
                  </span>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestMetric.databaseEfficiency && (
                <>
                  <EfficiencyGauge
                    value={latestMetric.databaseEfficiency.globalCacheHitRatio}
                    label="Cache Hit Ratio Global"
                    thresholds={{ good: 95, warning: 90 }}
                    infoType="cache-hit"
                  />
                  <EfficiencyGauge
                    value={latestMetric.databaseEfficiency.commitRollbackRatio}
                    label="Ratio Commits/Rollbacks"
                    thresholds={{ good: 95, warning: 90 }}
                    infoType="commit-rollback"
                  />
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Arquivos Temporários</h3>
                      <EfficiencyInfoButton
                        type="temp-files"
                        value={latestMetric.databaseEfficiency.tempFilesCount}
                        status={
                          latestMetric.databaseEfficiency.tempFilesCount === 0
                            ? 'good'
                            : latestMetric.databaseEfficiency.tempFilesCount < 100
                            ? 'warning'
                            : 'critical'
                        }
                      />
                    </div>
                    <div className="text-2xl font-bold mt-2">
                      {latestMetric.databaseEfficiency.tempFilesCount.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatBytes(latestMetric.databaseEfficiency.tempBytes)}
                    </p>
                  </Card>
                </>
              )}
            </div>

            {latestMetric.tableEfficiency && latestMetric.tableEfficiency.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Eficiência por Tabela</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Schema</th>
                        <th className="text-left p-2">Tabela</th>
                        <th className="text-right p-2">Seq Scans</th>
                        <th className="text-right p-2">Index Scans</th>
                        <th className="text-right p-2">Ratio Seq/Idx</th>
                        <th className="text-right p-2">Cache Hit</th>
                        <th className="text-right p-2">Tamanho</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestMetric.tableEfficiency.map((table, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-2">{table.schemaName}</td>
                          <td className="p-2 font-medium">{table.tableName}</td>
                          <td className="p-2 text-right">{table.seqScanCount.toLocaleString()}</td>
                          <td className="p-2 text-right">{table.indexScanCount.toLocaleString()}</td>
                          <td className="p-2 text-right">
                            {(table.seqIndexRatio * 100).toFixed(1)}%
                          </td>
                          <td className="p-2 text-right">{table.cacheHitRatio.toFixed(1)}%</td>
                          <td className="p-2 text-right">{formatBytes(table.tableSize)}</td>
                          <td className="p-2 text-center">
                            {table.needsAttention ? (
                              <Badge variant="destructive">Atenção</Badge>
                            ) : (
                              <Badge variant="secondary">OK</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="queries" className="space-y-4 mt-4">
            {isLoadingHistory ? (
              <Card className="p-6 text-center text-muted-foreground">
                Carregando histórico de queries...
              </Card>
            ) : (
              <QueryHistoryTable queryHistory={queryHistory} />
            )}
          </TabsContent>

          <TabsContent value="tables" className="space-y-4 mt-4">
            {latestMetric.tableStats && latestMetric.tableStats.length > 0 ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Estatísticas de Tabelas</h3>
                  <Badge variant="secondary">{latestMetric.tableStats.length} tabelas</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Schema</th>
                        <th className="text-left p-2">Tabela</th>
                        <th className="text-right p-2">Seq Scan</th>
                        <th className="text-right p-2">Index Scan</th>
                        <th className="text-right p-2">Inserts</th>
                        <th className="text-right p-2">Updates</th>
                        <th className="text-right p-2">Deletes</th>
                        <th className="text-center p-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestMetric.tableStats.map((table, index) => {
                        const tableEfficiency = latestMetric.tableEfficiency?.find(
                          (t) => t.tableName === table.tableName && t.schemaName === table.schemaName
                        );
                        const needsIndex = tableEfficiency?.needsAttention || table.seqScan > table.idxScan * 5;
                        
                        return (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-2">{table.schemaName}</td>
                            <td className="p-2 font-medium flex items-center gap-2">
                              {table.tableName}
                              {needsIndex && (
                                <Badge variant="destructive" className="text-xs">
                                  Precisa índice
                                </Badge>
                              )}
                            </td>
                            <td className="p-2 text-right">{table.seqScan.toLocaleString()}</td>
                            <td className="p-2 text-right">{table.idxScan.toLocaleString()}</td>
                            <td className="p-2 text-right">{table.tupleInsert.toLocaleString()}</td>
                            <td className="p-2 text-right">{table.tupleUpdate.toLocaleString()}</td>
                            <td className="p-2 text-right">{table.tupleDelete.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhuma estatística de tabela disponível.
              </Card>
            )}
          </TabsContent>

          <TabsContent value="query-details" className="space-y-4 mt-4">
            {/* Informações sobre a aba */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                    Sobre Queries Detalhadas
                  </h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                    <p>
                      Esta aba exibe estatísticas detalhadas de todas as queries executadas no banco de dados, 
                      coletadas através da extensão <strong>pg_stat_statements</strong> do PostgreSQL.
                    </p>
                    <p>
                      <strong>O que você pode ver aqui:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Tempo de execução:</strong> Tempo total, médio, mínimo e máximo de cada query</li>
                      <li><strong>Número de chamadas:</strong> Quantas vezes cada query foi executada</li>
                      <li><strong>Uso de cache:</strong> Quantas leituras foram do cache (shared_buffers) vs disco</li>
                      <li><strong>Operações temporárias:</strong> Uso de arquivos temporários para ordenações/joins grandes</li>
                      <li><strong>Linhas processadas:</strong> Quantas linhas cada query retornou</li>
                    </ul>
                    <p className="mt-2">
                      <strong>Como usar:</strong> Use essas informações para identificar queries que consomem mais recursos, 
                      têm muitos buffer reads (leituras do disco), ou geram muitos arquivos temporários. Essas são candidatas 
                      prioritárias para otimização através de índices, reescrita de queries, ou ajustes de configuração.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {!latestMetric.pgStatStatementsAvailable && (
              <Card className="p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">pg_stat_statements não está disponível</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Esta funcionalidade requer a extensão pg_stat_statements. Consulte a
                      documentação para instalação.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPgStatInfo(true)}
                      className="flex items-center gap-2"
                    >
                      <Info className="h-4 w-4" />
                      Ver instruções de instalação
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            {latestMetric.queryDetails && latestMetric.queryDetails.length > 0 ? (
              <QueryDetailsTable queryDetails={latestMetric.queryDetails} />
            ) : latestMetric.pgStatStatementsAvailable ? (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhuma query detalhada disponível.
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4 mt-4">
            {latestMetric.activeTransactions && latestMetric.activeTransactions.length > 0 ? (
              <TransactionsTable transactions={latestMetric.activeTransactions} />
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                Nenhuma transação ativa no momento.
              </Card>
            )}
          </TabsContent>

          <TabsContent value="locks" className="space-y-4 mt-4">
            <LocksVisualization
              lockDetails={latestMetric.lockDetails || []}
              blockingLocks={latestMetric.blockingLocks || []}
            />
          </TabsContent>

          <TabsContent value="wal-system" className="space-y-4 mt-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Estatísticas WAL</h3>
                <WalStatsCard walStats={latestMetric.walStats} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Tablespaces</h3>
                <TablespacesList tablespaces={latestMetric.tablespaces || []} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Configurações de Memória</h3>
                <MemoryConfigCard memoryConfig={latestMetric.memoryConfig} />
              </div>
              {latestMetric.systemInfo && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Informações do Sistema</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Versão:</span>
                      <span className="font-mono">{latestMetric.systemInfo.version}</span>
                    </div>
                    {latestMetric.systemInfo.dataDirectory && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Diretório de Dados:</span>
                        <code className="text-xs">{latestMetric.systemInfo.dataDirectory}</code>
                      </div>
                    )}
                    {latestMetric.systemInfo.configFile && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Arquivo de Config:</span>
                        <code className="text-xs">{latestMetric.systemInfo.configFile}</code>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Histórico Consolidado</h3>
                <div className="flex gap-2">
                  <Button
                    variant={historicalPeriod === '24h' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHistoricalPeriod('24h')}
                  >
                    24h
                  </Button>
                  <Button
                    variant={historicalPeriod === '7d' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHistoricalPeriod('7d')}
                  >
                    7d
                  </Button>
                  <Button
                    variant={historicalPeriod === '30d' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHistoricalPeriod('30d')}
                  >
                    30d
                  </Button>
                </div>
              </div>
            </Card>
            <HistoricalMetricsChart metrics={historicalMetrics} />
            <HistoricalMetricsTable metrics={historicalMetrics} />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4 mt-4">
            <PostgresLogsViewer
              logs={logs}
              isLoading={isLoadingLogs}
              onRefresh={() => refetchLogs()}
            />
          </TabsContent>
        </Tabs>
      )}

      {metrics.length === 0 && selectedConnectionId && !isLoading && (
        <Card className="p-6 text-center text-muted-foreground">
          Nenhuma métrica encontrada para esta conexão. Clique em "Coletar Métricas" para começar.
        </Card>
      )}
    </div>
  );
}
