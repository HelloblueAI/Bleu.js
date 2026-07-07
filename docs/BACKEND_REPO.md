# Backend repository (archived)

**Status:** [HelloblueAI/Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend) was **archived in July 2026**. It is no longer maintained.

## Where things moved

| Former backend repo | Now |
|---------------------|-----|
| Node OpenAPI stub (`index.mjs`, `server.mjs`) | [`services/edge-stub/`](../services/edge-stub/) in this repo |
| Contract tests | [`services/edge-stub/tests/`](../services/edge-stub/tests/) |
| Production chat / generate / embed | [bleujs.org](https://github.com/HelloblueAI/bleujs.org) (Next.js on Vercel) |
| Production `POST /predict` (XGBoost) | [bleujs.org `ml_engine/`](https://github.com/HelloblueAI/bleujs.org/tree/main/ml_engine) on Railway |

See [Repositories and sync](REPOSITORIES.md) and [Who serves the API](WHO_SERVES_THE_API.md).

## Edge stub (local dev / CI)

```bash
cd services/edge-stub
npm test
```

Do **not** re-create a separate backend repository. The `scripts/export-backend-repo.sh` script is deprecated.

## Historical note

The backend was split out in 2025–2026 to reduce Dependabot noise in the SDK repo. Production had already moved to bleujs.org; the split repo mostly held CI stubs and superseded ML code. Consolidating the stub into `services/edge-stub/` keeps one OpenAPI contract and one place for contract tests.
