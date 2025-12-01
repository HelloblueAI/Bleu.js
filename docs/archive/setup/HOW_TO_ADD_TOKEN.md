# 🔑 How to Add Your Hugging Face Token

There are **3 easy ways** to provide your token:

## Method 1: Environment Variable (Recommended)

Set it in your terminal session:

```bash
export HF_TOKEN="hf_your_token_here"
python3 scripts/setup_hf_model_auto.py
```

**To make it permanent**, add it to your `~/.bashrc` or `~/.zshrc`:

```bash
echo 'export HF_TOKEN="hf_your_token_here"' >> ~/.zshrc
source ~/.zshrc
```

## Method 2: Pass as Command Line Argument

```bash
python3 scripts/setup_hf_model_auto.py --token "hf_your_token_here"
```

## Method 3: Use the Bash Script

```bash
./scripts/upload_to_hf.sh "hf_your_token_here"
```

## 🔍 Where to Get Your Token

1. Go to: **https://huggingface.co/settings/tokens**
2. Click **"New token"**
3. Name it (e.g., `bleu-js-upload`)
4. Select **"Write"** permissions
5. Click **"Generate token"**
6. **Copy the token** (it starts with `hf_`)

## ✅ Quick Test

After setting your token, verify it works:

```bash
# Set token
export HF_TOKEN="hf_your_token_here"

# Test (this will show your username if token is valid)
huggingface-cli whoami
```

## 🚀 Then Run the Upload

Once your token is set, just run:

```bash
python3 scripts/setup_hf_model_auto.py
```

That's it! The script will use your token automatically.
