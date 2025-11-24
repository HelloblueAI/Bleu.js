#!/bin/bash
# Quick script to upload model to Hugging Face
# Usage: ./scripts/upload_to_hf.sh YOUR_TOKEN_HERE

set -e

TOKEN="${1:-${HF_TOKEN}}"

if [ -z "$TOKEN" ]; then
    echo "❌ Error: Hugging Face token required"
    echo ""
    echo "Usage:"
    echo "  $0 YOUR_TOKEN"
    echo "  OR"
    echo "  export HF_TOKEN='your_token' && $0"
    echo ""
    echo "Get your token from: https://huggingface.co/settings/tokens"
    exit 1
fi

echo "🚀 Uploading model to Hugging Face..."
echo ""

export HF_TOKEN="$TOKEN"
python3 scripts/setup_hf_model_auto.py --token "$TOKEN"

echo ""
echo "✅ Done! Visit your model at:"
echo "   https://huggingface.co/helloblueai/bleu-xgboost-classifier"

