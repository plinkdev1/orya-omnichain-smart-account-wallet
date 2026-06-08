#!/bin/bash

# ORYA Apollo Router Setup Validator
# Validates the Apollo Router setup and all dependencies

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 ORYA Apollo Router Setup Validator"
echo "======================================"
echo ""

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo -e "${GREEN}✓${NC} $NODE_VERSION"
else
  echo -e "${RED}✗${NC} Node.js not found"
  exit 1
fi

# Check pnpm
echo -n "Checking pnpm... "
if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm -v)
  echo -e "${GREEN}✓${NC} v$PNPM_VERSION"
else
  echo -e "${RED}✗${NC} pnpm not found"
  exit 1
fi

# Check Redis
echo -n "Checking Redis... "
if command -v redis-cli &> /dev/null; then
  REDIS_VERSION=$(redis-cli --version | awk '{print $NF}')
  if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis running ($REDIS_VERSION)"
  else
    echo -e "${YELLOW}⚠${NC} Redis not running"
  fi
else
  echo -e "${YELLOW}⚠${NC} redis-cli not found (optional if using remote Redis)"
fi

# Check Rover CLI
echo -n "Checking Rover CLI... "
if command -v rover &> /dev/null; then
  ROVER_VERSION=$(rover --version)
  echo -e "${GREEN}✓${NC} $ROVER_VERSION"
else
  echo -e "${YELLOW}⚠${NC} Rover CLI not found (required for schema composition)"
  echo "   Install with: npm install -g @apollo/rover"
fi

echo ""
echo "📦 Files Check"
echo "=============="

# Check required files
FILES=(
  "router.yaml"
  "supergraph-config.yaml"
  "package.json"
  "tsconfig.json"
  ".env.example"
  "src/main.ts"
  "src/plugins/authentication.ts"
  "src/plugins/rate-limiting.ts"
  "src/health/health-check.ts"
)

for file in "${FILES[@]}"; do
  echo -n "Checking $file... "
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${RED}✗${NC} NOT FOUND"
  fi
done

echo ""
echo "📋 Environment Check"
echo "==================="

if [ -f ".env" ]; then
  echo -e "${GREEN}✓${NC} .env file exists"
  
  # Check required env vars
  REQUIRED_VARS=("JWT_SECRET" "REDIS_HOST" "REDIS_PORT")
  
  for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^$var=" .env; then
      echo -e "${GREEN}✓${NC} $var is set"
    else
      echo -e "${YELLOW}⚠${NC} $var not set in .env"
    fi
  done
else
  echo -e "${YELLOW}⚠${NC} .env file not found"
  echo "   Copy from .env.example: cp .env.example .env"
fi

echo ""
echo "🔌 Subgraph Connectivity Check"
echo "=============================="

SUBGRAPHS=(
  "http://localhost:4002/graphql:User Service"
  "http://localhost:4001/graphql:Wallet Service"
  "http://localhost:4003/graphql:Transaction Service"
  "http://localhost:4004/graphql:Protocol Service"
  "http://localhost:4005/graphql:DeFi Service"
  "http://localhost:4006/graphql:Portfolio Service"
  "http://localhost:4007/graphql:Fiat Service"
)

for subgraph in "${SUBGRAPHS[@]}"; do
  IFS=':' read -r url name <<< "$subgraph"
  echo -n "Checking $name ($url)... "
  
  if timeout 2 curl -s -X POST "$url" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}' > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${YELLOW}⚠${NC} Not responding (may not be running yet)"
  fi
done

echo ""
echo "✨ Setup Validation Complete!"
echo ""
echo "📚 Next Steps:"
echo "1. Ensure all subgraph services are running on ports 4001-4007"
echo "2. Run: pnpm run compose (to compose supergraph)"
echo "3. Run: pnpm run dev (to start the Apollo Router)"
echo "4. Visit: http://localhost:4000/health"
echo ""
