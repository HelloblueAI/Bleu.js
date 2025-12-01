# 📝 Manual Repository Creation Guide

Since we don't have API permissions for the `helloblueai` organization, let's create it manually.

## Step-by-Step Instructions

### Step 1: Go to Create Repository Page
1. Open: **https://huggingface.co/new**
2. Select **"Model"** as the repository type

### Step 2: Fill Out the Form

**Owner:**
- Select: `helloblueai` (from the dropdown)

**Model name:**
- Enter: `bleu-xgboost-classifier`
- (Or any name you prefer)

**License:**
- Select: `mit` (MIT License)
- Or choose another appropriate license

**Visibility:**
- Select: **Public** ✅
  - Anyone on the internet can see this model
  - Only you (personal model) or members of your organization (organization model) can commit

**OR**

- Select: **Private** 🔒
  - Only you (personal model) or members of your organization (organization model) can see and commit to this model

### Step 3: Create Repository
- Click **"Create repository"** button

### Step 4: Upload Files (After Creation)

Once the repository is created, you can upload files using:

#### Option A: Web Interface
1. Go to your new repository
2. Click **"Add file"** → **"Upload files"**
3. Drag and drop:
   - `backend/models/xgboost_model_latest.pkl`
   - `backend/models/scaler_latest.pkl`
   - `backend/README_HF.md` (as README.md)
4. Add commit message
5. Click **"Commit changes"**

#### Option B: Our Script (After Manual Creation)
```bash
# After you manually create the repo, we can upload files:
python3 scripts/setup_hf_model_auto.py \
  --organization helloblueai \
  --model-name bleu-xgboost-classifier \
  --skip-create  # Skip creation, just upload
```

## ⚠️ Important Notes

### If You Don't See `helloblueai` in Owner Dropdown:
- You may not be a member of the organization
- Contact the organization admin to:
  1. Add you as a member
  2. Grant you write permissions
  3. Or have them create the repository and grant you access

### Alternative: Use Personal Namespace
If you can't access `helloblueai`, you can:
1. Create under `pejmantheory` (your personal namespace)
2. Transfer it later when you get organization access
3. Or have an admin create it and grant you access

## 🚀 Quick Command After Manual Creation

Once the repository exists (manually created), run:

```bash
python3 scripts/setup_hf_model_auto.py \
  --organization helloblueai \
  --model-name bleu-xgboost-classifier \
  --skip-create
```

This will upload all your model files automatically!

## 📋 Recommended Settings

- **Owner**: `helloblueai`
- **Model name**: `bleu-xgboost-classifier`
- **License**: `mit`
- **Visibility**: `Public` (recommended for open source)

## ✅ After Creation

Your repository will be at:
**https://huggingface.co/helloblueai/bleu-xgboost-classifier**

Then we can upload files using the script!
