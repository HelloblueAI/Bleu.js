# Deployment practices

Generic guidance for running the open-source Bleu.js app yourself. Hosted Helloblue infrastructure is out of scope for this repository.

## Practices this image follows

| Practice | What the image does |
|----------|---------------------|
| **Port from the environment** | The process listens on `0.0.0.0:$PORT` (default `8000`). |
| **Health check** | `GET /health` returns 200 so a load balancer or orchestrator can probe the process. |
| **One process** | A single uvicorn process serves the app. |
| **Non-root user** | The image runs as `app`. |
| **Config from the environment** | Ports, secrets, and the database URL come from the environment, not from the image. |

## Run the container

From the repository root:

```bash
docker build -t bleu-js:local .
docker run --rm -p 8000:8000 \
  -e PORT=8000 \
  -e ENV_NAME=production \
  -e SECRET_KEY="replace-with-a-random-string-at-least-32-chars" \
  -e JWT_SECRET_KEY="replace-with-a-different-random-string-32" \
  -e JWT_SECRET="replace-with-another-random-string-32chars" \
  -e ENCRYPTION_KEY="replace-with-another-random-string-32ch" \
  -e DATABASE_URL="sqlite:///./bleujs.db" \
  bleu-js:local
```

Then open `http://localhost:8000/health`.

Generate secrets with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Configuration

Copy [`.env.example`](../.env.example) to `.env` and set values for your own machine or cluster.

- **Database.** `DATABASE_URL` may be SQLite for a local trial, or a Postgres URL you run yourself (`postgresql://user:password@host:5432/bleujs`).
- **Startup.** `DATABASE_CONNECT_TIMEOUT` (default `5`) limits how long a database connection attempt waits. `FAIL_STARTUP_ON_DB_INIT_ERROR` defaults to `false`, so the process can still serve `/health` when the database is briefly unavailable. Set it to `true` when you want the process to exit if database init fails.
- **Optional model providers.** `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` are optional. Leave them unset to use only what you configure locally.

`docker-compose.prod.yml` is a minimal example of running this image. It is not a capacity plan. Set your own CPU, memory, and replica counts for the platform you use.

## What to publish

Ship the SDK, the OpenAPI contract, and this self-host example. Do not commit passwords, API keys, database URLs with credentials, or hostnames and network IDs from a live deployment.
