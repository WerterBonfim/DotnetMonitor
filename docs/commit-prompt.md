# Prompt para Mensagens de Commit

Siga o padrão **Conventional Commits** em português. Use este modelo como guia cada vez que for fazer um commit.

## Modelo

```
<tipo>[escopo opcional]: <descrição curta>

[Descrição opcional: um ou dois parágrafos explicando *o que*, *por que* e, se relevante, *como*.

- Itens adicionais podem ser formatados com lista
- Referência a issues: "Ref #1234"]
```

## Tipos Comuns

| Tipo       | Quando usar                                                       |
|------------|-------------------------------------------------------------------|
| `feat`     | Nova funcionalidade / recurso                                    |
| `fix`      | Correção de bug                                                   |
| `docs`     | Alterações em documentação                                        |
| `style`    | Formatação, espaçamento, etc., que não afetam lógica             |
| `refactor` | Refatorações que não adicionam nova feature nem corrigem bug     |
| `perf`     | Melhorias de performance                                          |
| `test`     | Adição ou correção de testes                                     |
| `chore`    | Tarefas de manutenção, atualizações de dependências, build, etc. |
| `ci`       | Mudanças em CI/CD                                                 |
| `build`    | Mudanças no sistema de build                                      |

## Escopos Opcionais

Escopos ajudam a identificar a área do código afetada. Exemplos:
- `feat(dashboard): adicionar gráfico de histórico`
- `fix(api): corrigir timeout na requisição`
- `refactor(components): reorganizar estrutura de pastas`

## Exemplos em Português

### Feature
```
feat(dashboard): adicionar gráfico de histórico de métricas

Implementa gráfico de linha usando Recharts para exibir evolução
das métricas do GC ao longo do tempo. O gráfico atualiza
automaticamente a cada 5 segundos quando o auto-refresh está ativo.
```

### Fix
```
fix(api): corrigir cálculo de fragmentação do heap

O cálculo estava retornando valores negativos em alguns casos.
Agora garante que o valor sempre seja entre 0 e 100.
```

### Docs
```
docs(readme): atualizar instruções de instalação

Adiciona instruções para instalação do Rust e configuração
do ambiente de desenvolvimento Tauri.
```

### Refactor
```
refactor(components): extrair lógica de formatação para utilitários

Move funções formatBytes e formatPercent para lib/utils.ts
para melhorar reutilização e manutenibilidade.
```

### Chore
```
chore(deps): atualizar dependências do projeto

Atualiza React Query para versão 5.90.18 e Tailwind CSS
para versão 4.1.18 para corrigir vulnerabilidades de segurança.
```

### Style
```
style(components): padronizar espaçamento em cards

Ajusta padding e margin dos componentes Card para manter
consistência visual em todo o dashboard.
```

## Boas Práticas

1. **Seja específico**: Descreva exatamente o que foi feito
2. **Use imperativo**: "adicionar" em vez de "adicionado" ou "adiciona"
3. **Mantenha curto**: A primeira linha deve ter no máximo 72 caracteres
4. **Explique o porquê**: Se necessário, use o corpo do commit para explicar a motivação
5. **Referencie issues**: Use "Ref #123" ou "Fixes #123" quando relevante

## Exemplo Completo

```
feat(dashboard): implementar sistema de temas

Adiciona suporte para três temas: Light, Dark e Slate.
O tema é persistido no localStorage e pode ser alterado
via seletor no header.

- Implementa ThemeProvider customizado
- Adiciona variáveis CSS para cada tema
- Integra seletor de tema no Header component

Ref #45
```
