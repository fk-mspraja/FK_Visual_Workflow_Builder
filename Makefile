.PHONY: help setup dev test clean

help:
	@echo "FourKites Workflow Builder - Available Commands"
	@echo "  make setup   - Initial setup (install dependencies)"
	@echo "  make dev     - Start development environment"
	@echo "  make test    - Run all tests"
	@echo "  make clean   - Clean build artifacts"

setup:
	./scripts/setup.sh

dev:
	./scripts/dev.sh

test:
	cd backend && pytest
	cd frontend && npm test

clean:
	rm -rf backend/.pytest_cache
	rm -rf frontend/.next
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
