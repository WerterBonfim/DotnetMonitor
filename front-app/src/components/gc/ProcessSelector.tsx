import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDotNetProcesses, type DotNetProcess } from '../../services/gcApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { formatBytes, formatLongPath } from '../../lib/utils';
import { RefreshCw, Search } from 'lucide-react';

interface ProcessSelectorProps {
  selectedProcessId: number | null;
  onProcessSelect: (processId: number) => void;
}

export function ProcessSelector({ selectedProcessId, onProcessSelect }: ProcessSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: processes = [], isLoading, refetch } = useQuery({
    queryKey: ['dotnet-processes'],
    queryFn: getDotNetProcesses,
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  // Filtra processos baseado no termo de busca
  const filteredProcesses = useMemo(() => {
    if (!searchTerm.trim()) {
      return processes;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return processes.filter((process) => {
      const processNameMatch = process.processName.toLowerCase().includes(lowerSearchTerm);
      const pathMatch = process.mainModulePath?.toLowerCase().includes(lowerSearchTerm) ?? false;
      const pidMatch = process.processId.toString().includes(lowerSearchTerm);
      
      return processNameMatch || pathMatch || pidMatch;
    });
  }, [processes, searchTerm]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando processos .NET...</div>
        </CardContent>
      </Card>
    );
  }

  if (processes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Processos .NET</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Nenhum processo .NET encontrado
          </div>
          <Button onClick={() => refetch()} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Selecione um Processo .NET</CardTitle>
          <Button onClick={() => refetch()} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar por nome, PID ou caminho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Lista de processos filtrados */}
        {filteredProcesses.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            Nenhum processo encontrado com "{searchTerm}"
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredProcesses.map((process) => (
              <Button
                key={process.processId}
                variant={selectedProcessId === process.processId ? 'default' : 'outline'}
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => onProcessSelect(process.processId)}
              >
                <div className="flex flex-col items-start w-full">
                  <div className="font-semibold">{process.processName}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    PID: {process.processId} • {formatBytes(process.workingSet64)}
                    {process.mainModulePath && (
                      <span className="block mt-1" title={process.mainModulePath}>
                        {formatLongPath(process.mainModulePath, 70)}
                      </span>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
