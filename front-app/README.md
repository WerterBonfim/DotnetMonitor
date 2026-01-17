# Garbage Collector Dashboard

Dashboard de monitoramento de Garbage Collector (GC) desenvolvido com React, Vite, TypeScript e Tauri.

## 🚀 Tecnologias

- **React 19** com **Vite** e **TypeScript**
- **Tauri** para aplicação desktop
- **Tailwind CSS** para estilização
- **Shadcn/ui** para componentes
- **Recharts** para gráficos
- **TanStack Query** para gerenciamento de estado e data fetching
- **Lucide React** para ícones

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ e npm
- Rust (para Tauri)

### Instalar Rust

Se você não tem o Rust instalado:

**Windows (PowerShell):**
```powershell
Invoke-WebRequest https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
.\rustup-init.exe
```

**Linux/Mac:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Instalar Dependências

```bash
npm install
```

## 🛠️ Desenvolvimento

### Modo Desenvolvimento (Web)

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

### Modo Desenvolvimento (Desktop com Tauri)

```bash
npm run tauri:dev
```

### Build para Produção

```bash
npm run build
```

### Build Desktop (Tauri)

```bash
npm run tauri:build
```

## 🎨 Temas

O dashboard suporta três temas:

- **Light**: Fundo claro (Zinc-50)
- **Dark**: Fundo preto profundo (Zinc-950)
- **Slate**: Tema azulado/cinza escuro (Slate-900)

O tema pode ser alterado via seletor no header e é persistido no localStorage.

## 📊 Funcionalidades

- **Visão Geral**: Dashboard principal com métricas do GC
- **Análise e Interpretação**: Interpretação automática do status do GC
- **Histórico de Coletas**: Registro das coletas recentes
- **Análise do Heap**: Análise detalhada do heap (em desenvolvimento)

### Métricas Exibidas

- Gerações (Gen 0, 1, 2): Tamanho, fragmentação e contagem de coletas
- Large Object Heap (LOH): Tamanho e uso relativo
- Pinned Object Heap (POH): Tamanho e objetos pinned
- Estatísticas Gerais: Memória total, disponível, fragmentação e objetos pinned
- Histórico de Métricas: Gráfico de linha com evolução temporal

## 🔄 Auto-refresh

O dashboard suporta atualização automática configurável:

- Intervalos: 1s, 3s, 5s, 10s
- Toggle para habilitar/desabilitar auto-refresh
- Botão de atualização manual

## 📱 Responsividade

O dashboard é responsivo e otimizado para:

- Notebooks 13 polegadas
- Telas grandes (1920px, 2560px, 3440px)
- Layout adaptativo com grid

## 🏗️ Estrutura do Projeto

```
front-app/
├── src/
│   ├── components/       # Componentes React
│   │   ├── ui/          # Componentes Shadcn/ui
│   │   ├── dashboard/   # Componentes do dashboard
│   │   └── layout/      # Componentes de layout
│   ├── services/        # Serviços de API
│   ├── types/           # Tipos TypeScript
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilitários
│   └── styles/          # Estilos globais
├── src-tauri/           # Código Rust do Tauri
└── public/              # Arquivos estáticos
```

## 📝 Notas

- Atualmente, o projeto usa dados mock que variam aleatoriamente
- A integração com a API .NET será implementada posteriormente
- Consulte `docs/commit-prompt.md` para guia de commits

## 📄 Licença

Este projeto é privado.
