import { Card } from '../../ui/card';
import { cn } from '../../../lib/utils';
import type { LucideProps } from 'lucide-react';
import { DashboardInfoButton } from './DashboardInfoButton';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<LucideProps>;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  trend?: {
    value: number;
    label: string;
  };
  infoType?: 'active-connections' | 'slow-queries' | 'unused-indexes' | 'total-indexes' | 'recommendations' | 'tables-problems' | 'avg-cache-hit';
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'default',
  trend,
  infoType,
}: MetricCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-500/50 bg-green-500/5',
    warning: 'border-yellow-500/50 bg-yellow-500/5',
    destructive: 'border-red-500/50 bg-red-500/5',
  };

  const getStatus = (): 'good' | 'warning' | 'critical' => {
    if (variant === 'success') return 'good';
    if (variant === 'warning') return 'warning';
    if (variant === 'destructive') return 'critical';
    return 'good';
  };

  return (
    <Card className={cn('p-4', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {infoType && (
              <DashboardInfoButton
                type={infoType}
                value={typeof value === 'number' ? value : undefined}
                status={getStatus()}
              />
            )}
          </div>
          <div className="text-2xl font-bold mt-2">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div className={cn(
              'text-xs mt-2',
              trend.value > 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
