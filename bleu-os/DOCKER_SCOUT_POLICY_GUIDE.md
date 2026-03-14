# 🔧 Docker Scout Policy Configuration Guide

**Production images use Debian bookworm-slim.** See [TRIVY_ALERTS.md](TRIVY_ALERTS.md) for the full runbook (policy exception + dismiss script).

---

## Do this now (exact steps)

**The policy page has no "Add exception" button.** If you see a form like **"Edit Critical and high vulnerabilities with fixes"** (Display name, Description, Severities, Age, Fixable vulnerabilities only, Package types) — that’s **editing the policy rule**, not adding exceptions. Cancel or go back. Exceptions are created from the **image’s Vulnerabilities** view. Do this:

1. **Go to Images** — In Scout click **Images** (or **Reports** → **Images**). Or: Docker Hub → **bleuos/bleu-os** → Scout, then open the image.
2. **Select** **bleuos/bleu-os** and tag (e.g. **latest**).
3. **Open the Vulnerabilities tab** for that image.
4. **Create exception** — Find a vulnerability (CVE), expand the package if needed, click **"Create exception"** next to it. In the side panel:
   - **Exception type:** Accepted risk
   - **Scope:** All images in repository
   - **Package scope:** Any packages (to cover all packages for that CVE)
   - **Additional details:** `Debian 12 base; no fix in image. See bleu-os/TRIVY_ALERTS.md.`
   Click **Create**.
5. **Repeat** for other CVEs if needed (same scope and reason).
6. **Base image (optional):** Policies → **"No unapproved base images"** → add **debian:bookworm-slim** to the approved list and save.

---

Detailed version:

1. **Open Scout** (if not already there)
   - Go to **https://scout.docker.com** and sign in, or: **Docker Hub** → **bleuos/bleu-os** → **Scout**.

2. **Open Policies**
   - In the left sidebar (or top), click **Policies** (or **Organization** → **Policies**).
   - Find the policy that applies to **bleuos/bleu-os** (e.g. “No fixable critical or high vulnerabilities” or your org’s default).

3. **Add one broad exception**
   - Go to **Images** → select **bleuos/bleu-os:latest** → **Vulnerabilities** tab. Click **Create exception** next to a CVE (not on the policy page).
   - **Scope:** “All images in this repository” or “bleuos/bleu-os” (whatever option matches your image).
   - **Condition:** If there’s a “vulnerabilities where fix is not available” or “by package” option, use it; otherwise choose “Accepted risk” for the listed CVEs / findings.
   - **Reason** (copy-paste):
     ```
     Debian 12 base; no fix in image. See bleu-os/TRIVY_ALERTS.md.
     ```
   - Save.

4. **Optional: approve base image**
   - In Policies, open **“No unapproved base images”** (if you see violations).
   - Add **debian:bookworm-slim** (or **debian:***) to the approved base images list and save.

5. **Done**
   - Re-scan or refresh the **bleuos/bleu-os** image in Scout; the vulnerability count / health should update once exceptions are applied.

**If your UI looks different:** Docker’s UI changes. Fallback: in Scout go to the **image** → **Vulnerabilities** → open each CVE → use **“Add exception”** / **“Accept risk”** and paste the same reason above. See also: https://docs.docker.com/scout/how-tos/create-exceptions-gui/.

---

## Create and assign environments (Scout checklist step 2)

Create an environment with one image; assign more images by running the same command again for each image.

**Create `production` and assign both tags (run from your machine, Docker logged in):**

```bash
# Create production and assign latest (platform matches CI: linux/amd64)
docker scout environment --platform linux/amd64 production bleuos/bleu-os:latest

# Assign additional image to the same environment
docker scout environment --platform linux/amd64 production bleuos/bleu-os:minimal
```

**Optional – separate staging environment:**

```bash
docker scout environment --platform linux/amd64 staging bleuos/bleu-os:latest
```

- Run `docker scout environment <ENVIRONMENT> <IMAGE>` again for each extra image you want in that environment.
- After each new push, re-run with the same tag to keep the environment on the latest digest.

**View images in an environment**

- **Dashboard:** Scout → **Overview** → **Images** dropdown → choose the environment (e.g. production).
- **CLI:** List all images assigned to an environment:
  ```bash
  docker scout environment production
  ```

**Compare image versions**

Assigning images to environments lets you compare a local or dev image to what’s in production (supply chain / vulnerabilities).

```bash
# Compare a local or dev image to the production environment
docker scout compare --to-env production <IMAGE>
```

Example: compare your local build to production before pushing:

```bash
docker scout compare --to-env production bleuos/bleu-os:latest
# or a local tag, e.g. helloblueai/bleu-os:1
```

---

## Supply chain attestations (Scout “Not compliant”)

Scout requires **SBOM** and **provenance with mode=max**. The workflow now uses:

- `provenance: mode=max`
- `sbom: true`

for both GHCR and Docker Hub in `.github/workflows/docker-publish.yml`.

**What you do:** Trigger a new build and push from CI (push to `main` or run the workflow). The next image pushed to Docker Hub will include attestations and Scout will show **Supply chain attestations** as compliant after you refresh.

**Note:** Images pushed with plain `docker build` + `docker push` do **not** get attestations. Use either CI or the CLI command below.

**Rebuild and push from CLI (with attestations):**

```bash
# From repo root. Requires: docker login (Docker Hub). Attestations require --push (no --load).
docker buildx build \
  --pull --no-cache \
  -f bleu-os/Dockerfile.production \
  --provenance=mode=max \
  --sbom=true \
  --push \
  -t bleuos/bleu-os:latest \
  -t bleuos/bleu-os:1 \
  .
```

Then refresh the image in Scout; Supply chain attestations should show compliant.

---

## How to get to health score A

1. **Supply chain attestations → Compliant**
   Image must be built and pushed with `provenance=mode=max` and `sbom=true` (you did this via CLI). Once Scout shows the **new** digest (e.g. `b435daf64...`), this policy will flip to Compliant. Refresh Scout / wait for re-index.

2. **No unapproved base images → Compliant**
   **Policies** → click **"No unapproved base images"** → add **debian:bookworm-slim** (or `debian:*`) to the **approved base images** list → Save. That gives the policy data and clears the violation.

3. **No fixable critical or high vulnerabilities → Compliant**
   Already Compliant if you have no fixable critical/high. If Scout starts failing this due to Debian base CVEs: **Images** → **bleuos/bleu-os:latest** → **Vulnerabilities** → **Create exception** (Accepted risk, scope: All images in repository, reason: `Debian 12 base; no fix in image. See bleu-os/TRIVY_ALERTS.md`) for the reported CVEs.

4. **No data → turn into Compliant where possible**
   **No outdated base images** and **No unapproved base images** often show "No data" until the base image is approved. Step 2 fixes "No unapproved base images"; "No outdated base images" may then evaluate too (or after the next scan).

5. **Keep the rest Compliant**
   Default non-root user, No AGPL v3, No high-profile vulnerabilities are already good; don’t change the image in a way that would break these.

When all (or almost all) policies are Compliant and Scout is using the attestation-backed image, the overall health should reach **A**.

---

## Current Policy Status

### ✅ Compliant (5 policies):
- ✅ Default non-root user (0 violations)
- ✅ No AGPL v3 licenses (0 violations)
- ✅ No high-profile vulnerabilities (0 violations)
- ✅ No outdated base images (0 violations)
- ✅ Supply chain attestations — **CI uses `provenance: mode=max` and `sbom: true`**; next image pushed by CI will comply. Manual `docker build` + `docker push` does not attach attestations.

### ❌ Not Compliant (2 policies):
- ❌ No unapproved base images (1 violation) - **Approve Debian base**
- ❌ No fixable critical or high vulnerabilities (1 violation) - **Add policy exception** (no fix in image)

---

## How to Approve Base Image (Debian)

Published images (`latest`, `minimal`) are built from **Debian bookworm-slim**, not Alpine.

### Step 1: Access Policy Details
1. On the Policies page, **click on "No unapproved base images"**
2. Open the policy details page

### Step 2: Approve Base Image
- Add **`debian:bookworm-slim`** (or `debian:*`) to the approved base images list.
- If you still have an Alpine-based build in scope, you can approve `alpine:*` for that; the published `:latest` is Debian.

### Step 3: Environment Configuration
- In Docker Scout → **Environments**, configure base image approvals for `debian:bookworm-slim` if needed.

---

## How to Get Passing Grade (Unfixable Base CVEs)

Remaining vulnerabilities are **Debian 12 base packages with no fix version** (tar, shadow, openssl, openldap, binutils, etc.). We already run `apt-get upgrade`; there is nothing to “fix” in the Dockerfile.

### Step 1: Add Policy Exception (Recommended)
1. In Docker Scout, go to **Policies** (or Organization → Policies) for **bleuos/bleu-os**.
2. Add **one exception**: “All vulnerabilities in debian:bookworm-slim base packages where fix version is not available.”
   - **Reason:** *Debian 12 base; no fix in image. See bleu-os/TRIVY_ALERTS.md.*
3. Optionally add exceptions for specific CVEs (CVE-2025-45582, GHSA-72hv-8253-57qq, etc.) as listed in [TRIVY_ALERTS.md](TRIVY_ALERTS.md) under “Docker Scout – get a passing grade.”

### Step 2: Rebuild When Debian Publishes Fixes
- Rebuild with `docker build --pull --no-cache -f bleu-os/Dockerfile.production -t …` periodically so the image picks up backports.

---

## Quick Reference

### Policy Page Navigation:
```
Policies Page
  ↓
Click "No unapproved base images"
  ↓
View Violations / Configure
  ↓
Approve debian:bookworm-slim or debian:*
```

### If You Can't Find Approval Option:
1. Check if you have admin/owner permissions on the Docker Hub repository
2. Try the "Request a policy" link to see if there's a different way
3. Check Docker Scout documentation: https://docs.docker.com/scout/policies/

---

## Expected Results After Configuration

### After Approving Debian base:
- ✅ "No unapproved base images" → 0 violations
- Health score should improve

### After Adding Policy Exception (unfixable base CVEs):
- ✅ "No fixable critical or high vulnerabilities" → 0 violations (exceptions applied)
- Health score should reach **A** or **B**

---

## Troubleshooting

### Can't Find Approval Option?
- **Check Permissions:** You need admin/owner access to the Docker Hub repository
- **Try Different View:** Look for "Violations" tab or "Details" button
- **Check Documentation:** https://docs.docker.com/scout/policies/base-images/

### Policy Not Saving?
- Clear browser cache
- Try a different browser
- Check if you're on the correct repository/organization

---

**Last Updated:** 2026-03
**Status:** Guide for configuring Docker Scout policies (Debian base; policy exceptions for unfixable CVEs). See [TRIVY_ALERTS.md](TRIVY_ALERTS.md) for full runbook.
