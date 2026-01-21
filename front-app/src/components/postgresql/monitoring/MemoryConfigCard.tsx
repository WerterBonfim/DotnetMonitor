import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import type { MemoryConfig } from '../../../types/postgresql';
import { formatBytes } from '../../../lib/utils';

interface MemoryConfigCardProps {
  memoryConfig?: MemoryConfig;
}

export function MemoryConfigCard({ memoryConfig }: MemoryConfigCardProps) {
  if (!memoryConfig) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Configurações de memória não disponíveis
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="p-6">
        <h3 className="font-semibold mb-2">Shared Buffers</h3>
        <div className="text-2xl font-bold">{formatBytes(memoryConfig.sharedBuffers)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Memória compartilhada para cache de dados
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-2">Work Memory</h3>
        <div className="text-2xl font-bold">{formatBytes(memoryConfig.workMem)}</div>
        <p className="text-xs text-muted-foreground mt-1">Por operação de ordenação/hash</p>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-2">Maintenance Work Memory</h3>
        <div className="text-2xl font-bold">{formatBytes(memoryConfig.maintenanceWorkMem)}</div>
        <p className="text-xs text-muted-foreground mt-1">Para operações de manutenção</p>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-2">Effective Cache Size</h3>
        <div className="text-2xl font-bold">{formatBytes(memoryConfig.effectiveCacheSize)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Estimativa de cache disponível no OS
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-2">Max Connections</h3>
        <div className="text-2xl font-bold">{memoryConfig.maxConnections}</div>
        <p className="text-xs text-muted-foreground mt-1">Conexões simultâneas máximas</p>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-2">WAL Buffers</h3>
        <div className="text-2xl font-bold">{formatBytes(memoryConfig.walBuffers)}</div>
        <p className="text-xs text-muted-foreground mt-1">Buffers para Write-Ahead Log</p>
      </Card>

      <Card className="p-6 md:col-span-2 lg:col-span-3 bg-primary/5">
        <h3 className="font-semibold mb-2">Memória Total Estimada</h3>
        <div className="text-3xl font-bold">{formatBytes(memoryConfig.estimatedTotalMemory)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Estimativa baseada nas configurações atuais
        </p>
      </Card>
    </div>
  );
}
