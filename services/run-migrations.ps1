# ============================================================================
# ORYA WALLET - DATABASE MIGRATION RUNNER
# ============================================================================
# Script to execute all database migrations for ORYA Wallet backend
# Supports: PostgreSQL, Neon
# Usage: .\run-migrations.ps1
# ============================================================================

param(
    [string]$DatabaseUrl = $null,
    [string]$Environment = "development"
)

# Load environment variables from .env file
function Load-EnvFile {
    param([string]$EnvFile)
    
    if (Test-Path $EnvFile) {
        Get-Content $EnvFile | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                if (-not [string]::IsNullOrWhiteSpace($name) -and -not $name.StartsWith('#')) {
                    [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
                }
            }
        }
    }
}

# Colors for output
$Colors = @{
    Reset   = "`e[0m"
    Green   = "`e[32m"
    Red     = "`e[31m"
    Yellow  = "`e[33m"
    Blue    = "`e[34m"
    Cyan    = "`e[36m"
}

function Write-Status {
    param([string]$Message, [string]$Color = "Blue")
    Write-Host "$($Colors[$Color])$Message$($Colors.Reset)"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "$($Colors.Red)ERROR: $Message$($Colors.Reset)"
}

function Write-Success {
    param([string]$Message)
    Write-Host "$($Colors.Green)✓ $Message$($Colors.Reset)"
}

# Main execution
Write-Status "==============================================================" "Cyan"
Write-Status "ORYA WALLET - DATABASE MIGRATION RUNNER" "Cyan"
Write-Status "==============================================================" "Cyan"
Write-Status ""

# Load .env files
$RootDir = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $RootDir ".env"
$EnvExampleFile = Join-Path $RootDir ".env.example"

Write-Status "Loading environment configuration..." "Blue"

if (Test-Path $EnvFile) {
    Write-Status "Found: $EnvFile" "Green"
    Load-EnvFile $EnvFile
} elseif (Test-Path $EnvExampleFile) {
    Write-Status "Found: $EnvExampleFile" "Yellow"
    Load-EnvFile $EnvExampleFile
} else {
    Write-Error-Custom "No .env file found at $EnvFile"
    exit 1
}

# Determine database URL
if (-not [string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    $DbUrl = $DatabaseUrl
    Write-Status "Using provided DATABASE_URL" "Green"
} elseif ($Environment -eq "production" -and -not [string]::IsNullOrWhiteSpace($env:NEON_URL)) {
    $DbUrl = $env:NEON_URL
    Write-Status "Using Neon (production) database URL" "Green"
} elseif (-not [string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
    $DbUrl = $env:DATABASE_URL
    Write-Status "Using local development database URL" "Green"
} else {
    Write-Error-Custom "No DATABASE_URL or NEON_URL found in environment"
    exit 1
}

# Mask sensitive URL for display
$DisplayUrl = $DbUrl -replace '(postgresql://.*:)(.+)(@)', '$1***$3'
Write-Status "Database: $DisplayUrl" "Cyan"

# Check if psql is available
Write-Status ""
Write-Status "Checking prerequisites..." "Blue"

$PsqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $PsqlPath) {
    Write-Error-Custom "psql not found in PATH"
    Write-Status "Please install PostgreSQL client tools"
    Write-Status "Download: https://www.postgresql.org/download/"
    exit 1
}

Write-Success "psql found: $($PsqlPath.Source)"

# Find migration directory
$MigrationsDir = Join-Path $PSScriptRoot "migrations"
if (-not (Test-Path $MigrationsDir)) {
    Write-Error-Custom "Migrations directory not found: $MigrationsDir"
    exit 1
}

Write-Success "Migrations directory: $MigrationsDir"

# Get all migration files
Write-Status ""
Write-Status "Scanning for migrations..." "Blue"

$MigrationFiles = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" | Sort-Object Name

if ($MigrationFiles.Count -eq 0) {
    Write-Error-Custom "No migration files found in $MigrationsDir"
    exit 1
}

Write-Success "Found $($MigrationFiles.Count) migration(s)"

# Execute migrations
Write-Status ""
Write-Status "Starting migration execution..." "Blue"
Write-Status ""

$SuccessCount = 0
$FailCount = 0

foreach ($MigrationFile in $MigrationFiles) {
    $MigrationName = $MigrationFile.Name
    $MigrationPath = $MigrationFile.FullName
    
    Write-Status "Executing: $MigrationName" "Yellow"
    
    try {
        # Execute migration using psql
        $Output = & psql $DbUrl -f $MigrationPath 2>&1
        
        # Check for errors in output
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Migration failed: $MigrationName"
            Write-Host $Output
            $FailCount++
        } else {
            Write-Success "Migration completed: $MigrationName"
            $SuccessCount++
        }
    } catch {
        Write-Error-Custom "Exception during migration: $($_.Exception.Message)"
        $FailCount++
    }
}

# Summary
Write-Status ""
Write-Status "==============================================================" "Cyan"
Write-Status "MIGRATION SUMMARY" "Cyan"
Write-Status "==============================================================" "Cyan"
Write-Status "Successful: $SuccessCount" "Green"
Write-Status "Failed: $FailCount" "Red"
Write-Status ""

if ($FailCount -eq 0) {
    Write-Success "All migrations executed successfully!"
    
    # Run verification queries
    Write-Status ""
    Write-Status "Running verification queries..." "Blue"
    Write-Status ""
    
    $VerificationQueries = @(
        "SELECT COUNT(*) as users_count FROM users;",
        "SELECT COUNT(*) as wallets_count FROM wallets;",
        "SELECT COUNT(*) as transactions_count FROM transactions;",
        "SELECT COUNT(*) as tokens_count FROM tokens;",
        "\dt" # List all tables
    )
    
    foreach ($Query in $VerificationQueries) {
        try {
            Write-Status "Running: $Query" "Blue"
            $Output = & psql $DbUrl -c $Query 2>&1
            Write-Host $Output
            Write-Status ""
        } catch {
            Write-Status "Verification query failed: $($_.Exception.Message)" "Yellow"
        }
    }
    
    exit 0
} else {
    Write-Error-Custom "Migration process completed with errors"
    exit 1
}