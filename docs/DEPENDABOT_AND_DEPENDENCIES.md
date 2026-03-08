# Dependabot and dependency security

This doc explains how we keep Dependabot and security alerts under control so we don't get hundreds of duplicate or noisy alerts.

## Why we had many alerts

- **Many manifests:** The repo used to have `backend/` (Node/npm + pip) tracked. That added a large dependency tree and many requirement files, so GitHub reported the same or similar vulnerabilities many times.
- **One source of truth:** We now keep the **dependency surface small** so Dependabot and the Security tab stay actionable.

## What we do

1. **Backend is not in the repo.** The `backend/` directory is in `.gitignore` and is **not** tracked. That avoids npm and pip manifests under `backend/` from being scanned. The canonical place for the backend is a **separate repo**—see [Backend repo](BACKEND_REPO.md). You can export it once with `scripts/export-backend-repo.sh`.
2. **Only these are scanned for updates:**
   - **Pip:** Root only (`/`) — `pyproject.toml` (and lockfile if present). Other `requirements*.txt` in the repo are for CI or reference; we don't add extra pip scan directories.
   - **npm:** `collaboration-tools/` only. No root or other `package.json` in the repo.
   - **Docker:** Root and `bleu-os/` (minimal set).
   - **GitHub Actions:** `.github/workflows` at root.
3. **No lockfiles in repo for backend.** We don't commit `backend/package-lock.json` or similar, so we never re-introduce that tree into the repo.

## If you add a new app or stack

- **Do not** add a new top-level app (e.g. another Node or Python app) with its own `package.json` or `requirements.txt` inside this repo if you want to avoid a new wave of alerts. Prefer a **separate repository** for that app, or use the existing ecosystems (root pip, collaboration-tools npm) only.
- If you must add a manifest, add it under a directory that is **not** in the default Dependabot scan (we only have pip at `/`, npm at `/collaboration-tools`). Prefer consolidating into root `pyproject.toml` or the existing npm app instead of new directories.

## Why the alert count still shows ~1.5k

- **Those are old open alerts.** When we stopped tracking `backend/`, we stopped *new* alerts from backend manifests. GitHub does **not** auto-close existing Dependabot alerts when you remove files. So the 1.5k are **legacy** alerts that were opened when backend was still in the repo.
- **To see what we actually have now:** You have to **dismiss** the obsolete ones. Then only alerts for the *current* scan scope (root pip, collaboration-tools npm, Docker, Actions) will remain.

## How to see the real current number

1. Go to **Security → Dependabot** (or **Dependency graph**) for this repo.
2. **Filter or sort** by dependency/package or path if the UI allows (e.g. focus on `pyproject.toml`, `collaboration-tools/package.json`).
3. **Bulk-dismiss** alerts that refer to:
   - `backend/` paths,
   - packages that only existed in backend (e.g. backend-only npm deps),
   - or any manifest that no longer exists in the repo.
4. Use the **“Dismiss”** reason like *“No longer used”* or *“Removed from repo”* so the count drops to the alerts that actually apply to the current codebase.

After that, the number you see will reflect only root pip, collaboration-tools npm, Docker, and Actions — typically dozens, not thousands.

## Where to look

- **Security alerts:** [GitHub Security tab](https://github.com/HelloblueAI/Bleu.js/security/dependabot) — triage and fix from here.
- **Update config:** [.github/dependabot.yml](../.github/dependabot.yml) — keep scan directories and limits as above so this doesn't happen again.
