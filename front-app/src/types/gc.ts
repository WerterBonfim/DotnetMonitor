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
}

export interface TypeMemoryInfo {
  typeName: string;
  totalBytes: number;
  instanceCount: number;
  averageBytesPerInstance: number;
  percentageOfTotal: number;
}

export interface TypeCountInfo {
  typeName: string;
  instanceCount: number;
  totalBytes: number;
  percentageOfTotalCount: number;
}

export interface LargeObjectInfo {
  typeName: string;
  sizeBytes: number;
  instanceCount: number;
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
  summary: HeapSummary;
  humanizedInsights: string[];
}
