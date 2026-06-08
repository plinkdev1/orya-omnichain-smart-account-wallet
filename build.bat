@echo off
cd /d "%~dp0"
echo Building wallet-core package...
call pnpm build --filter "@orya/wallet-core"
if %errorlevel% equ 0 (
    echo.
    echo Build successful!
    echo.
    echo Running type check...
    call pnpm typecheck --filter "@orya/wallet-core"
    if %errorlevel% equ 0 (
        echo Type check passed!
    ) else (
        echo Type check failed!
        exit /b 1
    )
) else (
    echo Build failed!
    exit /b 1
)
