import { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Search, ArrowUpDown } from 'lucide-react';
import type { QueryDetail } from '../../../types/postgresql';
import { formatBytes } from '../../../lib/utils';

interface QueryDetailsTableProps {
  queryDetails: QueryDetail[];
}

type SortField = 'totalTime' | 'meanTime' | 'calls' | 'sharedBlksRead';
type SortDirection = 'asc' | 'desc';

export function QueryDetailsTable({ queryDetails }: QueryDetailsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredAndSorted = useMemo(() => {
    let filtered = queryDetails.filter((q) =>
      q.query.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortField) {
        case 'totalTime':
          aVal = a.totalTime;
          bVal = b.totalTime;
          break;
        case 'meanTime':
          aVal = a.meanTime;
          bVal = b.meanTime;
          break;
        case 'calls':
          aVal = a.calls;
          bVal = b.calls;
          break;
        case 'sharedBlksRead':
          aVal = a.sharedBlksRead;
          bVal = b.sharedBlksRead;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aVal - bVal;
      }
      return bVal - aVal;
    });

    return filtered;
  }, [queryDetails, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  if (queryDetails.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Nenhuma query detalhada disponível. Certifique-se de que pg_stat_statements está
        configurado.
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">
                <SortButton field="totalTime" label="Tempo Total" />
              </th>
              <th className="text-left p-2">
                <SortButton field="meanTime" label="Tempo Médio" />
              </th>
              <th className="text-left p-2">
                <SortButton field="calls" label="Chamadas" />
              </th>
              <th className="text-left p-2">
                <SortButton field="sharedBlksRead" label="I/O Disco" />
              </th>
              <th className="text-left p-2">Cache Hit</th>
              <th className="text-left p-2">Query</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((query, idx) => {
              const cacheHitRatio =
                query.sharedBlksHit + query.sharedBlksRead > 0
                  ? ((query.sharedBlksHit / (query.sharedBlksHit + query.sharedBlksRead)) * 100).toFixed(1)
                  : '100.0';

              return (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <Badge variant="outline">{query.totalTime.toFixed(2)} ms</Badge>
                  </td>
                  <td className="p-2">{query.meanTime.toFixed(2)} ms</td>
                  <td className="p-2">{query.calls.toLocaleString()}</td>
                  <td className="p-2">
                    {query.sharedBlksRead > 0 && (
                      <Badge variant="destructive">
                        {formatBytes(query.sharedBlksRead * 8192)}
                      </Badge>
                    )}
                    {query.sharedBlksRead === 0 && (
                      <Badge variant="secondary">0 B</Badge>
                    )}
                  </td>
                  <td className="p-2">
                    <Badge
                      variant={
                        parseFloat(cacheHitRatio) > 95
                          ? 'default'
                          : parseFloat(cacheHitRatio) > 80
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {cacheHitRatio}%
                    </Badge>
                  </td>
                  <td className="p-2">
                    <code className="text-xs bg-muted p-1 rounded max-w-md block truncate">
                      {query.query.substring(0, 100)}
                      {query.query.length > 100 && '...'}
                    </code>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
