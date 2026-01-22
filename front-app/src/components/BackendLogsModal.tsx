import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { RefreshCw, X } from 'lucide-react';
import { getBackendLogs } from '../services/backendApi';

interface BackendLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackendLogsModal({ open, onOpenChange }: BackendLogsModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedLogs = await getBackendLogs(200);
      if (Array.isArray(fetchedLogs)) {
        setLogs(fetchedLogs);
      } else {
        setError('Formato de resposta inválido');
        setLogs([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Erro desconhecido ao carregar logs';
      setError(errorMessage);
      setLogs([]);
      console.error('Erro ao buscar logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col top-[5%] translate-y-0">
        <DialogHeader>
          <DialogTitle>Logs do Backend</DialogTitle>
          <DialogDescription>
            Visualize os logs recentes do servidor backend
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Carregando logs...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-destructive">
                <p className="font-semibold">Erro ao carregar logs</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto bg-slate-950 border rounded-md p-4">
              <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-words">
                {logs.length === 0 ? (
                  <span className="text-muted-foreground">Nenhum log disponível</span>
                ) : (
                  logs.join('\n')
                )}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {logs.length > 0 && `${logs.length} linhas de log`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchLogs}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
