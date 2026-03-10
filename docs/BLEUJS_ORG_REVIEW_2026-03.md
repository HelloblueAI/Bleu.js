# bleujs.org vs. What We Actually Deliver — Review (March 2026)

**TL;DR:** The site is *mostly* aligned and looks good, but **version numbers are behind**, one **env var is wrong** (so copy-paste would fail), and a couple of **taglines don’t match** the repo’s one-line pitch. Fix those and you’re delivering exactly what we claim.

---

## Copy-paste for website team (v1.4.31)

**Subject:** bleujs.org updates — version 1.4.31, env var fix, one-line pitch

1. **Version:** Show **1.4.31** as Current Version / Latest on the download page and in docs (Version Information). Update any “Download 1.3.29” link to 1.4.31 or “latest”.
2. **Env var:** In all installation/getting-started code samples, replace **`BLEU_API_KEY`** with **`BLEUJS_API_KEY`**. Correct snippet: `BleuAPIClient(api_key=os.getenv('BLEUJS_API_KEY'))` or `BleuAPIClient()` (reads env automatically).
3. **One-line pitch:** Use everywhere: **“Bleu.js — quantum-enhanced AI platform: cloud API, CLI, and Python SDK.”** Optional tagline: *“From zero to first API call in under two minutes.”* (Replace “The AI-Powered Python Framework” on the download page with this.)
4. **Docs version line:** e.g. “This documentation covers the Bleu.js 1.4.x line. Current release: 1.4.31.”

---

## What the site gets right ✅

- **Product idea:** Quantum-enhanced AI, Python, cloud API, CLI, SDK — all correct.
- **Install:** `pip install bleu-js`, Python 3.11+, lightweight by default, optional `[ml]`, `[quantum]`, `[deep]`, `[all]`.
- **CLI:** `bleu` and `bleujs` both work; `bleu version`, `bleu health`, `bleu chat`, etc.
- **Config:** API key via `bleu config` or `BLEUJS_API_KEY` (in some places; see bug below).
- **Docs structure:** Getting started, installation, quick start, tutorial, API reference — all sensible and consistent with the repo.
- **No overclaim:** You’re not saying “post-quantum” or that QuantumAttention runs on real hardware; the “optional extras” story is clear.

So in spirit, **yes — you’re delivering what we claim.** The gaps are version, one env var, and wording in a few spots.

---

## 1. Version: site says 1.3.29, we’re at 1.4.x

| Where on site | Says | Should be |
|---------------|------|-----------|
| Download page – “Current Version” | 1.3.29 | **1.4.31** (or “latest”, e.g. from PyPI) |
| Download page – “Download 1.3.29” link | 1.3.29 | **1.4.31** (or “latest”) |
| Docs – “Version Information” | Current Version: 1.3.29 | **1.4.31** (or dynamic) |
| Docs – “Released: March 2026” | (ok as-is) | (ok) |

**Why it matters:** Users who run `pip install bleu-js` get 1.4.31. If the site says “latest is 1.3.29”, it looks out of date and can confuse support (“I’m on 1.4.31, is that supported?”).

**Recommendation:**
- Set “Current Version” / “Latest” to **1.4.31** (or pull from PyPI/GitHub so it stays current).
- Optional: add a note like “`pip install bleu-js` installs the latest; run `bleu version` to see your CLI version.”

---

## 2. Wrong env var in installation docs (copy-paste bug)

**Page:** [bleujs.org/docs/getting-started/installation](https://bleujs.org/docs/getting-started/installation)

**Problem:** The code samples use **`BLEU_API_KEY`**:

```python
client = BleuAPIClient(api_key=os.getenv('BLEU_API_KEY'))
```

**Reality:** The SDK and CLI only read **`BLEUJS_API_KEY`**. So anyone who copies that snippet and sets `BLEU_API_KEY` will get “API key not found.”

**Fix:** Replace every instance of `BLEU_API_KEY` with **`BLEUJS_API_KEY`** in:

- Configuration section (e.g. “Create a configuration file…”).
- Basic Setup – Option 1 (Cloud API Client).

Correct pattern (matches repo and CLI):

```python
client = BleuAPIClient(api_key=os.getenv('BLEUJS_API_KEY'))
# or simply:
client = BleuAPIClient()  # reads BLEUJS_API_KEY automatically
```

**Bonus:** The repo doesn’t use a project-level `bleu_config.py` for the cloud client; we use env var or `bleu config set api-key`. So you could simplify the “Configuration” section to: “Set `BLEUJS_API_KEY` or run `bleu config set api-key <key>`,” then show the minimal `BleuAPIClient()` example. Optional, but would match the repo exactly.

---

## 3. One-line pitch / tagline

**Alignment doc says:**
“**Bleu.js** is a **quantum-enhanced AI platform**: **cloud API, CLI, and Python SDK** at bleujs.org.”
Optional tagline: *“From zero to first API call in under two minutes.”*

**Download page currently says:**
“Get started with Bleu.js - **The AI-Powered Python Framework**”

**Gap:** “AI-Powered Python Framework” is vaguer and drops “quantum-enhanced,” “cloud API,” and “CLI.” It’s not wrong, but it’s not the same claim.

**Recommendation:**
- On the download page (and anywhere you have a one-liner), use the canonical pitch:
  **“Bleu.js — quantum-enhanced AI platform: cloud API, CLI, and Python SDK.”**
- Optionally add: *“From zero to first API call in under two minutes.”*

That way the site and the repo (README, docs, PyPI) say exactly the same thing.

---

## 4. Docs version line (small inconsistency)

**Docs page says:**
“This documentation covers the **Bleu.js 1.4.x** line (unified SDK & CLI).”
But right next to it: “Current Version: **1.3.29**.”

So “1.4.x” and “1.3.29” conflict.

**Fix:** Once “Current Version” is updated to 1.4.31 (or “latest”), this line is consistent. You could also phrase it as: “This documentation covers the Bleu.js 1.4.x line. Current release: 1.4.31.”

---

## 5. Optional: “Efficient by default, powerful by choice”

The README and handoff use: **“Efficient by default, powerful by choice.”**
If you have a short “why Bleu.js” or “install” blurb, adding that line would match the repo and set the right expectation (lightweight default, optional power).

---

## Summary checklist for the website team

| # | Action | Priority |
|---|--------|----------|
| 1 | Set “Current Version” / “Latest” to **1.4.31** (or dynamic) on download and docs | High |
| 2 | Replace **BLEU_API_KEY** with **BLEUJS_API_KEY** in all installation/getting-started code samples | High |
| 3 | Use the one-line pitch: “quantum-enhanced AI platform: cloud API, CLI, and Python SDK” (and optional “under two minutes” tagline) on download/main hero | Medium |
| 4 | Resolve “1.4.x” vs “1.3.29” in docs (version block) | Medium |
| 5 | Optionally add “Efficient by default, powerful by choice” where you describe install/positioning | Low |

---

## Delightful conclusion

You’re **not** overclaiming. You’re not promising post-quantum crypto or real quantum hardware in the default path. The structure (getting started, installation, quick start, API reference) matches how the SDK and CLI actually work. So in spirit, **yes — bleujs.org is delivering what we claim.**

The main fixes are: **show the real version (1.4.31)**, **fix the env var so copy-paste works (BLEUJS_API_KEY)**, and **reuse the same one-line pitch** as the repo. Do those three and the site and the product are in lockstep — and users who land on bleujs.org get exactly what they’ll get when they `pip install bleu-js` and open the README.

For exact wording and API contract, keep using **[BLEUJS_ORG_CLAIMS_ALIGNMENT.md](BLEUJS_ORG_CLAIMS_ALIGNMENT.md)** and **[BLEUJS_ORG_WEBSITE_CHECKLIST.md](BLEUJS_ORG_WEBSITE_CHECKLIST.md)**.
