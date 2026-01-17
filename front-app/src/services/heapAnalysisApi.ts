import { HeapAnalysis, TypeMemoryInfo, TypeCountInfo, LargeObjectInfo, HeapSummary } from '../types/gc';

const typeNames = [
  'System.String',
  'System.Object[]',
  'System.Byte[]',
  'System.Int32[]',
  'System.Collections.Generic.List`1',
  'System.Collections.Generic.Dictionary`2',
  'System.Threading.Tasks.Task',
  'System.Exception',
  'System.Text.StringBuilder',
  'System.IO.MemoryStream',
];

function generateTypeMemoryInfo(): TypeMemoryInfo[] {
  return typeNames.slice(0, 10).map((typeName, index) => {
    const totalBytes = (10 - index) * 1024 * 1024 + Math.random() * 5 * 1024 * 1024;
    const instanceCount = Math.floor((10 - index) * 1000 + Math.random() * 5000);
    const averageBytesPerInstance = totalBytes / instanceCount;
    const percentageOfTotal = (totalBytes / (50 * 1024 * 1024)) * 100;

    return {
      typeName,
      totalBytes,
      instanceCount,
      averageBytesPerInstance,
      percentageOfTotal,
    };
  }).sort((a, b) => b.totalBytes - a.totalBytes);
}

function generateTypeCountInfo(): TypeCountInfo[] {
  return typeNames.slice(0, 10).map((typeName, index) => {
    const instanceCount = Math.floor((10 - index) * 5000 + Math.random() * 20000);
    const totalBytes = instanceCount * (100 + Math.random() * 500);
    const percentageOfTotalCount = (instanceCount / 100000) * 100;

    return {
      typeName,
      instanceCount,
      totalBytes,
      percentageOfTotalCount,
    };
  }).sort((a, b) => b.instanceCount - a.instanceCount);
}

function generateLargeObjects(): LargeObjectInfo[] {
  const largeObjectTypes = [
    'System.Byte[]',
    'System.Object[]',
    'System.Collections.Generic.List`1',
    'System.IO.MemoryStream',
  ];

  return largeObjectTypes.map((typeName) => {
    const sizeBytes = 85 * 1024 + Math.random() * 500 * 1024;
    const instanceCount = Math.floor(1 + Math.random() * 10);

    return {
      typeName,
      sizeBytes,
      instanceCount,
    };
  }).sort((a, b) => b.sizeBytes - a.sizeBytes);
}

function generateHeapSummary(): HeapSummary {
  const totalHeapBytes = 36.9 * 1024 * 1024 + Math.random() * 10 * 1024 * 1024;
  const totalObjectCount = 50000 + Math.floor(Math.random() * 50000);
  const totalTypeCount = 200 + Math.floor(Math.random() * 100);
  const lohBytes = 17.8 * 1024 * 1024 + Math.random() * 5 * 1024 * 1024;
  const lohObjectCount = Math.floor(50 + Math.random() * 50);

  return {
    totalHeapBytes,
    totalObjectCount,
    totalTypeCount,
    lohBytes,
    lohObjectCount,
  };
}

function generateInsights(summary: HeapSummary): string[] {
  const insights: string[] = [];

  if (summary.lohBytes > summary.totalHeapBytes * 0.4) {
    insights.push('Large Object Heap está ocupando mais de 40% do heap total');
  }

  if (summary.totalObjectCount > 80000) {
    insights.push('Alto número de objetos no heap pode indicar necessidade de otimização');
  }

  if (summary.lohObjectCount > 80) {
    insights.push('Muitos objetos grandes detectados no LOH');
  }

  insights.push(`Heap contém ${summary.totalTypeCount} tipos diferentes de objetos`);
  insights.push(`Total de ${summary.totalObjectCount.toLocaleString()} objetos alocados`);

  return insights;
}

let analysisIdCounter = 1;

export async function getLatestHeapAnalysis(): Promise<HeapAnalysis> {
  const summary = generateHeapSummary();
  const topTypesByMemory = generateTypeMemoryInfo();
  const topTypesByCount = generateTypeCountInfo();
  const largeObjects = generateLargeObjects();
  const humanizedInsights = generateInsights(summary);

  return {
    id: `analysis-${analysisIdCounter++}`,
    timestamp: new Date().toISOString(),
    topTypesByMemory,
    topTypesByCount,
    largeObjects,
    summary,
    humanizedInsights,
  };
}

export async function getHeapAnalysisHistory(limit: number = 10): Promise<HeapAnalysis[]> {
  const analyses: HeapAnalysis[] = [];
  
  for (let i = 0; i < limit; i++) {
    const analysis = await getLatestHeapAnalysis();
    const timestamp = new Date(Date.now() - (limit - i) * 60000).toISOString();
    analyses.push({
      ...analysis,
      timestamp,
    });
  }
  
  return analyses;
}

export async function getHeapAnalysisById(id: string): Promise<HeapAnalysis> {
  return await getLatestHeapAnalysis();
}
