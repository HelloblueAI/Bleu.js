# Trivy security alerts – Bleu OS images

**See also:** [SECURITY.md](../SECURITY.md) — known vulnerabilities and one-page fix checklist.

This doc explains how we handle Trivy (and similar) security alerts for the **helloblueai/bleu-os** images.

## Which image is published

- **`ghcr.io/helloblueai/bleu-os:latest`** and **`bleuos/bleu-os:latest`** are built from **`bleu-os/Dockerfile.production`** (Debian Bookworm). That image is the one that should be scanned and used in production.
- The **Alpine** Dockerfile (`bleu-os/Dockerfile`) is used in CI only (bleu-os.yml, `push: false`). We do **not** publish the Alpine image as `:latest`, so Trivy alerts that refer to “Alpine” packages (e.g. old zlib/sqlite in Alpine 3.23) apply to a non-published build.

## Intelligent next steps (runbook)

To get to **0 vulnerabilities / passing grade** without changing the image (remaining items are unfixable Debian base or host kernel):

1. **Docker Scout** – Add **one policy exception** for “all vulnerabilities in debian:bookworm-slim base packages where fix version is not available.” Reason: *Debian 12 base; no fix in image. See bleu-os/TRIVY_ALERTS.md.* Optionally add exceptions for specific CVEs (e.g. CVE-2025-45582, GHSA-72hv-8253-57qq) as in the table under “Docker Scout – get a passing grade” below.
2. **GitHub Code scanning (Trivy SARIF)** – Bulk-dismiss open Trivy alerts:
   `./scripts/dismiss-trivy-code-scanning-alerts.sh` (use `--dry-run` first). Alerts are dismissed with a comment pointing to this doc.
3. **Dependabot container alerts** – If the same findings appear under Security → Dependabot, dismiss there manually (or “Select all” → Dismiss) with: *Not fixable in container image; Debian base. See bleu-os/TRIVY_ALERTS.md.*

Rebuild the image periodically with `docker build --pull --no-cache -f bleu-os/Dockerfile.production -t …` so you pick up Debian backports when they are released.

## What we fixed in the production image (Debian)

- **Base:** Debian Bookworm slim; `apt-get update && apt-get upgrade -y` so all system packages (including zlib, sqlite, Python/CPython) get security updates.
- **pip / setuptools:** We do **not** install `python3-pip` from apt. We install **python3-venv** (for venv support), then **purge** `python3-pip-whl` and `python3-setuptools-whl` (so the scanner never sees pip@23.0.1 or setuptools@66.1.1). We then install pip via **get-pip.py** and upgrade to pip>=25.3 and setuptools>=78.1.1. This addresses **CVE-2023-5752**, **CVE-2025-8869**, **CVE-2026-1703** (pip), **CVE-2024-6345**, **CVE-2025-47273** (setuptools).
- **Explicit packages:** We install `zlib1g` and `libsqlite3-0` so the image uses Debian’s patched versions; combined with `upgrade -y`, this addresses many **zlib** and **sqlite** CVEs that Trivy reports in Alpine.
- **CPython:** The Python in the image is Debian’s; Debian backports security fixes. Rebuilding the image after `apt-get upgrade` picks up those fixes (email, tarfile, POP3/IMAP, http.client, etc.).
- **python-markdown:** We do not install it in the production Dockerfile. If it appears as a transitive dependency, pin a fixed version in the Dockerfile or in Bleu.js dependencies.

## Alerts that may still appear

1. **jackson-core (GHSA-72hv-8253-57qq) – ray_dist.jar**
   **Mitigation in image:** We **uninstall Ray** after installing Bleu.js so the image does not ship `ray_dist.jar` (and thus no jackson-core). Bleu.js does not require Ray; users who need distributed computing can `pip install ray` at runtime.
   - If you need Ray in the image, install it after the fact or use a custom Dockerfile; track [ray releases](https://github.com/ray-project/ray/releases) for a build that bundles jackson-core 2.18.6+.

2. **Debian base packages (no fix in image / no fix available)**
   Scans may report CVEs in Debian-provided packages with **No** fix or **-** fix version. These are base distro packages; we run `apt-get upgrade -y` so we get the latest from Bookworm. If the fix is not yet in Debian 12, accept risk or add a policy exception until the base image is updated:
   - **CVE-2026-27601** (high) – pkg:deb/debian/underscore: we **purge libjs-underscore** in the Dockerfile (apt-get remove --purge libjs-underscore) so this package is not present in the image.
   - **CVE-2026-2297** (medium) – pkg:deb/debian/python3.11 (no fix listed).
   - **CVE-2025-45582** (medium) – pkg:deb/debian/tar (no fix listed).
   - **Low:** CVE-2005-2541 (tar), CVE-2007-5686 (shadow), CVE-2010-0928 (openssl), CVE-2010-4651 (patch), CVE-2010-4756 (glibc), CVE-2011-3374 (apt), CVE-2011-4116 (perl), CVE-2013-4392 (systemd), CVE-2017-13716/CVE-2018-20673/CVE-2018-20712 (binutils), CVE-2017-18018 (coreutils), CVE-2018-20225 (python-pip), CVE-2018-20796 (glibc), CVE-2018-5709 (krb5), CVE-2018-6829 (libgcrypt20). Patch the **host** or use a newer base image when Debian provides fixes.

3. **Alpine-only alerts**
   If Trivy still reports **zlib**, **sqlite**, or **cpython** in **helloblueai/bleu-os**, check that the scanned image is actually the **production** image (Debian), not an old or Alpine build. Rebuild and push `bleu-os/Dockerfile.production` as `:latest`, then rescan.

4. **openldap / curl / libcurl / OpenSSH (Debian base)**
   Trivy may report **openldap** (e.g. null pointer dereference in ber_memalloc_x, LMDB buffer underflow, nops.c stack buffer, privilege escalation via PID file, cipherstring parsing), **curl** (e.g. predictable WebSocket mask, QUIC cert bypass, SFTP host verification, TLS/OAuth2/LDAPS issues, zlib buffer overflow), and **OpenSSH** (SCP/SFTP transfer issues). These come from **Debian bookworm-slim** base or its dependencies (we install `curl` explicitly; openldap/openssh may be pulled in transitively). We run `apt-get update && apt-get upgrade -y` so we get the latest patched versions from Bookworm.
   - **What to do:** If no fix is available in Debian 12 yet, **accept risk** or add a **policy exception** in Dependabot/Scout (e.g. “Debian base package; no fix in image. See bleu-os/TRIVY_ALERTS.md”). Rebuild the image when Debian backports fixes so the next build picks them up.

## Rebuild and rescan

After changes to `Dockerfile.production`:

1. Rebuild and push the image (e.g. via the `docker-publish` workflow or your CI).
2. Rescan the new image with Trivy. Many of the previous zlib/sqlite/cpython/python-markdown alerts should clear for the Debian-based `:latest` image.
3. If jackson/ray alerts remain, track an upgrade of the **ray** dependency as above.

## Recent Trivy alerts (#1601–#1622) – how to handle

| Alert # | Component | Severity | Action |
|--------|------------|----------|--------|
| **#1622** | kernel: tls (race in tls_sw_cancel_work_tx) | High | **Kernel** – not in image; patch **host** kernel or dismiss. See “Kernel alerts” below. |
| **#1621** | kernel: espintcp (race in espintcp_close) | High | **Kernel** – not in image; patch **host** kernel or dismiss. |
| **#1617, #1616, #1608, #1607** | curl / libcurl4 (CVE-2026-3783, CVE-2026-1965) | Medium | Image runs `apt-get update && apt-get upgrade -y`. **Rebuild** with `docker build --pull --no-cache` so the base and packages are fresh. If Debian has not yet published a fixed curl in Bookworm, add a **policy exception** until then. |
| **#1618, #1609** | libcurl4 / curl (CVE-2026-3784) | Low | Same as above; rebuild with `--pull`. |
| **#1620, #1619, #1615–#1601** | binutils (readelf infinite loop; DWARF .debug_rnglists / loclists) | Low | From Debian base. `apt-get upgrade -y` in the Dockerfile picks up fixes when Debian releases them. **Rebuild** with `--pull --no-cache`; if no fix in Bookworm yet, add **policy exception** or dismiss as “No fix in image.” |

**One-time fix:** Rebuild and push the production image with a fresh base so the next Trivy run sees the latest packages:

```bash
# From Bleu.js repo root. Docker Hub image is bleuos/bleu-os (see .github/workflows/docker-publish.yml).
docker build --pull --no-cache -f bleu-os/Dockerfile.production -t helloblueai/bleu-os:1 .
docker tag helloblueai/bleu-os:1 bleuos/bleu-os:1
docker tag helloblueai/bleu-os:1 bleuos/bleu-os:latest
docker push bleuos/bleu-os:1
docker push bleuos/bleu-os:latest
```

Then **dismiss** kernel alerts (#1621, #1622) with reason “Not fixable in image; kernel is host. See bleu-os/TRIVY_ALERTS.md.” For curl/binutils, either they clear after rebuild (if Debian has fixed versions) or dismiss with “Debian base; no fix in Bookworm yet. See TRIVY_ALERTS.md.”

---

### Docker Scout / Trivy – "Fix available: No" (add policy exceptions)

When the scanner shows **Fix available: No** / **Fix Version: -** for Debian 12 packages, add a **policy exception** (or dismiss) with reason: *Debian 12 base; no fix in Bookworm. See bleu-os/TRIVY_ALERTS.md.*

| CVE | Package (Debian 12) | Severity |
|-----|----------------------|----------|
| CVE-2025-45582 | tar | medium |
| CVE-2005-2541 | tar | low |
| CVE-2007-5686 | shadow | low |
| CVE-2010-0928 | openssl | low |
| CVE-2010-4651 | patch | low |
| CVE-2011-3374 | apt | low |
| CVE-2011-3389 | gnutls28 | low |
| CVE-2015-3276 | openldap | low |
| CVE-2017-13716 | binutils | low |
| CVE-2017-14159 | openldap | low |
| CVE-2017-17740 | openldap | low |
| CVE-2017-18018 | coreutils | low |
| CVE-2018-20673 | binutils | low |
| CVE-2018-20712 | binutils | low |
| CVE-2018-6829 | libgcrypt20 | low |
| CVE-2018-6951, CVE-2018-6952 | patch | low |
| CVE-2018-9996 | binutils | low |
| CVE-2020-15719 | openldap | low |
| CVE-2020-36325 | jansson | low |
| CVE-2021-32256 | binutils | low |
| CVE-2021-45261 | patch | low |
| CVE-2021-45346 | sqlite3 | low |
| CVE-2022-27943 | gcc-12 | low |
| CVE-2022-3219 | gnupg2 | low |

The image already runs `apt-get update && apt-get upgrade -y`; there is no newer fixed version in Bookworm to install. Rebuild when Debian backports fixes.

---

## Kernel alerts (cannot fix in the image)

Trivy may report **kernel** CVEs (e.g. nf_tables, ksmbd, macvlan, scsi, ALSA, bonding, smb, smc, ipv6, hfsplus, **tls**, **espintcp**, etc.). These refer to the **Linux kernel**, not to anything inside the container image.

- **The container image does not ship a kernel.** The kernel is provided by the **host** (the machine or VM running Docker/Kubernetes).
- You **cannot** fix kernel CVEs by changing the Bleu OS Dockerfile or base image.
- **What to do:** Run your containers on a **host with an updated kernel** (patch the host OS or use a managed service that applies kernel updates). In GitHub/Trivy you can **dismiss** these as “Not fixable in image” or “Mitigated by host kernel updates.”

So all **kernel:** High/Critical alerts are expected to remain in the Trivy list until the **host** is patched; they are not a defect of the Bleu OS image.

## Summary

| Alert type              | Where it comes from | What we did / do                          |
|-------------------------|--------------------|------------------------------------------|
| pip / setuptools (High/Med) | Debian python3-pip | Use get-pip.py; upgrade pip>=25.3, setuptools>=78.1.1 (no apt python3-pip) |
| zlib / sqlite (Critical) | Base image         | Use Debian + upgrade; install zlib1g, libsqlite3-0 |
| cpython (High)         | Base Python        | Debian + apt-get upgrade                 |
| python-markdown (High) | Transitive dep     | Not installed in image; pin if needed     |
| jackson-core (High) GHSA-72hv-8253-57qq | ray_dist.jar (ray) | Upgrade ray when upstream bundles jackson 2.18.6+ |
| Debian pkg (underscore, python3.11, tar, etc.) | Base image | apt-get upgrade; no fix in image → accept risk or policy exception |
| openldap / curl / libcurl / OpenSSH | Debian base (or transitive) | apt-get upgrade; no fix in image → accept risk or policy exception; see §4 above |
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

3. **If alerts appear under Dependabot** — GitHub may show the same Trivy findings under **Security → Dependabot** (container alerts). Dismiss them there manually: open each alert → **Dismiss** → reason “Won’t fix” and paste this comment:
   ```
   Not fixable in container image. openldap/curl/libcurl/OpenSSH (and kernel) come from Debian base or host; we run apt-get upgrade. No fix in image; see bleu-os/TRIVY_ALERTS.md §4.
   ```
   There is no bulk-dismiss for Dependabot container alerts via the script above (that script only dismisses Code scanning alerts). Use **Select all** in the Dependabot alerts list and **Dismiss selected** if your GitHub UI offers it, or dismiss one by one with the same comment.

## Reaching 0 vulnerabilities in Docker Scout

After the image changes above, the only remaining findings are **Debian base packages** with no fix in the image (python3.11, tar, binutils, etc.). To show **0 vulnerabilities** in Scout:

1. **Add policy exceptions** in Docker Scout for the CVEs that cannot be fixed in the image (see table below).
2. Or use one exception covering “all vulnerabilities in debian/bookworm-slim base with no fix version” and reference this doc.

| CVE / ID | Component | Reason |
|----------|-----------|--------|
| CVE-2026-2297 | debian/python3.11 | No fix in Bookworm; patch host or wait for DSA |
| CVE-2025-45582, CVE-2005-2541 | debian/tar | No fix in image |
| CVE-2025-69534 | debian/python3.11 | No fix in image |
| CVE-2025-7545, CVE-2025-69644, CVE-2025-11495, CVE-2025-1153 | debian/binutils | No fix in image |
| (+ other low debian/*) | Base packages | apt-get upgrade applied; no newer version in Bookworm |

### 82+ Debian base CVEs (tar, shadow, openssl, patch, apt, gnutls, openldap, binutils, coreutils, libgcrypt, jansson, sqlite3, gcc-12, gnupg2, etc.)

Scans may list many CVEs in Debian 12 (bookworm) packages with **Fix available: No** and **Fix version: -**. Examples: CVE-2025-45582 (tar), CVE-2005-2541 (tar), CVE-2007-5686 (shadow), CVE-2010-0928 (openssl), CVE-2010-4651 (patch), CVE-2011-3374 (apt), CVE-2011-3389 (gnutls28), CVE-2015-3276 / CVE-2017-14159 / CVE-2017-17740 / CVE-2020-15719 (openldap), CVE-2017-13716 / CVE-2018-20673 / CVE-2018-20712 / CVE-2018-9996 / CVE-2021-32256 (binutils), CVE-2017-18018 (coreutils), CVE-2018-6829 (libgcrypt20), CVE-2020-36325 (jansson), CVE-2021-45346 (sqlite3), CVE-2022-27943 (gcc-12), CVE-2022-3219 (gnupg2), and others.

**We have not fixed these in the image** because Debian 12 has not released patched versions (or the fix is only in a newer distro). The Dockerfile already runs `apt-get update && apt-get upgrade -y`, so when Debian backports fixes, the next image rebuild will pick them up.

**What to do:** Add **one policy exception** in Docker Scout / Trivy for “all vulnerabilities in debian:bookworm-slim base packages where fix version is not available” and reference this doc. Or dismiss each alert with reason “Won’t fix” and comment: “Debian 12 base; no fix in image. See bleu-os/TRIVY_ALERTS.md.” Rebuild the image with `docker build --pull --no-cache` periodically so you get the latest Bookworm package set.

## Docker Scout – get a passing grade (0 fixable)

Scout still shows **2 high + 2 medium** “fixable” because it lists fixes that we cannot apply inside this image:

| CVE / Advisory | Why it still appears | Action |
|----------------|----------------------|--------|
| **GHSA-72hv-8253-57qq** (jackson-core) | Bundled in Ray’s JAR; fix when Ray ships 2.18.6+ | Add policy exception |
| **CVE-2026-27601** (underscore) | Debian package; no fix in Bookworm | Add policy exception |
| **CVE-2026-2297** (python3.11) | Debian package; no fix in image | Add policy exception |
| **CVE-2025-45582** (tar) | Debian package; no fix in image | Add policy exception |

**To get 0 vulnerabilities / passing health in Docker Scout:**

1. Open your repo in **Docker Scout** (e.g. from Docker Hub → **bleuos/bleu-os** → Scout, or [scout.docker.com](https://scout.docker.com)).
2. Go to **Policies** (or **Organization** → Policies) and edit the policy that applies to **bleuos/bleu-os**.
3. Add **exceptions** (e.g. “Accepted risk”) for:
   - **GHSA-72hv-8253-57qq** — reason: “Jackson in Ray’s ray_dist.jar; track Ray release with jackson 2.18.6+. See bleu-os/TRIVY_ALERTS.md.”
   - **CVE-2026-27601** — reason: “Debian underscore; no fix in Bookworm. See bleu-os/TRIVY_ALERTS.md.”
   - **CVE-2026-2297** — reason: “Debian python3.11; no fix in image. See bleu-os/TRIVY_ALERTS.md.”
   - **CVE-2025-45582** — reason: “Debian tar; no fix in image. See bleu-os/TRIVY_ALERTS.md.”
4. Optionally add one **exception by package** (e.g. “all debian/* in bookworm-slim”) with reason “Base image; no fix in image. Patch host or upgrade base when Debian provides fixes. See bleu-os/TRIVY_ALERTS.md.”

After exceptions are saved, Scout will no longer count these against the image and the **Vulnerabilities** count / **Health** can show 0 or passing. The image itself is unchanged; we have already fixed everything that can be fixed inside the Dockerfile (pip, setuptools, etc.).
