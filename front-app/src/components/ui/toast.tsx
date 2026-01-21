import * as React from 'react';
import { cn } from '../../lib/utils';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export interface ToastProps {
  id: string;
  title?: string;
  description: string;
  variant?: 'default' | 'destructive' | 'success' | 'info';
  onClose?: () => void;
}

export function Toast({ id, title, description, variant = 'default', onClose }: ToastProps) {
  const icons = {
    default: <Info className="h-5 w-5" />,
    destructive: <AlertCircle className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  };

  const styles = {
    default: 'bg-background border-border text-foreground',
    destructive: 'bg-destructive/10 border-destructive text-destructive',
    success: 'bg-green-500/10 border-green-500 text-green-500',
    info: 'bg-blue-500/10 border-blue-500 text-blue-500',
  };

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all',
        styles[variant]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[variant]}</div>
      <div className="flex-1 space-y-1">
        {title && <div className="font-semibold text-sm">{title}</div>}
        <div className="text-sm opacity-90">{description}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
