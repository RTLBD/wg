# wg — Docker helpers (docker compose)
# Usage: make help

COMPOSE ?= docker compose
COMPOSE_FILE ?= docker-compose.yml
COMPOSE_DEV_FILE ?= docker-compose.dev.yml
SERVICE ?= wg
IMAGE ?= wg:latest

COMPOSE_CMD = $(COMPOSE) -f $(COMPOSE_FILE)
COMPOSE_DEV = $(COMPOSE) -f $(COMPOSE_DEV_FILE)

.PHONY: help up down restart logs logs-f ps build rebuild pull stop start shell exec dev dev-down dev-logs cli test-docker clean prune image image-multiarch

help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

# --- Production (docker-compose.yml) ---

up: ## Build local image and start in background
	$(COMPOSE_CMD) up -d --build

down: ## Stop and remove containers (keeps volumes)
	$(COMPOSE_CMD) down

restart: ## Restart the wg service
	$(COMPOSE_CMD) restart $(SERVICE)

stop: ## Stop without removing containers
	$(COMPOSE_CMD) stop $(SERVICE)

start: ## Start existing containers
	$(COMPOSE_CMD) start $(SERVICE)

logs: ## Tail container logs
	$(COMPOSE_CMD) logs $(SERVICE)

logs-f: ## Follow container logs
	$(COMPOSE_CMD) logs -f $(SERVICE)

ps: ## List compose services
	$(COMPOSE_CMD) ps

build: ## Build image only
	$(COMPOSE_CMD) build $(SERVICE)

rebuild: ## Rebuild image without cache and start
	$(COMPOSE_CMD) build --no-cache $(SERVICE)
	$(COMPOSE_CMD) up -d

pull: ## No-op for local-only compose (use make build or make up)
	@echo "Local compose uses image wg:local — run 'make build' or 'make up' instead of pull."

shell: ## Open shell in running container
	$(COMPOSE_CMD) exec $(SERVICE) sh

exec: ## Run command in container (make exec CMD="wg show")
	$(COMPOSE_CMD) exec $(SERVICE) $(CMD)

# --- Development (docker-compose.dev.yml) ---

dev: ## Start dev stack with live-mounted source
	$(COMPOSE_DEV) up $(SERVICE) --build

dev-down: ## Stop dev stack
	$(COMPOSE_DEV) down

dev-logs: ## Follow dev logs
	$(COMPOSE_DEV) logs -f $(SERVICE)

cli: ## Run CLI in dev container
	$(COMPOSE_DEV) run --build --rm -it $(SERVICE) cli:dev

test-docker: ## Run unit tests, typecheck, and lint in Docker
	$(COMPOSE) -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from test test

# --- Image (without compose) ---

image: ## Build Docker image tag locally (host architecture)
	docker build -t $(IMAGE) .

image-multiarch: ## Build amd64+arm64 and push (set REGISTRY=user/wg)
	@test -n "$(REGISTRY)" || (echo "Usage: make image-multiarch REGISTRY=docker.io/user/wg" && exit 1)
	docker buildx build --platform linux/amd64,linux/arm64 -t $(REGISTRY):latest --push .

# --- Cleanup ---

clean: down ## Stop stack and remove unused compose resources
	$(COMPOSE_CMD) down --remove-orphans

prune: ## Remove wg image and dangling build cache (destructive)
	-docker rmi $(IMAGE) 2>/dev/null || true
	-docker compose -f $(COMPOSE_FILE) down --rmi local -v 2>/dev/null || true
