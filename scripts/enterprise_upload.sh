#!/bin/bash
# Enterprise-grade model upload script
# Follows best practices from big companies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-dev}"  # dev, staging, prod
MODEL_NAME="${2:-bleu-xgboost-classifier}"
VERSION="${3:-$(git describe --tags --abbrev=0 2>/dev/null || echo 'latest')}"

# Environment-specific organization
case $ENVIRONMENT in
  dev)
    ORGANIZATION="pejmantheory"
    ;;
  staging)
    ORGANIZATION="helloblueai-staging"
    ;;
  prod)
    ORGANIZATION="helloblueai"
    ;;
  *)
    echo -e "${RED}Error: Invalid environment. Use: dev, staging, or prod${NC}"
    exit 1
    ;;
esac

echo "=========================================="
echo "🚀 Enterprise Model Upload"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Organization: $ORGANIZATION"
echo "Model Name: $MODEL_NAME"
echo "Version: $VERSION"
echo "=========================================="

# Pre-flight checks
echo -e "\n${YELLOW}Running pre-flight checks...${NC}"

# Check if token exists
if [ -z "$HF_TOKEN" ] && [ -z "$HUGGINGFACE_API_KEY" ]; then
  if [ -f ".env.local" ]; then
    source <(grep -E '^HF_TOKEN=|^HUGGINGFACE_API_KEY=' .env.local | sed 's/^/export /')
  else
    echo -e "${RED}Error: HF_TOKEN not found in environment or .env.local${NC}"
    exit 1
  fi
fi

# Check if model files exist
if [ ! -f "backend/models/xgboost_model_latest.pkl" ] && [ ! -f "backend/xgboost_model.pkl" ]; then
  echo -e "${RED}Error: Model files not found${NC}"
  exit 1
fi

# Check if model card exists
if [ ! -f "backend/README_HF.md" ] && [ ! -f "scripts/hf_model_card_template.md" ]; then
  echo -e "${YELLOW}Warning: Model card not found. Using template.${NC}"
fi

# For production, require approval
if [ "$ENVIRONMENT" == "prod" ]; then
  echo -e "\n${YELLOW}⚠️  PRODUCTION DEPLOYMENT${NC}"
  read -p "Are you sure you want to deploy to production? (yes/no): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 1
  fi
fi

# Add version to model name if not latest
if [ "$VERSION" != "latest" ] && [ -n "$VERSION" ]; then
  FULL_MODEL_NAME="${MODEL_NAME}-${VERSION}"
else
  FULL_MODEL_NAME="${MODEL_NAME}"
fi

# Upload
echo -e "\n${GREEN}Uploading model...${NC}"
python3 scripts/setup_hf_model_auto.py \
  --organization "$ORGANIZATION" \
  --model-name "$FULL_MODEL_NAME"

# Post-upload verification
echo -e "\n${GREEN}Verifying upload...${NC}"
REPO_URL="https://huggingface.co/${ORGANIZATION}/${FULL_MODEL_NAME}"
echo "Model URL: $REPO_URL"

# Create git tag for version tracking (if not latest)
if [ "$VERSION" != "latest" ] && [ -n "$VERSION" ] && ! git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo -e "\n${YELLOW}Creating git tag: $VERSION${NC}"
  git tag -a "$VERSION" -m "Model version $VERSION uploaded to $ORGANIZATION"
  echo "Tag created. Push with: git push origin $VERSION"
fi

echo -e "\n${GREEN}✅ Upload complete!${NC}"
echo "View your model at: $REPO_URL"
