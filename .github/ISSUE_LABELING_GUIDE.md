# Issue Labeling Guide

This guide helps maintainers and contributors understand and use issue labels effectively.

The names below are the labels that exist on this repository. The bug report template applies `bug`, the feature request template applies `enhancement`, and the question template applies `question`. There is no separate type, priority, or component label set.

---

## 🏷️ Labels

### Finding contributor work

**When to use:** Help people discover issues they can pick up. The contributor guide links here for starter work.

- `good first issue` - Perfect for first-time contributors: small, well-defined, and already documented
- `help wanted` - Community help needed; open to anyone, and not necessarily easy
- `documentation` - Improvements or additions to documentation
- `testing` - Adding or improving tests
- `research/eval` - Evaluation, benchmarks, and reproducibility

**Usage:**
- Label at least 5-10 issues as `good first issue`
- Add `help wanted` when the task is real work and anyone can take it
- Use `documentation`, `testing`, or `research/eval` so contributors can filter by kind of work
- Remove `good first issue` when someone starts working

---

### Issue kind

**When to use:** Match the bug report, feature request, and question templates.

- `bug` - Something isn't working (bug report template)
- `enhancement` - New feature or request (feature request template)
- `question` - Further information is requested (question template)

**Usage:**
- Every templated issue should keep the label that template already sets
- Use `question` for help requests, not `bug`

---

### Triage and resolution

**When to use:** Track review, and record why an issue is closed.

- `status: needs-triage` - Needs review and prioritization
- `duplicate` - This issue or pull request already exists
- `invalid` - This doesn't seem right
- `wontfix` - This will not be worked on (leave the reason in a comment)

**Usage:**
- New issues start at `status: needs-triage` until a maintainer has read them
- Close copies with `duplicate` and unclear reports with `invalid`
- Use `wontfix` when the project will not do the work

---

## 📋 Labeling Workflow

### For New Issues

1. **Read the issue** - Understand what it's about
2. **Keep the template label** - `bug`, `enhancement`, or `question`
3. **Add a work label** - `documentation`, `testing`, or `research/eval` when it fits
4. **Add a contributor label** - `good first issue` or `help wanted`, if appropriate
5. **Add status** - `status: needs-triage` until the issue has been reviewed

### For Existing Issues

1. **Weekly triage** - Review all open issues
2. **Update labels** - Ensure they're accurate
3. **Close stale issues** - If no longer relevant
4. **Mark good first issues** - For new contributors
5. **Clear triage** - Remove `status: needs-triage` once the issue is understood

---

## 🎯 Best Practices

### Do's ✅

- **Label consistently** - Use the same labels for similar issues
- **Use multiple labels** - Issues can have multiple labels
- **Update labels** - As issues evolve
- **Be descriptive** - Labels should be clear

### Don'ts ❌

- **Don't over-label** - 3-5 labels per issue is usually enough
- **Don't use conflicting labels** - e.g. both `help wanted` and `wontfix`
- **Don't forget to update** - Remove `good first issue` when work starts
- **Don't create new labels** - Use the ones listed in this guide

---

## 🔍 Finding Issues

### For Contributors

**First-time contributors:**

    is:open label:"good first issue"

**Help wanted:**

    is:open label:"help wanted"

**Docs, tests, and eval:**

    is:open label:"documentation"
    is:open label:"testing"
    is:open label:"research/eval"

**By template kind:**

    is:open label:"bug"
    is:open label:"enhancement"
    is:open label:"question"

### For Maintainers

**Needs triage:**

    is:open label:"status: needs-triage"

**Duplicates, invalid reports, and wontfix:**

    is:open label:"duplicate"
    is:open label:"invalid"
    is:open label:"wontfix"

---

## 📊 Label Statistics

Track these metrics:
- Number of `good first issue` labels (aim for 5-10)
- Issues with `status: needs-triage` (keep low)
- Open `help wanted` issues, including `documentation`, `testing`, and `research/eval`

---

## 🚀 Quick Actions

### Create Good First Issues

1. Look for small, well-defined tasks
2. Ensure documentation exists
3. Add `good first issue` label
4. Add `documentation`, `testing`, or `research/eval` when that is the work
5. Add a clear description and link to the relevant docs

### Triage Issues

1. Review new issues daily
2. Add labels from this guide
3. Respond to `question` issues
4. Close `invalid` and `duplicate` issues
5. Mark `wontfix` when the work will not be done, and leave a reason

---

## Example label combinations

- Newcomer bug: `bug` `good first issue` `status: needs-triage`
- Documentation task: `documentation` `good first issue`
- Tests that need a contributor: `testing` `help wanted`
- Eval or benchmark work: `research/eval` `help wanted`
- Feature request: `enhancement` `help wanted`
- Question from the template: `question` `status: needs-triage`
- Already reported: `bug` `duplicate`

---

## 📚 Resources

- [GitHub Label Best Practices](https://github.com/github/docs/blob/main/contributing/labels.md)
- [Contributing Guide](../docs/CONTRIBUTING.md)
- [Contributor Guide](../docs/CONTRIBUTOR_GUIDE.md)

---

**Questions?** Open a Discussion or ask a maintainer!

---

**Last Updated:** 2026-11-05
