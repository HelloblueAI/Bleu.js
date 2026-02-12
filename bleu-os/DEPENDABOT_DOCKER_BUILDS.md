# Dependabot PRs and Docker builds

When a **Dependabot** PR (e.g. bump boto3, setuptools) triggers CI, the **build-and-push (minimal)** job uses `bleu-os/Dockerfile.minimal` from that PR branch. If the branch is **behind main**, it may still contain an older Dockerfile that fails in CI.

## Typical failure

- **Error:** `pip3 install ... -e /opt/bleu-js` did not complete successfully (exit code 1)
- **Cause:** The PR branch has an old `Dockerfile.minimal` that installs Bleu.js via `pip install -e /opt/bleu-js`. On **main**, the minimal image installs **bleu-js from PyPI** and no longer uses `/opt/bleu-js`, so the branch’s Dockerfile is outdated.

## Fix: Update the Dependabot branch with main

From your repo (with `origin` = GitHub):

```bash
# Fetch latest
git fetch origin

# Checkout the Dependabot branch (use the branch name from the PR, e.g. dependabot/pip/boto3-1.42.44)
git checkout dependabot/pip/boto3-1.42.44

# Rebase onto main so the branch gets the current Dockerfile.minimal (and other main changes)
git rebase origin/main

# If there are conflicts (e.g. in pyproject.toml or lockfiles), resolve them and:
#   git add <resolved-files>
#   git rebase --continue

# Push the updated branch (force, because history changed)
git push --force-with-lease origin dependabot/pip/boto3-1.42.44
```

After pushing, re-run the CI for that PR. The minimal build should use the current Dockerfile and pass.

## Alternative: Merge main into the PR branch

If you prefer merging instead of rebasing:

```bash
git fetch origin
git checkout dependabot/pip/boto3-1.42.44
git merge origin/main
# Resolve conflicts if any, then:
git push origin dependabot/pip/boto3-1.42.44
```

Then re-run the failing job in the PR.
