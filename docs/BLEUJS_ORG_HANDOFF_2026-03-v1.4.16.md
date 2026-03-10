# bleujs.org website update – copy-paste for developer (March 2026, v1.4.16)

**Send the text below to your bleujs.org web developer.** They can copy-paste it and use it to update the site.

---

## Copy-paste start

**Subject:** bleujs.org updates to align with Bleu.js v1.4.16 and latest messaging

Hi,

Please update the bleujs.org site to match the following (so the website and the open-source repo say the same thing).

**1. Version**
- Show the current SDK/CLI version as **1.4.16** (or “latest” that points to the same). Update any hardcoded version badges or footers.

**2. One-line pitch / hero**
- **Bleu.js** is a quantum-enhanced AI platform: **cloud API, CLI, and Python SDK** at bleujs.org.
- Optional tagline: *“From zero to first API call in under two minutes.”*

**3. Install and CLI**
- **Install:** `pip install bleu-js` (no change).
- **CLI:** Both **`bleu`** and **`bleujs`** are installed and work (e.g. `bleu version`, `bleujs version`, `bleu chat "Hello"`, `bleujs health`). Use either name in docs and examples.
- **Default install is lightweight:** No torch, shap, or numba. Heavy ML/quantum/deep learning are optional: `pip install "bleu-js[ml]"`, `"bleu-js[quantum]"`, `"bleu-js[deep]"`, or `"bleu-js[all]"`.

**4. Positioning line (optional but recommended)**
- **“Efficient by default, powerful by choice.”** One command for API + CLI; add optional extras when you need ML, quantum, or deep learning.

**5. Get API key**
- Keep “Get API key” / sign-up pointing to bleujs.org (e.g. /dashboard or your sign-up flow).

**6. API endpoints (if you show them)**
- Base URL: `https://bleujs.org`
- `GET /health`, `POST /api/v1/chat`, `POST /api/v1/generate`, `POST /api/v1/embed`, `GET /api/v1/models`. Auth: Bearer token (API key).

**7. What not to overclaim**
- Don’t say “post-quantum” crypto (we use multi-round SHA-512, not NIST Kyber/Dilithium).
- Default install = API + CLI; quantum/ML are opt-in via extras.

**8. Links**
- Product/API: https://bleujs.org
- Get API key: https://bleujs.org (your sign-up/dashboard)
- Repo (SDK, CLI, docs): https://github.com/HelloblueAI/Bleu.js
- Full alignment checklist (for reference): https://github.com/HelloblueAI/Bleu.js/blob/main/docs/BLEUJS_ORG_CLAIMS_ALIGNMENT.md

Thanks — this keeps the site in sync with the repo and v1.4.16.

**Copy-paste end**

---

*This handoff is in the repo at `docs/BLEUJS_ORG_HANDOFF_2026-03-v1.4.16.md`.*
