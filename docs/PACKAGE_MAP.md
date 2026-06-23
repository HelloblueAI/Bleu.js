# Package map

Which installable packages exist in this repository and which one to use.

## Canonical package (use this)

| | |
|---|---|
| **Path** | Repository root (`pyproject.toml`) |
| **PyPI name** | [`bleu-js`](https://pypi.org/project/bleu-js/) |
| **Import** | `bleujs` |
| **Install** | `pip install bleu-js` or `pip install -e .` |
| **Includes** | Python SDK (`BleuAPIClient`), CLI (`bleu` / `bleujs`), core `BleuJS` |

All user-facing releases, versioning, and CI publish flows use **this** package. Version: `pyproject.toml` and `src/bleujs/__init__.py`.

## Other trees (not the default PyPI product)

| Path | Name / role | Published? |
|------|-------------|------------|
| `python/` | `bleu-ai` (legacy research subtree) | No — not released from root CI |
| `src/quantum_py/` | Quantum experiments / subpackage | Optional; document-only for most users |
| `src/bleu_ai/` | Research / vision experiments | Not part of default `bleu-js` install |
| `src/python/` | Internal ML / operations modules | Dev / monorepo layout only |

If you are contributing to the **product** (API, CLI, docs, bleujs.org integration), work at the **repo root** and `src/bleujs/`.

## Extras

See root `pyproject.toml` `[tool.poetry.extras]`: `ml`, `quantum`, `deep`, `server`, `all`, `ci`.

## Related

- [INSTALLATION.md](INSTALLATION.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [REPOSITORIES.md](REPOSITORIES.md) — SDK vs backend repo
