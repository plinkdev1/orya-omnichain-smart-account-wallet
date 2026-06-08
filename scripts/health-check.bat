@echo off
setlocal enabledelayedexpansion

echo 🏥 Checking Service Health...
echo.

set passed=0
set failed=0

REM Check API Gateway
call :check_service "API Gateway" 3000
REM Check User Service
call :check_service "User Service" 3001
REM Check Transaction Service
call :check_service "Transaction Service" 3002
REM Check Portfolio Service
call :check_service "Portfolio Service" 3003
REM Check Wallet Service
call :check_service "Wallet Service" 3010

echo.
echo 📊 Health Check Summary:
echo   ✅ Passed: !passed!
echo   ❌ Failed: !failed!
echo.

if !failed! equ 0 (
    echo 🎉 All services are healthy!
    exit /b 0
) else (
    echo ⚠️  Some services are not responding
    exit /b 1
)

:check_service
setlocal enabledelayedexpansion
set service_name=%~1
set port=%~2

for /f %%a in ('powershell -Command "try { $response = Invoke-WebRequest -Uri http://localhost:%port%/health -TimeoutSec 5 -PassThru -ErrorAction Stop; $response.StatusCode } catch { 000 }" 2^>nul') do (
    set response_code=%%a
)

if "!response_code!"=="200" (
    echo ✅ !service_name! (port !port!) - OK
    set /a passed+=1
) else if "!response_code!"=="404" (
    echo ✅ !service_name! (port !port!) - OK
    set /a passed+=1
) else (
    echo ❌ !service_name! (port !port!) - DOWN ^(HTTP !response_code!^)
    set /a failed+=1
)
endlocal

exit /b 0
