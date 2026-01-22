# Dotnet Monitor

Uma ferramenta didática e objetiva para entender o funcionamento do **Garbage Collector (GC)** do .NET e monitorar o comportamento do banco de dados **PostgreSQL**.

## 📋 Sobre o Projeto

O **Dotnet Monitor** é uma aplicação desktop desenvolvida com o objetivo de fornecer uma forma prática e visual de:

1. **Analisar o Garbage Collector do .NET**: Entender como o GC funciona, monitorar métricas em tempo real, visualizar estatísticas de gerações (Gen 0, 1, 2), heap, fragmentação e muito mais.

2. **Monitorar PostgreSQL**: Ferramenta completa para gerenciar conexões PostgreSQL, analisar query plans, monitorar métricas de performance, histórico de queries e comportamento do banco de dados.

A aplicação foi desenvolvida com foco educacional, oferecendo visualizações claras e interpretações automáticas dos dados coletados, facilitando o aprendizado sobre esses importantes componentes de sistemas.

## 🚀 Tecnologias

### Backend

- **.NET 10.0** - Framework principal
- **ASP.NET Core** - API REST
- **LiteDB** - Banco de dados local para armazenar configurações e histórico
- **Npgsql** - Driver para PostgreSQL
- **dotnet-monitor** - Integração com ferramentas de diagnóstico do .NET

### Frontend

- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tauri** - Framework para aplicação desktop
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes UI
- **Recharts** - Gráficos e visualizações
- **TanStack Query** - Gerenciamento de estado e data fetching
- **Axios** - Cliente HTTP

## 📦 Pré-requisitos

- **.NET SDK 10.0** ou superior
- **Node.js 18+** e npm
- **Rust** (para compilar o Tauri)
- **PostgreSQL** (opcional, apenas se quiser usar as ferramentas de monitoramento)

### Instalar Rust

**Windows (PowerShell):**
```powershell
Invoke-WebRequest https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
.\rustup-init.exe
```

**Linux/Mac:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 🛠️ Como Rodar em Modo Desenvolvimento

### Opção 1: Via IDE (Rider/Visual Studio)

1. Abra o projeto `backend/PostgresMonitor.Host/PostgresMonitor.Host.csproj` na sua IDE
2. Configure o projeto como startup project
3. Execute o projeto (F5 ou Run)
4. O Aspire irá iniciar automaticamente o backend e frontend

### Opção 2: Via Terminal

#### Backend

```bash
cd backend/PostgresMonitor.Api
dotnet run
```

O backend estará disponível em `http://localhost:5000` (ou na porta configurada pela variável de ambiente `PORT`).

#### Frontend

Em outro terminal:

```bash
cd front-app
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

#### Frontend com Tauri (Desktop)

```bash
cd front-app
npm install
npm run tauri:dev
```

### Opção 3: Via Aspire

```bash
cd backend/PostgresMonitor.Host
aspire run
```

O Aspire irá gerenciar todos os recursos e você poderá visualizar o dashboard do Aspire.

## 📦 Como Gerar Executável

O projeto inclui um script PowerShell (`build-app.ps1`) que automatiza todo o processo de build:

### Uso Básico

```powershell
.\build-app.ps1
```

### Parâmetros Disponíveis

- `-Port <porta>`: Define a porta do backend (padrão: 5000)
- `-Runtime <runtime>`: Define o runtime do .NET (padrão: win-x64)
- `-Clean`: Limpa builds anteriores antes de compilar

### Exemplos

```powershell
# Build com porta customizada
.\build-app.ps1 -Port 8080

# Build limpando builds anteriores
.\build-app.ps1 -Clean

# Build completo com todas as opções
.\build-app.ps1 -Port 5000 -Runtime win-x64 -Clean
```

### O que o Script Faz

1. Verifica pré-requisitos (dotnet, npm)
2. Limpa builds anteriores (se `-Clean` for especificado)
3. Compila o backend .NET como executável self-contained
4. Copia o executável para a pasta `front-app/src-tauri/binaries`
5. Atualiza configurações do Tauri
6. Compila o frontend
7. Compila o Tauri (gera o executável final)

### Localização do Executável

Após o build, o executável estará em:

```
front-app/src-tauri/target/release/
```

O arquivo terá o nome baseado na configuração do Tauri (geralmente algo como `dotnet-monitor.exe` ou similar).

## 🏗️ Estrutura do Projeto

```
.
├── backend/
│   ├── PostgresMonitor.Api/          # API REST principal
│   ├── PostgresMonitor.Core/         # Lógica de negócio e DTOs
│   ├── PostgresMonitor.Infrastructure/ # Implementações (LiteDB, serviços)
│   ├── PostgresMonitor.Host/         # AppHost do Aspire
│   └── PostgresMonitor.ServiceDefaults/ # Configurações padrão
├── front-app/
│   ├── src/
│   │   ├── components/               # Componentes React
│   │   │   ├── gc/                   # Componentes do GC Dashboard
│   │   │   ├── postgresql/           # Componentes do PostgreSQL Tools
│   │   │   └── ui/                   # Componentes Shadcn/ui
│   │   ├── pages/                    # Páginas da aplicação
│   │   ├── services/                 # Serviços de API
│   │   ├── types/                    # Tipos TypeScript
│   │   └── hooks/                    # Custom hooks
│   └── src-tauri/                    # Código Rust do Tauri
├── build-app.ps1                     # Script de build
└── README.md                          # Este arquivo
```

## ✨ Funcionalidades

### GC Dashboard

- **Seleção de Processos**: Lista todos os processos .NET em execução
- **Métricas em Tempo Real**: Visualização de métricas do GC atualizadas automaticamente
- **Análise de Gerações**: Detalhes sobre Gen 0, Gen 1 e Gen 2
- **Heap Analysis**: Análise detalhada do heap
- **Histórico**: Gráficos com evolução temporal das métricas
- **Interpretação Automática**: Análise inteligente do status do GC com recomendações

### PostgreSQL Tools

- **Gerenciamento de Conexões**: Salvar e gerenciar múltiplas conexões PostgreSQL
- **Query Plan Analyzer**: Analisar e visualizar query plans com EXPLAIN ANALYZE
- **Monitoramento**: Métricas de performance em tempo real
- **Histórico de Queries**: Visualizar histórico de execução de queries
- **Análise de Índices**: Detalhes sobre índices e recomendações
- **Logs do PostgreSQL**: Visualizar logs do banco de dados

## 🔧 Configuração

### Variáveis de Ambiente

- `PORT`: Porta do backend (padrão: 5000)
- `VITE_API_BASE_URL`: URL base da API no frontend (padrão: http://localhost:5000)

### Configuração do LiteDB

O banco de dados LiteDB é usado para armazenar:
- Conexões PostgreSQL (criptografadas)
- Histórico de métricas
- Histórico de queries

O caminho do banco pode ser configurado em `appsettings.json`:

```json
{
  "LiteDB": {
    "DatabasePath": "caminho/para/banco.db"
  }
}
```

Se não especificado, será usado um caminho padrão no diretório do usuário.

## 🐛 Troubleshooting

### Porta já está em uso

Se você receber um erro indicando que a porta está em uso:

1. Verifique se há outra instância do aplicativo rodando
2. Use uma porta diferente definindo a variável de ambiente `PORT`
3. No Windows, você pode verificar qual processo está usando a porta:
   ```powershell
   netstat -ano | findstr :5000
   ```

### Backend não inicia

1. Verifique os logs usando o botão "Ver Logs" no rodapé da aplicação
2. Certifique-se de que o .NET SDK está instalado corretamente
3. Verifique se não há conflitos de porta

### Frontend não conecta ao backend

1. Verifique se o backend está rodando
2. Confirme que a variável `VITE_API_BASE_URL` está correta
3. Verifique os logs do backend

## 📝 Notas

- O projeto usa **LiteDB** como banco de dados local (não MongoDB)
- As credenciais do PostgreSQL são armazenadas de forma criptografada
- O aplicativo verifica automaticamente se a porta está disponível antes de iniciar

## 📄 Licença

Este projeto é privado.
