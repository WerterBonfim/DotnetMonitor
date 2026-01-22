# Erro de Importação EdgeProps do ReactFlow

## Data
2025-01-27

## Problema

O frontend estava apresentando o seguinte erro em tempo de execução:

```
Uncaught SyntaxError: The requested module '/node_modules/.vite/deps/reactflow.js?v=a99c7276' does not provide an export named 'EdgeProps' (at QueryPlanEdge.tsx:2:20)
```

## Causa

O erro ocorreu porque `EdgeProps` estava sendo importado como um valor comum, mas na versão 11.11.4 do `reactflow`, tipos TypeScript precisam ser importados explicitamente usando a palavra-chave `type` para garantir que sejam removidos durante a compilação e não causem erros em tempo de execução.

## Solução

A importação foi corrigida de:
```typescript
import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow';
```

Para:
```typescript
import { BaseEdge, type EdgeProps, getBezierPath } from 'reactflow';
```

## Arquivos Afetados

- `front-app/src/components/postgresql/queryPlan/QueryPlanEdge.tsx`

## Observações

- O mesmo padrão já estava sendo usado corretamente em `QueryPlanNode.tsx` com `type NodeProps`
- A palavra-chave `type` garante que o TypeScript trate a importação apenas como tipo, removendo-a do código JavaScript compilado
- Isso é uma prática recomendada para importações de tipos em TypeScript moderno
