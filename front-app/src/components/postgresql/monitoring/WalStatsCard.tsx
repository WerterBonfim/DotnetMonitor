import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import type { WalStats } from '../../../types/postgresql';
import { formatBytes } from '../../../lib/utils';

interface WalStatsCardProps {
  walStats?: WalStats;
}

export function WalStatsCard({ walStats }: WalStatsCardProps) {
  if (!walStats) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Estatísticas WAL não disponíveis
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="p-6">
        <h3 className="font-semibold mb-2">Tamanho Total do WAL</h3>
        <div className="text-2xl font-bold">{formatBytes(walStats.totalWalSize)}</div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-2">Checkpoints</h3>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Agendados:</span>
            <Badge variant="secondary">{walStats.checkpointTimed}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Solicitados:</span>
            <Badge variant="secondary">{walStats.checkpointReq}</Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-2">Tempo de Checkpoint</h3>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Escrita:</span>
            <span className="text-sm">{walStats.checkpointWriteTime.toFixed(2)} ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Sincronização:</span>
            <span className="text-sm">{walStats.checkpointSyncTime.toFixed(2)} ms</span>
          </div>
        </div>
      </Card>

      {walStats.walLevel && (
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Configurações WAL</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nível:</span>
              <Badge variant="outline">{walStats.walLevel}</Badge>
            </div>
            {walStats.walCompression !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Compressão:</span>
                <Badge variant={walStats.walCompression ? 'default' : 'secondary'}>
                  {walStats.walCompression ? 'Ativada' : 'Desativada'}
                </Badge>
              </div>
            )}
            {walStats.maxWalSize && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tamanho Máx:</span>
                <span className="text-sm">{formatBytes(walStats.maxWalSize)}</span>
              </div>
            )}
            {walStats.minWalSize && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tamanho Mín:</span>
                <span className="text-sm">{formatBytes(walStats.minWalSize)}</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
