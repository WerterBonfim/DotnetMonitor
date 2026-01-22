import axios, { AxiosError } from 'axios';
import type { GCStats } from '../types/gc';
import { toast } from '../components/ui/toaster';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// #region agent log
fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gcApi.ts:6',message:'Criando apiClient',data:{baseURL:apiBaseURL,hasEnvVar:!!import.meta.env.VITE_API_BASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

const apiClient = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// Interceptor para capturar erros de conexão
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const errorData = error.response?.data as any;
    const errorString = JSON.stringify(errorData || error.message || '').toLowerCase();

    // Verifica se é erro de timeout
    const isTimeoutError = 
      error.code === 'ECONNABORTED' || 
      error.code === 'ETIMEDOUT' || 
      error.message?.toLowerCase().includes('timeout') ||
      errorString.includes('timeoutexception');

    // Verifica se é erro relacionado ao LiteDB
    const isLiteDBError = 
      errorString.includes('litedb') ||
      errorString.includes('lite db') ||
      errorString.includes('database locked');

    // Verificar se é erro de porta em uso
    const portInUseError = 
      errorString.includes('port') && 
      (errorString.includes('already in use') || 
       errorString.includes('já está em uso') ||
       errorString.includes('address already in use'));

    if (portInUseError) {
      const port = import.meta.env.VITE_API_BASE_URL?.match(/:(\d+)/)?.[1] || '5000';
      toast({
        title: 'Porta em Uso',
        description: `A porta ${port} já está sendo usada. Verifique se há outra instância do aplicativo rodando ou use uma porta diferente.`,
        variant: 'destructive',
        duration: 10000,
      });
    } else if (isTimeoutError) {
      toast({
        title: 'Erro de Timeout',
        description: 'A requisição demorou muito para responder. Verifique se o backend está rodando corretamente.',
        variant: 'destructive',
        duration: 10000,
      });
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gcApi.ts:56',message:'Erro de conexão detectado',data:{code:error.code,message:error.message,baseURL:apiBaseURL,url:error.config?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      toast({
        title: 'Erro de Conexão',
        description: 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
        variant: 'destructive',
        duration: 8000,
      });
    } else if (error.response?.status === 500 && isLiteDBError) {
      toast({
        title: 'Erro no Banco de Dados',
        description: 'Não foi possível acessar o banco de dados LiteDB. Verifique as permissões do arquivo de banco de dados.',
        variant: 'destructive',
        duration: 8000,
      });
    }

    return Promise.reject(error);
  }
);

export interface DotNetProcess {
  processId: number;
  processName: string;
  mainModulePath: string | null;
  workingSet64: number;
  startTime: string;
}

export async function getDotNetProcesses(): Promise<DotNetProcess[]> {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gcApi.ts:getDotNetProcesses',message:'Iniciando requisição getDotNetProcesses',data:{baseURL:apiBaseURL,url:'/api/gc/processes'},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  try {
    const response = await apiClient.get<DotNetProcess[]>('/api/gc/processes');
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gcApi.ts:getDotNetProcesses',message:'Requisição getDotNetProcesses bem-sucedida',data:{status:response.status,dataLength:response.data?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return response.data;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gcApi.ts:getDotNetProcesses',message:'Erro em getDotNetProcesses',data:{error:error instanceof Error?error.message:String(error),code:(error as any)?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}

export async function getGCMetrics(processId: number): Promise<GCStats> {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gcApi.ts:75',message:'getGCMetrics called',data:{processId},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const response = await apiClient.get(`/api/gc/metrics/${processId}`);
    const data = response.data;
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gcApi.ts:79',message:'API response received',data:{hasData:!!data,hasTimeInGC:!!data?.timeInGCPercent,hasCollectionRate:!!data?.collectionRatePerMinute,keys:data?Object.keys(data):[],rawData:JSON.stringify(data).substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gcApi.ts:86',message:'Before creating result object',data:{hasData:!!data,dataKeys:data?Object.keys(data):[],hasCollectionRate:!!data?.collectionRatePerMinute,collectionRateValue:data?.collectionRatePerMinute},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'L'})}).catch(()=>{});
    // #endregion
    const result = {
    gen0: {
      sizeAfterBytes: data.gen0.sizeAfterBytes,
      fragmentedBytes: data.gen0.fragmentedBytes,
      fragmentationPercent: data.gen0.fragmentationPercent,
      collectionCount: data.gen0.collectionCount,
    },
    gen1: {
      sizeAfterBytes: data.gen1.sizeAfterBytes,
      fragmentedBytes: data.gen1.fragmentedBytes,
      fragmentationPercent: data.gen1.fragmentationPercent,
      collectionCount: data.gen1.collectionCount,
    },
    gen2: {
      sizeAfterBytes: data.gen2.sizeAfterBytes,
      fragmentedBytes: data.gen2.fragmentedBytes,
      fragmentationPercent: data.gen2.fragmentationPercent,
      collectionCount: data.gen2.collectionCount,
    },
    lohSizeBytes: data.lohSizeBytes,
    pohSizeBytes: data.pohSizeBytes,
    totalMemoryBytes: data.totalMemoryBytes,
    availableMemoryBytes: data.availableMemoryBytes,
    pinnedObjectsCount: data.pinnedObjectsCount,
    overallFragmentationPercent: data.overallFragmentationPercent,
    healthStatus: data.healthStatus as 'Healthy' | 'Warning' | 'Critical',
    interpretation: {
      status: data.interpretation.status,
      description: data.interpretation.description,
      recommendations: data.interpretation.recommendations,
      currentIssues: data.interpretation.currentIssues,
    },
    recentCollections: data.recentCollections.map((c: any) => ({
      generation: c.generation,
      timestamp: c.timestamp,
      heapSizeBytes: c.heapSizeBytes,
      memoryFreedBytes: c.memoryFreedBytes,
    })),
    timestamp: data.timestamp,
    timeInGCPercent: data.timeInGCPercent ?? 0,
    gcPauseTimeTotalMs: data.gcPauseTimeTotalMs ?? 0,
    gcPauseTimeAverageMs: data.gcPauseTimeAverageMs ?? 0,
    collectionRatePerMinute: (() => {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gcApi.ts:128',message:'Processing collectionRatePerMinute',data:{hasCollectionRate:!!data.collectionRatePerMinute,collectionRateType:typeof data.collectionRatePerMinute,collectionRateValue:data.collectionRatePerMinute},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'M'})}).catch(()=>{});
      // #endregion
      if (!data.collectionRatePerMinute) {
        return { gen0: 0, gen1: 0, gen2: 0 };
      }
      return {
        gen0: data.collectionRatePerMinute.gen0 ?? 0,
        gen1: data.collectionRatePerMinute.gen1 ?? 0,
        gen2: data.collectionRatePerMinute.gen2 ?? 0,
      };
    })(),
    allocationRateBytesPerSecond: data.allocationRateBytesPerSecond ?? 0,
    memoryCommittedSizeBytes: data.memoryCommittedSizeBytes ?? 0,
    heapSizeAfterGen2GC: data.heapSizeAfterGen2GC ?? 0,
    gen2CollectionFrequencyPerHour: data.gen2CollectionFrequencyPerHour ?? 0,
    };
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gcApi.ts:149',message:'getGCMetrics result created successfully',data:{hasTimeInGC:typeof result.timeInGCPercent==='number',hasCollectionRate:!!result.collectionRatePerMinute,collectionRateGen0:result.collectionRatePerMinute?.gen0},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return result;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gcApi.ts:153',message:'getGCMetrics error',data:{error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}
