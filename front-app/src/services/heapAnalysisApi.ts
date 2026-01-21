import axios from 'axios';
import type { HeapAnalysis, TypeMemoryInfo, TypeCountInfo, LargeObjectInfo, NamespaceStats, ArrayElementStats, ThreadAnalysis, HeapSummary, AllocationOrigin } from '../types/gc';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5179',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 segundos (análise de heap pode demorar)
});

export async function getLatestHeapAnalysis(processId: number, topN: number = 10, includeAllocationStacks: boolean = false): Promise<HeapAnalysis> {
  try {
    const response = await apiClient.get(`/api/gc/heap-analysis/${processId}`, {
      params: { topN, includeAllocationStacks },
    });

    const data = response.data;

    return {
      id: data.id,
      timestamp: data.timestamp,
      topTypesByMemory: (data.topTypesByMemory || []).map((t: any): TypeMemoryInfo => ({
        typeName: t.typeName || '',
        namespace: t.namespace || '<unknown>',
        isArray: t.isArray || false,
        arrayElementType: t.arrayElementType || null,
        isThreadRelated: t.isThreadRelated || false,
        totalBytes: t.totalBytes || 0,
        instanceCount: t.instanceCount || 0,
        averageBytesPerInstance: t.averageBytesPerInstance || 0,
        percentageOfTotal: t.percentageOfTotal || 0,
        allocationOrigins: t.allocationOrigins?.map((o: any): AllocationOrigin => ({
          typeName: o.typeName || '',
          methodName: o.methodName || 'Unknown',
          className: o.className || null,
          namespace: o.namespace || null,
          fileName: o.fileName || null,
          lineNumber: o.lineNumber || null,
          stackFrames: o.stackFrames || [],
          allocationCount: o.allocationCount || 0,
        })),
      })),
      topTypesByCount: (data.topTypesByCount || []).map((t: any): TypeCountInfo => ({
        typeName: t.typeName || '',
        namespace: t.namespace || '<unknown>',
        isArray: t.isArray || false,
        arrayElementType: t.arrayElementType || null,
        isThreadRelated: t.isThreadRelated || false,
        instanceCount: t.instanceCount || 0,
        totalBytes: t.totalBytes || 0,
        percentageOfTotalCount: t.percentageOfTotalCount || 0,
      })),
      largeObjects: (data.largeObjects || []).map((l: any): LargeObjectInfo => ({
        typeName: l.typeName || '',
        namespace: l.namespace || '<unknown>',
        isArray: l.isArray || false,
        arrayElementType: l.arrayElementType || null,
        sizeBytes: l.sizeBytes || 0,
        instanceCount: l.instanceCount || 0,
      })),
      topNamespacesByMemory: (data.topNamespacesByMemory || []).map((ns: any): NamespaceStats => ({
        namespace: ns.namespace || '<unknown>',
        totalBytes: ns.totalBytes || 0,
        instanceCount: ns.instanceCount || 0,
        typeCount: ns.typeCount || 0,
        isProblematic: ns.isProblematic || false,
        topAllocationMethods: ns.topAllocationMethods || undefined,
        topTypes: (ns.topTypes || []).map((t: any): TypeMemoryInfo => ({
          typeName: t.typeName || '',
          namespace: t.namespace || '<unknown>',
          isArray: t.isArray || false,
          arrayElementType: t.arrayElementType || null,
          isThreadRelated: t.isThreadRelated || false,
          totalBytes: t.totalBytes || 0,
          instanceCount: t.instanceCount || 0,
          averageBytesPerInstance: t.averageBytesPerInstance || 0,
          percentageOfTotal: t.percentageOfTotal || 0,
          allocationOrigins: t.allocationOrigins?.map((o: any): AllocationOrigin => ({
            typeName: o.typeName || '',
            methodName: o.methodName || 'Unknown',
            className: o.className || null,
            namespace: o.namespace || null,
            fileName: o.fileName || null,
            lineNumber: o.lineNumber || null,
            stackFrames: o.stackFrames || [],
            allocationCount: o.allocationCount || 0,
          })),
        })),
      })),
      topArrayElements: (data.topArrayElements || []).map((a: any): ArrayElementStats => ({
        elementTypeName: a.elementTypeName || '',
        arrayTypeName: a.arrayTypeName || '',
        totalArrays: a.totalArrays || 0,
        totalBytes: a.totalBytes || 0,
        averageArraySize: a.averageArraySize || 0,
      })),
      threadAnalysis: {
        totalThreads: data.threadAnalysis?.totalThreads || 0,
        threadObjectsCount: data.threadAnalysis?.threadObjectsCount || 0,
        threadObjectsBytes: data.threadAnalysis?.threadObjectsBytes || 0,
        taskObjectsCount: data.threadAnalysis?.taskObjectsCount || 0,
        taskObjectsBytes: data.threadAnalysis?.taskObjectsBytes || 0,
      } as ThreadAnalysis,
      summary: {
        totalHeapBytes: data.summary?.totalHeapBytes || 0,
        totalObjectCount: data.summary?.totalObjectCount || 0,
        totalTypeCount: data.summary?.totalTypeCount || 0,
        lohBytes: data.summary?.lohBytes || 0,
        lohObjectCount: data.summary?.lohObjectCount || 0,
      } as HeapSummary,
      humanizedInsights: data.humanizedInsights || [],
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Processo ${processId} não encontrado ou não é um processo .NET`);
      }
      throw new Error(error.response?.data?.message || error.message || 'Erro ao obter análise de heap');
    }
    throw error;
  }
}

export async function getHeapAnalysisHistory(processId: number, limit: number = 10): Promise<HeapAnalysis[]> {
  // Por enquanto, retorna apenas a análise mais recente
  // Pode ser implementado histórico no futuro se necessário
  const analysis = await getLatestHeapAnalysis(processId);
  return [analysis];
}

export async function getHeapAnalysisById(processId: number, _id: string): Promise<HeapAnalysis> {
  // Por enquanto, retorna a análise mais recente
  // Pode ser implementado busca por ID no futuro se necessário
  return await getLatestHeapAnalysis(processId);
}

// Allocation Tracking functions
export async function startAllocationTracking(processId: number): Promise<{ processId: number; status: string; message: string }> {
  try {
    const response = await apiClient.post(`/api/gc/allocation-tracking/start/${processId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message || 'Erro ao iniciar rastreamento');
    }
    throw error;
  }
}

export async function stopAllocationTracking(processId: number): Promise<{ processId: number; status: string; message: string }> {
  try {
    const response = await apiClient.post(`/api/gc/allocation-tracking/stop/${processId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message || 'Erro ao parar rastreamento');
    }
    throw error;
  }
}

export async function getAllocationTrackingStatus(processId: number): Promise<{ processId: number; isActive: boolean; status: string }> {
  try {
    const response = await apiClient.get(`/api/gc/allocation-tracking/status/${processId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message || 'Erro ao obter status do rastreamento');
    }
    throw error;
  }
}
