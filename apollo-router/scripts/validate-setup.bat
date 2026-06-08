@echo off
REM ORYA Apollo Router Setup Validator (Windows)
REM Validates the Apollo Router setup and all dependencies

setlocal enabledelayedexpansion

cls
echo.
echo 🔍 ORYA Apollo Router Setup Validator
echo ======================================
echo.

REM Check Node.js
echo Checking Node.js...
node -v >nul 2>&1
if !errorlevel! equ 0 (
  for /f "tokens=*" %%A in ('node -v') do set NODE_VERSION=%%A
  echo ✓ !NODE_VERSION!
) else (
  echo ✗ Node.js not found
  exit /b 1
)

REM Check pnpm
echo Checking pnpm...
pnpm -v >nul 2>&1
if !errorlevel! equ 0 (
  for /f "tokens=*" %%A in ('pnpm -v') do set PNPM_VERSION=%%A
  echo ✓ v!PNPM_VERSION!
) else (
  echo ✗ pnpm not found
  exit /b 1
)

REM Check Redis
echo Checking Redis...
redis-cli ping >nul 2>&1
if !errorlevel! equ 0 (
  echo ✓ Redis running
) else (
  echo ⚠ Redis not running or not accessible
)

echo.
echo 📦 Files Check
echo ==============

setlocal enabledelayedexpansion
set "FILES=router.yaml supergraph-config.yaml package.json tsconfig.json .env.example src\main.ts src\plugins\authentication.ts src\plugins\rate-limiting.ts src\health\health-check.ts"

for %%F in (%FILES%) do (
  if exist "%%F" (
    echo ✓ %%F
  ) else (
    echo ✗ %%F - NOT FOUND
  )
)

echo.
echo 📋 Environment Check
echo ===================

if exist ".env" (
  echo ✓ .env file exists
  
  findstr /M "JWT_SECRET" .env >nul
  if !errorlevel! equ 0 (
    echo ✓ JWT_SECRET is set
  ) else (
    echo ⚠ JWT_SECRET not set in .env
  )
  
  findstr /M "REDIS_HOST" .env >nul
  if !errorlevel! equ 0 (
    echo ✓ REDIS_HOST is set
  ) else (
    echo ⚠ REDIS_HOST not set in .env
  )
  
  findstr /M "REDIS_PORT" .env >nul
  if !errorlevel! equ 0 (
    echo ✓ REDIS_PORT is set
  ) else (
    echo ⚠ REDIS_PORT not set in .env
  )
) else (
  echo ⚠ .env file not found
  echo    Copy from .env.example: copy .env.example .env
)

echo.
echo 🔌 Subgraph Connectivity Check
echo ==============================

echo Checking User Service ^(4002^)...
timeout /t 1 /nobreak > nul
curl -s -X POST http://localhost:4002/graphql -H "Content-Type: application/json" -d "{\"query\":\"{ __typename }\"}" >nul 2>&1
if !errorlevel! equ 0 (
  echo ✓ User Service responding
) else (
  echo ⚠ User Service not responding
)

echo Checking Wallet Service ^(4001^)...
curl -s -X POST http://localhost:4001/graphql -H "Content-Type: application/json" -d "{\"query\":\"{ __typename }\"}" >nul 2>&1
if !errorlevel! equ 0 (
  echo ✓ Wallet Service responding
) else (
  echo ⚠ Wallet Service not responding
)

echo.
echo ✨ Setup Validation Complete!
echo.
echo 📚 Next Steps:
echo 1. Ensure all subgraph services are running on ports 4001-4007
echo 2. Run: pnpm run compose ^(to compose supergraph^)
echo 3. Run: pnpm run dev ^(to start the Apollo Router^)
echo 4. Visit: http://localhost:4000/health
echo.

endlocal
