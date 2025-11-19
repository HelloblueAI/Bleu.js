# Issue Labeling Guide

This guide helps maintainers and contributors understand and use issue labels effectively.

---

## 🏷️ Label Categories

### Priority Labels

**When to use:** Indicate how urgent an issue is.

- `priority: critical` - Security vulnerabilities, data loss, breaking changes
- `priority: high` - Major bugs affecting many users, important features
- `priority: medium` - Normal bugs, standard features
- `priority: low` - Nice-to-have features, minor improvements

**Usage:**
- Use `priority: critical` sparingly (security issues only)
- Most issues should be `priority: medium`
- `priority: low` for enhancements that can wait

---

### Type Labels

**When to use:** Categorize the type of issue.

- `type: bug` - Something is broken
- `type: feature` - New functionality request
- `type: documentation` - Docs need improvement
- `type: question` - Asking for help/information
- `type: enhancement` - Improve existing feature
- `type: performance` - Performance improvements
- `type: security` - Security concerns

**Usage:**
- Every issue should have at least one type label
- Use `type: question` for help requests (not bugs)

---

### Difficulty Labels

**When to use:** Help contributors find appropriate work.

- `good first issue` - Perfect for first-time contributors
  - Small, well-defined tasks
  - Clear requirements
  - Good documentation exists
  
- `help wanted` - Community help needed
  - Open to anyone
  - Not necessarily easy
  
- `beginner-friendly` - Easy to get started
  - Similar to "good first issue"
  - May require some setup
  
- `intermediate` - Requires some experience
  - Need to understand codebase
  - May require domain knowledge
  
- `advanced` - Complex tasks
  - Requires deep understanding
  - May need architecture changes

**Usage:**
- Label at least 5-10 issues as `good first issue`
- Update labels as issues are worked on
- Remove `good first issue` when someone starts working

---

### Status Labels

**When to use:** Track issue progress.

- `status: needs-triage` - Needs review/prioritization
- `status: in-progress` - Someone is working on it
- `status: blocked` - Blocked by another issue
- `status: needs-review` - PR needs review
- `status: on-hold` - Temporarily paused
- `status: duplicate` - Duplicate of another issue
- `status: invalid` - Not a valid issue
- `status: wontfix` - Won't be fixed (with reason)

**Usage:**
- Add `status: in-progress` when someone comments they're working on it
- Use `status: blocked` when waiting on something
- Close issues with `status: duplicate` or `status: invalid`

---

### Component Labels (Optional)

**When to use:** Organize by project area.

- `component: core` - Core functionality
- `component: quantum` - Quantum features
- `component: ml` - Machine learning
- `component: api` - API client
- `component: docs` - Documentation
- `component: tests` - Testing
- `component: ci/cd` - CI/CD pipeline

---

## 📋 Labeling Workflow

### For New Issues

1. **Read the issue** - Understand what it's about
2. **Add type label** - Bug, feature, question, etc.
3. **Add priority label** - Critical, high, medium, low
4. **Add difficulty label** - If appropriate (good first issue, etc.)
5. **Add component label** - If applicable
6. **Add status label** - Usually `status: needs-triage` initially

### For Existing Issues

1. **Weekly triage** - Review all open issues
2. **Update labels** - Ensure they're accurate
3. **Close stale issues** - If no longer relevant
4. **Mark good first issues** - For new contributors

---

## 🎯 Best Practices

### Do's ✅

- **Label consistently** - Use same labels for similar issues
- **Use multiple labels** - Issues can have multiple labels
- **Update labels** - As issues evolve
- **Be descriptive** - Labels should be clear

### Don'ts ❌

- **Don't over-label** - 3-5 labels per issue is usually enough
- **Don't use conflicting labels** - e.g., both `priority: high` and `priority: low`
- **Don't forget to update** - Remove `good first issue` when work starts
- **Don't create new labels** - Use existing ones unless necessary

---

## 🔍 Finding Issues

### For Contributors

**First-time contributors:**
```
is:open label:"good first issue"
```

**Help wanted:**
```
is:open label:"help wanted"
```

**By type:**
```
is:open label:"type:bug"
is:open label:"type:documentation"
```

**By component:**
```
is:open label:"component:quantum"
```

### For Maintainers

**Needs triage:**
```
is:open label:"status:needs-triage"
```

**In progress:**
```
is:open label:"status:in-progress"
```

**High priority:**
```
is:open label:"priority:high"
```

---

## 📊 Label Statistics

Track these metrics:
- Number of `good first issue` labels (aim for 5-10)
- Issues with `status: needs-triage` (keep low)
- Issues by type (balance across types)
- Issues by priority (most should be medium)

---

## 🚀 Quick Actions

### Create Good First Issues

1. Look for small, well-defined tasks
2. Ensure documentation exists
3. Add `good first issue` label
4. Add clear description
5. Link to relevant docs

### Triage Issues

1. Review new issues daily
2. Add appropriate labels
3. Respond to questions
4. Close invalid/duplicate issues
5. Assign if needed

---

## 📚 Resources

- [GitHub Label Best Practices](https://github.com/github/docs/blob/main/contributing/labels.md)
- [Contributing Guide](../docs/CONTRIBUTING.md)
- [Contributor Guide](../docs/CONTRIBUTOR_GUIDE.md)

---

**Questions?** Open a Discussion or ask a maintainer!

---

**Last Updated:** 2025-01-XX

