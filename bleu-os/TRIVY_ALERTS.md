# Trivy security alerts – Bleu OS images

**See also:** [SECURITY.md](../SECURITY.md) — known vulnerabilities and one-page fix checklist.

This doc explains how we handle Trivy (and similar) security alerts for the **helloblueai/bleu-os** images.

## Which image is published

- **`ghcr.io/helloblueai/bleu-os:latest`** and **`bleuos/bleu-os:latest`** are built from **`bleu-os/Dockerfile.production`** (Debian Bookworm). That image is the one that should be scanned and used in production.
- The **Alpine** Dockerfile (`bleu-os/Dockerfile`) is used in CI only (bleu-os.yml, `push: false`). We do **not** publish the Alpine image as `:latest`, so Trivy alerts that refer to “Alpine” packages (e.g. old zlib/sqlite in Alpine 3.23) apply to a non-published build.

## What we fixed in the production image (Debian)

- **Base:** Debian Bookworm slim; `apt-get update && apt-get upgrade -y` so all system packages (including zlib, sqlite, Python/CPython) get security updates.
- **Explicit packages:** We install `zlib1g` and `libsqlite3-0` so the image uses Debian’s patched versions; combined with `upgrade -y`, this addresses many **zlib** and **sqlite** CVEs that Trivy reports in Alpine.
- **CPython:** The Python in the image is Debian’s; Debian backports security fixes. Rebuilding the image after `apt-get upgrade` picks up those fixes (email, tarfile, POP3/IMAP, http.client, etc.).
- **python-markdown:** We do not install it in the production Dockerfile. If it appears as a transitive dependency, pin a fixed version in the Dockerfile or in Bleu.js dependencies.

## Alerts that may still appear

1. **jackson-core (ray_dist.jar)**
   The **ray** Python package bundles `ray_dist.jar`, which can contain an older **jackson-core**. Trivy may report a “Number Length Constraint Bypass” / DoS for that JAR.
   - **Mitigation:** Upgrade **ray** when a release bundles a fixed jackson (check [ray releases](https://github.com/ray-project/ray/releases) and release notes). We currently pin `ray>=2.9.0` in pyproject.toml; bump the minimum when upstream fixes the bundle.
   - **Risk:** DoS in a parser; the JAR is used by Ray at runtime. Prefer upgrading ray over removing it if you need it.

2. **Alpine-only alerts**
   If Trivy still reports **zlib**, **sqlite**, or **cpython** in **helloblueai/bleu-os**, check that the scanned image is actually the **production** image (Debian), not an old or Alpine build. Rebuild and push `bleu-os/Dockerfile.production` as `:latest`, then rescan.

## Rebuild and rescan

After changes to `Dockerfile.production`:

1. Rebuild and push the image (e.g. via the `docker-publish` workflow or your CI).
2. Rescan the new image with Trivy. Many of the previous zlib/sqlite/cpython/python-markdown alerts should clear for the Debian-based `:latest` image.
3. If jackson/ray alerts remain, track an upgrade of the **ray** dependency as above.

## Kernel alerts (cannot fix in the image)

Trivy may report **kernel** CVEs (e.g. nf_tables, ksmbd, macvlan, scsi, ALSA, bonding, smb, smc, ipv6, hfsplus, etc.). These refer to the **Linux kernel**, not to anything inside the container image.

- **The container image does not ship a kernel.** The kernel is provided by the **host** (the machine or VM running Docker/Kubernetes).
- You **cannot** fix kernel CVEs by changing the Bleu OS Dockerfile or base image.
- **What to do:** Run your containers on a **host with an updated kernel** (patch the host OS or use a managed service that applies kernel updates). In GitHub/Trivy you can **dismiss** these as “Not fixable in image” or “Mitigated by host kernel updates.”

So all **kernel:** High/Critical alerts are expected to remain in the Trivy list until the **host** is patched; they are not a defect of the Bleu OS image.

## Summary

| Alert type              | Where it comes from | What we did / do                          |
|-------------------------|--------------------|------------------------------------------|
| zlib / sqlite (Critical) | Base image         | Use Debian + upgrade; install zlib1g, libsqlite3-0 |
| cpython (High)         | Base Python        | Debian + apt-get upgrade                 |
| python-markdown (High) | Transitive dep     | Not installed in image; pin if needed     |
| jackson-core (High)    | ray_dist.jar (ray) | Upgrade ray when upstream fixes bundle   |
| **kernel (High)**      | **Host kernel**    | **Not in image; patch host or dismiss**  |

We did **not** fix these in the main Bleu.js repo before; they are fixed or mitigated in the **Bleu OS production image** and process as above. Kernel alerts are handled by host/VM updates, not by the image.

## GitHub Code scanning (Trivy SARIF) – bulk dismiss

Trivy results are uploaded as SARIF to **Security → Code scanning** (not Dependabot). If you see hundreds of open Trivy alerts (zlib, sqlite, cpython, python-markdown, jackson-core, kernel) that are documented above as “not fixable in image” or “patch host,” you can bulk-dismiss them:

1. **Script (recommended)** — from repo root, with `gh` authenticated and `security_events` scope:
   ```bash
   ./scripts/dismiss-trivy-code-scanning-alerts.sh --dry-run   # list only
   ./scripts/dismiss-trivy-code-scanning-alerts.sh              # dismiss Trivy alerts
   ./scripts/dismiss-trivy-code-scanning-alerts.sh --all-tools   # dismiss all Code scanning tools
   ```
   Alerts are dismissed with reason **“won't fix”** and a comment pointing to this doc.

2. **Manual** — In **Security → Code scanning**, filter by tool (Trivy), select alerts, and use **Dismiss** with reason “Won’t fix” and a short comment (e.g. “Not fixable in image; see bleu-os/TRIVY_ALERTS.md”).
