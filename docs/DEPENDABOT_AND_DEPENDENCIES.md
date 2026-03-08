# Dependabot and dependency security

This doc explains how we keep Dependabot and security alerts under control so we don't get hundreds of duplicate or noisy alerts.

## Why we had many alerts

- **Many manifests:** The repo used to have `backend/` (Node/npm + pip) tracked. That added a large dependency tree and many requirement files, so GitHub reported the same or similar vulnerabilities many times.
- **One source of truth:** We now keep the **dependency surface small** so Dependabot and the Security tab stay actionable.

## What we do

1. **Backend is not in the repo.** The `backend/` directory is in `.gitignore` and is **not** tracked. That avoids npm and pip manifests under `backend/` from being scanned. If you need the backend code, it remains on disk when untracked; for a permanent copy, use a separate repo or archive.
2. **Only these are scanned for updates:**
   - **Pip:** Root only (`/`) — `pyproject.toml` (and lockfile if present). Other `requirements*.txt` in the repo are for CI or reference; we don't add extra pip scan directories.
   - **npm:** `collaboration-tools/` only. No root or other `package.json` in the repo.
   - **Docker:** Root and `bleu-os/` (minimal set).
   - **GitHub Actions:** `.github/workflows` at root.
3. **No lockfiles in repo for backend.** We don't commit `backend/package-lock.json` or similar, so we never re-introduce that tree into the repo.

## If you add a new app or stack

- **Do not** add a new top-level app (e.g. another Node or Python app) with its own `package.json` or `requirements.txt` inside this repo if you want to avoid a new wave of alerts. Prefer a **separate repository** for that app, or use the existing ecosystems (root pip, collaboration-tools npm) only.
- If you must add a manifest, add it under a directory that is **not** in the default Dependabot scan (we only have pip at `/`, npm at `/collaboration-tools`). Prefer consolidating into root `pyproject.toml` or the existing npm app instead of new directories.

## Where to look

- **Security alerts:** [GitHub Security tab](https://github.com/HelloblueAI/Bleu.js/security/dependabot) — triage and fix from here.
- **Update config:** [.github/dependabot.yml](../.github/dependabot.yml) — keep scan directories and limits as above so this doesn't happen again.
