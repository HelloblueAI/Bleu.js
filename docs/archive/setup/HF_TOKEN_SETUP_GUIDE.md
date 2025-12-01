# 🔑 Hugging Face Token Setup Guide

## Step-by-Step Token Creation

### 1. Token Name
```
bleu-js-model-upload
```
*(Or any name you prefer - this is just a label for you)*

### 2. Token Type
✅ **Fine-grained** (recommended - more secure)

### 3. User Permissions (pejmantheory)

**Repositories:**
- ✅ **Write access to contents/settings of all repos under your personal namespace**
  - *This allows you to test uploads to your personal repos if needed*

**Everything else can be left unchecked** for basic model uploads.

### 4. Org Permissions (helloblueai)

**Select the `helloblueai` organization** from the dropdown, then enable:

**Repositories:**
- ✅ **Write access to contents/settings of all repos in selected organizations**
  - *This is REQUIRED to upload models to helloblueai/*

**Everything else can be left unchecked** unless you need:
- **Inference** (if you want to deploy models)
- **Org settings** (if you need to manage org settings)

### 5. Repositories Permissions (Optional)
Leave this empty unless you want to restrict to specific repos.

---

## ✅ Quick Checklist

**Required for model upload:**
- [x] Token name: `bleu-js-model-upload`
- [x] Token type: Fine-grained
- [x] User → Repositories → Write access to personal namespace
- [x] Org → helloblueai → Repositories → Write access

**Optional (can skip):**
- [ ] Inference permissions
- [ ] Webhooks
- [ ] Collections
- [ ] Discussions & Posts
- [ ] Billing
- [ ] Jobs

---

## 🎯 Minimal Setup (Just What You Need)

If you want the absolute minimum:

1. **Token name**: `bleu-js-model-upload`
2. **Token type**: Fine-grained
3. **User permissions**:
   - ✅ Write access to contents/settings of all repos under your personal namespace
4. **Org permissions** (helloblueai):
   - ✅ Write access to contents/settings of all repos in selected organizations

That's it! Everything else can be left unchecked.

---

## 🚀 After Creating the Token

1. Copy the token (starts with `hf_`)
2. Use it in your terminal:

```bash
export HF_TOKEN="hf_your_token_here"
python3 scripts/setup_hf_model_auto.py
```

---

## ⚠️ Important Notes

- **Token type cannot be changed after creation** - Fine-grained is recommended
- **Write access is required** to upload files
- Make sure you select the **helloblueai** organization
- The token will be shown only once - save it securely!
