import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { postgresqlApi } from '../../services/postgresqlApi';
import type { PostgresConnection, QueryPlanResult } from '../../types/postgresql';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface QueryPlanExecutorProps {
  connections: PostgresConnection[];
}

export function QueryPlanExecutor({ connections }: QueryPlanExecutorProps) {
  // Encontrar conexão padrão ou usar a primeira
  const defaultConnection = connections.find(c => c.isDefault) || connections[0];
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>(
    defaultConnection?.id || ''
  );
  const [query, setQuery] = useState<string>('SELECT * FROM users LIMIT 10;');
  const [planResult, setPlanResult] = useState<QueryPlanResult | null>(null);

  const executeMutation = useMutation({
    mutationFn: ({ connectionId, query }: { connectionId: string; query: string }) =>
      postgresqlApi.executeExplainAnalyze(connectionId, query),
    onSuccess: (data) => {
      setPlanResult(data);
    },
  });

  const handleExecute = () => {
    if (!selectedConnectionId || !query.trim()) {
      return;
    }
    executeMutation.mutate({ connectionId: selectedConnectionId, query });
  };

  const renderPlanNode = (node: QueryPlanResult['plan'], depth = 0) => {
    const indent = depth * 20;
    return (
      <div key={node.nodeType} className="mb-2" style={{ marginLeft: `${indent}px` }}>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline">{node.nodeType}</Badge>
          {node.relationName && (
            <span className="text-sm text-muted-foreground">
              {node.relationName}
              {node.alias && ` (${node.alias})`}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground ml-4 space-y-1">
          <div>
            Custo: {node.cost.startup.toFixed(2)}..{node.cost.total.toFixed(2)}
          </div>
          {node.actualTime && (
            <div>
              Tempo: {node.actualTime.first.toFixed(2)}ms..{node.actualTime.total.toFixed(2)}ms
            </div>
          )}
          <div>
            Linhas: {node.rows.estimated.toLocaleString()}
            {node.rows.actual !== undefined && ` (${node.rows.actual.toLocaleString()} real)`}
          </div>
          {node.buffers && (
            <div>
              Buffers: {node.buffers.sharedHit} hit, {node.buffers.sharedRead} read
            </div>
          )}
        </div>
        {node.children.length > 0 && (
          <div className="mt-2">
            {node.children.map((child, index) => (
              <div key={index}>{renderPlanNode(child, depth + 1)}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (connections.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Configure pelo menos uma conexão para executar query plans.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Análise de Query Plan</h2>

      <Card className="p-6 space-y-4">
        <div>
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

        <div>
          <label className="block text-sm font-medium mb-2">Query SQL</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm"
            placeholder="Digite sua query SQL aqui..."
          />
        </div>

        <Button onClick={handleExecute} disabled={!selectedConnectionId || !query.trim() || executeMutation.isPending}>
          {executeMutation.isPending ? 'Executando...' : 'Executar EXPLAIN ANALYZE'}
        </Button>
      </Card>

      {executeMutation.isError && (
        <Card className="p-4 bg-destructive/10 border-destructive">
          <p className="text-destructive">
            Erro: {executeMutation.error instanceof Error ? executeMutation.error.message : 'Erro desconhecido'}
          </p>
        </Card>
      )}

      {planResult && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Resultado do Query Plan</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tempo de Planejamento:</span>
                  <span className="ml-2 font-semibold">{planResult.planningTime.toFixed(2)}ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tempo de Execução:</span>
                  <span className="ml-2 font-semibold">{planResult.executionTime.toFixed(2)}ms</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Árvore do Plano de Execução</h4>
                <div className="border rounded-md p-4 bg-muted/50">
                  {renderPlanNode(planResult.plan)}
                </div>
              </div>

              {planResult.insights && (
                <div>
                  <h4 className="font-semibold mb-2">Insights e Recomendações</h4>
                  {planResult.insights.problems.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-destructive mb-2">Problemas Identificados:</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {planResult.insights.problems.map((problem, index) => (
                          <li key={index}>{problem}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {planResult.insights.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Recomendações:</h5>
                      <div className="space-y-2">
                        {planResult.insights.recommendations.map((rec, index) => (
                          <Card key={index} className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant={rec.impact === 'high' ? 'destructive' : rec.impact === 'medium' ? 'default' : 'secondary'}>
                                {rec.type} - {rec.impact}
                              </Badge>
                            </div>
                            <p className="text-sm mb-2">{rec.description}</p>
                            {rec.sqlScript && (
                              <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                                {rec.sqlScript}
                              </pre>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
