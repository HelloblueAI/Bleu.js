# Bleu.js – Issues and solutions (developer reference)

Copy-paste reference for the four main issues and how they were fixed.

---

## ISSUE 1: bleu config show fails

- **Symptom:** Running `bleu config show` returns: `Error: Got unexpected extra argument (show)`
- **Cause:** Click was not routing "show" as the subcommand of the config group (e.g. main group consuming an argument).
- **Solution (fixed):** CLI now passes `args=sys.argv[1:]` and `prog_name="bleu"` in `main()` so Click correctly dispatches `bleu config show`. The `config show` command also accepts optional trailing args (`_rest`) so extra tokens do not cause "unexpected extra argument."
- **Status:** Fixed in Bleu.js repo (cli.py). Install latest: `pip install -U bleu-js`.

---

## ISSUE 2: Chat times out / no response

- **Symptom:** `bleu chat "Hello, world!"` and Python `client.chat([...])` never return; they time out (e.g. 30–40s).
- **Cause:** The API (served by **bleujs.org**, not by Bleu.js) did not respond in time.
- **Solution (fixed on bleujs.org):** Chat has a 20s timeout; if the backend does not respond in time we return 503 with a clear message instead of hanging. See [Who serves the API](WHO_SERVES_THE_API.md).
- **Status:** Fixed on **bleujs.org** (Next.js/Vercel). No changes required in the Bleu.js repo.

---

## ISSUE 3: Generate returns 500 Internal Server Error

- **Symptom:** `bleu generate "..."` and `client.generate(...)` return: `API Error: {'success': False, 'error': 'Internal Server Error', 'code': 'INTERNAL_ERROR'}`
- **Cause:** The API (bleujs.org) was returning HTTP 500 for generate errors.
- **Solution (fixed on bleujs.org):** Errors from the AI layer now return 503 (and are logged); response includes a top-level `"text"` field. See [Who serves the API](WHO_SERVES_THE_API.md).
- **Status:** Fixed on **bleujs.org**. No changes required in the Bleu.js repo.

---

## ISSUE 4: Embed returns 500 Internal Server Error

- **Symptom:** `bleu embed "Hello world" "Goodbye world"` and `client.embed([...])` return the same 500 INTERNAL_ERROR.
- **Cause:** The API (bleujs.org) was returning HTTP 500 for embed.
- **Solution (fixed on bleujs.org):** 503 and logging instead of 500; fallback embedding provider when primary fails so we can still return 200 with embeddings when possible. See [Who serves the API](WHO_SERVES_THE_API.md).
- **Status:** Fixed on **bleujs.org**. No changes required in the Bleu.js repo.

---

## Verification (after fixes)

Run with a valid API key (e.g. `BLEUJS_API_KEY=bleujs_sk_...`):

```bash
bleu version && bleu health && bleu models list
bleu config show
bleu chat "Hello, world!"        # → returns a reply within ~15s
bleu generate "Write one sentence."  # → returns generated text
bleu embed "Hello" "World"        # → returns two embedding vectors
```

Python:

```python
from bleujs import BleuAPIClient
client = BleuAPIClient()
client.chat([{"role": "user", "content": "Say hi."})   # returns without timeout
client.generate("Hi")                                   # returns text, no 500
client.embed(["x", "y"])                                # returns embeddings, no 500
```

- **SDK/CLI:** Fixed in this repo; `pip install -U bleu-js` gets the latest.
- **Live API:** Served by **bleujs.org** (Next.js on Vercel). Chat/generate/embed fixes were deployed there. Bleu.js only calls the API; it does not serve it. See [Who serves the API](WHO_SERVES_THE_API.md) and [BACKEND_REPO.md](BACKEND_REPO.md).
