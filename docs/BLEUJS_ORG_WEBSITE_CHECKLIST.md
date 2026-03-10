# What to update on bleujs.org (website checklist)

Use this checklist when updating the live site [bleujs.org](https://bleujs.org) so it stays in sync with the open-source repos and current architecture.

**For exact claims and one-line pitch:** See **[BLEUJS_ORG_CLAIMS_ALIGNMENT.md](BLEUJS_ORG_CLAIMS_ALIGNMENT.md)** — use it so the website and repo say the same thing.

## 1. Developers / Docs / API

- [ ] **API base URL** — The API is served at `https://bleujs.org` (or your API subdomain). Ensure docs and examples use the same base URL as the deployed backend (Bleujs.-backend when deployed).
- [ ] **API endpoints** — Match the [API contract](API_CLIENT_GUIDE.md#api-contract-and-response-shapes): e.g. `POST /api/v1/chat`, `POST /api/v1/generate`, `POST /api/v1/embed`, `GET /api/v1/models`, `GET /health`. Machine-readable spec: [docs/api/openapi.yaml](api/openapi.yaml).
- [ ] **Link to SDK/docs** — Point to the [Bleu.js repo](https://github.com/HelloblueAI/Bleu.js) for SDK, CLI, and [API Client Guide](API_CLIENT_GUIDE.md). Optional: link to [Get started](GET_STARTED.md) (e.g. on GitHub).

## 2. Open source / Contribute

- [ ] **Two repos** — If you have a “Contribute” or “Open source” section, mention that the project has two repos: **[Bleu.js](https://github.com/HelloblueAI/Bleu.js)** (SDK, CLI, docs) and **[Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend)** (API server). Link to [Repositories and sync](REPOSITORIES.md) for details.
- [ ] **Where to contribute** — SDK/docs/CLI → Bleu.js repo; API server/backend → Bleujs.-backend repo. Link to [CONTRIBUTING](https://github.com/HelloblueAI/Bleu.js/blob/main/CONTRIBUTING.md). For API changes, the [Changing the API runbook](CHANGING_THE_API.md) applies (contract → backend → client).

## 3. Evaluation / Awards (optional)

- [ ] If you mention awards or evaluations, add a link to the **[Evaluation and awards](EVALUATION_AND_AWARDS.md)** one-pager (e.g. `https://github.com/HelloblueAI/Bleu.js/blob/main/docs/EVALUATION_AND_AWARDS.md`) so committees have a single entry point.

## 4. Infrastructure / deployment

- [ ] **Backend deployment** — bleujs.org (or your API host) should point at the deployed **Bleujs.-backend** app (Node/Express). See [BACKEND_REPO.md](BACKEND_REPO.md) and the backend [README](https://github.com/HelloblueAI/Bleujs.-backend#readme).
- [ ] **CORS** — If the website (e.g. dashboard or a separate frontend) calls the API from a different origin, ensure the backend allows that origin in CORS (no `*` in production).

## 5. Copy / links that often need a refresh

- [ ] **“Get API key”** — Keep pointing to bleujs.org (e.g. `/dashboard` or sign-up flow).
- [ ] **Pricing / plans** — `https://bleujs.org/pricing` is referenced in the repo; ensure that page exists and is correct.
- [ ] **Docs URL** — Several places reference `https://bleujs.org/docs`; ensure it resolves to your docs or update references.

## 6. No change needed

- Links in the **Bleu.js repo** (README, docs, API client defaults) already use `https://bleujs.org`. You don’t need to change those unless you move the API to a different domain (e.g. `api.bleujs.org`).

---

**Summary:** Align the website with: (1) API base URL and endpoints matching the contract (and [openapi.yaml](api/openapi.yaml)), (2) “Contribute” / open source mentioning both repos and CONTRIBUTING, (3) deployment pointing at Bleujs.-backend, and (4) optional link to Evaluation and awards. The repo already points at bleujs.org.
