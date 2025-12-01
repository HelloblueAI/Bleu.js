# Hugging Face Model Repository Setup

This guide will help you create a model repository on Hugging Face under the `helloblueai` organization.

## 📋 What You Need

1. **Hugging Face Account**: Sign up at https://huggingface.co
2. **Access Token**: Get one at https://huggingface.co/settings/tokens
3. **Python Package**: Install `huggingface-hub`

```bash
pip install huggingface-hub
```

## 🚀 Quick Start

### Method 1: Using the Script (Easiest)

```bash
# 1. Set your token
export HF_TOKEN="your_huggingface_token_here"

# 2. Create repository
python scripts/create_hf_model.py \
    --model-name "your-model-name" \
    --organization "helloblueai" \
    --private  # Remove this for public repository

# 3. Upload model files
python scripts/create_hf_model.py \
    --model-name "your-model-name" \
    --model-files backend/xgboost_model.pkl backend/scaler.pkl \
    --readme scripts/hf_model_card_template.md \
    --skip-create
```

### Method 2: Using Web Interface

1. **Create Repository**:
   - Go to: https://huggingface.co/new
   - Select **Model** as repository type
   - Owner: `helloblueai`
   - Model name: Choose a name (e.g., `bleu-xgboost-model`)
   - Visibility: **Public** or **Private**
   - License: Select appropriate license (e.g., MIT)
   - Click **Create repository**

2. **Upload Files**:
   - Navigate to your repository
   - Click **Add file** → **Upload files**
   - Drag and drop your model files
   - Add commit message and click **Commit changes**

## 📝 Files Created

I've created the following files to help you:

1. **`scripts/create_hf_model.py`** - Python script to automate repository creation and file uploads
2. **`scripts/hf_model_card_template.md`** - Template for your model card (README.md)
3. **`docs/HUGGINGFACE_SETUP.md`** - Comprehensive setup guide
4. **`scripts/QUICK_START_HF.md`** - Quick reference guide

## 📖 Detailed Instructions

See `docs/HUGGINGFACE_SETUP.md` for:
- Complete workflow examples
- Manual setup instructions
- Git-based upload methods
- Model card best practices
- Troubleshooting guide

## 🎯 Example: Complete Workflow

```bash
# Step 1: Install dependencies
pip install huggingface-hub

# Step 2: Set your token
export HF_TOKEN="hf_xxxxxxxxxxxxx"

# Step 3: Create repository
python scripts/create_hf_model.py \
    --model-name "bleu-xgboost-classifier" \
    --organization "helloblueai"

# Step 4: Prepare model card
cp scripts/hf_model_card_template.md README.md
# Edit README.md with your model details

# Step 5: Upload everything
python scripts/create_hf_model.py \
    --model-name "bleu-xgboost-classifier" \
    --model-files \
        backend/xgboost_model.pkl \
        backend/models/xgboost_model_latest.pkl \
        backend/scaler.pkl \
    --readme README.md \
    --skip-create

# Step 6: View your model
# Visit: https://huggingface.co/helloblueai/bleu-xgboost-classifier
```

## 📚 Next Steps

1. **Customize Model Card**: Edit the template with your model's specific details
2. **Add Documentation**: Include usage examples, performance metrics, and limitations
3. **Version Control**: Use Git tags to version your models
4. **Share**: Make your model discoverable with proper tags and descriptions

## 🔗 Resources

- [Hugging Face Hub Docs](https://huggingface.co/docs/hub)
- [Model Cards Guide](https://huggingface.co/docs/hub/model-cards)
- [Python API Reference](https://huggingface.co/docs/huggingface_hub)

## ❓ Need Help?

- Check `docs/HUGGINGFACE_SETUP.md` for detailed instructions
- See `scripts/QUICK_START_HF.md` for quick reference
- Contact: support@helloblue.ai
