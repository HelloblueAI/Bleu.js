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
- **Cause:** Backend did not respond in time or did not implement POST /api/v1/chat.
- **Solution (fixed in backend repo):** Backend (Bleu.js-backend-export / Bleujs.-backend) now implements POST /api/v1/chat and returns within a few seconds with valid JSON (`choices[].message.content`).
- **Status:** Fixed in **Bleu.js-backend-export** `index.mjs`. Deploy that backend to the host serving https://bleujs.org so the live API responds.

---

## ISSUE 3: Generate returns 500 Internal Server Error

- **Symptom:** `bleu generate "..."` and `client.generate(...)` return: `API Error: {'success': False, 'error': 'Internal Server Error', 'code': 'INTERNAL_ERROR'}`
- **Cause:** Backend POST /api/v1/generate was returning HTTP 500.
- **Solution (fixed in backend repo):** Backend now implements POST /api/v1/generate and returns 200 with `{ text, id, model, usage, finish_reason }`.
- **Status:** Fixed in **Bleu.js-backend-export** `index.mjs`. Deploy that backend to bleujs.org.

---

## ISSUE 4: Embed returns 500 Internal Server Error

- **Symptom:** `bleu embed "Hello world" "Goodbye world"` and `client.embed([...])` return the same 500 INTERNAL_ERROR.
- **Cause:** Backend POST /api/v1/embed was returning HTTP 500.
- **Solution (fixed in backend repo):** Backend now implements POST /api/v1/embed and returns 200 with `{ data: [{ embedding, index }], model, usage }`.
- **Status:** Fixed in **Bleu.js-backend-export** `index.mjs`. Deploy that backend to bleujs.org.

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
- **Live API (bleujs.org):** Fix chat/generate/embed by deploying the updated backend (Bleu.js-backend-export or Bleujs.-backend) to the server that serves https://bleujs.org. See [BACKEND_REPO.md](BACKEND_REPO.md) and [SMOKE_TEST_RESULTS.md](SMOKE_TEST_RESULTS.md).
