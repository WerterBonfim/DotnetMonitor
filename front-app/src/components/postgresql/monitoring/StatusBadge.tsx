import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    unused: { label: 'Não Utilizado', variant: 'destructive' },
    low_usage: { label: 'Baixo Uso', variant: 'outline' },
    normal: { label: 'Normal', variant: 'secondary' },
    high_usage: { label: 'Alto Uso', variant: 'default' },
  };

  const config = statusConfig[status] || { label: status, variant: 'default' };

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
}
