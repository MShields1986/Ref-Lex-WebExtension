.PHONY: help build dev clean install test lint

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build the extension for production
	docker compose run --rm extension-builder npm run build

build-chrome: ## Build for Chrome
	docker compose run --rm extension-builder npm run build:chrome

build-firefox: ## Build for Firefox
	docker compose run --rm extension-builder npm run build:firefox

build-all: ## Build for all browsers
	docker compose run --rm extension-builder npm run build:all

dev: ## Start development build with watch mode
	docker compose up

install: ## Install dependencies in container
	docker compose build

clean: ## Remove build artifacts
	rm -rf dist/
	docker compose down -v

test: ## Run tests
	docker compose run --rm extension-builder npm test

lint: ## Run linter
	docker compose run --rm extension-builder npm run lint

shell: ## Open shell in container
	docker compose run --rm extension-builder sh

stop: ## Stop running containers
	docker compose down
