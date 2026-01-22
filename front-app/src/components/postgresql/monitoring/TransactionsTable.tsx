import { useState, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Search, Clock, AlertTriangle } from 'lucide-react';
import type { TransactionDetail } from '../../../types/postgresql';

interface TransactionsTableProps {
  transactions: TransactionDetail[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter(
      (t) =>
        t.datname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.usename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.query?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.applicationName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const getStateBadge = (state: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      idle: 'secondary',
      'idle in transaction': 'destructive',
      'idle in transaction (aborted)': 'destructive',
    };

    return (
      <Badge variant={variants[state] || 'outline'}>{state}</Badge>
    );
  };

  const formatDuration = (runtime?: string) => {
    if (!runtime) return '-';
    // Runtime vem como "HH:MM:SS" ou similar
    return runtime;
  };

  if (transactions.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Nenhuma transação ativa no momento.
      </Card>
    );
  }

  const longRunning = filtered.filter(
    (t) => t.runtime && parseFloat(t.runtime.replace(/[^\d.]/g, '')) > 300
  );

  return (
    <div className="space-y-4">
      {longRunning.length > 0 && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <span className="font-medium">
              {longRunning.length} transação(ões) rodando há mais de 5 minutos
            </span>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações..."
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
                <th className="text-left p-2">PID</th>
                <th className="text-left p-2">Usuário</th>
                <th className="text-left p-2">Banco</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Tempo de Execução</th>
                <th className="text-left p-2">Query</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((transaction, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <code className="text-xs">{transaction.pid}</code>
                  </td>
                  <td className="p-2">{transaction.usename}</td>
                  <td className="p-2">{transaction.datname}</td>
                  <td className="p-2">{getStateBadge(transaction.state)}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(transaction.runtime)}
                    </div>
                  </td>
                  <td className="p-2">
                    {transaction.query ? (
                      <code className="text-xs bg-muted p-1 rounded max-w-md block truncate">
                        {transaction.query.substring(0, 100)}
                        {transaction.query.length > 100 && '...'}
                      </code>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
