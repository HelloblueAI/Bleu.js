# What to update on bleujs.org (website checklist)

Use this checklist when updating the live site [bleujs.org](https://bleujs.org) so it stays in sync with the open-source repos and current architecture.

**For exact claims and one-line pitch:** See **[BLEUJS_ORG_CLAIMS_ALIGNMENT.md](BLEUJS_ORG_CLAIMS_ALIGNMENT.md)** — use it so the website and repo say the same thing.

## 1. Developers / Docs / API

- [ ] **API base URL** — The SDK and API docs use `https://api.bleujs.org`. Keep public docs and examples on that base URL.
- [ ] **API endpoints** — Match the [API contract](API_CLIENT_GUIDE.md#api-contract-and-response-shapes): e.g. `POST /api/v1/chat`, `POST /api/v1/generate`, `POST /api/v1/embed`, `GET /api/v1/models`, `GET /health`. Machine-readable spec: [docs/api/openapi.yaml](api/openapi.yaml).
- [ ] **Link to SDK/docs** — Point to the [Bleu.js repo](https://github.com/HelloblueAI/Bleu.js) for SDK, CLI, and [API Client Guide](API_CLIENT_GUIDE.md). Optional: link to [Get started](GET_STARTED.md) (e.g. on GitHub).

## 2. Open source / Contribute

- [ ] **Open source** — Point contributors at **[Bleu.js](https://github.com/HelloblueAI/Bleu.js)** and [CONTRIBUTING](https://github.com/HelloblueAI/Bleu.js/blob/main/CONTRIBUTING.md). API shape changes follow [Changing the API](CHANGING_THE_API.md).

## 3. Evaluation / Awards (optional)

- [ ] If you mention awards or evaluations, add a link to the **[Evaluation and awards](EVALUATION_AND_AWARDS.md)** one-pager (e.g. `https://github.com/HelloblueAI/Bleu.js/blob/main/docs/EVALUATION_AND_AWARDS.md`) so committees have a single entry point.

## 4. Public API

- [ ] Public examples use `https://api.bleujs.org` and the paths in [openapi.yaml](api/openapi.yaml). Do not publish internal hostnames or deploy steps.

## 5. Copy / links that often need a refresh

- [ ] **“Get API key”** — Keep pointing to bleujs.org (e.g. `/dashboard` or sign-up flow).
- [ ] **Pricing / plans** — `https://bleujs.org/pricing` is referenced in the repo; ensure that page exists and is correct.
- [ ] **Docs URL** — Several places reference `https://bleujs.org/docs`; ensure it resolves to your docs or update references.

## 6. Repo defaults

- Links for sign-up and API keys should keep pointing to `https://bleujs.org`; SDK/API request defaults should point to `https://api.bleujs.org`.

---

**Summary:** Align public pages with the API base URL, the OpenAPI contract, and this repository’s contributing guide.
