# Why PyPI might show an old version

The version on `main` is not what PyPI shows. **PyPI** is updated only when the **Release Management** workflow runs and the **"Publish to PyPI"** step succeeds.

## How a release starts

**Release Management** (`.github/workflows/release.yml`) runs when a maintainer pushes a version tag (`v*`), such as `v1.5.178`. A merge to `main` does not publish. The version-bump workflow is manual and does not run after an ordinary push.

A tag pushed with `GITHUB_TOKEN` does not start other workflows. Release Management is started by a person's tag push, or by the version-bump workflow calling `gh workflow run` after it creates a new tag. It does not run from `workflow_run`.

The published version must match `pyproject.toml`. An existing PyPI file or GitHub release is not replaced. Version `1.5.177` is refused.

## How PyPI gets updated

1. **Trigger:** Push a new version tag. For a version already written into `pyproject.toml`, tag that commit and push the tag. Do not run the version-bump workflow for a version that is already committed; a patch bump would propose the next number.
2. **Workflow:** [.github/workflows/release.yml](../.github/workflows/release.yml) checks out that tag, builds one wheel and one sdist, and compares SHA-256 hashes after upload.
3. **Publish step:** The job **"Publish to PyPI"** runs `twine upload` using the secret **`PYPI_API_TOKEN`**.

If PyPI still shows an old version (e.g. 1.3.29) even though **`PYPI_API_TOKEN` is set**:

- **Check the workflow run:** Actions → "Release Management" → open the run for the tag you expect. Look at the **"Publish to PyPI"** job. If it failed, the step log will show the twine error (for example 403 Forbidden or a token scope error).
- **Earlier job failure:** If **validate** or **build** failed, the publish job does not upload. Fix that job and push a new tag for a version that is not already on PyPI.
- **Already published:** Re-running the workflow for an existing version is refused. It does not replace the PyPI files or the GitHub release.

## What to do

1. **Add or fix the PyPI token**
   - GitHub: **Settings → Secrets and variables → Actions** → **Secrets** (not Variables).
   - Ensure there is a secret named **`PYPI_API_TOKEN`**.
   - Create a token at [pypi.org](https://pypi.org) → Account → API tokens (scope: entire account or just this project).

2. **Publish a new version**
   - Set the version in `pyproject.toml` and the matching `__version__` files, add a changelog entry, and merge that commit.
   - Tag that exact commit and push the tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"` then `git push origin vX.Y.Z`.
   - The current published package is `1.5.178`. The next release needs a higher version.

3. **Tell users**
   - The published install is `pip install -U "bleu-js>=1.5.178"`.
   - A not-yet-published commit can be installed from GitHub:
     ```bash
     pip install 'bleu-js @ git+https://github.com/HelloblueAI/Bleu.js@vX.Y.Z'
     ```

## Quick reference

| Item        | Where |
|------------|--------|
| Workflow   | [.github/workflows/release.yml](../.github/workflows/release.yml) |
| PyPI job   | `publish-pypi` (uses `secrets.PYPI_API_TOKEN`) |
| Token setup | [PyPI API tokens](https://pypi.org/manage/account/token/) |
