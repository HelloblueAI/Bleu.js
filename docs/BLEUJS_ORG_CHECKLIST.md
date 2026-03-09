# bleujs.org content checklist

Use this to keep the **website** (bleujs.org) in sync with the **repo** and the install flow we document.

---

## What we document in-repo

These are the steps and messages we describe in the repo (README, [GET_STARTED.md](GET_STARTED.md), [QUICKSTART.md](QUICKSTART.md), [INSTALLATION.md](INSTALLATION.md)):

| Step | In-repo doc | Suggested for bleujs.org |
|------|-------------|---------------------------|
| **1. Install** | `pip install bleu-js` | Same: `pip install bleu-js` (Python 3.11+). |
| **2. First commands (no key)** | `bleu --help`, `bleu version` | Optional: “Try `bleu version` right after install.” |
| **3. Get API key** | “Go to bleujs.org, sign up, create/copy key” | Prominent: “Get your API key” / “Sign up” → dashboard or account. |
| **4. Set key** | `export BLEUJS_API_KEY=...` or `bleu config set api-key <key>` | Same two options (env var + CLI config). |
| **5. First API use** | `bleu chat "Say hello in one word."` | Same command and/or a “Try it” button that runs it. |
| **6. Verify** | `bleu version`, `bleu health` | Optional: “Check connection: `bleu health`.” |
| **Config location** | `~/.bleujs/config.json` when using CLI config | Optional: mention in “Configuration” or FAQ. |
| **Error: no key** | “API key not found … Set with … Get your key: https://bleujs.org” | Optional: FAQ “What if I see ‘API key not found’?” with same fix. |
| **Version** | v1.3.x (e.g. 1.3.59); `bleu version` | Hero/tagline: “Bleu.js v1.3.x – Unified SDK & CLI” (or current 1.3.x). |

---

## Suggested bleujs.org copy (align with repo)

- **Tagline:** e.g. “Bleu.js v1.3.x – Unified SDK & CLI” and “Command-Line Interface • Python SDK • Cloud API”.
- **Install:** “`pip install bleu-js`” (not `bleu-js[api]`; default includes API + CLI).
- **Quick start:** Install → Get API key (here on bleujs.org) → Set key (env or `bleu config set api-key`) → `bleu chat "Hello"` (and/or Python snippet).
- **Links:** Point to GitHub README and/or [GET_STARTED.md](GET_STARTED.md) for the full walkthrough.

---

## Single source of truth

- **Version number:** [pyproject.toml](../pyproject.toml) and `bleu version` (e.g. 1.3.59). Update the site when you release a new 1.3.x.
- **Install command:** `pip install bleu-js` everywhere (repo + site).
- **First-run flow:** Same order (install → key → set key → `bleu chat` / SDK) in repo and on bleujs.org.

This file is for maintainers only; it is not linked from the main user docs.
