#!/bin/bash
set -euo pipefail

# Install Docker using Docker's convenience script (no sudo required for script)
# This installs Docker for the current user

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    echo "✅ $1"
}

log_error() {
    echo "❌ $1"
}

log_info() {
    echo "ℹ️  $1"
}

log "Installing Docker using convenience script..."

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker is already installed: $DOCKER_VERSION"

    if docker info &> /dev/null 2>&1; then
        log_success "Docker daemon is running"
        exit 0
    fi
fi

# Download and run Docker's convenience script
log "Downloading Docker installation script..."
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh

log "Running Docker installation script..."
log_info "This will install Docker. You may be prompted for your password."
sh /tmp/get-docker.sh

# Clean up
rm -f /tmp/get-docker.sh

# Verify installation
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker installed: $DOCKER_VERSION"

    # Check if user needs to be added to docker group
    if ! groups | grep -q docker; then
        log_info "Adding current user to docker group..."
        log_info "Run this command: sudo usermod -aG docker $USER"
        log_info "Then log out and back in, or run: newgrp docker"
    fi
else
    log_error "Docker installation may have failed"
    exit 1
fi

log_success "Docker installation complete!"
