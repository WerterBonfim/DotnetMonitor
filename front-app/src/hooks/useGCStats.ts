import { useQuery } from '@tanstack/react-query';
import { getGCMetrics } from '../services/gcApi';
import { GCStats } from '../types/gc';

export function useGCStats(refetchInterval: number = 5000, enabled: boolean = true) {
  return useQuery<GCStats>({
    queryKey: ['gc-metrics'],
    queryFn: getGCMetrics,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 1000,
  });
}
