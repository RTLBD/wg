# wg — Docker helpers (docker compose)
# Usage: make help

COMPOSE ?= docker compose
COMPOSE_FILE ?= docker-compose.yml
SERVICE ?= wg
IMAGE ?= imzami/wg:latest

COMPOSE_CMD = $(COMPOSE) -f $(COMPOSE_FILE)

.PHONY: help up down restart logs logs-f ps build rebuild pull stop start shell exec cli test-docker clean prune image image-multiarch

help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

up: ## Pull image and start in background
	$(COMPOSE_CMD) pull && $(COMPOSE_CMD) up -d

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

build: ## Build production image locally
	docker build -t $(IMAGE) .

rebuild: ## Rebuild image without cache and start
	docker build --no-cache -t $(IMAGE) .
	$(COMPOSE_CMD) up -d

pull: ## Pull latest image from registry
	$(COMPOSE_CMD) pull

shell: ## Open shell in running container
	$(COMPOSE_CMD) exec $(SERVICE) sh

exec: ## Run command in container (make exec CMD="wg show")
	$(COMPOSE_CMD) exec $(SERVICE) $(CMD)

cli: ## Run CLI in running container (make cli CMD="--help")
	$(COMPOSE_CMD) exec $(SERVICE) cli $(CMD)

test-docker: ## Run unit tests, typecheck, and lint in Docker
	$(COMPOSE) -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from test test
	$(COMPOSE) -f docker-compose.test.yml down --remove-orphans

image: ## Build Docker image tag locally (host architecture)
	docker build -t $(IMAGE) .

image-multiarch: ## Build amd64+arm64 and push (set REGISTRY=docker.io/imzami/wg)
	@test -n "$(REGISTRY)" || (echo "Usage: make image-multiarch REGISTRY=docker.io/imzami/wg" && exit 1)
	docker buildx build --platform linux/amd64,linux/arm64 -t $(REGISTRY):latest --push .

clean: down ## Stop stack and remove unused compose resources
	$(COMPOSE_CMD) down --remove-orphans

prune: ## Remove wg image and dangling build cache (destructive)
	-docker rmi $(IMAGE) 2>/dev/null || true
	-docker compose -f $(COMPOSE_FILE) down --rmi local -v 2>/dev/null || true
