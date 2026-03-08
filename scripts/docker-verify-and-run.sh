#!/usr/bin/env bash
# Verify Docker after OS upgrade and optionally start the Bleu.js stack.
# Usage: ./scripts/docker-verify-and-run.sh [--start]
#   --start   Also run 'docker compose up -d --build'

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

do_start=false
for arg in "$@"; do
  if [ "$arg" = "--start" ]; then
    do_start=true
    break
  fi
done

echo "=== Docker verification (Bleu.js) ==="

# 1. Docker installed
if ! command -v docker &>/dev/null; then
  echo -e "${RED}Docker is not installed. Install it and try again.${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Docker binary found: $(docker --version)"

# 2. Docker Compose available
if ! docker compose version &>/dev/null; then
  echo -e "${RED}Docker Compose plugin not available.${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Docker Compose: $(docker compose version --short 2>/dev/null || docker compose version)"

# 3. Can talk to daemon (permission / socket)
if ! docker info &>/dev/null; then
  echo -e "${RED}Cannot connect to Docker daemon (permission denied).${NC}"
  echo ""
  echo "Run this once, then log out and back in (or run: newgrp docker):"
  echo "  sudo usermod -aG docker \$USER"
  echo ""
  echo "See: docs/DOCKER_AFTER_OS_UPGRADE.md"
  exit 1
fi
echo -e "${GREEN}✓${NC} Docker daemon reachable"

# 4. Daemon is running
if ! docker info 2>/dev/null | grep -q "Server Version"; then
  echo -e "${RED}Docker daemon is not running. Start it (e.g. systemctl start docker).${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Docker daemon is running"

echo ""
echo -e "${GREEN}All Docker checks passed.${NC}"

if [ "$do_start" = true ]; then
  echo ""
  echo "Starting Bleu.js stack (docker compose up -d --build)..."
  docker compose up -d --build
  echo ""
  docker compose ps
  echo ""
  echo "Useful: docker compose logs -f"
  echo "Docs:   docs/DOCKER_AFTER_OS_UPGRADE.md"
else
  echo ""
  echo "To start the stack run:"
  echo "  docker compose up -d --build"
  echo "Or run this script with --start:"
  echo "  ./scripts/docker-verify-and-run.sh --start"
fi
