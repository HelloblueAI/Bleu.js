#!/bin/bash
set -euo pipefail

# Approve all open Dependabot PRs (for auto-merge setup)
# This script approves PRs so they can be auto-merged if configured

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

log "Dependabot PR Approver"
echo "====================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) is not installed"
    log_info "Install it: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &>/dev/null; then
    log_error "Not authenticated with GitHub CLI"
    log_info "Run: gh auth login"
    exit 1
fi

log_info "Fetching open Dependabot PRs..."

# Get all open dependabot PRs
PRS=$(gh pr list --author "app/dependabot" --state open --json number,title --jq '.[] | "\(.number)|\(.title)"')

if [ -z "$PRS" ]; then
    log_info "No open Dependabot PRs found"
    exit 0
fi

# Count PRs
PR_COUNT=$(echo "$PRS" | wc -l)
log_info "Found $PR_COUNT open Dependabot PR(s)"

echo ""
echo "Open Dependabot PRs:"
echo "==================="
echo "$PRS" | while IFS='|' read -r number title; do
    echo "  #$number: $title"
done
echo ""

# Ask for confirmation
read -p "Do you want to approve all these PRs? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Cancelled"
    exit 0
fi

# Approve each PR
APPROVED=0
FAILED=0

echo "$PRS" | while IFS='|' read -r number title; do
    log "Approving PR #$number: $title"

    if gh pr review "$number" --approve --body "✅ Approved - Dependabot dependency update" 2>/dev/null; then
        log_success "Approved PR #$number"
        ((APPROVED++))
    else
        log_error "Failed to approve PR #$number"
        ((FAILED++))
    fi
done

echo ""
log_info "Summary:"
echo "  Approved: $APPROVED"
echo "  Failed: $FAILED"

log_success "Done!"
