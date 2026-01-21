import { useState } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { AlertTriangle, Lock, Unlock, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Button } from '../../ui/button';
import type { LockDetail, BlockingLock } from '../../../types/postgresql';

interface LocksVisualizationProps {
  lockDetails: LockDetail[];
  blockingLocks: BlockingLock[];
}

export function LocksVisualization({ lockDetails, blockingLocks }: LocksVisualizationProps) {
  const [showLockInfo, setShowLockInfo] = useState(false);
  const waitingLocks = lockDetails.filter((l) => !l.granted);
  const grantedLocks = lockDetails.filter((l) => l.granted);

  // Informações sobre tipos de locks
  const lockTypeInfo: Record<string, { description: string; impact: string }> = {
    relation: {
      description: 'Lock em tabelas, índices ou outras relações',
      impact: 'Bloqueia acesso a estruturas de dados específicas'
    },
    extend: {
      description: 'Lock de extensão de arquivo (quando uma tabela está crescendo)',
      impact: 'Normal durante operações de INSERT, geralmente não causa bloqueios'
    },
    page: {
      description: 'Lock em páginas individuais de uma tabela',
      impact: 'Raro, usado em operações de baixo nível'
    },
    tuple: {
      description: 'Lock em linhas individuais (row-level lock)',
      impact: 'Bloqueia apenas linhas específicas, permite concorrência'
    },
    transactionid: {
      description: 'Lock de transação (usado para controle de concorrência)',
      impact: 'Pode causar deadlocks se não gerenciado corretamente'
    },
    virtualxid: {
      description: 'Lock de ID de transação virtual',
      impact: 'Uso interno do PostgreSQL, geralmente não causa problemas'
    },
    object: {
      description: 'Lock em objetos do banco (schemas, databases, etc)',
      impact: 'Pode bloquear operações DDL em objetos específicos'
    },
    userlock: {
      description: 'Lock definido pelo usuário (advisory locks)',
      impact: 'Usado para sincronização customizada entre aplicações'
    },
    advisory: {
      description: 'Lock consultivo (advisory lock)',
      impact: 'Usado para sincronização entre processos de aplicação'
    }
  };

  // Informações sobre modos de lock
  const lockModeInfo: Record<string, { description: string; compatibility: string }> = {
    'AccessShareLock': {
      description: 'Lock compartilhado para leitura (SELECT)',
      compatibility: 'Compatível com todos os outros locks, exceto AccessExclusiveLock'
    },
    'RowShareLock': {
      description: 'Lock compartilhado em nível de linha (SELECT FOR UPDATE)',
      compatibility: 'Compatível com AccessShareLock e RowShareLock'
    },
    'RowExclusiveLock': {
      description: 'Lock exclusivo em nível de linha (INSERT, UPDATE, DELETE)',
      compatibility: 'Compatível com AccessShareLock, mas não com outros RowExclusiveLock'
    },
    'ShareUpdateExclusiveLock': {
      description: 'Lock para operações VACUUM, CREATE INDEX CONCURRENTLY',
      compatibility: 'Compatível apenas com AccessShareLock'
    },
    'ShareLock': {
      description: 'Lock compartilhado (CREATE INDEX sem CONCURRENTLY)',
      compatibility: 'Compatível apenas com AccessShareLock'
    },
    'ShareRowExclusiveLock': {
      description: 'Lock compartilhado exclusivo (CREATE UNIQUE INDEX)',
      compatibility: 'Compatível apenas com AccessShareLock'
    },
    'ExclusiveLock': {
      description: 'Lock exclusivo (ALTER TABLE, algumas operações DDL)',
      compatibility: 'Compatível apenas com AccessShareLock'
    },
    'AccessExclusiveLock': {
      description: 'Lock exclusivo de acesso (DROP TABLE, TRUNCATE, ALTER TABLE)',
      compatibility: 'Não compatível com nenhum outro lock'
    }
  };

  const getLockTypeDescription = (lockType: string): string => {
    return lockTypeInfo[lockType.toLowerCase()]?.description || 'Tipo de lock desconhecido';
  };

  const getLockTypeImpact = (lockType: string): string => {
    return lockTypeInfo[lockType.toLowerCase()]?.impact || '';
  };

  const getLockModeDescription = (mode: string): string => {
    return lockModeInfo[mode]?.description || 'Modo de lock padrão';
  };

  // Agrupar locks por tipo com mais detalhes
  const locksByTypeDetailed = lockDetails.reduce((acc, lock) => {
    if (!acc[lock.lockType]) {
      acc[lock.lockType] = {
        count: 0,
        granted: 0,
        waiting: 0,
        modes: new Set<string>()
      };
    }
    acc[lock.lockType].count++;
    if (lock.granted) {
      acc[lock.lockType].granted++;
    } else {
      acc[lock.lockType].waiting++;
    }
    acc[lock.lockType].modes.add(lock.mode);
    return acc;
  }, {} as Record<string, { count: number; granted: number; waiting: number; modes: Set<string> }>);

  return (
    <div className="space-y-4">
      {/* Informações sobre tipos de locks */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
              Sobre Locks do PostgreSQL
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                <strong>Locks</strong> são mecanismos de controle de concorrência que garantem a consistência dos dados.
                O PostgreSQL usa diferentes tipos e modos de locks para gerenciar o acesso simultâneo aos dados.
              </p>
              <p>
                <strong>Tipos de Locks:</strong> Definem o que está sendo bloqueado (tabela, linha, transação, etc.)
              </p>
              <p>
                <strong>Modos de Locks:</strong> Definem o nível de acesso permitido (leitura, escrita, exclusivo, etc.)
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setShowLockInfo(true)}
              >
                <Info className="h-4 w-4 mr-2" />
                Ver detalhes sobre tipos e modos de locks
              </Button>
              <Dialog open={showLockInfo} onOpenChange={setShowLockInfo}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto top-[5%] translate-y-0">
                  <DialogHeader>
                    <DialogTitle>Tipos e Modos de Locks do PostgreSQL</DialogTitle>
                    <DialogDescription>
                      Informações detalhadas sobre os locks do PostgreSQL
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">Tipos de Locks</h3>
                      <div className="space-y-3">
                        {Object.entries(lockTypeInfo).map(([type, info]) => (
                          <div key={type} className="p-3 bg-muted rounded-md">
                            <div className="font-medium mb-1">{type}</div>
                            <div className="text-sm text-muted-foreground">{info.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <strong>Impacto:</strong> {info.impact}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Modos de Locks</h3>
                      <div className="space-y-3">
                        {Object.entries(lockModeInfo).map(([mode, info]) => (
                          <div key={mode} className="p-3 bg-muted rounded-md">
                            <div className="font-medium mb-1">{mode}</div>
                            <div className="text-sm text-muted-foreground">{info.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <strong>Compatibilidade:</strong> {info.compatibility}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </Card>

      {blockingLocks.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{blockingLocks.length} bloqueio(s) detectado(s)</strong> - Algumas queries estão
            esperando por locks.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Locks Esperando ({waitingLocks.length})
          </h3>
          {waitingLocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lock esperando</p>
          ) : (
            <div className="space-y-2">
              {waitingLocks.slice(0, 10).map((lock, idx) => (
                <div key={idx} className="p-3 bg-muted rounded-md text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">PID {lock.pid}</span>
                    <Badge variant="destructive">Esperando</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Tipo:</span>
                      <Badge variant="outline">{lock.lockType}</Badge>
                    </div>
                    {lock.relation && (
                      <div>
                        <span className="font-medium">Tabela:</span> {lock.relation}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Modo:</span> {lock.mode}
                      <div className="text-xs mt-0.5 italic">
                        {getLockModeDescription(lock.mode)}
                      </div>
                    </div>
                    {lock.waitStart && (
                      <div>
                        <span className="font-medium">Esperando desde:</span>{' '}
                        {new Date(lock.waitStart).toLocaleString('pt-BR')}
                      </div>
                    )}
                    {lock.query && (
                      <div className="mt-2">
                        <div className="font-medium mb-1">Query:</div>
                        <div className="truncate max-w-md bg-background p-2 rounded font-mono text-xs">
                          {lock.query.substring(0, 100)}
                          {lock.query.length > 100 && '...'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Unlock className="h-4 w-4" />
            Locks Concedidos ({grantedLocks.length})
          </h3>
          <div className="space-y-3">
            {Object.entries(locksByTypeDetailed).map(([type, details]) => (
              <div key={type} className="p-3 bg-muted rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{type}</span>
                  <Badge variant="secondary">{details.count} total</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {details.granted} concedidos
                    </Badge>
                    {details.waiting > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {details.waiting} esperando
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="font-medium mb-1">Descrição:</div>
                    <div>{getLockTypeDescription(type)}</div>
                    {getLockTypeImpact(type) && (
                      <>
                        <div className="font-medium mt-1 mb-1">Impacto:</div>
                        <div>{getLockTypeImpact(type)}</div>
                      </>
                    )}
                  </div>
                  {details.modes.size > 0 && (
                    <div className="mt-2">
                      <div className="font-medium mb-1">Modos utilizados:</div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(details.modes).map((mode) => (
                          <Badge key={mode} variant="outline" className="text-xs">
                            {mode}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {blockingLocks.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Relação de Bloqueios</h3>
          <div className="space-y-3">
            {blockingLocks.map((block, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="font-medium">Bloqueio Detectado</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-destructive mb-1">Bloqueado (PID {block.blockedPid})</div>
                    <div className="text-muted-foreground">
                      <div>Usuário: {block.blockedUser}</div>
                      {block.blockedQuery && (
                        <div className="truncate max-w-md">
                          Query: {block.blockedQuery.substring(0, 80)}...
                        </div>
                      )}
                      {block.blockedDuration && (
                        <div>Esperando há: {block.blockedDuration}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Bloqueador (PID {block.blockingPid})</div>
                    <div className="text-muted-foreground">
                      <div>Usuário: {block.blockingUser}</div>
                      {block.blockingQuery && (
                        <div className="truncate max-w-md">
                          Query: {block.blockingQuery.substring(0, 80)}...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {block.relation && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Tabela: {block.relation} | Modo bloqueado: {block.blockedMode} | Modo
                    bloqueador: {block.blockingMode}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
