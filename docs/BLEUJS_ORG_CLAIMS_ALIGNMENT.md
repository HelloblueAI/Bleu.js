# bleujs.org – claims alignment (match exactly)

Use this so **bleujs.org** and the **Bleu.js repo** say the same thing. Update the website to match these bullets, or keep this doc in sync when we change claims.

---

## One-line pitch

- **Bleu.js** is a quantum-enhanced AI platform: **cloud API, CLI, and Python SDK** at [bleujs.org](https://bleujs.org).
- Optional tagline: *“From zero to first API call in under two minutes.”*

---

## What we offer (exact wording to mirror)

| Claim | Source | Use on website |
|-------|--------|----------------|
| Quantum-enhanced AI platform | README, pyproject | Home / hero |
| Cloud API + CLI + Python SDK | README, GET_STARTED | Features / docs |
| Get API key at bleujs.org | README, all docs | CTA: “Get API key” → bleujs.org |
| Install: `pip install bleu-js` | README, INSTALLATION | Install section |
| CLI: `bleu` or `bleujs` (both work) | GET_STARTED, handoff | Docs / examples |
| Commands: `bleu version`, `bleu health`, `bleu chat "Hello"`, `bleu generate`, `bleu embed`, `bleu models list` | README, CLI | CLI section |
| Default install is lightweight (no torch, shap, numba) | INSTALLATION, FEEDBACK_AUDIT | Install / FAQ |
| Optional: `[ml]`, `[quantum]`, `[deep]`, `[all]` for heavy stacks | pyproject, INSTALLATION | Install options |

---

## API contract (must match backend)

Base URL: **`https://bleujs.org`** (or API subdomain if you split later).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check (status, version) |
| POST | `/api/v1/chat` | Chat completion (messages, model, temperature, max_tokens) |
| POST | `/api/v1/generate` | Text generation (prompt, model, temperature, max_tokens) |
| POST | `/api/v1/embed` | Embeddings (input or inputs: array of strings) |
| GET | `/api/v1/models` | List models |

Auth: **Bearer token** (API key in `Authorization: Bearer <key>`).

Machine-readable: [docs/api/openapi.yaml](api/openapi.yaml).

---

## What NOT to overclaim

- **Quantum:** Local quantum features need optional deps (Qiskit/PennyLane). Default install = API + CLI; quantum is optional.
- **“Quantum-resistant” crypto** in the SDK = multi-round SHA-512 (hardening), not NIST post-quantum (Kyber/Dilithium). Don’t say “post-quantum” unless we add those.
- **QuantumAttention** in code = classical simulation for compatibility; don’t imply it runs real quantum circuits.

---

## Links to keep consistent

- **Product / API:** https://bleujs.org
- **Get API key / sign up:** https://bleujs.org (e.g. /dashboard or sign-up)
- **Docs:** https://bleujs.org/docs (if you host them) or GitHub: [Bleu.js docs](https://github.com/HelloblueAI/Bleu.js/tree/main/docs)
- **Repo (SDK, CLI, docs):** https://github.com/HelloblueAI/Bleu.js
- **Backend repo:** https://github.com/HelloblueAI/Bleujs.-backend
- **OpenAPI spec:** https://github.com/HelloblueAI/Bleu.js/blob/main/docs/api/openapi.yaml

---

## Version and badges

- Show **current version** from PyPI or GitHub releases (e.g. 1.4.x). Update README badge from `1.3.x` to match (or use dynamic badge).
- “pip install bleu-js” installs the latest; “bleu version” or “bleujs version” shows CLI version.

---

**Summary for website team:** Use the one-line pitch and the table above on bleujs.org. Keep API paths and auth identical to openapi.yaml. Don’t overclaim quantum or crypto. Link to bleujs.org for keys and to GitHub for repo/docs. Default install = lightweight; heavy stacks = optional extras.
