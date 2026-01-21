export interface GenerationInfo {
  sizeAfterBytes: number;
  fragmentedBytes: number;
  fragmentationPercent: number;
  collectionCount: number;
}

export interface GCCollectionEvent {
  generation: number;
  timestamp: string;
  heapSizeBytes: number;
  memoryFreedBytes: number;
}

export interface GCInterpretation {
  status: string;
  description: string;
  recommendations: string[];
  currentIssues: string[];
}

export interface CollectionRatePerMinute {
  gen0: number;
  gen1: number;
  gen2: number;
}

export interface GCStats {
  gen0: GenerationInfo;
  gen1: GenerationInfo;
  gen2: GenerationInfo;
  lohSizeBytes: number;
  pohSizeBytes: number;
  totalMemoryBytes: number;
  availableMemoryBytes: number;
  pinnedObjectsCount: number;
  overallFragmentationPercent: number;
  healthStatus: 'Healthy' | 'Warning' | 'Critical';
  interpretation: GCInterpretation;
  recentCollections: GCCollectionEvent[];
  timestamp: string;
  timeInGCPercent: number;
  gcPauseTimeTotalMs: number;
  gcPauseTimeAverageMs: number;
  collectionRatePerMinute: CollectionRatePerMinute;
  allocationRateBytesPerSecond: number;
  memoryCommittedSizeBytes: number;
  heapSizeAfterGen2GC: number;
  gen2CollectionFrequencyPerHour: number;
}

export interface AllocationOrigin {
  typeName: string;
  methodName: string;
  className: string | null;
  namespace: string | null;
  fileName: string | null;
  lineNumber: number | null;
  stackFrames: string[];
  allocationCount: number;
}

export interface TypeMemoryInfo {
  typeName: string;
  namespace: string;
  isArray: boolean;
  arrayElementType: string | null;
  isThreadRelated: boolean;
  totalBytes: number;
  instanceCount: number;
  averageBytesPerInstance: number;
  percentageOfTotal: number;
  allocationOrigins?: AllocationOrigin[];
}

export interface TypeCountInfo {
  typeName: string;
  namespace: string;
  isArray: boolean;
  arrayElementType: string | null;
  isThreadRelated: boolean;
  instanceCount: number;
  totalBytes: number;
  percentageOfTotalCount: number;
}

export interface LargeObjectInfo {
  typeName: string;
  namespace: string;
  isArray: boolean;
  arrayElementType: string | null;
  sizeBytes: number;
  instanceCount: number;
}

export interface NamespaceStats {
  namespace: string;
  totalBytes: number;
  instanceCount: number;
  typeCount: number;
  topTypes: TypeMemoryInfo[];
  isProblematic: boolean;
  topAllocationMethods?: string[];
}

export interface ArrayElementStats {
  elementTypeName: string;
  arrayTypeName: string;
  totalArrays: number;
  totalBytes: number;
  averageArraySize: number;
}

export interface ThreadAnalysis {
  totalThreads: number;
  threadObjectsCount: number;
  threadObjectsBytes: number;
  taskObjectsCount: number;
  taskObjectsBytes: number;
}

export interface HeapSummary {
  totalHeapBytes: number;
  totalObjectCount: number;
  totalTypeCount: number;
  lohBytes: number;
  lohObjectCount: number;
}

export interface HeapAnalysis {
  id: string;
  timestamp: string;
  topTypesByMemory: TypeMemoryInfo[];
  topTypesByCount: TypeCountInfo[];
  largeObjects: LargeObjectInfo[];
  topNamespacesByMemory: NamespaceStats[];
  topArrayElements: ArrayElementStats[];
  threadAnalysis: ThreadAnalysis;
  summary: HeapSummary;
  humanizedInsights: string[];
}
