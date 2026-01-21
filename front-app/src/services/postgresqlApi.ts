import axios, { AxiosError } from 'axios';
import type {
  PostgresConnection,
  QueryPlanResult,
  CreateConnectionRequest,
  MonitoringMetric,
  QueryHistory,
  IndexDetails,
  TableDetails,
  IndexTypeInfo,
} from '../types/postgresql';
import { toast } from '../components/ui/toaster';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5179',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// Interceptor para capturar erros de conexão com MongoDB
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const errorData = error.response?.data as any;
    const errorMessage = errorData?.message || errorData?.detail || error.message || '';
    const errorString = JSON.stringify(errorData || error.message || '').toLowerCase();

    // Verifica se é erro de timeout ou conexão relacionado ao MongoDB
    const isTimeoutError = 
      error.code === 'ECONNABORTED' || 
      error.code === 'ETIMEDOUT' || 
      error.message?.toLowerCase().includes('timeout') ||
      errorString.includes('timeoutexception');

    const isMongoDBError = 
      errorString.includes('mongodb') ||
      errorString.includes('mongo') ||
      errorString.includes('compositeserverselector') ||
      errorString.includes('cluster state') ||
      errorString.includes('server selector');

    if (isTimeoutError || isMongoDBError) {
      toast({
        title: 'Erro de Conexão com MongoDB',
        description: 'Não foi possível conectar ao banco de dados MongoDB para obter as credenciais e outras informações. Verifique se o MongoDB está rodando e acessível.',
        variant: 'destructive',
        duration: 10000,
      });
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      toast({
        title: 'Erro de Conexão',
        description: 'Não foi possível conectar ao servidor. Verifique se o backend está rodando e se o MongoDB está acessível.',
        variant: 'destructive',
        duration: 8000,
      });
    } else if (error.response?.status === 500 && isMongoDBError) {
      toast({
        title: 'Erro no Banco de Dados',
        description: 'Não foi possível conectar ao banco de dados MongoDB. Verifique se o MongoDB está rodando e configurado corretamente.',
        variant: 'destructive',
        duration: 8000,
      });
    }

    return Promise.reject(error);
  }
);

export const postgresqlApi = {
  async getConnections(): Promise<PostgresConnection[]> {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'postgresqlApi.ts:68',message:'getConnections start',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    const response = await apiClient.get<PostgresConnection[]>('/api/postgresql/connections');
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'postgresqlApi.ts:70',message:'getConnections ok',data:{count:Array.isArray(response.data)?response.data.length:null,firstId:Array.isArray(response.data)&&response.data[0]?String((response.data[0] as any).id):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return response.data;
  },

  async getConnection(id: string): Promise<PostgresConnection> {
    const response = await apiClient.get<PostgresConnection>(`/api/postgresql/connections/${id}`);
    return response.data;
  },

  async saveConnection(connection: CreateConnectionRequest): Promise<PostgresConnection> {
    const response = await apiClient.post<PostgresConnection>('/api/postgresql/connections', connection);
    return response.data;
  },

  async executeExplainAnalyze(connectionId: string, query: string): Promise<QueryPlanResult> {
    const response = await apiClient.post<QueryPlanResult>('/api/postgresql/query-plan', {
      connectionId,
      query,
    });
    return response.data;
  },

  async getMonitoringMetrics(connectionId: string): Promise<MonitoringMetric[]> {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'postgresqlApi.ts:91',message:'getMonitoringMetrics start',data:{connectionId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    const response = await apiClient.get<MonitoringMetric[]>(
      `/api/postgresql/monitoring/${connectionId}`
    );
    // #region agent log
    const first = Array.isArray(response.data) ? response.data[0] as any : null;
    fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'postgresqlApi.ts:97',message:'getMonitoringMetrics ok',data:{count:Array.isArray(response.data)?response.data.length:null,hasFirst:!!first,pgStat:first?Boolean(first.pgStatStatementsAvailable):null,keys:first?Object.keys(first).slice(0,25):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    return response.data;
  },

  async collectMonitoringMetrics(connectionId: string): Promise<void> {
    await apiClient.post(`/api/postgresql/monitoring/${connectionId}/collect`);
  },

  async deleteConnection(id: string): Promise<void> {
    await apiClient.delete(`/api/postgresql/connections/${id}`);
  },

  async setDefaultConnection(id: string): Promise<void> {
    await apiClient.put(`/api/postgresql/connections/${id}/set-default`);
  },

  async checkExtension(connectionId: string): Promise<ExtensionStatus> {
    const response = await apiClient.get<ExtensionStatus>(
      `/api/postgresql/connections/${connectionId}/extensions`
    );
    return response.data;
  },

  async getHistoricalMetrics(
    connectionId: string,
    period: HistoricalPeriod
  ): Promise<HistoricalMetric[]> {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'postgresqlApi.ts:113',message:'getHistoricalMetrics start',data:{connectionId,period},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    const response = await apiClient.get<HistoricalMetric[]>(
      `/api/postgresql/monitoring/${connectionId}/history`,
      { params: { period } }
    );
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'postgresqlApi.ts:121',message:'getHistoricalMetrics ok',data:{count:Array.isArray(response.data)?response.data.length:null,firstType:Array.isArray(response.data)&&response.data[0]?(response.data[0] as any).periodType:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    return response.data;
  },

  async getHistoricalMetricsRange(
    connectionId: string,
    start: Date,
    end: Date
  ): Promise<HistoricalMetric[]> {
    const response = await apiClient.get<HistoricalMetric[]>(
      `/api/postgresql/monitoring/${connectionId}/history/range`,
      {
        params: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      }
    );
    return response.data;
  },

  async getQueryHistory(connectionId: string): Promise<QueryHistory[]> {
    const response = await apiClient.get<QueryHistory[]>(
      `/api/postgresql/connections/${connectionId}/query-history`
    );
    return response.data;
  },

  async getLogs(connectionId: string, maxLines?: number): Promise<string[]> {
    const params = maxLines ? { maxLines } : {};
    const response = await apiClient.get<{ logs: string[] }>(
      `/api/postgresql/connections/${connectionId}/logs`,
      { params }
    );
    return response.data.logs;
  },

  async getIndexDetails(
    connectionId: string,
    schemaName: string,
    tableName: string,
    indexName: string
  ): Promise<IndexDetails> {
    const response = await apiClient.get<IndexDetails>(
      `/api/postgresql/connections/${connectionId}/indexes/${encodeURIComponent(schemaName)}/${encodeURIComponent(tableName)}/${encodeURIComponent(indexName)}/details`
    );
    return response.data;
  },

  async getTableDetails(
    connectionId: string,
    schemaName: string,
    tableName: string
  ): Promise<TableDetails> {
    const response = await apiClient.get<TableDetails>(
      `/api/postgresql/connections/${connectionId}/tables/${encodeURIComponent(schemaName)}/${encodeURIComponent(tableName)}/details`
    );
    return response.data;
  },
};
