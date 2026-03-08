# Poetry: What to Use From Now On

This project uses **Poetry** for dependency management. Use one of the following so your environment works reliably.

---

## What to use from now on

### Option A: Poetry via pipx (recommended)

If `poetry` on your machine is broken (e.g. `PoetryCoreException` / `InvalidRequirement` errors), or you want a single consistent Poetry, use **pipx**:

```bash
# One-time: install Poetry with pipx
pipx install poetry
pipx ensurepath   # ensure ~/.local/bin is on PATH

# From the project root, always use:
pipx run poetry install --no-interaction --extras all
pipx run poetry lock
pipx run poetry run pytest
pipx run poetry run python -m uvicorn src.main:app --reload
```

So **from now on**, for any Poetry command, run:

| You want to run | Use instead |
|-----------------|-------------|
| `poetry install --extras all` | `pipx run poetry install --no-interaction --extras all` |
| `poetry lock` | `pipx run poetry lock` |
| `poetry run pytest` | `pipx run poetry run pytest` |
| `poetry run python ...` | `pipx run poetry run python ...` |
| `poetry add some-package` | `pipx run poetry add some-package` |

To make the plain `poetry` command use the pipx install (optional):

- Put `~/.local/bin` **before** `/usr/bin` in your PATH, or
- Remove the system Poetry: `sudo apt remove --purge poetry`, then in a new terminal `poetry` will be the pipx one.

### Option B: Poetry fixed (plain `poetry` works)

If you’ve fixed the conflict (see **If you see errors** below), use Poetry as usual:

```bash
poetry install --extras all
poetry lock
poetry run pytest
```

### Option C: Pip only (no Poetry)

If you don’t use Poetry locally:

```bash
pip install -e .           # API + CLI only
pip install -e ".[all]"    # Full stack (for tests and app)
```

CI and other contributors can still use Poetry; the repo keeps `poetry.lock`.

---

## If you see errors

If you see:

```text
ImportError: cannot import name 'PoetryCoreException' from 'poetry.core.exceptions'
ImportError: cannot import name 'InvalidRequirement' from 'poetry.core.version.requirements'
```

then your **Poetry** and **poetry-core** (and sometimes **poetry-plugin-export**) are from different sources and versions don’t match.

**Fix 1 — Use pipx (recommended):** Use **Option A** above and run all Poetry commands via `pipx run poetry ...`.

**Fix 2 — Remove system Poetry:** So the pipx one is used when you type `poetry`:

```bash
sudo apt remove --purge poetry
# New terminal; then:
poetry install --extras all
```

**Fix 3 — Remove conflicting user packages:** If you prefer to keep system Poetry:

```bash
pip3 uninstall -y poetry-core poetry-plugin-export
# Then try:
poetry lock
```

**Fix 4 — Use uv for locking only:** If you only need a lock file and don’t use Poetry locally: install [uv](https://docs.astral.sh/uv/getting-started/install/) and run `uv lock`. The repo can still use `poetry.lock` in CI.

---

## After fixing

```bash
poetry lock   # or: pipx run poetry lock
git add poetry.lock
git commit -m "chore: update poetry.lock"
```
