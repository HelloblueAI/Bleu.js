#!/bin/bash
set -euo pipefail

# Install Docker on Linux systems
# Supports: Ubuntu, Debian, Fedora, CentOS, RHEL, Arch

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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root or with sudo"
    log_info "Run: sudo bash $0"
    exit 1
fi

# Detect OS
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=$VERSION_ID
else
    log_error "Cannot detect OS"
    exit 1
fi

log "Detected OS: $OS $OS_VERSION"

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker is already installed: $DOCKER_VERSION"

    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        log_success "Docker daemon is running"
        exit 0
    else
        log_info "Docker is installed but daemon is not running"
        log "Starting Docker daemon..."
    fi
fi

# Install Docker based on OS
case "$OS" in
    ubuntu|debian)
        log "Installing Docker on Ubuntu/Debian..."

        # Update package index
        apt-get update

        # Install prerequisites
        apt-get install -y \
            ca-certificates \
            curl \
            gnupg \
            lsb-release

        # Add Docker's official GPG key
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/$OS/gpg | \
            gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        chmod a+r /etc/apt/keyrings/docker.gpg

        # Set up repository
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
          $(lsb_release -cs) stable" | \
          tee /etc/apt/sources.list.d/docker.list > /dev/null

        # Install Docker Engine
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

        log_success "Docker installed successfully"
        ;;

    fedora|rhel|centos)
        log "Installing Docker on Fedora/RHEL/CentOS..."

        # Install prerequisites
        yum install -y yum-utils

        # Add Docker repository
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

        # Install Docker Engine
        yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

        log_success "Docker installed successfully"
        ;;

    arch|manjaro)
        log "Installing Docker on Arch Linux..."

        # Install Docker
        pacman -S --noconfirm docker docker-compose

        log_success "Docker installed successfully"
        ;;

    *)
        log_error "Unsupported OS: $OS"
        log_info "Please install Docker manually from: https://docs.docker.com/get-docker/"
        exit 1
        ;;
esac

# Start Docker service
log "Starting Docker service..."
if systemctl start docker 2>/dev/null; then
    log_success "Docker service started"
elif service docker start 2>/dev/null; then
    log_success "Docker service started (using service command)"
else
    log_error "Failed to start Docker service"
    exit 1
fi

# Enable Docker to start on boot
if systemctl enable docker &>/dev/null; then
    log_success "Docker enabled to start on boot"
fi

# Add current user to docker group (if not root)
if [[ -n "${SUDO_USER:-}" ]]; then
    log "Adding $SUDO_USER to docker group..."
    usermod -aG docker "$SUDO_USER"
    log_success "User $SUDO_USER added to docker group"
    log_info "You may need to log out and back in for group changes to take effect"
fi

# Verify installation
log "Verifying Docker installation..."
if docker --version &>/dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker is working: $DOCKER_VERSION"
else
    log_error "Docker verification failed"
    exit 1
fi

# Test Docker
log "Testing Docker with hello-world..."
if docker run --rm hello-world &>/dev/null; then
    log_success "Docker test passed!"
else
    log_info "Docker test skipped (hello-world image may need to be pulled)"
fi

log ""
log_success "Docker installation complete!"
log_info "If you added a user to docker group, log out and back in, or run: newgrp docker"
