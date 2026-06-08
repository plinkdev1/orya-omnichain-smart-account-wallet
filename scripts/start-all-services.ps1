#!/usr/bin/env pwsh
param(
    [switch]$Background = $false,
    [string]$LogDir = "logs"
)

Write-Host "🚀 Starting ORŸA Wallet Services..." -ForegroundColor Green
Write-Host ""

$servicesDir = Join-Path (Split-Path $PSScriptRoot) "services"
$logDir = Join-Path (Split-Path $PSScriptRoot) $LogDir

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$services = @(
    @{ Name = "user-service"; Port = 3001 },
    @{ Name = "wallet-service"; Port = 3010 },
    @{ Name = "transaction-service"; Port = 3002 },
    @{ Name = "portfolio-service"; Port = 3003 },
    @{ Name = "api-gateway"; Port = 3000 }
)

$processList = @()

foreach ($service in $services) {
    $serviceName = $service.Name
    $port = $service.Port
    $logFile = Join-Path $logDir "$serviceName.log"
    
    Write-Host "Starting $serviceName (port $port)..."
    
    $startParams = @{
        FilePath = "cargo"
        ArgumentList = @("run", "--release")
        WorkingDirectory = (Join-Path $servicesDir $serviceName)
        RedirectStandardOutput = $logFile
        RedirectStandardError = $logFile
        NoNewWindow = $true
        PassThru = $true
    }
    
    if (-not $Background) {
        $startParams.NoNewWindow = $false
    }
    
    $process = Start-Process @startParams
    $processList += @{ Process = $process; Name = $serviceName }
    
    Write-Host "✅ $serviceName started with PID $($process.Id)"
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "📋 Service Status:" -ForegroundColor Cyan
foreach ($item in $processList) {
    Write-Host "  $($item.Name): $($item.Process.Id)"
}

Write-Host ""
Write-Host "✨ All services started successfully!" -ForegroundColor Green

if (-not $Background) {
    Write-Host "Press Ctrl+C to stop all services"
    Write-Host ""
    
    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    }
    finally {
        Write-Host ""
        Write-Host "⛔ Stopping all services..." -ForegroundColor Yellow
        foreach ($item in $processList) {
            $item.Process | Stop-Process -ErrorAction SilentlyContinue
        }
        Write-Host "✅ All services stopped"
    }
}
