.PHONY: help setup install dev build test lint clean docker-up docker-down docker-logs

help:
	@echo "ORŸA Wallet Development Commands"
	@echo "================================"
	@echo ""
	@echo "Setup:"
	@echo "  make setup              - Complete setup (install + docker up)"
	@echo "  make install            - Install dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev                - Start dev environment (all services)"
	@echo "  make dev-mobile         - Start mobile app dev server"
	@echo "  make dev-backend        - Start backend services"
	@echo ""
	@echo "Building:"
	@echo "  make build              - Build all packages"
	@echo "  make build-backend      - Build Rust services"
	@echo "  make build-frontend     - Build frontend packages"
	@echo ""
	@echo "Testing:"
	@echo "  make test               - Run all tests"
	@echo "  make test-backend       - Test Rust services"
	@echo "  make test-frontend      - Test Node packages"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint               - Lint all code"
	@echo "  make format             - Format all code"
	@echo "  make typecheck          - TypeScript type checking"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up          - Start Docker services"
	@echo "  make docker-down        - Stop Docker services"
	@echo "  make docker-logs        - View Docker logs"
	@echo "  make docker-clean       - Remove Docker volumes"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean              - Clean all build artifacts"
	@echo ""

setup: install docker-up
	@echo "✅ Setup complete!"

install:
	@echo "Installing dependencies..."
	cd services && cargo build --workspace
	pnpm install
	@echo "✅ Dependencies installed"

dev:
	@echo "Starting development environment..."
	@echo "Backend: cargo run"
	@echo "Frontend: pnpm dev"
	pnpm --recursive --parallel run dev

dev-mobile:
	@echo "Starting mobile dev server..."
	cd apps/mobile && pnpm dev

dev-backend:
	@echo "Starting backend services..."
	cd services && cargo run -p api-gateway

build:
	@echo "Building all packages..."
	cd services && cargo build --workspace --release
	pnpm build

build-backend:
	@echo "Building Rust services..."
	cd services && cargo build --workspace --release

build-frontend:
	@echo "Building frontend packages..."
	pnpm build

test:
	@echo "Running all tests..."
	cd services && cargo test --workspace
	pnpm test

test-backend:
	@echo "Testing Rust services..."
	cd services && cargo test --workspace

test-frontend:
	@echo "Testing Node packages..."
	pnpm test

lint:
	@echo "Linting all code..."
	cd services && cargo clippy --workspace
	pnpm run lint

format:
	@echo "Formatting all code..."
	cd services && cargo fmt --all
	pnpm run format

typecheck:
	@echo "Type checking TypeScript..."
	pnpm run typecheck

docker-up:
	@echo "Starting Docker containers..."
	cd infrastructure && docker compose up -d
	@sleep 10
	@echo "✅ Docker services running"
	@echo "   pgAdmin: http://localhost:5050"
	@echo "   Redis Commander: http://localhost:8081"

docker-down:
	@echo "Stopping Docker containers..."
	cd infrastructure && docker compose down

docker-logs:
	@echo "Docker logs..."
	cd infrastructure && docker compose logs -f

docker-clean:
	@echo "Removing Docker volumes..."
	cd infrastructure && docker compose down -v

clean:
	@echo "Cleaning build artifacts..."
	cd services && cargo clean
	rm -rf dist/ build/
	pnpm --recursive exec rm -rf dist
	@echo "✅ Cleanup complete"

.PHONY: $(shell grep -E '^[a-zA-Z_-]+:' $(MAKEFILE_LIST) | sed 's/:.*//')