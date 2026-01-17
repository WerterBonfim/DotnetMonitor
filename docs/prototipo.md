
#### 2. GC API (`services/gcApi.ts`)

**Endpoints**:
- `GET /api/gc/metrics`

**Retorna**: `GCStats` com métricas completas do GC

#### 3. Heap Analysis API (`services/heapAnalysisApi.ts`)

**Endpoints**:
- `GET /api/gc/heap-analysis/latest`
- `GET /api/gc/heap-analysis/history?limit=10`
- `GET /api/gc/heap-analysis/{id}`

**Tipos**:
```typescript
interface HeapAnalysis {
  id: string;
  timestamp: string;
  topTypesByMemory: TypeMemoryInfo[];
  topTypesByCount: TypeCountInfo[];
  largeObjects: LargeObjectInfo[];
  summary: HeapSummary;
  humanizedInsights: string[];
}
```

### Cliente HTTP

Todos os serviços usam **Axios** com configuração base:
```typescript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```