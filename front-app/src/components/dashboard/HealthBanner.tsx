import { AlertTriangle, CheckCircle, XCircle, Folder } from 'lucide-react';
import type { GCStats } from '../../types/gc';
import { cn } from '../../lib/utils';

interface HealthBannerProps {
  stats: GCStats;
}

export function HealthBanner({ stats }: HealthBannerProps) {
  const getStatusConfig = () => {
    switch (stats.healthStatus) {
      case 'Healthy':
        return {
          bgColor: 'bg-green-500/10 border-green-500/50',
          icon: CheckCircle,
          iconColor: 'text-green-500',
          title: 'Status de Saúde do GC',
          status: 'Saudável',
        };
      case 'Warning':
        return {
          bgColor: 'bg-yellow-500/10 border-yellow-500/50',
          icon: AlertTriangle,
          iconColor: 'text-yellow-500',
          title: 'Status de Saúde do GC',
          status: 'Atenção',
        };
      case 'Critical':
        return {
          bgColor: 'bg-red-500/10 border-red-500/50',
          icon: XCircle,
          iconColor: 'text-red-500',
          title: 'Status de Saúde do GC',
          status: 'Crítico',
        };
      default:
        return {
          bgColor: 'bg-yellow-500/10 border-yellow-500/50',
          icon: AlertTriangle,
          iconColor: 'text-yellow-500',
          title: 'Status de Saúde do GC',
          status: 'Atenção',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border p-4',
        config.bgColor
      )}
    >
      <Folder className="h-6 w-6 text-purple-500" />
      <Icon className={cn('h-8 w-8', config.iconColor)} />
      <div className="flex-1">
        <div className="font-semibold">{config.title}</div>
        <div className="text-sm font-medium">{config.status}</div>
      </div>
      <div className="text-sm">
        Fragmentação Geral: {stats.overallFragmentationPercent.toFixed(2)}%
      </div>
    </div>
  );
}
