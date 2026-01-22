# Script de Build - Empacotar Backend .NET com Tauri
# Este script compila o backend .NET como executável self-contained e integra com Tauri

param(
    [string]$Port = "5000",
    [string]$Runtime = "win-x64",
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build Script - DotnetMonitor App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Caminhos do projeto
$RootDir = $PSScriptRoot
$BackendProject = Join-Path $RootDir "backend\PostgresMonitor.Api\PostgresMonitor.Api.csproj"
$BackendPublishDir = Join-Path $RootDir "backend\PostgresMonitor.Api\bin\Release\net10.0\$Runtime\publish"
$TauriBinariesDir = Join-Path $RootDir "front-app\src-tauri\binaries"
$FrontAppDir = Join-Path $RootDir "front-app"
$BackendExeName = "PostgresMonitor.Api.exe"

# Função para verificar se arquivo está em uso
function Test-FileLocked {
    param([string]$FilePath)
    
    try {
        $file = [System.IO.File]::Open($FilePath, 'Open', 'ReadWrite', 'None')
        $file.Close()
        return $false
    }
    catch {
        return $true
    }
}

# Função para verificar pré-requisitos
function Test-Prerequisites {
    Write-Host "Verificando pré-requisitos..." -ForegroundColor Yellow
    
    $missing = @()
    
    if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
        $missing += "dotnet"
    }
    
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        $missing += "npm"
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "ERRO: Os seguintes pré-requisitos estão faltando:" -ForegroundColor Red
        $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        exit 1
    }
    
    Write-Host "✓ Todos os pré-requisitos estão instalados" -ForegroundColor Green
    Write-Host ""
}

# Função para limpar builds anteriores
function Clear-PreviousBuilds {
    if ($Clean) {
        Write-Host "Limpando builds anteriores..." -ForegroundColor Yellow
        
        if (Test-Path $BackendPublishDir) {
            Remove-Item -Path $BackendPublishDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        if (Test-Path $TauriBinariesDir) {
            Remove-Item -Path $TauriBinariesDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        Write-Host "✓ Builds anteriores limpos" -ForegroundColor Green
        Write-Host ""
    }
}

# Função para compilar backend .NET
function Build-Backend {
    Write-Host "Compilando backend .NET como self-contained..." -ForegroundColor Yellow
    Write-Host "  Projeto: $BackendProject" -ForegroundColor Gray
    Write-Host "  Runtime: $Runtime" -ForegroundColor Gray
    Write-Host "  Porta: $Port" -ForegroundColor Gray
    Write-Host ""
    
    $publishArgs = @(
        "publish",
        $BackendProject,
        "--configuration", "Release",
        "--runtime", $Runtime,
        "--self-contained", "true",
        "/p:PublishSingleFile=true",
        "/p:IncludeNativeLibrariesForSelfExtract=true",
        "/p:EnableCompressionInSingleFile=true",
        "--output", $BackendPublishDir,
        "--verbosity", "minimal"
    )
    
    $env:PORT = $Port
    dotnet $publishArgs
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Falha ao compilar backend .NET" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Backend compilado com sucesso" -ForegroundColor Green
    Write-Host ""
}

# Função para copiar executável para Tauri
function Copy-BackendToTauri {
    Write-Host "Copiando executável para Tauri binaries..." -ForegroundColor Yellow
    
    # #region agent log
    $logData = @{
        sessionId = "debug-session"
        runId = "run1"
        hypothesisId = "A"
        location = "build-app.ps1:Copy-BackendToTauri"
        message = "Iniciando cópia de binários"
        data = @{
            tauriBinariesDir = $TauriBinariesDir
            backendPublishDir = $BackendPublishDir
        }
        timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    } | ConvertTo-Json -Compress
    try {
        Invoke-WebRequest -Uri "http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31" -Method POST -Body $logData -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
    } catch {}
    # #endregion
    
    # Verificar e encerrar processos que possam estar usando os binários
    Write-Host "Verificando processos bloqueando binários..." -ForegroundColor Yellow
    $processes = Get-Process -Name "PostgresMonitor.Api" -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "  Encontrados $($processes.Count) processo(s) em execução. Encerrando..." -ForegroundColor Yellow
        $processes | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    # Criar diretório de binaries se não existir
    if (-not (Test-Path $TauriBinariesDir)) {
        New-Item -ItemType Directory -Path $TauriBinariesDir -Force | Out-Null
    }
    
    # Remover binários antigos se existirem
    $oldBinaries = Get-ChildItem -Path $TauriBinariesDir -Filter "PostgresMonitor.Api*.exe" -ErrorAction SilentlyContinue
    if ($oldBinaries) {
        Write-Host "Removendo binários antigos..." -ForegroundColor Yellow
        foreach ($oldBinary in $oldBinaries) {
            # #region agent log
            $logData = @{
                sessionId = "debug-session"
                runId = "run1"
                hypothesisId = "A"
                location = "build-app.ps1:Copy-BackendToTauri"
                message = "Removendo binário antigo"
                data = @{
                    fileName = $oldBinary.Name
                    isLocked = (Test-FileLocked -FilePath $oldBinary.FullName)
                }
                timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
            } | ConvertTo-Json -Compress
            try {
                Invoke-WebRequest -Uri "http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31" -Method POST -Body $logData -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
            } catch {}
            # #endregion
            
            if (Test-FileLocked -FilePath $oldBinary.FullName) {
                Write-Host "  AVISO: $($oldBinary.Name) está bloqueado. Tentando desbloquear..." -ForegroundColor Yellow
                # Tentar desbloquear usando handle.exe se disponível, ou apenas aguardar
                Start-Sleep -Seconds 1
            }
            Remove-Item -Path $oldBinary.FullName -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 1
    }
    
    # Encontrar o executável compilado
    $exePath = Get-ChildItem -Path $BackendPublishDir -Filter "*.exe" | Select-Object -First 1
    
    if (-not $exePath) {
        Write-Host "ERRO: Executável não encontrado em $BackendPublishDir" -ForegroundColor Red
        exit 1
    }
    
    # #region agent log
    $logData = @{
        sessionId = "debug-session"
        runId = "run1"
        hypothesisId = "B"
        location = "build-app.ps1:Copy-BackendToTauri"
        message = "Arquivo fonte encontrado"
        data = @{
            sourcePath = $exePath.FullName
            sourceSize = $exePath.Length
            sourceExists = $true
        }
        timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    } | ConvertTo-Json -Compress
    try {
        Invoke-WebRequest -Uri "http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31" -Method POST -Body $logData -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
    } catch {}
    # #endregion
    
    # Tauri adiciona o target triple ao nome do binário
    # Para Windows, pode ser x86_64-pc-windows-gnu ou x86_64-pc-windows-msvc
    # Vamos copiar para ambos os nomes possíveis para garantir compatibilidade
    $targetTriples = @(
        "x86_64-pc-windows-gnu",
        "x86_64-pc-windows-msvc"
    )
    
    foreach ($triple in $targetTriples) {
        $targetFileName = "PostgresMonitor.Api-$triple.exe"
        $targetPath = Join-Path $TauriBinariesDir $targetFileName
        
        # #region agent log
        $logData = @{
            sessionId = "debug-session"
            runId = "run1"
            hypothesisId = "B"
            location = "build-app.ps1:Copy-BackendToTauri"
            message = "Antes de copiar binário"
            data = @{
                targetPath = $targetPath
                targetExists = (Test-Path $targetPath)
                targetLocked = if (Test-Path $targetPath) { (Test-FileLocked -FilePath $targetPath) } else { $false }
            }
            timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
        } | ConvertTo-Json -Compress
        try {
            Invoke-WebRequest -Uri "http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31" -Method POST -Body $logData -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
        } catch {}
        # #endregion
        
        Copy-Item -Path $exePath.FullName -Destination $targetPath -Force
        
        # #region agent log
        $logData = @{
            sessionId = "debug-session"
            runId = "run1"
            hypothesisId = "B"
            location = "build-app.ps1:Copy-BackendToTauri"
            message = "Após copiar binário"
            data = @{
                targetPath = $targetPath
                targetExists = (Test-Path $targetPath)
                targetLocked = (Test-FileLocked -FilePath $targetPath)
                targetSize = if (Test-Path $targetPath) { (Get-Item $targetPath).Length } else { 0 }
            }
            timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
        } | ConvertTo-Json -Compress
        try {
            Invoke-WebRequest -Uri "http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31" -Method POST -Body $logData -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
        } catch {}
        # #endregion
        
        Write-Host "  Copiado: $targetFileName" -ForegroundColor Gray
    }
    
    # Também copiar com o nome simples para referência
    $simpleTargetPath = Join-Path $TauriBinariesDir $BackendExeName
    Copy-Item -Path $exePath.FullName -Destination $simpleTargetPath -Force
    
    # Aguardar um pouco para garantir que os arquivos foram totalmente escritos
    Start-Sleep -Seconds 2
    
    # Verificar se os arquivos estão acessíveis
    Write-Host "Verificando acessibilidade dos binários..." -ForegroundColor Yellow
    $allAccessible = $true
    foreach ($triple in $targetTriples) {
        $targetFileName = "PostgresMonitor.Api-$triple.exe"
        $targetPath = Join-Path $TauriBinariesDir $targetFileName
        
        # #region agent log
        $isLocked = Test-FileLocked -FilePath $targetPath
        $logData = @{
            sessionId = "debug-session"
            runId = "run1"
            hypothesisId = "C"
            location = "build-app.ps1:Copy-BackendToTauri"
            message = "Verificação final de acessibilidade"
            data = @{
                targetPath = $targetPath
                exists = (Test-Path $targetPath)
                isLocked = $isLocked
                canRead = if (Test-Path $targetPath) { try { [System.IO.File]::ReadAllBytes($targetPath).Length -gt 0 } catch { $false } } else { $false }
            }
            timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
        } | ConvertTo-Json -Compress
        try {
            Invoke-WebRequest -Uri "http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31" -Method POST -Body $logData -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
        } catch {}
        # #endregion
        
        if (-not (Test-Path $targetPath)) {
            Write-Host "  ERRO: $targetFileName não existe após cópia" -ForegroundColor Red
            $allAccessible = $false
        }
        elseif (Test-FileLocked -FilePath $targetPath) {
            Write-Host "  AVISO: $targetFileName está bloqueado" -ForegroundColor Yellow
            $allAccessible = $false
        }
        else {
            Write-Host "  ✓ $targetFileName está acessível" -ForegroundColor Green
        }
    }
    
    if (-not $allAccessible) {
        Write-Host "AVISO: Alguns binários podem não estar totalmente acessíveis" -ForegroundColor Yellow
        Write-Host "Aguardando mais 3 segundos..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
    
    Write-Host "  Origem: $($exePath.FullName)" -ForegroundColor Gray
    Write-Host "✓ Executável copiado com sucesso" -ForegroundColor Green
    Write-Host ""
}

# Função para atualizar configurações do Tauri
function Update-TauriConfig {
    Write-Host "Atualizando configurações do Tauri..." -ForegroundColor Yellow
    
    $tauriConfigPath = Join-Path $RootDir "front-app\src-tauri\tauri.conf.json"
    $capabilitiesPath = Join-Path $RootDir "front-app\src-tauri\capabilities\default-capability.json"
    
    # Atualizar tauri.conf.json
    if (Test-Path $tauriConfigPath) {
        $config = Get-Content $tauriConfigPath | ConvertFrom-Json
        
        if (-not $config.bundle) {
            $config | Add-Member -MemberType NoteProperty -Name "bundle" -Value @{} -Force
        }
        
        if (-not $config.bundle.externalBin) {
            $config.bundle | Add-Member -MemberType NoteProperty -Name "externalBin" -Value @() -Force
        }
        
        $binName = "binaries/PostgresMonitor.Api"
        if ($config.bundle.externalBin -notcontains $binName) {
            $config.bundle.externalBin += $binName
        }
        
        $config | ConvertTo-Json -Depth 10 | Set-Content $tauriConfigPath
        Write-Host "✓ tauri.conf.json atualizado" -ForegroundColor Green
    }
    
    # Atualizar capabilities
    if (Test-Path $capabilitiesPath) {
        $capabilities = Get-Content $capabilitiesPath | ConvertFrom-Json
        
        # Verificar se já existe permissão shell:allow-spawn
        $hasSpawnPermission = $capabilities.permissions | Where-Object {
            if ($_.PSObject.Properties.Name -contains "identifier") {
                $_.identifier -eq "shell:allow-spawn"
            } else {
                $_ -eq "shell:allow-spawn"
            }
        }
        
        if (-not $hasSpawnPermission) {
            $spawnPermission = @{
                identifier = "shell:allow-spawn"
                allow = @(
                    @{
                        name = "binaries/PostgresMonitor.Api"
                        sidecar = $true
                    }
                )
            }
            $capabilities.permissions += $spawnPermission
            $capabilities | ConvertTo-Json -Depth 10 | Set-Content $capabilitiesPath
            Write-Host "✓ capabilities/default-capability.json atualizado" -ForegroundColor Green
        } else {
            Write-Host "✓ Permissões já configuradas" -ForegroundColor Green
        }
    }
    
    Write-Host ""
}

# Função para compilar frontend e Tauri
function Build-Tauri {
    Write-Host "Compilando frontend e Tauri..." -ForegroundColor Yellow
    
    Push-Location $FrontAppDir
    
    try {
        # Instalar dependências se necessário
        if (-not (Test-Path "node_modules")) {
            Write-Host "Instalando dependências do frontend..." -ForegroundColor Yellow
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Host "ERRO: Falha ao instalar dependências" -ForegroundColor Red
                exit 1
            }
        }
        
        # Compilar frontend
        Write-Host "Compilando frontend..." -ForegroundColor Yellow
        # Sempre usar porta 5000 para o frontend, pois o Rust está fixado nessa porta
        $env:VITE_API_BASE_URL = "http://localhost:5000"
        npm run build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERRO: Falha ao compilar frontend" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✓ Frontend compilado" -ForegroundColor Green
        
        # Compilar Tauri
        Write-Host "Compilando Tauri (isso pode demorar alguns minutos)..." -ForegroundColor Yellow
        
        # #region agent log
        $logData = @{
            sessionId = "debug-session"
            runId = "run1"
            hypothesisId = "D"
            location = "build-app.ps1:Build-Tauri"
            message = "Antes de iniciar build do Tauri"
            data = @{
                binariesDir = $TauriBinariesDir
                binaries = @(Get-ChildItem -Path $TauriBinariesDir -Filter "*.exe" -ErrorAction SilentlyContinue | ForEach-Object { @{ name = $_.Name; size = $_.Length; locked = (Test-FileLocked -FilePath $_.FullName) } })
            }
            timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
        } | ConvertTo-Json -Compress
        try {
            Invoke-WebRequest -Uri "http://127.0.0.1:7246/ingest/94f82386-1b3b-4287-9cae-08e92f387d31" -Method POST -Body $logData -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
        } catch {}
        # #endregion
        
        npm run tauri:build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERRO: Falha ao compilar Tauri" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✓ Tauri compilado com sucesso" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
    
    Write-Host ""
}

# Função para exibir resultado final
function Show-Result {
    $releaseDir = Join-Path $RootDir "front-app\src-tauri\target\release"
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Build Concluído com Sucesso!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Executável final:" -ForegroundColor Yellow
    Write-Host "  $releaseDir" -ForegroundColor White
    Write-Host ""
    Write-Host "Backend configurado para porta: $Port" -ForegroundColor Yellow
    Write-Host ""
    
    # Listar executáveis encontrados
    $exes = Get-ChildItem -Path $releaseDir -Filter "*.exe" -ErrorAction SilentlyContinue
    if ($exes) {
        Write-Host "Executáveis gerados:" -ForegroundColor Yellow
        $exes | ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "  - $($_.Name) ($size MB)" -ForegroundColor White
        }
    }
    
    Write-Host ""
}

# Executar pipeline de build
try {
    Test-Prerequisites
    Clear-PreviousBuilds
    Build-Backend
    Copy-BackendToTauri
    Update-TauriConfig
    Build-Tauri
    Show-Result
}
catch {
    Write-Host ""
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    exit 1
}
