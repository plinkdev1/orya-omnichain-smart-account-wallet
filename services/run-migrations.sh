#!/bin/bash

# ============================================================================
# ORYA WALLET - DATABASE MIGRATION RUNNER (Unix/Linux/macOS)
# ============================================================================
# Script to execute all database migrations for ORYA Wallet backend
# Supports: PostgreSQL, Neon
# Usage: ./run-migrations.sh [environment]
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/.env"
ENV_EXAMPLE_FILE="$ROOT_DIR/.env.example"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# Helper functions
print_header() {
    echo -e "${CYAN}$1${NC}"
}

print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

# Load .env file
load_env_file() {
    local env_file=$1
    if [ -f "$env_file" ]; then
        # Source the .env file, ignoring comments and empty lines
        export $(grep -v '^#' "$env_file" | grep -v '^$' | xargs)
        return 0
    fi
    return 1
}

# Main execution
print_header "=============================================================="
print_header "ORYA WALLET - DATABASE MIGRATION RUNNER"
print_header "=============================================================="
echo ""

# Determine environment
ENVIRONMENT="${1:-development}"
print_status "Environment: $ENVIRONMENT"
echo ""

# Load environment configuration
print_status "Loading environment configuration..."

if load_env_file "$ENV_FILE"; then
    print_success "Found: $ENV_FILE"
elif load_env_file "$ENV_EXAMPLE_FILE"; then
    print_warning "Found: $ENV_EXAMPLE_FILE (using as fallback)"
else
    print_error "No .env file found"
    exit 1
fi

# Determine database URL
if [ "$ENVIRONMENT" = "production" ] && [ ! -z "$NEON_URL" ]; then
    DB_URL="$NEON_URL"
    print_status "Using Neon (production) database URL"
elif [ ! -z "$DATABASE_URL" ]; then
    DB_URL="$DATABASE_URL"
    print_status "Using development database URL"
else
    print_error "No DATABASE_URL or NEON_URL found in environment"
    exit 1
fi

# Display masked URL
DISPLAY_URL=$(echo "$DB_URL" | sed 's/\(postgresql:\/\/.*:\).*\(@\)/\1***\2/')
print_status "Database: $DISPLAY_URL"

# Check if psql is available
echo ""
print_status "Checking prerequisites..."

if ! command -v psql &> /dev/null; then
    print_error "psql not found in PATH"
    print_status "Please install PostgreSQL client tools"
    exit 1
fi

PSQL_VERSION=$(psql --version)
print_success "psql found: $PSQL_VERSION"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    print_error "Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi

print_success "Migrations directory: $MIGRATIONS_DIR"

# Get all migration files
echo ""
print_status "Scanning for migrations..."

MIGRATION_COUNT=$(find "$MIGRATIONS_DIR" -name "*.sql" | wc -l)
if [ "$MIGRATION_COUNT" -eq 0 ]; then
    print_error "No migration files found in $MIGRATIONS_DIR"
    exit 1
fi

print_success "Found $MIGRATION_COUNT migration(s)"

# Execute migrations
echo ""
print_status "Starting migration execution..."
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for migration_file in $(find "$MIGRATIONS_DIR" -name "*.sql" | sort); do
    migration_name=$(basename "$migration_file")
    
    print_warning "Executing: $migration_name"
    
    if psql "$DB_URL" -f "$migration_file" > /dev/null 2>&1; then
        print_success "Migration completed: $migration_name"
        ((SUCCESS_COUNT++))
    else
        print_error "Migration failed: $migration_name"
        psql "$DB_URL" -f "$migration_file"
        ((FAIL_COUNT++))
    fi
done

# Summary
echo ""
print_header "=============================================================="
print_header "MIGRATION SUMMARY"
print_header "=============================================================="
print_success "Successful: $SUCCESS_COUNT"
print_error "Failed: $FAIL_COUNT"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    print_success "All migrations executed successfully!"
    
    # Run verification queries
    echo ""
    print_status "Running verification queries..."
    echo ""
    
    echo "-- Users table"
    psql "$DB_URL" -c "SELECT COUNT(*) as users_count FROM users;"
    echo ""
    
    echo "-- Wallets table"
    psql "$DB_URL" -c "SELECT COUNT(*) as wallets_count FROM wallets;"
    echo ""
    
    echo "-- Transactions table"
    psql "$DB_URL" -c "SELECT COUNT(*) as transactions_count FROM transactions;"
    echo ""
    
    echo "-- Tokens table"
    psql "$DB_URL" -c "SELECT COUNT(*) as tokens_count FROM tokens;"
    echo ""
    
    echo "-- All tables"
    psql "$DB_URL" -c "\dt"
    
    exit 0
else
    print_error "Migration process completed with errors"
    exit 1
fi