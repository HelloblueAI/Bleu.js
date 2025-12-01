# 📤 Upload Files to helloblueai Repository

Since your token doesn't have direct write access to the organization repository, here are your options:

## Option 1: Use Hugging Face CLI (Recommended)

### Step 1: Install CLI (if not installed)
```bash
curl -LsSf https://hf.co/cli/install.sh | bash
```

### Step 2: Login
```bash
hf auth login
# Enter your token when prompted: hf_YOUR_TOKEN_HERE
```

### Step 3: Upload Files
```bash
cd /home/pejmanhaghighatnia/Documents/Bleu.js

hf upload helloblueai/bleu-xgboost-classifier \
    backend/models/xgboost_model_latest.pkl \
    backend/models/scaler_latest.pkl \
    backend/README_HF.md
```

**OR** use the script I created:
```bash
./upload_to_hf_org.sh
```

## Option 2: Web Interface (Easiest)

1. Go to: **https://huggingface.co/helloblueai/bleu-xgboost-classifier**
2. Click **"Add file"** → **"Upload files"**
3. Drag and drop these files:
   - `backend/models/xgboost_model_latest.pkl`
   - `backend/models/scaler_latest.pkl`
   - `backend/README_HF.md` (rename to `README.md` in the upload)
4. Add commit message: "Initial model upload"
5. Click **"Commit changes"**

## Option 3: Git (If you have write access)

```bash
cd /home/pejmanhaghighatnia/Documents/Bleu.js

# Clone the repository
git clone https://huggingface.co/helloblueai/bleu-xgboost-classifier
cd bleu-xgboost-classifier

# Copy files
cp ../backend/models/xgboost_model_latest.pkl .
cp ../backend/models/scaler_latest.pkl .
cp ../backend/README_HF.md README.md

# Commit and push
git add .
git commit -m "Initial model upload"
git push
```

## Option 4: Request Write Access

If you need to upload programmatically:
1. Contact the `helloblueai` organization admin
2. Request write access to the repository
3. Or have them add your token with write permissions

## 🎯 Recommended: Use Web Interface

The **web interface (Option 2)** is the easiest and doesn't require special permissions!

Just drag and drop the files:
- `backend/models/xgboost_model_latest.pkl`
- `backend/models/scaler_latest.pkl`
- `backend/README_HF.md` (as README.md)

## 📋 Files to Upload

- ✅ `backend/models/xgboost_model_latest.pkl` (341KB)
- ✅ `backend/models/scaler_latest.pkl` (855B)
- ✅ `backend/README_HF.md` → Upload as `README.md`
