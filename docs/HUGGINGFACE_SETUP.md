# Hugging Face Model Repository Setup Guide

This guide will help you create and upload a model repository to Hugging Face Hub under the `helloblueai` organization.

## Prerequisites

1. **Hugging Face Account**: Create an account at https://huggingface.co
2. **Access Token**: Generate an access token at https://huggingface.co/settings/tokens
3. **Python Dependencies**: Install required packages

```bash
pip install huggingface-hub
```

## Quick Start

### Step 1: Set Up Your Access Token

```bash
# Option 1: Set environment variable
export HF_TOKEN="your_huggingface_token_here"

# Option 2: Login using CLI
huggingface-cli login
```

### Step 2: Create Repository Using Script

```bash
# Basic usage - create repository only
python scripts/create_hf_model.py \
    --model-name "bleu-xgboost-model" \
    --organization "helloblueai" \
    --private  # Remove this flag for public repository

# Create and upload model files
python scripts/create_hf_model.py \
    --model-name "bleu-xgboost-model" \
    --organization "helloblueai" \
    --model-files backend/xgboost_model.pkl backend/scaler.pkl \
    --readme scripts/hf_model_card_template.md

# Using custom token
python scripts/create_hf_model.py \
    --model-name "bleu-xgboost-model" \
    --token "your_token_here" \
    --model-files backend/xgboost_model.pkl
```

## Manual Setup (Web Interface)

### Step 1: Create Repository

1. Go to https://huggingface.co/new
2. Select **Model** as the repository type
3. Fill in the details:
   - **Owner**: `helloblueai`
   - **Model name**: Choose a descriptive name (e.g., `bleu-xgboost-model`)
   - **Visibility**: Select **Public** or **Private**
   - **License**: Select appropriate license (e.g., MIT)
4. Click **Create repository**

### Step 2: Upload Files

#### Option A: Using Web Interface

1. Navigate to your repository: `https://huggingface.co/helloblueai/YOUR_MODEL_NAME`
2. Click **Add file** → **Upload files**
3. Drag and drop your model files:
   - `xgboost_model.pkl`
   - `scaler.pkl` (if applicable)
   - `README.md` (model card)
4. Add a commit message and click **Commit changes**

#### Option B: Using Git

```bash
# Clone the repository
git clone https://huggingface.co/helloblueai/YOUR_MODEL_NAME
cd YOUR_MODEL_NAME

# Copy your model files
cp ../backend/xgboost_model.pkl .
cp ../backend/scaler.pkl .
cp scripts/hf_model_card_template.md README.md

# Edit README.md with your model details
# Then commit and push

git add .
git commit -m "Upload model files"
git push
```

#### Option C: Using Python Script

```python
from huggingface_hub import HfApi, upload_file

api = HfApi(token="your_token")

# Upload model file
api.upload_file(
    path_or_fileobj="backend/xgboost_model.pkl",
    path_in_repo="xgboost_model.pkl",
    repo_id="helloblueai/YOUR_MODEL_NAME",
    token="your_token",
    commit_message="Upload XGBoost model"
)

# Upload README
api.upload_file(
    path_or_fileobj="README.md",
    path_in_repo="README.md",
    repo_id="helloblueai/YOUR_MODEL_NAME",
    token="your_token",
    commit_message="Add model card"
)
```

## Creating a Model Card

A model card (README.md) is essential for documenting your model. Use the template provided:

1. Copy the template:
   ```bash
   cp scripts/hf_model_card_template.md README.md
   ```

2. Edit `README.md` and fill in:
   - Model description
   - Training details
   - Performance metrics
   - Usage examples
   - Limitations

3. Upload the README:
   ```bash
   python scripts/create_hf_model.py \
       --model-name "YOUR_MODEL_NAME" \
       --readme README.md \
       --skip-create  # If repository already exists
   ```

## Example: Complete Workflow

```bash
# 1. Set your token
export HF_TOKEN="hf_xxxxxxxxxxxxx"

# 2. Create repository and upload files
python scripts/create_hf_model.py \
    --model-name "bleu-xgboost-classifier" \
    --organization "helloblueai" \
    --model-files \
        backend/xgboost_model.pkl \
        backend/models/xgboost_model_latest.pkl \
        backend/scaler.pkl \
    --readme scripts/hf_model_card_template.md

# 3. Verify upload
# Visit: https://huggingface.co/helloblueai/bleu-xgboost-classifier
```

## Repository Structure

Your Hugging Face model repository should have this structure:

```
helloblueai/YOUR_MODEL_NAME/
├── README.md              # Model card (required)
├── xgboost_model.pkl      # Model file
├── scaler.pkl            # Preprocessing scaler (optional)
├── config.json           # Model configuration (optional)
└── .gitattributes        # Git LFS configuration (auto-generated)
```

## Using Your Model

### Download and Use

```python
from huggingface_hub import hf_hub_download
import pickle

# Download model
model_path = hf_hub_download(
    repo_id="helloblueai/YOUR_MODEL_NAME",
    filename="xgboost_model.pkl"
)

# Load model
with open(model_path, 'rb') as f:
    model = pickle.load(f)

# Use model
predictions = model.predict(X_test)
```

### Using with Transformers (if applicable)

If you convert your model to a format compatible with Transformers:

```python
from transformers import AutoModel

model = AutoModel.from_pretrained("helloblueai/YOUR_MODEL_NAME")
```

## Best Practices

1. **Model Card**: Always include a comprehensive README.md with:
   - Model description
   - Training details
   - Performance metrics
   - Usage examples
   - Limitations and biases

2. **File Organization**:
   - Use descriptive filenames
   - Include version numbers if needed
   - Document all files in README

3. **Versioning**:
   - Use Git tags for model versions
   - Document changes in README
   - Tag releases: `git tag v1.0.0 && git push --tags`

4. **Licensing**:
   - Choose appropriate license (MIT, Apache 2.0, etc.)
   - Include license in README

5. **Documentation**:
   - Provide clear usage examples
   - Document dependencies
   - Include citation information

## Troubleshooting

### Authentication Issues

```bash
# Verify token is set
echo $HF_TOKEN

# Re-login
huggingface-cli login
```

### Upload Errors

- **File too large**: Use Git LFS for large files
  ```bash
  git lfs install
  git lfs track "*.pkl"
  ```

- **Permission denied**: Ensure you have write access to the organization

- **Repository not found**: Check the repository name and organization

### Common Issues

1. **"Repository already exists"**: Use `--skip-create` flag or delete existing repo
2. **"Invalid token"**: Regenerate token at https://huggingface.co/settings/tokens
3. **"File not found"**: Check file paths are correct

## Advanced Usage

### Using Git LFS for Large Files

```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.pkl"
git lfs track "*.bin"

# Add .gitattributes
echo "*.pkl filter=lfs diff=lfs merge=lfs -text" >> .gitattributes
git add .gitattributes
git commit -m "Add Git LFS tracking"
```

### Automated Upload in CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Upload to Hugging Face
  env:
    HF_TOKEN: ${{ secrets.HF_TOKEN }}
  run: |
    python scripts/create_hf_model.py \
      --model-name "bleu-xgboost-model" \
      --model-files backend/xgboost_model.pkl \
      --readme README.md
```

## Resources

- [Hugging Face Hub Documentation](https://huggingface.co/docs/hub)
- [Model Cards Guide](https://huggingface.co/docs/hub/model-cards)
- [Python API Documentation](https://huggingface.co/docs/huggingface_hub)
- [Git LFS Documentation](https://git-lfs.github.com/)

## Support

For issues or questions:
- Email: support@helloblue.ai
- GitHub: https://github.com/HelloblueAI/Bleu.js/issues
- Hugging Face: https://huggingface.co/helloblueai

