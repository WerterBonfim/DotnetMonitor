import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import type { Tablespace } from '../../../types/postgresql';
import { formatBytes } from '../../../lib/utils';

interface TablespacesListProps {
  tablespaces: Tablespace[];
}

export function TablespacesList({ tablespaces }: TablespacesListProps) {
  if (tablespaces.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Nenhum tablespace customizado encontrado (apenas pg_default e pg_global).
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Tablespaces</h3>
      <div className="space-y-2">
        {tablespaces.map((tablespace, idx) => (
          <div key={idx} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{tablespace.name}</span>
              <Badge variant="outline">{formatBytes(tablespace.size)}</Badge>
            </div>
            {tablespace.location && (
              <div className="text-sm text-muted-foreground">
                <code className="text-xs">{tablespace.location}</code>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
