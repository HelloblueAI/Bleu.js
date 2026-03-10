# bleujs.org website updates – handoff (March 2026)

**For:** bleujs.org website developer
**From:** Bleu.js repo / product
**Release:** v1.4.13 (CLI fix + docs alignment)

Use this list to keep the live site in sync with the latest SDK/CLI and docs.

---

## 1. CLI command names (important)

- **`pip install bleu-js`** installs **two** CLI commands: **`bleu`** and **`bleujs`**. Both do the same thing.
- Any place on the site that shows only **`bleu`** (e.g. “run `bleu version`”) should either:
  - Show both, e.g. **“`bleu version` or `bleujs version`”**, or
  - Say **“`bleu` or `bleujs`”** once so users know both work.
- This avoids confusion for users who only see `bleujs` in their terminal (e.g. on some systems the `bleu` script might not be in PATH).

**Examples to align:**

| If you currently show | Prefer (either is fine) |
|------------------------|-------------------------|
| `bleu version`         | `bleu version` or `bleujs version` |
| `bleu health`          | `bleu health` or `bleujs health` |
| `bleu chat "Hello"`    | `bleu chat "Hello"` or `bleujs chat "Hello"` |
| `bleu config set api-key ...` | Same, plus “or `bleujs config set api-key ...`” if you want |

---

## 2. Version number

- If the website shows a “current” or “latest” SDK/CLI version, update it to **1.4.13** (or whatever is latest at [PyPI](https://pypi.org/project/bleu-js/) / [GitHub releases](https://github.com/HelloblueAI/Bleu.js/releases)).
- Changelog: [CHANGELOG.md](https://github.com/HelloblueAI/Bleu.js/blob/main/CHANGELOG.md).

---

## 3. Install and verify copy

- **Install:** Keep **`pip install bleu-js`** as the install command. No change.
- **Verify:** If you tell users to verify the install, you can say:
  **“Run `bleu version` or `bleujs version`, and `bleu health` or `bleujs health` (with `BLEUJS_API_KEY` set).”**

---

## 4. Existing checklist (reference)

The repo has a general website checklist:
**[docs/BLEUJS_ORG_WEBSITE_CHECKLIST.md](https://github.com/HelloblueAI/Bleu.js/blob/main/docs/BLEUJS_ORG_WEBSITE_CHECKLIST.md)**

It covers API base URL, endpoints, “Get API key”, pricing, docs URL, open source links, and deployment. Use it for broader sync; this handoff focuses on the **v1.4.13 CLI/docs updates** above.

---

## Quick checklist for you

- [ ] Replace or extend any “run `bleu ...`” copy so it’s clear **`bleu` or `bleujs`** both work.
- [ ] Update displayed SDK/CLI version to **1.4.13** (or latest).
- [ ] Leave **`pip install bleu-js`** as-is.
- [ ] (Optional) Skim [BLEUJS_ORG_WEBSITE_CHECKLIST.md](https://github.com/HelloblueAI/Bleu.js/blob/main/docs/BLEUJS_ORG_WEBSITE_CHECKLIST.md) for other items (API, contribute, deployment).

---

**Summary:** Align bleujs.org with the fact that both **`bleu`** and **`bleujs`** are valid CLI commands after `pip install bleu-js`, and bump any shown version to 1.4.13 (or later).
