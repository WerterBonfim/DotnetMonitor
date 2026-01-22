import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import {
  Play,
  Square,
  AlertTriangle,
  Database,
  Info,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import {
  startAllocationTracking,
  stopAllocationTracking,
  getAllocationTrackingStatus,
} from '../../services/heapAnalysisApi';

interface AllocationTrackingControlProps {
  processId: number | null;
}

export function AllocationTrackingControl({
  processId,
}: AllocationTrackingControlProps) {
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['allocation-tracking-status', processId],
    queryFn: () => {
      if (!processId) throw new Error('Processo não selecionado');
      return getAllocationTrackingStatus(processId);
    },
    enabled: !!processId,
    refetchInterval: 2000, // Refetch a cada 2 segundos quando ativo (será controlado pelo enabled)
  });

  const startMutation = useMutation({
    mutationFn: (pid: number) => startAllocationTracking(pid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocation-tracking-status', processId] });
      setShowConfirmDialog(false);
      setConfirmed(false);
    },
  });

  const stopMutation = useMutation({
    mutationFn: (pid: number) => stopAllocationTracking(pid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocation-tracking-status', processId] });
    },
  });

  const handleStartClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmStart = () => {
    if (confirmed && processId) {
      startMutation.mutate(processId);
    }
  };

  const handleStop = () => {
    if (processId) {
      stopMutation.mutate(processId);
    }
  };

  if (!processId) {
    return null;
  }

  const isActive = status?.isActive ?? false;
  const isLoading = statusLoading || startMutation.isPending || stopMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Rastreamento de Origem de Alocações</span>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Botões de controle */}
          <div className="flex items-center gap-2">
            {!isActive ? (
              <Button
                onClick={handleStartClick}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Iniciar Rastreamento
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                disabled={isLoading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Parar Rastreamento
              </Button>
            )}
          </div>

          {/* Alertas informativos */}
          <div className="space-y-3">
            {/* Alerta de Performance */}
            <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>⚠️ Overhead de Performance</AlertTitle>
              <AlertDescription className="space-y-1">
                <p>
                  O rastreamento de alocações usa amostragem alta (
                  <code className="text-xs">gcsampledobjectallocationhigh</code>)
                </p>
                <p>
                  <strong>Overhead estimado: 5-15%</strong> de impacto na performance
                </p>
                <p>Recomendado apenas para: desenvolvimento, debug e análise de problemas</p>
                <p className="font-semibold">
                  ⚠️ <strong>NÃO recomendado para produção</strong> com alta carga
                </p>
              </AlertDescription>
            </Alert>

            {/* Alerta de Memória (quando ativo) */}
            {isActive && (
              <Alert variant="default" className="border-blue-500/50 bg-blue-500/10">
                <Database className="h-4 w-4" />
                <AlertTitle>💾 Consumo de Memória</AlertTitle>
                <AlertDescription className="space-y-1">
                  <p>Stack traces são armazenados em memória</p>
                  <p>Consumo aumenta com o tempo de rastreamento</p>
                  <p className="font-semibold">
                    Recomendado: parar o rastreamento após análise
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Alerta de Símbolos */}
            <Alert variant="default" className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4" />
              <AlertTitle>ℹ️ Símbolos (PDBs)</AlertTitle>
              <AlertDescription className="space-y-1">
                <p>Para stack traces úteis, PDBs devem estar disponíveis</p>
                <p>
                  Stack traces sem símbolos mostrarão apenas endereços de memória
                </p>
                <p>
                  Certifique-se de que a aplicação foi compilada com símbolos de debug
                </p>
              </AlertDescription>
            </Alert>

            {/* Alerta de Uso (quando inativo) */}
            {!isActive && (
              <Alert variant="default" className="border-green-500/50 bg-green-500/10">
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>💡 Como Usar</AlertTitle>
                <AlertDescription className="space-y-1">
                  <p>1. Clique em &quot;Iniciar Rastreamento&quot;</p>
                  <p>2. Execute ações na aplicação monitorada</p>
                  <p>3. Clique em &quot;Analisar Heap&quot; para ver origens</p>
                  <p>4. Pare o rastreamento quando terminar</p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="top-[5%] translate-y-0 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Início do Rastreamento</DialogTitle>
            <DialogDescription>
              Antes de iniciar, leia os avisos importantes abaixo:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>⚠️ Impacto na Performance</AlertTitle>
              <AlertDescription>
                O rastreamento de alocações pode causar um overhead de 5-15% na
                performance da aplicação monitorada. Use apenas em ambientes de
                desenvolvimento ou quando necessário para diagnóstico.
              </AlertDescription>
            </Alert>
            <Alert variant="default" className="border-blue-500/50 bg-blue-500/10">
              <Database className="h-4 w-4" />
              <AlertTitle>💾 Consumo de Memória</AlertTitle>
              <AlertDescription>
                Stack traces são armazenados em memória. O consumo aumenta com o
                tempo de rastreamento. Pare o rastreamento após concluir a análise.
              </AlertDescription>
            </Alert>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm-risks"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <label
                htmlFor="confirm-risks"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Entendi os riscos e quero continuar
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setConfirmed(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmStart}
              disabled={!confirmed || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Iniciar Rastreamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
