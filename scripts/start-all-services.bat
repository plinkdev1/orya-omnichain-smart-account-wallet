@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting ORŸA Wallet Services...
echo.

set SERVICES_DIR=%~dp0..\services
set LOG_DIR=%~dp0..\logs

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Define services and ports
set services[0]=user-service:3001
set services[1]=wallet-service:3010
set services[2]=transaction-service:3002
set services[3]=portfolio-service:3003
set services[4]=api-gateway:3000

REM Start each service
for %%s in (%services[0]% %services[1]% %services[2]% %services[3]% %services[4]%) do (
    for /f "tokens=1,2 delims=:" %%a in ("%%s") do (
        set service=%%a
        set port=%%b
        echo Starting !service! (port !port!)...
        
        cd "%SERVICES_DIR%\!service!"
        start "!service!" cmd /c "cargo run --release > %LOG_DIR%\!service!.log 2>&1"
        
        echo ✅ !service! started
        timeout /t 2 /nobreak > nul
    )
)

echo.
echo 📋 All services started! Check logs in %LOG_DIR%
echo Press any key to stop all services...
pause

echo.
echo ⛔ Stopping all services...
taskkill /FI "WINDOWTITLE eq user-service" /T /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq wallet-service" /T /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq transaction-service" /T /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq portfolio-service" /T /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq api-gateway" /T /F > nul 2>&1

echo ✅ All services stopped
