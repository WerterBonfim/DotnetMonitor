import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './lib/theme-provider';
import { Header } from './components/layout/Header';
import { HealthBanner } from './components/dashboard/HealthBanner';
import { GenerationCards } from './components/dashboard/GenerationCards';
import { SpecialHeaps } from './components/dashboard/SpecialHeaps';
import { GeneralStats } from './components/dashboard/GeneralStats';
import { MetricsHistory } from './components/dashboard/MetricsHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { useGCStats } from './hooks/useGCStats';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function DashboardContent() {
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data: stats, refetch, isLoading } = useGCStats(refreshInterval, autoRefresh);

  const handleManualRefresh = () => {
    refetch();
  };

  if (isLoading && !stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-destructive">Erro ao carregar dados</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        refreshInterval={refreshInterval}
        onRefreshIntervalChange={setRefreshInterval}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        onManualRefresh={handleManualRefresh}
        lastUpdate={stats.timestamp}
      />

      <main className="mainContent container mx-auto p-4 space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="analysis">Análise e Interpretação</TabsTrigger>
            <TabsTrigger value="history">Histórico de Coletas</TabsTrigger>
            <TabsTrigger value="heap">Análise do Heap</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <HealthBanner stats={stats} />
            <GenerationCards gen0={stats.gen0} gen1={stats.gen1} gen2={stats.gen2} />
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
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-2xl font-bold mb-4">Análise do Heap</h2>
              <p className="text-muted-foreground">
                Esta funcionalidade será implementada quando a API de análise de heap estiver
                disponível.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <DashboardContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
