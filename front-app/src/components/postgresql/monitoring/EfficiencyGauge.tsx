import { Card } from '../../ui/card';
import { cn } from '../../../lib/utils';
import { EfficiencyInfoButton } from './EfficiencyInfoButton';

interface EfficiencyGaugeProps {
  value: number;
  label: string;
  unit?: string;
  thresholds?: {
    good: number;
    warning: number;
  };
  infoType?: 'cache-hit' | 'commit-rollback' | 'temp-files';
}

export function EfficiencyGauge({
  value,
  label,
  unit = '%',
  thresholds = { good: 95, warning: 90 },
  infoType,
}: EfficiencyGaugeProps) {
  const percentage = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * 45; // raio = 45
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= thresholds.good) return 'text-green-500';
    if (percentage >= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBgColor = () => {
    if (percentage >= thresholds.good) return 'stroke-green-500/20';
    if (percentage >= thresholds.warning) return 'stroke-yellow-500/20';
    return 'stroke-red-500/20';
  };

  const getStatus = (): 'good' | 'warning' | 'critical' => {
    if (percentage >= thresholds.good) return 'good';
    if (percentage >= thresholds.warning) return 'warning';
    return 'critical';
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
          {infoType && (
            <EfficiencyInfoButton
              type={infoType}
              value={value}
              status={getStatus()}
            />
          )}
        </div>
        <div className="relative">
          <svg className="transform -rotate-90 w-32 h-32">
            {/* Background circle */}
            <circle
              cx="50%"
              cy="50%"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className={cn('text-muted', getBgColor())}
            />
            {/* Progress circle */}
            <circle
              cx="50%"
              cy="50%"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={cn('transition-all duration-500', getColor())}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={cn('text-2xl font-bold', getColor())}>
                {value.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">{unit}</div>
            </div>
          </div>
        </div>
        <div className={cn('mt-4 text-xs font-medium', getColor())}>
          {percentage >= thresholds.good
            ? 'Eficiência Excelente'
            : percentage >= thresholds.warning
            ? 'Atenção Necessária'
            : 'Requer Ação'}
        </div>
      </div>
    </Card>
  );
}
