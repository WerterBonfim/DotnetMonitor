import { useState } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { RefreshCw, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface PostgresLogsViewerProps {
  logs: string[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function PostgresLogsViewer({ logs, isLoading, onRefresh }: PostgresLogsViewerProps) {
  const [autoScroll, setAutoScroll] = useState(true);

  const getLogLevel = (line: string): 'error' | 'warning' | 'info' | 'unknown' => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('error') || lowerLine.includes('fatal') || lowerLine.includes('panic')) {
      return 'error';
    }
    if (lowerLine.includes('warning') || lowerLine.includes('warn')) {
      return 'warning';
    }
    if (lowerLine.includes('info') || lowerLine.includes('notice')) {
      return 'info';
    }
    return 'unknown';
  };

  const getLogLevelColor = (level: 'error' | 'warning' | 'info' | 'unknown') => {
    switch (level) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getLogLevelIcon = (level: 'error' | 'warning' | 'info' | 'unknown') => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3" />;
      case 'info':
        return <Info className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
        Carregando logs...
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Nenhum log disponível.
      </Card>
    );
  }

  // Verificar se é uma mensagem de erro (não conseguiu ler os logs)
  if (logs.length > 0 && logs[0].includes('Não foi possível acessar')) {
    return (
      <Card className="p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
        <div className="space-y-2">
          {logs.map((line, index) => (
            <p key={index} className="text-sm text-yellow-800 dark:text-yellow-200">
              {line}
            </p>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Logs do PostgreSQL</h3>
          <Badge variant="secondary">{logs.length} linhas</Badge>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          )}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div
          className="bg-slate-950 text-green-400 font-mono text-xs p-4 overflow-x-auto max-h-[600px] overflow-y-auto"
          style={{ fontFamily: 'monospace' }}
        >
          {logs.map((line, index) => {
            const level = getLogLevel(line);
            const levelColor = getLogLevelColor(level);
            const levelIcon = getLogLevelIcon(level);

            return (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-2 py-1 hover:bg-slate-900/50',
                  levelColor
                )}
              >
                {levelIcon && <span className="mt-0.5 flex-shrink-0">{levelIcon}</span>}
                <span className="flex-1 break-words whitespace-pre-wrap">{line}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="text-xs text-muted-foreground">
        <p>Mostrando as últimas {logs.length} linhas dos logs do PostgreSQL.</p>
        <p className="mt-1">
          <span className="text-red-600 dark:text-red-400">●</span> Erro |{' '}
          <span className="text-yellow-600 dark:text-yellow-400">●</span> Aviso |{' '}
          <span className="text-blue-600 dark:text-blue-400">●</span> Info
        </p>
      </div>
    </div>
  );
}
