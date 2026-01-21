# Instruções para Build do Tauri no Windows

## Problema
O Tauri precisa das ferramentas de build do Visual Studio (MSVC) para compilar no Windows.

## Solução: Instalar Visual Studio Build Tools

### Opção 1: Instalar Visual Studio Build Tools (Recomendado)

1. **Baixe o Visual Studio Build Tools:**
   - Acesse: https://visualstudio.microsoft.com/downloads/
   - Role até "Ferramentas para Visual Studio" e baixe "Build Tools para Visual Studio 2022"

2. **Instale com os componentes necessários:**
   - Execute o instalador
   - Selecione a carga de trabalho "Desenvolvimento para Desktop com C++"
   - Certifique-se de que os seguintes componentes estão marcados:
     - MSVC v143 - VS 2022 C++ x64/x86 build tools
     - Windows 10/11 SDK (versão mais recente)
     - CMake tools for Windows

3. **Após a instalação:**
   - Feche e reabra o terminal/PowerShell
   - Execute novamente: `npm run tauri:build`

### Opção 2: Instalar Visual Studio Community (Alternativa)

Se preferir instalar o Visual Studio completo:

1. Baixe o Visual Studio Community 2022: https://visualstudio.microsoft.com/vs/community/
2. Durante a instalação, selecione a carga de trabalho "Desenvolvimento para Desktop com C++"
3. Após a instalação, execute: `npm run tauri:build`

## Verificar Instalação

Após instalar, verifique se está funcionando:

```powershell
rustc --version
cargo --version
```

E tente compilar um projeto Rust simples para confirmar:

```powershell
cargo new test-build
cd test-build
cargo build
```

## Após Instalar

Depois de instalar as ferramentas, execute:

```powershell
cd front-app
npm run tauri:build
```

O executável será gerado em:
- `src-tauri/target/release/front-app.exe` (executável direto)
- `src-tauri/target/release/bundle/msi/front-app_0.1.0_x64_en-US.msi` (instalador MSI)
- `src-tauri/target/release/bundle/nsis/front-app_0.1.0_x64-setup.exe` (instalador NSIS)

## Nota

O build pode demorar vários minutos na primeira vez, pois precisa compilar todas as dependências Rust.
