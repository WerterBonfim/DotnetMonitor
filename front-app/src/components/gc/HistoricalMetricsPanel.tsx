import { HeapTrendCard } from './HeapTrendCard';
import { MemoryCommittedCard } from './MemoryCommittedCard';
import type { GCStats } from '../../types/gc';

interface HistoricalMetricsPanelProps {
  stats: GCStats;
}

export function HistoricalMetricsPanel({ stats }: HistoricalMetricsPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Métricas Históricas</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Métricas que revelam tendências, padrões de comportamento e degradação gradual ao longo do tempo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HeapTrendCard
          heapSizeAfterGen2GC={stats.heapSizeAfterGen2GC}
          gen2CollectionFrequencyPerHour={stats.gen2CollectionFrequencyPerHour}
        />
        <MemoryCommittedCard
          memoryCommittedSizeBytes={stats.memoryCommittedSizeBytes}
          totalMemoryBytes={stats.totalMemoryBytes}
        />
      </div>
    </div>
  );
}
