#!/usr/bin/env pwsh
param(
    [int]$TimeoutSeconds = 5
)

Write-Host "🏥 Checking Service Health..." -ForegroundColor Green
Write-Host ""

$services = @(
    @{ Name = "API Gateway"; Port = 3000 },
    @{ Name = "User Service"; Port = 3001 },
    @{ Name = "Transaction Service"; Port = 3002 },
    @{ Name = "Portfolio Service"; Port = 3003 },
    @{ Name = "Wallet Service"; Port = 3010 }
)

$passed = 0
$failed = 0

foreach ($service in $services) {
    $name = $service.Name
    $port = $service.Port
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port/health" `
            -TimeoutSec $TimeoutSeconds `
            -ErrorAction Stop `
            -SkipHttpErrorCheck
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) {
            Write-Host "✅ $name (port $port) - OK" -ForegroundColor Green
            $passed++
        }
        else {
            Write-Host "❌ $name (port $port) - DOWN (HTTP $($response.StatusCode))" -ForegroundColor Red
            $failed++
        }
    }
    catch {
        Write-Host "❌ $name (port $port) - DOWN (Connection refused)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "📊 Health Check Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Passed: $passed"
Write-Host "  ❌ Failed: $failed"
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 All services are healthy!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "⚠️  Some services are not responding" -ForegroundColor Yellow
    exit 1
}
