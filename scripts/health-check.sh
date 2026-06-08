#!/bin/bash

echo "🏥 Checking Service Health..."
echo ""

services=(
  "API Gateway:3000"
  "User Service:3001"
  "Transaction Service:3002"
  "Portfolio Service:3003"
  "Wallet Service:3010"
)

failed=0
passed=0

for service in "${services[@]}"; do
  name="${service%%:*}"
  port="${service##*:}"
  
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health 2>/dev/null || echo "000")
  
  if [ "$response" == "200" ] || [ "$response" == "404" ]; then
    echo "✅ $name (port $port) - OK"
    ((passed++))
  else
    echo "❌ $name (port $port) - DOWN (HTTP $response)"
    ((failed++))
  fi
done

echo ""
echo "📊 Health Check Summary:"
echo "  ✅ Passed: $passed"
echo "  ❌ Failed: $failed"
echo ""

if [ $failed -eq 0 ]; then
  echo "🎉 All services are healthy!"
  exit 0
else
  echo "⚠️  Some services are not responding"
  exit 1
fi
