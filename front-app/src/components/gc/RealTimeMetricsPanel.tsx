import { TimeInGCCard } from './TimeInGCCard';
import { GCPauseTimeCard } from './GCPauseTimeCard';
import { CollectionRateCard } from './CollectionRateCard';
import { AllocationRateCard } from './AllocationRateCard';
import type { GCStats } from '../../types/gc';

interface RealTimeMetricsPanelProps {
  stats: GCStats;
}

export function RealTimeMetricsPanel({ stats }: RealTimeMetricsPanelProps) {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RealTimeMetricsPanel.tsx:11',message:'RealTimeMetricsPanel render',data:{hasStats:!!stats,timeInGC:stats?.timeInGCPercent,timeInGCType:typeof stats?.timeInGCPercent,hasCollectionRate:!!stats?.collectionRatePerMinute,collectionRateType:typeof stats?.collectionRatePerMinute},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  if (!stats) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RealTimeMetricsPanel.tsx:14',message:'Stats is null/undefined',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    return <div>Stats não disponível</div>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Métricas em Tempo Real</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Métricas críticas que indicam problemas imediatos e ajudam a diagnosticar questões de performance e estabilidade no momento atual.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(() => {
          try {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RealTimeMetricsPanel.tsx:25',message:'Before rendering TimeInGCCard',data:{timeInGC:stats.timeInGCPercent,type:typeof stats.timeInGCPercent},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'K'})}).catch(()=>{});
            // #endregion
            return <TimeInGCCard timeInGCPercent={stats.timeInGCPercent ?? 0} />;
          } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RealTimeMetricsPanel.tsx:29',message:'Error rendering TimeInGCCard',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'K'})}).catch(()=>{});
            // #endregion
            return <div className="p-2 border border-red-500">Erro: {String(error)}</div>;
          }
        })()}
        <GCPauseTimeCard
          pauseTimeTotalMs={stats.gcPauseTimeTotalMs ?? 0}
          pauseTimeAverageMs={stats.gcPauseTimeAverageMs ?? 0}
        />
        <CollectionRateCard collectionRatePerMinute={stats.collectionRatePerMinute ?? { gen0: 0, gen1: 0, gen2: 0 }} />
        <AllocationRateCard allocationRateBytesPerSecond={stats.allocationRateBytesPerSecond ?? 0} />
      </div>
    </div>
  );
}
