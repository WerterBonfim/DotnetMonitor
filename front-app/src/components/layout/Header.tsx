import { Trash2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../lib/theme-provider';

interface HeaderProps {
  refreshInterval: number;
  onRefreshIntervalChange: (interval: number) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  onManualRefresh: () => void;
  lastUpdate: string;
}

export function Header({
  refreshInterval,
  onRefreshIntervalChange,
  autoRefresh,
  onAutoRefreshChange,
  onManualRefresh,
  lastUpdate,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR');
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="navContent container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-6 w-6" />
            <h1 className="text-xl font-bold">Garbage Collector Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => onAutoRefreshChange(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh
            </label>
          </div>

          <select
            value={refreshInterval}
            onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            disabled={!autoRefresh}
          >
            <option value={1000}>1s</option>
            <option value={3000}>3s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
          </select>

          <Button variant="outline" size="sm" onClick={onManualRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>

          <div className="text-xs text-muted-foreground">
            Última atualização: {formatTime(lastUpdate)}
          </div>

          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'slate')}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="slate">Slate</option>
          </select>
        </div>
      </div>
    </header>
  );
}
