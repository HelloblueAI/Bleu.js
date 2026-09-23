# API server code in this repo

The OpenAPI stub and its contract tests live in [`services/edge-stub/`](../services/edge-stub/).

```bash
cd services/edge-stub
npm test
```

Do not add a second backend tree to this repository. `scripts/export-backend-repo.sh` is retired and exits immediately.

The public client contract is [openapi.yaml](api/openapi.yaml). See [Changing the API](CHANGING_THE_API.md).
