#!/bin/bash
set -euo pipefail

# Merge all open Dependabot PRs
# This script helps merge multiple dependabot pull requests

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

log "Dependabot PR Merger"
echo "===================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) is not installed"
    log_info "Install it: https://cli.github.com/"
    log_info "Or merge PRs manually on GitHub website"
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
PRS=$(gh pr list --author "app/dependabot" --state open --json number,title,headRefName --jq '.[] | "\(.number)|\(.title)|\(.headRefName)"')

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
echo "$PRS" | while IFS='|' read -r number title branch; do
    echo "  #$number: $title"
done
echo ""

# Ask for confirmation
read -p "Do you want to merge all these PRs? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Cancelled"
    exit 0
fi

# Merge each PR
MERGED=0
FAILED=0

echo "$PRS" | while IFS='|' read -r number title branch; do
    log "Merging PR #$number: $title"

    if gh pr merge "$number" --squash --auto --delete-branch 2>/dev/null; then
        log_success "Merged PR #$number"
        ((MERGED++))
    else
        log_error "Failed to merge PR #$number"
        log_info "You may need to merge it manually or check for conflicts"
        ((FAILED++))
    fi
done

echo ""
log_info "Summary:"
echo "  Merged: $MERGED"
echo "  Failed: $FAILED"

if [ $FAILED -gt 0 ]; then
    log_info "Some PRs failed. Check them manually on GitHub"
    exit 1
fi

log_success "All Dependabot PRs merged!"
