import { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { StatusBadge } from './StatusBadge';
import { IndexDetailsModal } from './IndexDetailsModal';
import { Search, Eye } from 'lucide-react';
import type { IndexStats } from '../../../types/postgresql';
import { formatBytes } from '../../../lib/utils';

interface IndexStatsTableProps {
  indexStats: IndexStats[];
  connectionId?: string;
}

type FilterStatus = 'all' | 'unused' | 'low_usage' | 'normal' | 'high_usage';

export function IndexStatsTable({ indexStats, connectionId }: IndexStatsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedIndex, setSelectedIndex] = useState<{
    schemaName: string;
    tableName: string;
    indexName: string;
  } | null>(null);

  const filteredStats = useMemo(() => {
    return indexStats.filter((index) => {
      const matchesSearch =
        index.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        index.indexName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        index.schemaName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || index.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [indexStats, searchTerm, statusFilter]);

  const statsByStatus = useMemo(() => {
    return {
      all: indexStats.length,
      unused: indexStats.filter((i) => i.status === 'unused').length,
      low_usage: indexStats.filter((i) => i.status === 'low_usage').length,
      normal: indexStats.filter((i) => i.status === 'normal').length,
      high_usage: indexStats.filter((i) => i.status === 'high_usage').length,
    };
  }, [indexStats]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Estatísticas de Índices</h3>
          <Badge variant="secondary">{filteredStats.length} índices</Badge>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar por tabela ou índice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'unused', 'low_usage', 'normal', 'high_usage'] as FilterStatus[]).map((status) => (
              <Badge
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all'
                  ? 'Todos'
                  : status === 'unused'
                  ? 'Não Utilizados'
                  : status === 'low_usage'
                  ? 'Baixo Uso'
                  : status === 'normal'
                  ? 'Normal'
                  : 'Alto Uso'}{' '}
                ({statsByStatus[status]})
              </Badge>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Schema</th>
                <th className="text-left p-2">Tabela</th>
                <th className="text-left p-2">Índice</th>
                <th className="text-right p-2">Scans</th>
                <th className="text-right p-2">Tuplas Lidas</th>
                <th className="text-right p-2">Tamanho</th>
                <th className="text-right p-2">% da Tabela</th>
                <th className="text-center p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-4 text-muted-foreground">
                    Nenhum índice encontrado
                  </td>
                </tr>
              ) : (
                filteredStats.map((index, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2">{index.schemaName}</td>
                    <td className="p-2 font-medium">{index.tableName}</td>
                    <td className="p-2 font-mono text-xs">{index.indexName}</td>
                    <td className="p-2 text-right">{index.indexScans.toLocaleString()}</td>
                    <td className="p-2 text-right">{index.indexTuplesRead.toLocaleString()}</td>
                    <td className="p-2 text-right">{formatBytes(index.indexSize)}</td>
                    <td className="p-2 text-right">{index.percentOfTable.toFixed(2)}%</td>
                    <td className="p-2 text-center">
                      <StatusBadge status={index.status} />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() =>
                          setSelectedIndex({
                            schemaName: index.schemaName,
                            tableName: index.tableName,
                            indexName: index.indexName,
                          })
                        }
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="Ver detalhes do índice"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIndex && connectionId && (
        <IndexDetailsModal
          connectionId={connectionId}
          schemaName={selectedIndex.schemaName}
          tableName={selectedIndex.tableName}
          indexName={selectedIndex.indexName}
          open={!!selectedIndex}
          onOpenChange={(open) => !open && setSelectedIndex(null)}
        />
      )}
    </Card>
  );
}
