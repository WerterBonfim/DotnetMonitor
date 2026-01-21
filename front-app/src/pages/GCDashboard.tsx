import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { HealthBanner } from '../components/dashboard/HealthBanner';
import { GenerationCards } from '../components/dashboard/GenerationCards';
import { SpecialHeaps } from '../components/dashboard/SpecialHeaps';
import { GeneralStats } from '../components/dashboard/GeneralStats';
import { MetricsHistory } from '../components/dashboard/MetricsHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useGCStats } from '../hooks/useGCStats';
import { Button } from '../components/ui/button';
import { ProcessSelector } from '../components/gc/ProcessSelector';
import { RealTimeMetricsPanel } from '../components/gc/RealTimeMetricsPanel';
import { HistoricalMetricsPanel } from '../components/gc/HistoricalMetricsPanel';
import { GCFlowVisualization } from '../components/gc/GCFlowVisualization';
import { HeapAnalysisPanel } from '../components/gc/HeapAnalysisPanel';

export function GCDashboard() {
  const navigate = useNavigate();
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(3000); // Padrão: 3 segundos
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data: stats, refetch, isLoading, error } = useGCStats(selectedProcessId, refreshInterval, autoRefresh);

  const handleManualRefresh = () => {
    refetch();
  };

  const handleProcessSelect = (processId: number) => {
    setSelectedProcessId(processId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Voltar para Home
          </Button>
        </div>
      </div>

      <main className="mainContent container mx-auto p-4 space-y-6">
        <ProcessSelector
          selectedProcessId={selectedProcessId}
          onProcessSelect={handleProcessSelect}
        />

        {!selectedProcessId && (
          <div className="text-center py-8 text-muted-foreground">
            Selecione um processo .NET acima para visualizar as métricas de GC
          </div>
        )}

        {selectedProcessId && isLoading && !stats && (
          <div className="flex h-64 items-center justify-center">
            <div className="text-lg">Carregando métricas...</div>
          </div>
        )}

        {selectedProcessId && !stats && error && (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="text-lg text-destructive">Erro ao carregar dados</div>
              {error && (
                <div className="text-sm text-muted-foreground mt-2">
                  {error instanceof Error ? error.message : String(error)}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedProcessId && stats && (
          <>
            {/* #region agent log */}
            {(()=>{fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GCDashboard.tsx:72',message:'Rendering with stats',data:{hasStats:!!stats,hasTimeInGC:typeof stats.timeInGCPercent==='number',hasCollectionRate:!!stats.collectionRatePerMinute,statsKeys:Object.keys(stats)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});return null;})()}
            {/* #endregion */}
            <Header
              refreshInterval={refreshInterval}
              onRefreshIntervalChange={setRefreshInterval}
              autoRefresh={autoRefresh}
              onAutoRefreshChange={setAutoRefresh}
              onManualRefresh={handleManualRefresh}
              lastUpdate={stats.timestamp}
            />
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="advanced">Métricas Avançadas</TabsTrigger>
            <TabsTrigger value="flow">Como Funciona o GC</TabsTrigger>
            <TabsTrigger value="analysis">Análise e Interpretação</TabsTrigger>
            <TabsTrigger value="history">Histórico de Coletas</TabsTrigger>
            <TabsTrigger value="heap">Análise do Heap</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <HealthBanner stats={stats} />
            <GenerationCards 
              gen0={stats.gen0} 
              gen1={stats.gen1} 
              gen2={stats.gen2}
              collectionRatePerMinute={stats.collectionRatePerMinute}
            />
            <SpecialHeaps
              lohSizeBytes={stats.lohSizeBytes}
              pohSizeBytes={stats.pohSizeBytes}
              totalMemoryBytes={stats.totalMemoryBytes}
              pinnedObjectsCount={stats.pinnedObjectsCount}
            />
            <GeneralStats
              totalMemoryBytes={stats.totalMemoryBytes}
              availableMemoryBytes={stats.availableMemoryBytes}
              overallFragmentationPercent={stats.overallFragmentationPercent}
              pinnedObjectsCount={stats.pinnedObjectsCount}
            />
            <MetricsHistory stats={stats} />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            {/* #region agent log */}
            {(()=>{try{fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GCDashboard.tsx:109',message:'Rendering advanced tab',data:{hasStats:!!stats,statsType:typeof stats,hasTimeInGC:typeof stats?.timeInGCPercent,hasCollectionRate:!!stats?.collectionRatePerMinute},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});}catch(e){fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GCDashboard.tsx:109',message:'Error in advanced tab log',data:{error:String(e),stack:e instanceof Error?e.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});}return null;})()}
            {/* #endregion */}
            {(() => {
              try {
                return (
                  <>
                    <RealTimeMetricsPanel stats={stats} />
                    <HistoricalMetricsPanel stats={stats} />
                  </>
                );
              } catch (error) {
                // #region agent log
                fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GCDashboard.tsx:112',message:'Error rendering advanced panels',data:{error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'})}).catch(()=>{});
                // #endregion
                return (
                  <div className="p-4 border border-red-500 rounded">
                    <p className="text-red-500">Erro ao renderizar métricas avançadas: {error instanceof Error ? error.message : String(error)}</p>
                  </div>
                );
              }
            })()}
          </TabsContent>

          <TabsContent value="flow" className="space-y-4">
            <GCFlowVisualization />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-2xl font-bold mb-4">Interpretação do GC</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Status: {stats.interpretation.status}</h3>
                  <p className="text-muted-foreground">{stats.interpretation.description}</p>
                </div>
                {stats.interpretation.currentIssues.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Problemas Atuais</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {stats.interpretation.currentIssues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold mb-2">Recomendações</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {stats.interpretation.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-2xl font-bold mb-4">Coletas Recentes</h2>
              <div className="space-y-2">
                {stats.recentCollections.map((collection, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded border">
                    <div>
                      <div className="font-semibold">Gen {collection.generation}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(collection.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Heap Size</div>
                      <div className="font-semibold">
                        {(collection.heapSizeBytes / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <div className="text-sm text-muted-foreground">Memória Liberada</div>
                      <div className="font-semibold text-green-500">
                        {(collection.memoryFreedBytes / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="heap" className="space-y-4">
            <HeapAnalysisPanel processId={selectedProcessId} />
          </TabsContent>
        </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
