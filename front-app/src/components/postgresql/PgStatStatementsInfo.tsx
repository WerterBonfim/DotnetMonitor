import { Card } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Database, FileCode, Settings } from 'lucide-react';
import { Badge } from '../ui/badge';

export function PgStatStatementsInfo() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuração do pg_stat_statements</h1>
        <p className="text-muted-foreground">
          O pg_stat_statements é uma extensão do PostgreSQL que rastreia estatísticas de execução
          de todas as queries SQL executadas no servidor. Esta extensão é necessária para recursos
          avançados de monitoramento de queries.
        </p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>
          Após modificar o arquivo postgresql.conf, é <strong>necessário reiniciar o PostgreSQL</strong> para
          que as alterações tenham efeito.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Passo 1: Instalar a Extensão</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          Execute o seguinte comando SQL no banco de dados onde deseja monitorar:
        </p>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <code>CREATE EXTENSION IF NOT EXISTS pg_stat_statements;</code>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileCode className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Passo 2: Configurar postgresql.conf</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          Adicione ou modifique a seguinte linha no arquivo <code>postgresql.conf</code>:
        </p>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <code>shared_preload_libraries = 'pg_stat_statements'</code>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          <strong>Localização do arquivo:</strong> Normalmente em{' '}
          <code>/etc/postgresql/[versão]/main/postgresql.conf</code> ou{' '}
          <code>C:\Program Files\PostgreSQL\[versão]\data\postgresql.conf</code>
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Passo 3: Configurações Opcionais</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          Após reiniciar o PostgreSQL, você pode configurar opções adicionais:
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">Configuração</Badge>
              <span className="font-medium">Número máximo de queries rastreadas</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Define quantas queries distintas podem ser rastreadas simultaneamente (padrão: ~5000)
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <code>ALTER SYSTEM SET pg_stat_statements.max = 10000;</code>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">Configuração</Badge>
              <span className="font-medium">Rastreamento de queries</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Controla quais queries são rastreadas:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mb-2 space-y-1">
              <li>
                <code>'top'</code> - Apenas queries de nível superior (padrão)
              </li>
              <li>
                <code>'all'</code> - Todas as queries, incluindo funções e procedimentos
              </li>
            </ul>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <code>ALTER SYSTEM SET pg_stat_statements.track = 'all';</code>
            </div>
          </div>
        </div>

        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Após executar os comandos <code>ALTER SYSTEM</code>, você pode precisar recarregar a
            configuração com <code>SELECT pg_reload_conf();</code> ou reiniciar o PostgreSQL,
            dependendo da configuração.
          </AlertDescription>
        </Alert>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">Verificação</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          Para verificar se a extensão está funcionando corretamente, execute:
        </p>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <code>SELECT * FROM pg_stat_statements LIMIT 1;</code>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Se a query retornar resultados (ou uma tabela vazia sem erro), a extensão está
          configurada corretamente.
        </p>
      </Card>

      <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-2">Recursos Disponíveis com pg_stat_statements</h3>
        <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
          <li>Análise detalhada de performance de queries</li>
          <li>Identificação de queries mais custosas</li>
          <li>Métricas de I/O por query</li>
          <li>Estatísticas de tempo de execução (média, mínimo, máximo)</li>
          <li>Análise de cache hit ratio por query</li>
        </ul>
      </Card>
    </div>
  );
}
