import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { postgresqlApi } from '../services/postgresqlApi';
import { ConnectionsManager } from '../components/postgresql/ConnectionsManager';
import { QueryPlanExecutor } from '../components/postgresql/QueryPlanExecutor';
import { MonitoringMetrics } from '../components/postgresql/MonitoringMetrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';

export function PostgreSQLTools() {
  const navigate = useNavigate();
  
  const { data: connections = [] } = useQuery({
    queryKey: ['postgresql-connections'],
    queryFn: () => postgresqlApi.getConnections(),
  });

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Voltar para Home
          </Button>
        </div>
      </div>

      <main className="mainContent container mx-auto p-4 space-y-6">
        <Tabs defaultValue="connections" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="connections">Conexões</TabsTrigger>
            <TabsTrigger value="query-plan">Query Plan</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-4">
            <ConnectionsManager />
          </TabsContent>

          <TabsContent value="query-plan" className="space-y-4">
            <QueryPlanExecutor connections={connections} />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <MonitoringMetrics connections={connections} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
