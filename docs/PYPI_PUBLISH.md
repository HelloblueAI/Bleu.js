# Why PyPI might show an old version (e.g. 1.3.29)

The **fixes and latest version are on GitHub** (main branch and release tags). **PyPI** is updated only when the **Release Management** workflow runs and the **"Publish to PyPI"** step succeeds.

## Why the release workflow wasn’t running (fixed)

**Release Management** (`.github/workflows/release.yml`) is triggered by **tag** push (`v*`). The **Automatic Version Bump & Release** workflow pushes that tag using the default `GITHUB_TOKEN`. **GitHub does not trigger other workflows when a tag is pushed with `GITHUB_TOKEN`** (to avoid recursive runs), so Release Management never ran and PyPI was never updated.

**Fix:** Release Management now also runs on **workflow_run** when “🚀 Automatic Version Bump & Release” completes successfully. It checks out the commit that was just version-bumped and builds/publishes from that. No PAT is required.

## How PyPI gets updated

1. **Trigger:** Pushing a version tag (e.g. `v1.4.16`) or running the release workflow manually (Actions → "Release Management" → Run workflow).
2. **Workflow:** [.github/workflows/release.yml](../.github/workflows/release.yml) builds the package and runs tests.
3. **Publish step:** The job **"Publish to PyPI"** runs `twine upload` using the secret **`PYPI_API_TOKEN`**.

If PyPI still shows an old version (e.g. 1.3.29) even though **`PYPI_API_TOKEN` is set**:

- **Check the workflow run:** Actions → "Release Management" → open the run for the tag you expect (e.g. v1.4.17). Look at the **"Publish to PyPI"** job. If it failed, the step log will show the twine error (e.g. 403 Forbidden, token scope, or "File already exists").
- **Earlier job failure:** If **validate**, **build**, or **test-packages** failed, the publish job might not have run or might have failed when downloading artifacts. Fix the failing job and re-run or push a new tag.
- **Test PyPI:** The workflow also uploads to Test PyPI. If `TEST_PYPI_API_TOKEN` was missing, that step used to fail the whole job. The Test PyPI step now uses `continue-on-error: true`, so a missing or invalid Test PyPI token no longer blocks publishing to production PyPI.

## What to do

1. **Add or fix the PyPI token**
   - GitHub: **Settings → Secrets and variables → Actions** → **Secrets** (not Variables).
   - Ensure there is a secret named **`PYPI_API_TOKEN`**.
   - Create a token at [pypi.org](https://pypi.org) → Account → API tokens (scope: entire account or just this project).

2. **Trigger the release workflow again**
   - **Option A:** Push a new version tag (e.g. bump to 1.4.18, tag `v1.4.18`, push `git push origin v1.4.18`). The workflow will run and, if the token is set, upload to PyPI.
   - **Option B:** In GitHub **Actions → Release Management**, open a successful run that built the version you want, then **Re-run all jobs**. If the earlier run failed at "Publish to PyPI", fix the token first.

3. **Tell users**
   - Until PyPI is updated, users can install the latest from GitHub:
     ```bash
     pip install 'bleu-js @ git+https://github.com/HelloblueAI/Bleu.js@main'
     ```
   - Or from a specific tag:
     ```bash
     pip install 'bleu-js @ git+https://github.com/HelloblueAI/Bleu.js@v1.4.16'
     ```

## Quick reference

| Item        | Where |
|------------|--------|
| Workflow   | [.github/workflows/release.yml](../.github/workflows/release.yml) |
| PyPI job   | `publish-pypi` (uses `secrets.PYPI_API_TOKEN`) |
| Token setup | [PyPI API tokens](https://pypi.org/manage/account/token/) |
