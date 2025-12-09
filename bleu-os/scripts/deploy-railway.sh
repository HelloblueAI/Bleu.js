#!/bin/bash
set -euo pipefail

# Deploy Bleu OS to Railway
# This script helps with Railway deployment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    echo "✅ $1"
}

log_info() {
    echo "ℹ️  $1"
}

log_error() {
    echo "❌ $1"
}

log "Bleu OS Railway Deployment Helper"
echo "=================================="

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    log_success "Railway CLI found"

    log_info "Deploying to Railway..."
    cd "${PROJECT_ROOT}"

    # Deploy using Railway CLI
    railway up --detach || {
        log_error "Railway deployment failed"
        exit 1
    }

    log_success "Deployed to Railway!"
    log_info "Check status at: https://railway.app"
else
    log_info "Railway CLI not installed"
    log_info "Options:"
    echo ""
    echo "1. Install Railway CLI:"
    echo "   npm i -g @railway/cli"
    echo "   railway login"
    echo "   railway up"
    echo ""
    echo "2. Deploy manually on Railway website:"
    echo "   - Go to https://railway.app"
    echo "   - Click 'Redeploy' on your service"
    echo ""
    echo "3. Push to GitHub (auto-deploy):"
    echo "   git push origin main"
    echo ""
fi

log_info "Railway deployment options shown above"
