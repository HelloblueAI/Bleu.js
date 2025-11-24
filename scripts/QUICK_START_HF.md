# Quick Start: Create Hugging Face Model Repository

## Prerequisites

1. Get your Hugging Face token: https://huggingface.co/settings/tokens
2. Install dependencies: `pip install huggingface-hub`

## Step 1: Set Your Token

```bash
export HF_TOKEN="your_token_here"
```

## Step 2: Create Repository

### Option A: Using the Script (Recommended)

```bash
python scripts/create_hf_model.py \
    --model-name "your-model-name" \
    --organization "helloblueai" \
    --private  # Remove for public
```

### Option B: Using Web Interface

1. Go to: https://huggingface.co/new
2. Select **Model**
3. Owner: `helloblueai`
4. Model name: `your-model-name`
5. Choose Public/Private
6. Click **Create repository**

## Step 3: Upload Model Files

```bash
python scripts/create_hf_model.py \
    --model-name "your-model-name" \
    --model-files path/to/model.pkl path/to/scaler.pkl \
    --readme scripts/hf_model_card_template.md \
    --skip-create  # If repo already exists
```

## Step 4: Edit Model Card

1. Copy template: `cp scripts/hf_model_card_template.md README.md`
2. Edit `README.md` with your model details
3. Upload: `python scripts/create_hf_model.py --model-name "your-model-name" --readme README.md --skip-create`

## Complete Example

```bash
# 1. Set token
export HF_TOKEN="hf_xxxxxxxxxxxxx"

# 2. Create repository
python scripts/create_hf_model.py \
    --model-name "bleu-xgboost-classifier" \
    --organization "helloblueai"

# 3. Upload files
python scripts/create_hf_model.py \
    --model-name "bleu-xgboost-classifier" \
    --model-files backend/xgboost_model.pkl backend/scaler.pkl \
    --readme scripts/hf_model_card_template.md \
    --skip-create

# 4. View your model
# Visit: https://huggingface.co/helloblueai/bleu-xgboost-classifier
```

## Help

```bash
python scripts/create_hf_model.py --help
```

For detailed instructions, see: `docs/HUGGINGFACE_SETUP.md`

