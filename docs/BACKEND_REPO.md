# Backend: separate repository

**See also:** [Repositories and sync](REPOSITORIES.md) — how both repos fit together and stay in sync. **Who serves the live API:** [Who serves the API](WHO_SERVES_THE_API.md) (bleujs.org Next.js/Vercel; Bleu.js is client-only). **Live API status:** [Smoke test results](SMOKE_TEST_RESULTS.md). **Issue/solution reference:** [Issues and solutions](ISSUES_AND_SOLUTIONS.md) (config show, chat timeout, generate/embed 500).

The Node/Express backend (inference, ML API, services) is **not** in this repo. It lives in a **separate repository** so this repo stays focused on the Bleu.js product (Python package, CLI, cloud API) and dependency alerts stay manageable—the same pattern used by Node.js, Stripe, and other API-first projects.

## Why a separate repo

| This repo                                         | Backend repo                                 |
| ------------------------------------------------- | -------------------------------------------- |
| Python SDK, CLI, docs, demos, Bleu OS             | Node/Express API and services                |
| Single dependency surface, clear Dependabot scope | Its own dependencies, releases, and security |

## Where is the backend?

- **Locally:** If you had a clone before we stopped tracking `backend/`, the folder `backend/` still exists on disk (`.gitignore`). Use it as the source for the new repo.
- **Canonical:** [HelloblueAI/Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend) — backend lives here. Use the export script below to refresh from local `backend/` if needed.

## One-time setup: create the backend repo

### Option A: Export script (recommended)

From the **root of this repo**, with `backend/` present on disk:

```bash
chmod +x scripts/export-backend-repo.sh
./scripts/export-backend-repo.sh
```

This creates `../Bleu.js-backend-export/` with a copy of `backend/` plus a minimal README (only if the export folder is new) and `.gitignore`. Then:

```bash
cd ../Bleu.js-backend-export
git init
git add .
git commit -m "Initial commit: Bleu.js backend (exported from main repo)"
git remote add origin git@github.com:HelloblueAI/Bleujs.-backend.git
git branch -M main
git push -u origin main
```

If you create a new repo, use the same remote URL; existing repo: [Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend).

### Option B: Manual

1. Or create a new repo (e.g. `HelloblueAI/Bleujs.-backend` already exists).
2. Copy your local `Bleu.js/backend/` into the new clone (exclude `node_modules/`, `.env`, secrets).
3. Add README and `.gitignore` in the new repo.
4. Commit and push.

## After the backend repo exists

- **CI/CD:** Add GitHub Actions in the backend repo for test, lint, deploy.
- **Deploy:** Point bleujs.org API at the backend repo’s main branch or releases.
- **Link:** Backend repo: [github.com/HelloblueAI/Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend).

**Backend repo parity (recommended):** So both repos feel production-ready, the backend repo should have: a minimal CI (lint + test), a README with install/run instructions, and a SECURITY.md (reporting, no secrets, deployment checklist). This repo’s [SECURITY.md](../SECURITY.md) can be used as a template.

## Re-exporting

If you run the export script again (e.g. to refresh the backend repo from local `backend/`), the script **does not overwrite** an existing `README.md` in the export folder, so the backend repo keeps its customized README. Merge any other changes from the export into the backend repo as needed.

## Do not re-add backend here

To avoid Dependabot and security alert overload, **do not** re-add `backend/` to this repo. Keep backend in its own repo. See [Dependabot and dependency security](./DEPENDABOT_AND_DEPENDENCIES.md).
