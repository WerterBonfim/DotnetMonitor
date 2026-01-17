Objetivo: Criar um Dashboard de Monitoramento de Garbage Collector (GC) baseado na imagem enviada. A aplicação deve ser robusta, performática e suportar atualizações em tempo real a cada 5 segundos.

Stack Tecnológica:

Framework: React com Vite e TypeScript.

Estilização: Tailwind CSS + Shadcn/ui.

Gráficos: Recharts.

Data Fetching: TanStack Query (React Query) com refetchInterval de 5s.

Ícones: Lucide React.

Temas (Gerenciamento via next-themes): Implemente 3 variações de tema:

Light: Fundo claro (Zinc-50), cards brancos com bordas suaves.

Dark: Fundo preto profundo (Zinc-950), estética técnica.

Slate (Meio-termo): Um tema azulado/cinza escuro moderno (Slate-900), com menos contraste que o Pure Dark.

Estrutura da Interface:

Header: Título "Garbage Collector Dashboard", seletor de intervalo de atualização e toggle de temas.

Health Banner: Um banner de status (ex: "Atenção") que muda de cor (Verde/Amarelo/Vermelho) baseado na fragmentação geral.

Grid de Cards de Geração: > * Cards para Gen 0, Gen 1 e Gen 2. Cada card deve mostrar: Tamanho, % de Fragmentação, contagem de Coletas e um Badge de status (OK/Alerta).

Heaps Especiais: Cards destacados para LOH (Large Object Heap) e POH (Pinned Object Heap).

Estatísticas Gerais: Widgets pequenos com Memória Total, Memória Disponível e Objetos Pinned.

Gráfico de Histórico: Um gráfico de linha (AreaChart ou LineChart) usando Recharts que mostre a evolução do uso de memória ao longo do tempo.

Instruções Adicionais:

Crie um mock-api simples ou use o estado do React Query para simular os dados mudando a cada 5 segundos.

Utilize os componentes do Shadcn/ui (Card, Badge, Button, Tabs, Progress).

Certifique-se de que os componentes sejam responsivos.

Como transformar seu app React em Desktop com Tauri

Se não tiver o rust instalado, instale ele pra mim.

Obtenha a documentação atualizada do dotnet 10 GC, rust, tauri e das lib necessaria para o projeto react

crie uma pasta chamada front-app = vai conter o projeto react e tauri
não crie o projeto dotnet, eu vou criar ele depois com mais detalhes

o front deve ser ajustado:

/* Responsive layouts for large screens */
@media (min-width: 1920px) {
  .navContent {
    max-width: 1800px;
  }
  
  .mainContent {
    max-width: 1800px;
  }
}

@media (min-width: 2560px) {
  .navContent {
    max-width: 2400px;
  }
  
  .mainContent {
    max-width: 2400px;
  }
}

@media (min-width: 3440px) {
  .navContent {
    max-width: 3200px;
  }
  
  .mainContent {
    max-width: 3200px;
  }
}


principalmente para telas muito grandes e telas de notebook 13 polegadas

esse app frontend deve seguir uma arquitetura limpa e enxuta de forma a facilitar a manutenção.


Alguns tipos sugeridos que mapeiam o GC:

export interface HeapAnalysis {
  id: string;
  timestamp: string;
  topTypesByMemory: TypeMemoryInfo[];
  topTypesByCount: TypeCountInfo[];
  largeObjects: LargeObjectInfo[];
  summary: HeapSummary;
  humanizedInsights: string[];
}

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

