# Bleu OS — Grade A checklist

**Goal:** Docker Scout **A**, Trivy clean for fixable issues, CI aligned with published images.

## Automated (in this repo)

| Step | What we did |
|------|-------------|
| **Multi-stage image** | `Dockerfile.production` — build tools only in `builder`; runtime has no `build-essential` / `perl` / `linux-libc-dev` |
| **Base image** | `debian:bookworm-slim` (Debian 12 LTS, pinned). Use `stable-slim` only when intentionally tracking Debian 13+ |
| **Published tags** | `docker-publish.yml` builds `Dockerfile.production` → `bleuos/bleu-os:latest` |
| **CI alignment** | `bleu-os.yml` builds/tests **production** Dockerfile (not Alpine) |
| **Trivy ignore file** | `bleu-os/.trivyignore` — documented Debian/host CVEs only |
| **Local verify** | `./bleu-os/scripts/verify-grade-a.sh` |

```bash
# From Bleu.js repo root
chmod +x bleu-os/scripts/verify-grade-a.sh
./bleu-os/scripts/verify-grade-a.sh
```

## Manual (Docker Scout — required for Scout **A**)

Scout still counts Debian base CVEs with **no fix in Bookworm**. Add **policy exceptions** once (5–10 min):

1. Open [scout.docker.com](https://scout.docker.com) → **Images** → `bleuos/bleu-os:latest` → **Vulnerabilities**.
2. For each remaining **fixable** high/critical that TRIVY_ALERTS says is **not fixable in image**, click **Create exception** → **Accepted risk** → scope **All images in repository**.
3. Reason (paste):
   ```
   Debian 12 base; no fix in image. See bleu-os/TRIVY_ALERTS.md.
   ```
4. **Policies** → approve base image **debian:bookworm-slim** if “unapproved base” fails.
5. **Supply chain:** push via `docker-publish.yml` (SBOM + provenance already enabled).

Detailed clicks: [DOCKER_SCOUT_POLICY_GUIDE.md](DOCKER_SCOUT_POLICY_GUIDE.md).

## GitHub Code scanning

After the next image push, dismiss stale **Alpine** alerts:

```bash
./scripts/dismiss-trivy-code-scanning-alerts.sh --dry-run
./scripts/dismiss-trivy-code-scanning-alerts.sh
```

## Backend repo (Bleujs.-backend) → A

Target **95+/100** ([REPOSITORY_HEALTH_REPORT.md](https://github.com/HelloblueAI/Bleujs.-backend/blob/main/REPOSITORY_HEALTH_REPORT.md)):

- Run `npm test` on every change
- Keep contract tests in sync with main `openapi.yaml`
- Rebuild production image with `--pull` monthly

## Grade definitions

| Grade | Meaning |
|-------|---------|
| **A** | Zero **fixable** critical/high in Scout; documented exceptions for Debian base |
| **B** | Fixable issues remain or exceptions not configured |
| **F** | Unpinned secrets, root-only image, or failing CI |
