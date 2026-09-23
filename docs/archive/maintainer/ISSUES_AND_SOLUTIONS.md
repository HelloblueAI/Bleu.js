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
- **Cause:** The hosted API did not respond in time. This repository only contains the client.
- **Solution:** The hosted API now returns an error the client can surface, instead of hanging. See [API client and contract](../../WHO_SERVES_THE_API.md).
- **Status:** Fixed on the hosted API. No changes required in this repository for the client.

---

## ISSUE 3: Generate returns 500 Internal Server Error

- **Symptom:** `bleu generate "..."` and `client.generate(...)` return: `API Error: {'success': False, 'error': 'Internal Server Error', 'code': 'INTERNAL_ERROR'}`
- **Cause:** The hosted API returned HTTP 500 for generate errors.
- **Solution:** Clients should accept a top-level `text` field, as documented in the API contract.
- **Status:** Fixed on the hosted API. No changes required in this repository for the client.

---

## ISSUE 4: Embed returns 500 Internal Server Error

- **Symptom:** `bleu embed "Hello world" "Goodbye world"` and `client.embed([...])` return the same 500 INTERNAL_ERROR.
- **Cause:** The hosted API returned HTTP 500 for embed.
- **Solution:** Use the response shape in the API contract. No client change is required for the fix.
- **Status:** Fixed on the hosted API. No changes required in this repository for the client.

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
- **Live API:** The SDK and CLI call `https://api.bleujs.org`. See [API client and contract](../../WHO_SERVES_THE_API.md).
