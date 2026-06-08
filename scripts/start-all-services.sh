#!/bin/bash

set -e

echo "🚀 Starting ORŸA Wallet Services..."

SERVICES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../services" && pwd)"
LOG_DIR="logs"

mkdir -p "$LOG_DIR"

declare -a SERVICE_PIDS
declare -a SERVICE_NAMES

services=(
  "user-service:3001"
  "wallet-service:3010"
  "transaction-service:3002"
  "portfolio-service:3003"
  "api-gateway:3000"
)

for service_port in "${services[@]}"; do
  IFS=':' read -r service port <<< "$service_port"
  echo "Starting $service (port $port)..."
  
  cd "$SERVICES_DIR/$service"
  cargo run --release > "../../$LOG_DIR/$service.log" 2>&1 &
  PID=$!
  
  SERVICE_PIDS+=($PID)
  SERVICE_NAMES+=($service)
  
  echo "✅ $service started with PID $PID"
  sleep 2
done

echo ""
echo "📋 Service Status:"
for i in "${!SERVICE_NAMES[@]}"; do
  echo "  ${SERVICE_NAMES[$i]}: ${SERVICE_PIDS[$i]}"
done

cleanup() {
  echo ""
  echo "⛔ Stopping all services..."
  for pid in "${SERVICE_PIDS[@]}"; do
    kill $pid 2>/dev/null || true
  done
  echo "✅ All services stopped"
  exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "✨ All services started successfully!"
echo "Press Ctrl+C to stop all services"
echo ""

wait
