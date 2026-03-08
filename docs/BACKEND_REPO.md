# Backend: separate repository

The Node/Express backend (inference, ML API, services) is **not** in this repo. It lives in a **separate repository** so this repo stays focused on the Bleu.js product (Python package, CLI, cloud API) and dependency alerts stay manageable—the same pattern used by Node.js, Stripe, and other API-first projects.

## Why a separate repo

| This repo | Backend repo |
|-----------|--------------|
| Python SDK, CLI, docs, demos, Bleu OS | Node/Express API and services |
| Single dependency surface, clear Dependabot scope | Its own dependencies, releases, and security |

## Where is the backend?

- **Locally:** If you had a clone before we stopped tracking `backend/`, the folder `backend/` still exists on disk (`.gitignore`). Use it as the source for the new repo.
- **Canonical:** Create e.g. `HelloblueAI/Bleu.js-backend` and push the backend there. Use the export script below once to prepare the contents.

## One-time setup: create the backend repo

### Option A: Export script (recommended)

From the **root of this repo**, with `backend/` present on disk:

```bash
chmod +x scripts/export-backend-repo.sh
./scripts/export-backend-repo.sh
```

This creates `../Bleu.js-backend-export/` with a copy of `backend/` plus a minimal README and `.gitignore`. Then:

```bash
cd ../Bleu.js-backend-export
git init
git add .
git commit -m "Initial commit: Bleu.js backend (exported from main repo)"
git remote add origin git@github.com:HelloblueAI/Bleu.js-backend.git
git branch -M main
git push -u origin main
```

Create the empty repo on GitHub first (no README, no .gitignore).

### Option B: Manual

1. Create a new repo, e.g. `HelloblueAI/Bleu.js-backend`.
2. Copy your local `Bleu.js/backend/` into the new clone (exclude `node_modules/`, `.env`, secrets).
3. Add README and `.gitignore` in the new repo.
4. Commit and push.

## After the backend repo exists

- **CI/CD:** Add GitHub Actions in the backend repo for test, lint, deploy.
- **Deploy:** Point bleujs.org API at the backend repo’s main branch or releases.
- **Link:** In this repo we reference the backend once; update the URL when the repo is created.

## Do not re-add backend here

To avoid Dependabot and security alert overload, **do not** re-add `backend/` to this repo. Keep backend in its own repo. See [Dependabot and dependency security](./DEPENDABOT_AND_DEPENDENCIES.md).
