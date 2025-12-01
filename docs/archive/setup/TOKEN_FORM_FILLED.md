# 📝 Hugging Face Token Form - Pre-filled Guide

Here's exactly what to fill in:

## Form Fields

### Token Name
```
bleu-js-model-upload
```

### Token Type
**Select:** ✅ **Fine-grained**

---

## User Permissions (pejmantheory)

### Repositories
- ✅ **Write access to contents/settings of all repos under your personal namespace**
- ❌ Read access to contents of all repos under your personal namespace (optional)
- ❌ Read access to contents of all public gated repos (optional)

### Everything Else
- ❌ Inference (leave unchecked)
- ❌ Webhooks (leave unchecked)
- ❌ Collections (leave unchecked)
- ❌ Discussions & Posts (leave unchecked)
- ❌ Billing (leave unchecked)
- ❌ Jobs (leave unchecked)

---

## Org Permissions

### Select Organization
**Choose:** `helloblueai` from the dropdown

### Repositories
- ✅ **Write access to contents/settings of all repos in selected organizations**
- ❌ Read access (optional, but write includes read)

### Everything Else
- ❌ Inference (leave unchecked unless needed)
- ❌ Org settings (leave unchecked unless you're an admin)
- ❌ Collections (leave unchecked)
- ❌ Resource Groups (leave unchecked)
- ❌ Jobs (leave unchecked)

---

## Repositories Permissions (Override Section)
**Leave empty** - This is for specific repo overrides, not needed.

---

## Summary

**Minimum Required:**
1. Token name: `bleu-js-model-upload`
2. Token type: Fine-grained
3. User → Repositories → ✅ Write access
4. Org (helloblueai) → Repositories → ✅ Write access

**That's all you need!** Click "Generate token" and copy it.
