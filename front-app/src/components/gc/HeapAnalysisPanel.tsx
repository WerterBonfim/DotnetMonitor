import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Loader2, AlertTriangle, Database, Package, TrendingUp, Layers, Boxes, Cpu, Info } from 'lucide-react';
import { getLatestHeapAnalysis, getAllocationTrackingStatus } from '../../services/heapAnalysisApi';
import { formatBytes, formatPercent } from '../../lib/utils';
import type { HeapAnalysis } from '../../types/gc';
import { AllocationTrackingControl } from './AllocationTrackingControl';
import { AllocationOriginInfo } from './AllocationOriginInfo';

interface HeapAnalysisPanelProps {
  processId: number | null;
}

export function HeapAnalysisPanel({ processId }: HeapAnalysisPanelProps) {
  const [includeAllocationStacks, setIncludeAllocationStacks] = useState(false);

  const { data: trackingStatus } = useQuery({
    queryKey: ['allocation-tracking-status', processId],
    queryFn: () => {
      if (!processId) throw new Error('Processo não selecionado');
      return getAllocationTrackingStatus(processId);
    },
    enabled: !!processId,
    refetchInterval: 2000,
  });

  const { data: analysis, isLoading, error, refetch } = useQuery<HeapAnalysis>({
    queryKey: ['heap-analysis', processId, includeAllocationStacks],
    queryFn: () => {
      if (!processId) throw new Error('Processo não selecionado');
      return getLatestHeapAnalysis(processId, 10, includeAllocationStacks);
    },
    enabled: !!processId,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  if (!processId) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Selecione um processo .NET para visualizar a análise do heap.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Analisando heap...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar análise do heap: {error instanceof Error ? error.message : 'Erro desconhecido'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!analysis) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma análise de heap disponível para este processo.
        </AlertDescription>
      </Alert>
    );
  }

  const isTrackingActive = trackingStatus?.isActive ?? false;

  return (
    <div className="space-y-6">
      {/* Controle de Rastreamento */}
      <AllocationTrackingControl processId={processId} />

      {/* Alerta contextual quando rastreamento está ativo mas análise não inclui origens */}
      {isTrackingActive && !includeAllocationStacks && (
        <Alert variant="default" className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4" />
          <AlertTitle>Rastreamento Ativo</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Rastreamento ativo. Para ver origens, analise o heap com &quot;Incluir origens de
              alocação&quot; habilitado.
            </span>
            <Button
              size="sm"
              onClick={() => {
                setIncludeAllocationStacks(true);
                refetch();
              }}
            >
              Incluir Origens
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Resumo do Heap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Total de Memória</div>
              <div className="text-lg font-semibold">{formatBytes(analysis.summary.totalHeapBytes)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total de Objetos</div>
              <div className="text-lg font-semibold">{analysis.summary.totalObjectCount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tipos Únicos</div>
              <div className="text-lg font-semibold">{analysis.summary.totalTypeCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">LOH</div>
              <div className="text-lg font-semibold">{formatBytes(analysis.summary.lohBytes)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Objetos LOH</div>
              <div className="text-lg font-semibold">{analysis.summary.lohObjectCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {analysis.humanizedInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {analysis.humanizedInsights.map((insight, index) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Análise por Namespace */}
      {analysis.topNamespacesByMemory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Top Namespaces por Memória
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.topNamespacesByMemory.map((ns, index) => {
                const isFrameworkNamespace =
                  ns.namespace.startsWith('System.') ||
                  ns.namespace.startsWith('Microsoft.') ||
                  ns.namespace === '<global>';

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      ns.isProblematic ? 'border-yellow-500/50 bg-yellow-500/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-lg">{ns.namespace}</div>
                        {ns.isProblematic && (
                          <Badge variant="warning" className="text-xs">
                            ⚠️ Problemático
                          </Badge>
                        )}
                        {isFrameworkNamespace && (
                          <Badge variant="secondary" className="text-xs">
                            Framework
                          </Badge>
                        )}
                        {!isFrameworkNamespace && (
                          <Badge variant="success" className="text-xs">
                            Código do Dev
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatBytes(ns.totalBytes)}</div>
                        <div className="text-sm text-muted-foreground">
                          {ns.instanceCount.toLocaleString()} objetos, {ns.typeCount} tipos
                        </div>
                      </div>
                    </div>
                    {/* Top métodos de alocação */}
                    {ns.topAllocationMethods && ns.topAllocationMethods.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          Top métodos de alocação neste namespace:
                        </div>
                        <div className="space-y-1">
                          {ns.topAllocationMethods.map((method, methodIndex) => (
                            <div
                              key={methodIndex}
                              className="text-sm p-2 rounded bg-muted/50 font-mono"
                            >
                              {method}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {isFrameworkNamespace && (
                      <Alert variant="default" className="mt-3 border-blue-500/50 bg-blue-500/10">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Namespace do framework. Foque em namespaces do seu código.
                        </AlertDescription>
                      </Alert>
                    )}
                    {ns.topTypes.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-muted-foreground mb-2">
                          Top tipos neste namespace:
                        </div>
                        <div className="space-y-1">
                          {ns.topTypes.map((type, typeIndex) => (
                            <div key={typeIndex} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{type.typeName}</span>
                                {type.isArray && (
                                  <Badge variant="outline" className="text-xs">
                                    Array
                                  </Badge>
                                )}
                                {type.isThreadRelated && (
                                  <Badge variant="outline" className="text-xs">
                                    Thread
                                  </Badge>
                                )}
                              </div>
                              <div className="text-muted-foreground">
                                {formatBytes(type.totalBytes)} ({type.instanceCount.toLocaleString()})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise de Arrays */}
      {analysis.topArrayElements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5" />
              Análise de Arrays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.topArrayElements.map((array, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded border">
                  <div className="flex-1">
                    <div className="font-medium">
                      Array de <span className="text-blue-600 dark:text-blue-400">{array.elementTypeName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {array.totalArrays.toLocaleString()} arrays, tamanho médio: {formatBytes(array.averageArraySize)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Tipo: {array.arrayTypeName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatBytes(array.totalBytes)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatPercent((array.totalBytes / analysis.summary.totalHeapBytes) * 100)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise de Threads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Análise de Threads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <div className="text-xs text-muted-foreground">Total de Threads</div>
              <div className={`text-lg font-semibold ${analysis.threadAnalysis.totalThreads > 50 ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                {analysis.threadAnalysis.totalThreads}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Objetos Thread</div>
              <div className="text-lg font-semibold">{analysis.threadAnalysis.threadObjectsCount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Memória Thread</div>
              <div className="text-lg font-semibold">{formatBytes(analysis.threadAnalysis.threadObjectsBytes)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Objetos Task</div>
              <div className={`text-lg font-semibold ${analysis.threadAnalysis.taskObjectsCount > 1000 ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                {analysis.threadAnalysis.taskObjectsCount.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Memória Task</div>
              <div className="text-lg font-semibold">{formatBytes(analysis.threadAnalysis.taskObjectsBytes)}</div>
            </div>
          </div>
          {(analysis.threadAnalysis.totalThreads > 50 || analysis.threadAnalysis.taskObjectsCount > 1000) && (
            <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {analysis.threadAnalysis.totalThreads > 50 && (
                  <div>⚠️ Alto número de threads ({analysis.threadAnalysis.totalThreads}) - possível thread leak</div>
                )}
                {analysis.threadAnalysis.taskObjectsCount > 1000 && (
                  <div>⚠️ Muitos objetos Task ({analysis.threadAnalysis.taskObjectsCount.toLocaleString()}) - verificar async/await não aguardados</div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Top Tipos por Memória */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Tipos por Memória
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.topTypesByMemory.map((type, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium">{type.typeName}</div>
                      {type.isArray && (
                        <Badge variant="outline" className="text-xs">
                          Array
                        </Badge>
                      )}
                      {type.isThreadRelated && (
                        <Badge variant="outline" className="text-xs">
                          Thread
                        </Badge>
                      )}
                      {type.allocationOrigins && type.allocationOrigins.length > 0 && (
                        <Badge variant="success" className="text-xs">
                          {type.allocationOrigins.length} origem{type.allocationOrigins.length !== 1 ? 'ens' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Namespace: {type.namespace}</div>
                      {type.isArray && type.arrayElementType && (
                        <div>Tipo do elemento: {type.arrayElementType}</div>
                      )}
                      <div>{type.instanceCount.toLocaleString()} instâncias</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatBytes(type.totalBytes)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatPercent(type.percentageOfTotal)}
                    </div>
                  </div>
                </div>
                {/* Origens de Alocação */}
                {type.allocationOrigins && type.allocationOrigins.length > 0 && (
                  <div className="ml-4 pl-4 border-l-2">
                    <AllocationOriginInfo allocationOrigins={type.allocationOrigins} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Tipos por Contagem */}
      <Card>
        <CardHeader>
          <CardTitle>Top Tipos por Contagem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analysis.topTypesByCount.map((type, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded border">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium">{type.typeName}</div>
                    {type.isArray && (
                      <Badge variant="outline" className="text-xs">
                        Array
                      </Badge>
                    )}
                    {type.isThreadRelated && (
                      <Badge variant="outline" className="text-xs">
                        Thread
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Namespace: {type.namespace}</div>
                    {type.isArray && type.arrayElementType && (
                      <div>Tipo do elemento: {type.arrayElementType}</div>
                    )}
                    <div>{formatBytes(type.totalBytes)} total</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{type.instanceCount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatPercent(type.percentageOfTotalCount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Objetos Grandes */}
      {analysis.largeObjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Objetos Grandes (LOH)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.largeObjects.map((obj, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium">{obj.typeName}</div>
                      {obj.isArray && (
                        <Badge variant="outline" className="text-xs">
                          Array
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Namespace: {obj.namespace}</div>
                      {obj.isArray && obj.arrayElementType && (
                        <div>Tipo do elemento: {obj.arrayElementType}</div>
                      )}
                      <div>{obj.instanceCount} instância{obj.instanceCount !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatBytes(obj.sizeBytes)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timestamp */}
      <div className="text-xs text-muted-foreground text-center">
        Análise realizada em: {new Date(analysis.timestamp).toLocaleString('pt-BR')}
      </div>
    </div>
  );
}
