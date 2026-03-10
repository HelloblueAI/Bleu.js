#!/usr/bin/env bash
# Dismiss open Code scanning alerts (e.g. from Trivy) that are not fixable in our image.
# Run from repo root. Requires: gh CLI, auth with security_events scope.
# See: bleu-os/TRIVY_ALERTS.md and SECURITY.md
set -e
REPO="${REPO:-HelloblueAI/Bleu.js}"
# GitHub API only allows: false positive, won't fix, used in tests
DISMISS_REASON="${DISMISS_REASON:-"won't fix"}"
DISMISS_COMMENT="Not fixable in image: openldap/curl/libcurl/OpenSSH from Debian base; kernel = host. See bleu-os/TRIVY_ALERTS.md §4 and SECURITY.md"
DRY_RUN=false
TRIVY_ONLY=true

usage() {
  echo "Usage: $0 [--dry-run] [--all-tools]"
  echo ""
  echo "  --dry-run    Only list open Code scanning alerts; do not dismiss."
  echo "  --all-tools  Dismiss all open Code scanning alerts (default: only Trivy)."
  echo ""
  echo "Requires: gh auth login with security_events scope (gh auth refresh -s security_events)."
  echo "Repo: $REPO (override with REPO=owner/repo $0)"
  echo ""
  echo "These are Code scanning alerts (Trivy SARIF), not Dependabot. See Security → Code scanning in GitHub."
  exit 0
}

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)   DRY_RUN=true; shift ;;
    --all-tools) TRIVY_ONLY=false; shift ;;
    -h|--help)   usage ;;
    *)           echo "Unknown option: $1"; usage ;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI is required. Install: https://cli.github.com/"
  echo "Then: gh auth refresh -s security_events"
  exit 1
fi

echo "Fetching open Code scanning alerts for $REPO ..."
# List open code scanning alerts (paginated). API: GET /repos/{owner}/{repo}/code-scanning/alerts
# --paginate concatenates pages; jq -s 'add' merges arrays into one
RAW=$(gh api "repos/$REPO/code-scanning/alerts?state=open&per_page=100" --paginate 2>/dev/null | jq -s 'add // []' || echo "[]")

if [ -z "$RAW" ] || [ "$RAW" = "[]" ]; then
  echo "No open Code scanning alerts found."
  echo "If you still see alerts in the UI, ensure: gh auth status shows security_events scope."
  exit 0
fi

# Filter by tool name if we only want Trivy
if [ "$TRIVY_ONLY" = true ]; then
  ALERT_NUMBERS=$(echo "$RAW" | jq -r '.[] | select(.tool.name == "Trivy") | .number | tostring')
else
  ALERT_NUMBERS=$(echo "$RAW" | jq -r '.[] | .number | tostring')
fi

COUNT=$(echo "$ALERT_NUMBERS" | grep -c . 2>/dev/null || echo 0)
if [ "$COUNT" -eq 0 ]; then
  echo "No open Trivy (Code scanning) alerts to dismiss."
  [ "$TRIVY_ONLY" = true ] && echo "Tip: use --all-tools to include other tools."
  exit 0
fi

echo "Found $COUNT open alert(s) to dismiss (reason=$DISMISS_REASON)."

if [ "$DRY_RUN" = true ]; then
  echo "Dry run. Would dismiss alert numbers:"
  echo "$ALERT_NUMBERS" | head -30
  [ "$COUNT" -gt 30 ] && echo "... and $((COUNT - 30)) more."
  echo "Run without --dry-run to dismiss."
  exit 0
fi

echo "Dismissing ..."
DONE=0
ERR=0
for num in $ALERT_NUMBERS; do
  if gh api -X PATCH "repos/$REPO/code-scanning/alerts/$num" \
    -f state=dismissed \
    -f dismissed_reason="$DISMISS_REASON" \
    -f dismissed_comment="$DISMISS_COMMENT" \
    --silent 2>/dev/null; then
    DONE=$((DONE + 1))
    printf "  dismissed #%s\r" "$num"
  else
    ERR=$((ERR + 1))
  fi
done
echo ""
echo "Done: $DONE dismissed, $ERR errors."
echo "Check: https://github.com/$REPO/security/code-scanning"
