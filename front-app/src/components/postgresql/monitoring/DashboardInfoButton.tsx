import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';

interface DashboardInfoButtonProps {
  type: 'active-connections' | 'slow-queries' | 'unused-indexes' | 'total-indexes' | 'recommendations' | 'tables-problems' | 'avg-cache-hit';
  value?: number | string;
  status?: 'good' | 'warning' | 'critical';
}

export function DashboardInfoButton({ type, value, status }: DashboardInfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getInfo = (): {
    title: string;
    description: string;
    impact: string;
    interpretation: {
      good: string;
      warning: string;
      critical: string;
    };
    actions: string[];
    tips: string[];
    thresholds?: {
      good: number;
      warning: number;
    };
  } => {
    switch (type) {
      case 'active-connections':
        return {
          title: 'Conexões Ativas',
          description: 'Número de conexões atualmente ativas no banco de dados PostgreSQL. Conexões ativas são aquelas que estão executando queries ou aguardando por recursos.',
          impact: 'Muitas conexões ativas podem indicar sobrecarga do banco, queries lentas, ou aplicações mantendo conexões abertas desnecessariamente. Isso pode consumir recursos (memória, CPU) e degradar a performance geral.',
          interpretation: {
            good: 'Excelente! Número de conexões ativas está dentro de limites saudáveis.',
            warning: 'Atenção: Número elevado de conexões ativas. Monitorar e investigar queries lentas.',
            critical: 'Crítico: Muitas conexões ativas. Pode indicar problemas sérios de performance ou vazamento de conexões.',
          },
          actions: [
            'Verificar max_connections no postgresql.conf e ajustar se necessário',
            'Analisar pg_stat_activity para identificar conexões ociosas ou queries lentas',
            'Implementar connection pooling na aplicação (ex: PgBouncer)',
            'Verificar se a aplicação está fechando conexões corretamente',
            'Monitorar conexões de longa duração que podem estar bloqueando recursos',
            'Considerar usar PgBouncer ou pgpool para gerenciar conexões',
            'Revisar código da aplicação para garantir que conexões são liberadas após uso',
          ],
          tips: [
            'Valores típicos: 20-100 conexões ativas para aplicações pequenas/médias',
            'Mais de 50 conexões ativas simultaneamente pode indicar necessidade de otimização',
            'Connection pooling pode reduzir drasticamente o número de conexões necessárias',
            'Conexões ociosas (idle) ainda consomem memória - considere timeouts',
            'Verifique pg_stat_activity.state para entender o estado das conexões',
          ],
          thresholds: {
            good: 30,
            warning: 50,
          },
        };
      case 'slow-queries':
        return {
          title: 'Queries Lentas',
          description: 'Número de queries que estão executando com tempo médio superior a 100ms. Queries lentas podem degradar significativamente a performance do banco de dados.',
          impact: 'Queries lentas consomem recursos (CPU, I/O, memória) por mais tempo, podem causar locks e bloquear outras operações, e resultam em experiência ruim para os usuários da aplicação.',
          interpretation: {
            good: 'Excelente! Nenhuma ou poucas queries lentas detectadas.',
            warning: 'Atenção: Algumas queries estão lentas. Investigar e otimizar.',
            critical: 'Crítico: Muitas queries lentas. Performance do banco pode estar comprometida.',
          },
          actions: [
            'Analisar queries específicas usando pg_stat_statements para identificar as mais lentas',
            'Executar EXPLAIN ANALYZE nas queries problemáticas para identificar gargalos',
            'Verificar se há índices faltantes que possam estar causando full table scans',
            'Otimizar queries complexas, considerando reescrever ou quebrar em partes menores',
            'Verificar se há locks ou bloqueios que possam estar causando lentidão',
            'Considerar adicionar índices apropriados baseados nos planos de execução',
            'Monitorar pg_stat_activity para identificar queries em execução no momento',
            'Revisar configurações de work_mem e shared_buffers que podem afetar performance',
          ],
          tips: [
            'Queries com tempo > 100ms são consideradas lentas em muitos contextos',
            'Queries com tempo > 1s devem ser investigadas imediatamente',
            'Use pg_stat_statements para identificar as queries mais problemáticas',
            'Índices apropriados podem reduzir drasticamente o tempo de execução',
            'Queries com muitos JOINs ou subqueries podem se beneficiar de otimização',
          ],
          thresholds: {
            good: 0,
            warning: 5,
          },
        };
      case 'unused-indexes':
        return {
          title: 'Índices Não Utilizados',
          description: 'Número de índices que não estão sendo utilizados (0 scans). Índices não utilizados ocupam espaço em disco e podem degradar a performance de operações de escrita (INSERT, UPDATE, DELETE).',
          impact: 'Índices não utilizados consomem espaço em disco, aumentam o tempo de backup, e podem degradar a performance de operações de escrita, pois o PostgreSQL precisa mantê-los atualizados mesmo quando não são usados.',
          interpretation: {
            good: 'Excelente! Todos os índices estão sendo utilizados.',
            warning: 'Atenção: Alguns índices não estão sendo utilizados. Considerar remoção.',
            critical: 'Crítico: Muitos índices não utilizados. Impacto significativo em espaço e performance de escrita.',
          },
          actions: [
            'Analisar cada índice não utilizado para confirmar que realmente não é necessário',
            'Verificar se o índice foi criado para uma query específica que não é mais executada',
            'Considerar remover índices não utilizados usando DROP INDEX CONCURRENTLY',
            'Monitorar por algumas semanas antes de remover para garantir que não será necessário',
            'Verificar se há índices duplicados ou redundantes que podem ser consolidados',
            'Documentar a razão da remoção antes de executar',
          ],
          tips: [
            'Índices com 0 scans por um período prolongado são candidatos à remoção',
            'Cuidado: alguns índices podem ser usados apenas em casos específicos (ex: relatórios mensais)',
            'Índices grandes não utilizados têm maior impacto negativo',
            'Use DROP INDEX CONCURRENTLY para evitar locks durante a remoção',
            'Monitore pg_stat_user_indexes.idx_scan para identificar índices não utilizados',
          ],
          thresholds: {
            good: 0,
            warning: 3,
          },
        };
      case 'total-indexes':
        return {
          title: 'Total de Índices',
          description: 'Número total de índices no banco de dados e o tamanho total que ocupam. Índices são estruturas que melhoram a velocidade de consultas, mas também ocupam espaço e podem impactar operações de escrita.',
          impact: 'Muitos índices podem indicar que o banco está bem otimizado para leitura, mas pode degradar a performance de escrita. Poucos índices podem indicar que queries estão lentas por falta de otimização.',
          interpretation: {
            good: 'Excelente! Número de índices está balanceado para as necessidades do banco.',
            warning: 'Atenção: Número de índices pode estar alto ou baixo. Avaliar necessidade.',
            critical: 'Crítico: Número de índices muito alto ou muito baixo. Revisar estratégia de indexação.',
          },
          actions: [
            'Avaliar se todos os índices são realmente necessários',
            'Verificar se há índices duplicados ou redundantes',
            'Analisar queries frequentes para identificar índices faltantes',
            'Considerar índices compostos para queries com múltiplas condições',
            'Monitorar o impacto dos índices em operações de escrita',
            'Balancear entre performance de leitura e escrita',
          ],
          tips: [
            'Não há um número "ideal" de índices - depende do padrão de uso',
            'Índices devem ser criados baseados em queries frequentes e lentas',
            'Muitos índices em tabelas com muitas escritas podem degradar performance',
            'Índices compostos podem substituir múltiplos índices simples',
            'Use EXPLAIN ANALYZE para verificar se índices estão sendo utilizados',
          ],
        };
      case 'recommendations':
        return {
          title: 'Recomendações de Índices',
          description: 'Número de recomendações geradas pelo sistema para melhorar a performance através da criação, modificação ou remoção de índices.',
          impact: 'Recomendações de alto impacto podem resultar em melhorias significativas de performance quando implementadas. Ignorar recomendações pode resultar em queries lentas e degradação contínua da performance.',
          interpretation: {
            good: 'Excelente! Poucas ou nenhuma recomendação. O banco está bem otimizado.',
            warning: 'Atenção: Algumas recomendações disponíveis. Avaliar e implementar as de alto impacto.',
            critical: 'Crítico: Muitas recomendações, especialmente de alto impacto. Implementação urgente recomendada.',
          },
          actions: [
            'Revisar recomendações de alto impacto primeiro',
            'Analisar cada recomendação antes de implementar',
            'Testar índices sugeridos em ambiente de desenvolvimento primeiro',
            'Usar CREATE INDEX CONCURRENTLY para evitar locks em produção',
            'Monitorar o impacto após implementação',
            'Priorizar recomendações baseadas em queries mais frequentes',
            'Documentar decisões sobre quais recomendações implementar ou não',
          ],
          tips: [
            'Recomendações de alto impacto geralmente resultam em melhorias significativas',
            'Nem todas as recomendações precisam ser implementadas - avalie caso a caso',
            'Recomendações são baseadas em padrões de uso atuais - podem mudar com o tempo',
            'Índices sugeridos devem ser testados antes de implementação em produção',
            'Considere o custo de manutenção do índice versus o benefício de performance',
          ],
          thresholds: {
            good: 0,
            warning: 5,
          },
        };
      case 'tables-problems':
        return {
          title: 'Tabelas com Problemas',
          description: 'Número de tabelas que apresentam problemas de eficiência, como muitos sequential scans, baixo cache hit ratio, ou outros indicadores de performance ruim.',
          impact: 'Tabelas com problemas podem estar causando queries lentas, consumo excessivo de recursos, e degradação geral da performance do banco de dados.',
          interpretation: {
            good: 'Excelente! Nenhuma tabela com problemas detectados.',
            warning: 'Atenção: Algumas tabelas apresentam problemas. Investigar e otimizar.',
            critical: 'Crítico: Muitas tabelas com problemas. Impacto significativo na performance.',
          },
          actions: [
            'Analisar cada tabela problemática para identificar a causa raiz',
            'Verificar se há índices faltantes que possam melhorar sequential scans',
            'Considerar VACUUM e ANALYZE para atualizar estatísticas das tabelas',
            'Otimizar queries que acessam essas tabelas frequentemente',
            'Verificar se há fragmentação excessiva que pode ser resolvida com VACUUM FULL',
            'Considerar particionamento para tabelas muito grandes',
            'Revisar estratégia de indexação para essas tabelas',
          ],
          tips: [
            'Tabelas com muitos sequential scans podem se beneficiar de índices apropriados',
            'Cache hit ratio baixo pode indicar necessidade de aumentar shared_buffers',
            'Tabelas grandes podem se beneficiar de particionamento',
            'Estatísticas desatualizadas podem causar planos de execução ruins',
            'Use VACUUM ANALYZE regularmente para manter estatísticas atualizadas',
          ],
          thresholds: {
            good: 0,
            warning: 3,
          },
        };
      case 'avg-cache-hit':
        return {
          title: 'Cache Hit Ratio Médio',
          description: 'Média do cache hit ratio entre todas as tabelas monitoradas. Indica o quão eficientemente o banco está usando o cache em memória para servir leituras.',
          impact: 'Um cache hit ratio médio alto indica que a maioria das leituras está sendo servida da memória, resultando em melhor performance. Valores baixos indicam muitas leituras do disco, que são significativamente mais lentas.',
          interpretation: {
            good: 'Excelente! Cache hit ratio médio está alto. O banco está usando eficientemente a memória.',
            warning: 'Atenção: Cache hit ratio médio pode ser melhorado. Algumas tabelas podem estar causando leituras do disco.',
            critical: 'Crítico: Cache hit ratio médio baixo. Muitas leituras do disco estão degradando a performance.',
          },
          actions: [
            'Aumentar shared_buffers no postgresql.conf (recomendado: 25% da RAM total)',
            'Identificar tabelas específicas com cache hit ratio baixo',
            'Verificar se há queries fazendo full table scans desnecessários',
            'Analisar índices faltantes que possam estar causando leituras sequenciais',
            'Considerar aumentar effective_cache_size para ajudar o planejador de queries',
            'Monitorar pg_stat_statements para identificar queries com muitos buffer reads',
            'Verificar se há tabelas muito grandes que não cabem no cache',
          ],
          tips: [
            'Valores acima de 95% são considerados excelentes',
            'Valores entre 90-95% são aceitáveis mas podem ser melhorados',
            'Valores abaixo de 90% indicam necessidade de otimização',
            'Cache hit ratio pode variar entre tabelas - analise individualmente',
            'Tabelas muito grandes podem ter cache hit ratio baixo mesmo com configuração adequada',
          ],
          thresholds: {
            good: 95,
            warning: 90,
          },
        };
    }
  };

  const info = getInfo();
  const statusText = status ? info.interpretation[status] : '';

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 text-muted-foreground hover:text-foreground"
        onClick={() => setIsOpen(true)}
        title={`Informações sobre ${info.title}`}
      >
        <Info className="h-3 w-3" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto top-[5%] translate-y-0">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-6 w-6"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8">
              <Info className="h-5 w-5" />
              {info.title}
            </DialogTitle>
            <DialogDescription>{info.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Valor atual e status */}
            {value !== undefined && (
              <Alert
                variant={
                  status === 'good'
                    ? 'default'
                    : status === 'warning'
                    ? 'default'
                    : 'destructive'
                }
                className={
                  status === 'good'
                    ? 'border-green-500/50 bg-green-500/10'
                    : status === 'warning'
                    ? 'border-yellow-500/50 bg-yellow-500/10'
                    : 'border-red-500/50 bg-red-500/10'
                }
              >
                <AlertTitle className="flex items-center justify-between">
                  <span>Valor Atual</span>
                  <span className="text-lg font-bold">
                    {typeof value === 'string' ? value : value.toLocaleString()}
                  </span>
                </AlertTitle>
                {statusText && (
                  <AlertDescription className="mt-2">
                    <strong>Interpretação:</strong> {statusText}
                  </AlertDescription>
                )}
              </Alert>
            )}

            {/* Impacto */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg">📊</span> Impacto na Performance
              </h4>
              <p className="text-sm text-muted-foreground">{info.impact}</p>
            </div>

            {/* Dicas */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg">💡</span> Dicas e Valores de Referência
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {info.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>

            {/* Ações Recomendadas */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg">⚙️</span> Ações Recomendadas
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {info.actions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
