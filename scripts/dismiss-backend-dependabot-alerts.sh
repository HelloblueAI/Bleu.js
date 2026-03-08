#!/usr/bin/env bash
# Dismiss Dependabot alerts for manifests that no longer exist (e.g. backend/).
# Run from repo root. Requires: gh CLI, auth with repo or security_events scope.
# See: docs/DEPENDABOT_AND_DEPENDENCIES.md
set -e
REPO="${REPO:-HelloblueAI/Bleu.js}"
COMMENT="Manifest removed; backend is in separate repo. See docs/DEPENDABOT_AND_DEPENDENCIES.md"
REASON="not_used"
DRY_RUN=false
DISMISS_ALL_LEGACY=false

usage() {
  echo "Usage: $0 [--dry-run] [--dismiss-all-legacy]"
  echo ""
  echo "  --dry-run           Only list matching alerts; do not dismiss."
  echo "  --dismiss-all-legacy Dismiss any open alert whose manifest path is not in"
  echo "                      current scope (/, collaboration-tools/, bleu-os/, .github/)."
  echo "                      Default: only dismiss when path contains 'backend'."
  echo ""
  echo "Requires: gh auth login (with repo or security_events scope)."
  echo "Repo: $REPO (override with REPO=owner/repo $0)"
  exit 0
}

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)           DRY_RUN=true; shift ;;
    --dismiss-all-legacy) DISMISS_ALL_LEGACY=true; shift ;;
    -h|--help)           usage ;;
    *)                   echo "Unknown option: $1"; usage ;;
  esac
done

USE_CURL=false
if command -v gh >/dev/null 2>&1; then
  :
elif [ -n "$GITHUB_TOKEN" ] && command -v curl >/dev/null 2>&1 && command -v jq >/dev/null 2>&1; then
  USE_CURL=true
else
  echo "Error: need either (1) gh CLI (https://cli.github.com/) or (2) GITHUB_TOKEN + curl + jq."
  echo "  Example: GITHUB_TOKEN=ghp_xxx $0 --dry-run"
  exit 1
fi

fetch_alerts_curl() {
  local url="https://api.github.com/repos/$REPO/dependabot/alerts?state=open&per_page=100"
  local out=""
  while [ -n "$url" ]; do
    local resp
    resp=$(curl -s -L -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" "$url") || true
    local body
    body=$(echo "$resp" | jq -c 'if type == "array" then . else [] end' 2>/dev/null) || body="[]"
    out="${out}${body}"
    url=$(echo "$resp" | grep -i "^link:" | grep -o 'https://[^>]*>; rel="next"' | sed 's/>; rel="next"//') || true
    [ -z "$url" ] && break
  done
  echo "$out" | jq -s 'add // []'
}

# Fetch open alerts (paginated), output JSON array
echo "Fetching open Dependabot alerts for $REPO ..."
if [ "$USE_CURL" = true ]; then
  ALERTS_JSON=$(fetch_alerts_curl)
else
  ALERTS_JSON=$(gh api "repos/$REPO/dependabot/alerts?state=open&per_page=100" --paginate 2>/dev/null || true)
fi
if [ -z "$ALERTS_JSON" ] || [ "$ALERTS_JSON" = "[]" ]; then
  echo "No open Dependabot alerts found for this repo."
  echo "If you expected legacy alerts, they may already be dismissed or you need repo/security_events scope. Check: gh auth status"
  exit 0
fi

# Filter: backend in manifest_path, or (if --dismiss-all-legacy) path not in current scope
# Current scope: collaboration-tools/, bleu-os/, .github/, pyproject.toml, Dockerfile, package.json, etc.
if [ "$DISMISS_ALL_LEGACY" = true ]; then
  TO_DISMISS=$(echo "$ALERTS_JSON" | jq -r '
    .[] | select(.dependency.manifest_path != null) |
    select(
      (.dependency.manifest_path | ascii_downcase | test("backend")) or
      ((.dependency.manifest_path | ascii_downcase | test("^collaboration-tools/|^bleu-os/|^\\.github/|^pyproject\\.toml|^poetry\\.lock|^pipfile|^requirements|^dockerfile|package\\.json")) | not)
    ) | .number | tostring
  ')
else
  TO_DISMISS=$(echo "$ALERTS_JSON" | jq -r '
    .[] | select(.dependency.manifest_path != null) |
    select(.dependency.manifest_path | ascii_downcase | test("backend")) |
    .number | tostring
  ')
fi

COUNT=$(echo "$TO_DISMISS" | grep -c . 2>/dev/null || echo 0)
if [ "$COUNT" -eq 0 ]; then
  echo "No matching legacy alerts to dismiss (backend in path)."
  if [ "$DISMISS_ALL_LEGACY" = false ]; then
    echo "Tip: try --dismiss-all-legacy to dismiss alerts outside current scope."
  fi
  exit 0
fi

echo "Found $COUNT alert(s) to dismiss (manifest path contains 'backend' or legacy path)."
if [ "$DRY_RUN" = true ]; then
  echo "Dry run: would dismiss alert numbers:"
  echo "$TO_DISMISS" | head -20
  [ "$COUNT" -gt 20 ] && echo "... and $((COUNT - 20)) more."
  echo "Run without --dry-run to dismiss."
  exit 0
fi

echo "Dismissing with reason=$REASON ..."
DONE=0
ERR=0
for num in $TO_DISMISS; do
  if gh api -X PATCH "repos/$REPO/dependabot/alerts/$num" \
    -f state=dismissed \
    -f dismissed_reason="$REASON" \
    -f dismissed_comment="$COMMENT" \
    --silent 2>/dev/null; then
    DONE=$((DONE + 1))
    printf "  dismissed %s\r" "$num"
  else
    ERR=$((ERR + 1))
  fi
done
echo ""
echo "Done: $DONE dismissed, $ERR errors."
echo "Check: https://github.com/$REPO/security/dependabot"
