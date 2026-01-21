import { useQuery } from '@tanstack/react-query';
import { getGCMetrics } from '../services/gcApi';
import type { GCStats } from '../types/gc';

export function useGCStats(processId: number | null, refetchInterval: number = 3000, enabled: boolean = true) {
  return useQuery<GCStats>({
    queryKey: ['gc-metrics', processId],
    queryFn: () => {
      if (!processId) {
        throw new Error('Processo não selecionado');
      }
      return getGCMetrics(processId);
    },
    enabled: enabled && processId !== null,
    refetchInterval: enabled && processId !== null ? refetchInterval : false,
    staleTime: 1000,
  });
}
