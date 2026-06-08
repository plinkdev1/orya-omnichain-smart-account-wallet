# ============================================================================
# ORYA WALLET - MIGRATION VERIFICATION SCRIPT
# ============================================================================
# Verifies that all database migrations have been applied correctly
# Usage: .\verify-migrations.ps1
# ============================================================================

param(
    [string]$DatabaseUrl = $null
)

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
    Write-Host "$($Colors.Red)✗ $Message$($Colors.Reset)"
}

function Write-Success {
    param([string]$Message)
    Write-Host "$($Colors.Green)✓ $Message$($Colors.Reset)"
}

# Load environment variables
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

# Main execution
Write-Status "==============================================================" "Cyan"
Write-Status "ORYA WALLET - MIGRATION VERIFICATION" "Cyan"
Write-Status "==============================================================" "Cyan"
Write-Status ""

# Load environment
$RootDir = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $RootDir ".env"

if (Test-Path $EnvFile) {
    Load-EnvFile $EnvFile
}

# Get database URL
if (-not [string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    $DbUrl = $DatabaseUrl
} elseif (-not [string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
    $DbUrl = $env:DATABASE_URL
} else {
    Write-Error-Custom "No DATABASE_URL found"
    exit 1
}

Write-Status "Testing database connection..."
try {
    $TestOutput = & psql $DbUrl -c "SELECT 1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database connection successful"
    } else {
        Write-Error-Custom "Failed to connect to database"
        exit 1
    }
} catch {
    Write-Error-Custom "Connection error: $($_.Exception.Message)"
    exit 1
}

Write-Status ""
Write-Status "Verifying database schema..." "Blue"
Write-Status ""

# Define required tables and columns
$RequiredTables = @{
    "users" = @(
        "id", "privy_user_id", "email", "kyc_status", 
        "is_kyc_verified", "created_at", "updated_at"
    )
    "wallets" = @(
        "id", "user_id", "wallet_name", "chain", "public_address",
        "wallet_type", "custody_type", "is_primary", "created_at", "updated_at"
    )
    "transactions" = @(
        "id", "wallet_id", "user_id", "tx_hash", "status", "tx_type",
        "from_address", "to_address", "amount", "amount_in_usd", "created_at", "updated_at"
    )
    "sessions" = @(
        "id", "user_id", "refresh_token_hash", "expires_at", "created_at"
    )
    "portfolios" = @(
        "id", "user_id", "total_balance_usd", "created_at", "updated_at"
    )
    "tokens" = @(
        "id", "symbol", "chain", "decimals", "price_usd", "created_at", "updated_at"
    )
    "kyc_verifications" = @(
        "id", "user_id", "provider", "status", "created_at", "updated_at"
    )
}

$TablesOk = 0
$TablesFailed = 0

foreach ($TableName in $RequiredTables.Keys) {
    Write-Status "Checking table: $TableName" "Yellow"
    
    # Check if table exists
    $TableExistsQuery = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$TableName');"
    $TableExists = & psql $DbUrl -t -c $TableExistsQuery 2>&1 | Select-Object -First 1
    
    if ($TableExists -match "t|true") {
        Write-Success "  Table exists"
        
        # Check columns
        $RequiredColumns = $RequiredTables[$TableName]
        $MissingColumns = @()
        
        foreach ($ColumnName in $RequiredColumns) {
            $ColumnQuery = "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = '$TableName' AND column_name = '$ColumnName');"
            $ColumnExists = & psql $DbUrl -t -c $ColumnQuery 2>&1 | Select-Object -First 1
            
            if (-not ($ColumnExists -match "t|true")) {
                $MissingColumns += $ColumnName
            }
        }
        
        if ($MissingColumns.Count -eq 0) {
            Write-Success "  All required columns present"
            $TablesOk++
        } else {
            Write-Error-Custom "  Missing columns: $($MissingColumns -join ', ')"
            $TablesFailed++
        }
    } else {
        Write-Error-Custom "  Table does not exist"
        $TablesFailed++
    }
}

# Check indexes
Write-Status ""
Write-Status "Checking indexes..." "Blue"
Write-Status ""

$ExpectedIndexes = @(
    "idx_users_privy_user_id",
    "idx_wallets_user_id",
    "idx_transactions_user_id",
    "idx_transactions_wallet_id"
)

$IndexesOk = 0
$IndexesFailed = 0

foreach ($IndexName in $ExpectedIndexes) {
    $IndexQuery = "SELECT EXISTS (SELECT FROM pg_indexes WHERE indexname = '$IndexName');"
    $IndexExists = & psql $DbUrl -t -c $IndexQuery 2>&1 | Select-Object -First 1
    
    if ($IndexExists -match "t|true") {
        Write-Success "Index exists: $IndexName"
        $IndexesOk++
    } else {
        Write-Error-Custom "Index missing: $IndexName"
        $IndexesFailed++
    }
}

# Check RLS policies
Write-Status ""
Write-Status "Checking Row-Level Security (RLS) policies..." "Blue"
Write-Status ""

$RlsTablesWithPolicy = @("users", "wallets", "transactions", "portfolios")
$RlsPoliciesOk = 0
$RlsPoliciesFailed = 0

foreach ($TableName in $RlsTablesWithPolicy) {
    $RlsQuery = "SELECT COUNT(*) FROM pg_policies WHERE tablename = '$TableName';"
    $PolicyCount = & psql $DbUrl -t -c $RlsQuery 2>&1 | Select-Object -First 1 | ForEach-Object { [int]$_ }
    
    if ($PolicyCount -gt 0) {
        Write-Success "RLS policy exists for $TableName ($PolicyCount policies)"
        $RlsPoliciesOk++
    } else {
        Write-Error-Custom "No RLS policy found for $TableName"
        $RlsPoliciesFailed++
    }
}

# Check triggers
Write-Status ""
Write-Status "Checking update triggers..." "Blue"
Write-Status ""

$TablesWithTriggers = @("users", "wallets", "transactions", "portfolios", "tokens")
$TriggersOk = 0
$TriggersFailed = 0

foreach ($TableName in $TablesWithTriggers) {
    $TriggerQuery = "SELECT COUNT(*) FROM pg_triggers WHERE tgrelname = '$TableName';"
    $TriggerCount = & psql $DbUrl -t -c $TriggerQuery 2>&1 | Select-Object -First 1 | ForEach-Object { [int]$_ }
    
    if ($TriggerCount -gt 0) {
        Write-Success "Update trigger exists for $TableName"
        $TriggersOk++
    } else {
        Write-Error-Custom "No update trigger found for $TableName"
        $TriggersFailed++
    }
}

# Check seed data
Write-Status ""
Write-Status "Checking seed data..." "Blue"
Write-Status ""

$TokenCountQuery = "SELECT COUNT(*) FROM tokens;"
$TokenCount = & psql $DbUrl -t -c $TokenCountQuery 2>&1 | Select-Object -First 1 | ForEach-Object { [int]$_ }

if ($TokenCount -gt 0) {
    Write-Success "Seed tokens found: $TokenCount tokens"
} else {
    Write-Error-Custom "No seed tokens found"
}

# Summary
Write-Status ""
Write-Status "==============================================================" "Cyan"
Write-Status "VERIFICATION SUMMARY" "Cyan"
Write-Status "==============================================================" "Cyan"
Write-Status ""

Write-Status "Tables: $TablesOk ok, $TablesFailed failed" $(if ($TablesFailed -eq 0) { "Green" } else { "Red" })
Write-Status "Indexes: $IndexesOk ok, $IndexesFailed failed" $(if ($IndexesFailed -eq 0) { "Green" } else { "Red" })
Write-Status "RLS Policies: $RlsPoliciesOk ok, $RlsPoliciesFailed failed" $(if ($RlsPoliciesFailed -eq 0) { "Green" } else { "Yellow" })
Write-Status "Triggers: $TriggersOk ok, $TriggersFailed failed" $(if ($TriggersFailed -eq 0) { "Green" } else { "Yellow" })
Write-Status ""

$TotalIssues = $TablesFailed + $IndexesFailed + $TriggersFailed

if ($TotalIssues -eq 0) {
    Write-Success "All migrations verified successfully!"
    Write-Status ""
    Write-Status "The database schema is ready for use by backend services." "Green"
    exit 0
} else {
    Write-Error-Custom "Verification completed with $TotalIssues issue(s)"
    Write-Status ""
    Write-Status "Please run migrations and try again." "Yellow"
    exit 1
}