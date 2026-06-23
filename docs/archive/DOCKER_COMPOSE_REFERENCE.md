# Docker Compose reference (legacy)

> **Archived:** This repo no longer ships `docker-compose.yml`. For current container deployment, use the root [Dockerfile](../../Dockerfile) and [INSTALLATION.md](../INSTALLATION.md#method-4-docker-install-for-containers).

Historical multi-service Compose layout kept for reference only.

## Quick start (legacy)

```bash
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js
docker-compose up -d
```

## Services (historical)

| Service | Port | Role |
|---------|------|------|
| Backend API | 4003 | FastAPI |
| Core Engine | 6000 | Quantum processing |
| MongoDB | 27017 | Primary store |
| Redis | 6379 | Cache |
| Eggs Generator | 5000 | Model inference |
| MongoDB Express | 8081 | DB admin |

## Current self-host path

```bash
docker build -t bleu-js:local .
docker run --rm -p 8000:8000 -e PORT=8000 bleu-js:local
```

See [DEPLOYMENT_PRACTICES.md](../DEPLOYMENT_PRACTICES.md).
