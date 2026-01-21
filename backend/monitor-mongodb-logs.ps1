# Script para monitorar logs do MongoDB gerenciado pelo Aspire
# Execute este script após iniciar o PostgresMonitor.Host

Write-Host "=== Monitorando Logs do MongoDB ===" -ForegroundColor Cyan
Write-Host "Aguardando container MongoDB ser criado pelo Aspire..." -ForegroundColor Yellow

# Aguarda até encontrar um container MongoDB
$maxAttempts = 30
$attempt = 0
$mongoContainer = $null

while ($attempt -lt $maxAttempts -and $null -eq $mongoContainer) {
    Start-Sleep -Seconds 2
    $mongoContainer = docker ps --format "{{.Names}}" | Select-String -Pattern "mongo"
    $attempt++
    Write-Host "." -NoNewline
}

Write-Host ""

if ($null -eq $mongoContainer) {
    Write-Host "Container MongoDB não encontrado. Verifique se o Aspire Host está rodando." -ForegroundColor Red
    exit 1
}

$containerName = $mongoContainer.ToString().Trim()
Write-Host "`nContainer MongoDB encontrado: $containerName" -ForegroundColor Green
Write-Host "Iniciando monitoramento de logs... (Ctrl+C para parar)`n" -ForegroundColor Yellow

# Monitora os logs em tempo real
docker logs -f $containerName
