import { GCStats, GenerationInfo, GCCollectionEvent, GCInterpretation } from '../types/gc';

function randomVariation(base: number, variationPercent: number = 10): number {
  const variation = base * (variationPercent / 100);
  return base + (Math.random() * 2 - 1) * variation;
}

function generateGenerationInfo(baseSize: number, baseFragmentation: number, baseCollections: number): GenerationInfo {
  return {
    sizeAfterBytes: Math.max(0, randomVariation(baseSize, 15)),
    fragmentedBytes: Math.max(0, randomVariation(baseSize * (baseFragmentation / 100), 20)),
    fragmentationPercent: Math.max(0, Math.min(100, randomVariation(baseFragmentation, 15))),
    collectionCount: Math.max(0, baseCollections + Math.floor(Math.random() * 3)),
  };
}

function generateHealthStatus(fragmentation: number): 'Healthy' | 'Warning' | 'Critical' {
  if (fragmentation < 20) return 'Healthy';
  if (fragmentation < 40) return 'Warning';
  return 'Critical';
}

function generateInterpretation(healthStatus: string, fragmentation: number): GCInterpretation {
  const recommendations: string[] = [];
  const issues: string[] = [];

  if (fragmentation > 30) {
    issues.push(`Fragmentação elevada: ${fragmentation.toFixed(2)}%`);
    recommendations.push('Considere reduzir alocações de objetos grandes');
    recommendations.push('Avalie o uso de object pooling para objetos frequentes');
  }

  if (fragmentation > 50) {
    issues.push('Fragmentação crítica detectada');
    recommendations.push('Execute uma coleta completa (GC.Collect()) se necessário');
    recommendations.push('Revise padrões de alocação de memória');
  }

  if (fragmentation < 20) {
    recommendations.push('GC está funcionando de forma eficiente');
  }

  return {
    status: healthStatus,
    description: `Status atual: ${healthStatus}. Fragmentação geral: ${fragmentation.toFixed(2)}%`,
    recommendations: recommendations.length > 0 ? recommendations : ['Nenhuma ação necessária no momento'],
    currentIssues: issues,
  };
}

function generateRecentCollections(): GCCollectionEvent[] {
  const collections: GCCollectionEvent[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 5; i++) {
    const timestamp = new Date(now - (i * 30000)).toISOString();
    const generation = Math.floor(Math.random() * 3);
    const heapSize = randomVariation(30 * 1024 * 1024, 20);
    const memoryFreed = randomVariation(heapSize * 0.3, 30);
    
    collections.push({
      generation,
      timestamp,
      heapSizeBytes: heapSize,
      memoryFreedBytes: memoryFreed,
    });
  }
  
  return collections.reverse();
}

let baseGen0 = 3.5 * 1024 * 1024;
let baseGen1 = 2.4 * 1024 * 1024;
let baseGen2 = 6.8 * 1024 * 1024;
let baseLOH = 17.8 * 1024 * 1024;
let baseTotal = 36.9 * 1024 * 1024;

export async function getGCMetrics(): Promise<GCStats> {
  // Simula variação gradual dos dados
  baseGen0 = randomVariation(baseGen0, 5);
  baseGen1 = randomVariation(baseGen1, 5);
  baseGen2 = randomVariation(baseGen2, 5);
  baseLOH = randomVariation(baseLOH, 5);
  baseTotal = baseGen0 + baseGen1 + baseGen2 + baseLOH;

  const gen0 = generateGenerationInfo(baseGen0, 7.39, 16);
  const gen1 = generateGenerationInfo(baseGen1, 5.02, 9);
  const gen2 = generateGenerationInfo(baseGen2, 14.27, 8);

  const lohSizeBytes = Math.max(0, randomVariation(baseLOH, 10));
  const pohSizeBytes = 320 + Math.floor(Math.random() * 100);
  const totalMemoryBytes = gen0.sizeAfterBytes + gen1.sizeAfterBytes + gen2.sizeAfterBytes + lohSizeBytes;
  const availableMemoryBytes = 31.84 * 1024 * 1024 * 1024;
  const pinnedObjectsCount = 5 + Math.floor(Math.random() * 3);

  const overallFragmentation = (gen0.fragmentationPercent + gen1.fragmentationPercent + gen2.fragmentationPercent) / 3;
  const healthStatus = generateHealthStatus(overallFragmentation);
  const interpretation = generateInterpretation(healthStatus, overallFragmentation);
  const recentCollections = generateRecentCollections();

  return {
    gen0,
    gen1,
    gen2,
    lohSizeBytes,
    pohSizeBytes,
    totalMemoryBytes,
    availableMemoryBytes,
    pinnedObjectsCount,
    overallFragmentationPercent: overallFragmentation,
    healthStatus,
    interpretation,
    recentCollections,
    timestamp: new Date().toISOString(),
  };
}
