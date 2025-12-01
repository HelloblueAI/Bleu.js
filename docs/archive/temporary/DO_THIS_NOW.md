# 🚀 Quick Setup: Create Your Hugging Face Model Repository

## Step 1: Get Your Token (30 seconds)

1. Go to: **https://huggingface.co/settings/tokens**
2. Click **"New token"**
3. Name it: `bleu-js-upload`
4. Select **"Write"** permissions
5. Click **"Generate token"**
6. **Copy the token** (starts with `hf_...`)

## Step 2: Run the Setup (1 minute)

```bash
# Set your token
export HF_TOKEN="paste_your_token_here"

# Run the automated setup
python3 scripts/setup_hf_model_auto.py
```

That's it! The script will:
- ✅ Create the repository: `helloblueai/bleu-xgboost-classifier`
- ✅ Upload all model files
- ✅ Upload the model card
- ✅ Make it public (or use `--private` for private)

## Alternative: One-Line Command

```bash
HF_TOKEN="your_token_here" python3 scripts/setup_hf_model_auto.py
```

## What Gets Created

- **Repository**: https://huggingface.co/helloblueai/bleu-xgboost-classifier
- **Files uploaded**:
  - `xgboost_model_latest.pkl`
  - `scaler_latest.pkl`
  - `README.md` (model card)

## Customization Options

```bash
# Use a different model name
python3 scripts/setup_hf_model_auto.py --model-name "my-custom-model"

# Make it private
python3 scripts/setup_hf_model_auto.py --private

# Skip creation (if repo already exists)
python3 scripts/setup_hf_model_auto.py --skip-create
```

## Need Help?

See `docs/HUGGINGFACE_SETUP.md` for detailed instructions.
