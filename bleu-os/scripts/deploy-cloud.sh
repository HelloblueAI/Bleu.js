#!/bin/bash
set -euo pipefail

# Deploy Bleu OS to Cloud Platforms

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLATFORM="${PLATFORM:-aws}"
REGION="${REGION:-us-east-1}"
IMAGE_NAME="${IMAGE_NAME:-bleu-os}"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

show_help() {
    cat << EOF
Deploy Bleu OS to Cloud Platforms

Usage: $0 [OPTIONS]

Options:
  --platform PLATFORM    Cloud platform (aws, gcp, azure, digitalocean)
  --region REGION        Region to deploy to
  --image-name NAME      Image name
  --help                 Show this help

Examples:
  $0 --platform aws --region us-east-1
  $0 --platform gcp --region us-central1
  $0 --platform azure --region eastus
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --image-name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

log "Deploying Bleu OS to $PLATFORM in region $REGION..."

case "$PLATFORM" in
    aws)
        log "AWS deployment..."

        # Check for AWS CLI
        if ! command -v aws &> /dev/null; then
            log "Error: AWS CLI not found. Install with: pip install awscli"
            exit 1
        fi

        # Check for Docker
        if ! command -v docker &> /dev/null; then
            log "Error: Docker not found"
            exit 1
        fi

        # Build Docker image
        log "Building Docker image..."
        docker build -t "${IMAGE_NAME}:latest" -f "${SCRIPT_DIR}/Dockerfile" "${SCRIPT_DIR}/.."

        # Get AWS account ID
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        AWS_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

        log "Logging in to AWS ECR..."
        aws ecr get-login-password --region "${REGION}" | \
            docker login --username AWS --password-stdin "${AWS_REGISTRY}"

        # Create ECR repository if it doesn't exist
        log "Creating ECR repository..."
        aws ecr describe-repositories --repository-names "${IMAGE_NAME}" --region "${REGION}" 2>/dev/null || \
            aws ecr create-repository --repository-name "${IMAGE_NAME}" --region "${REGION}"

        # Tag and push image
        log "Tagging and pushing image..."
        docker tag "${IMAGE_NAME}:latest" "${AWS_REGISTRY}/${IMAGE_NAME}:latest"
        docker push "${AWS_REGISTRY}/${IMAGE_NAME}:latest"

        log "✅ Image pushed to: ${AWS_REGISTRY}/${IMAGE_NAME}:latest"
        log "Create EC2 instance with: aws ec2 run-instances --image-id <AMI> --instance-type t3.large"
        ;;

    gcp)
        log "Google Cloud Platform deployment..."

        # Check for gcloud CLI
        if ! command -v gcloud &> /dev/null; then
            log "Error: gcloud CLI not found. Install from: https://cloud.google.com/sdk"
            exit 1
        fi

        # Get GCP project
        GCP_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
        if [[ -z "$GCP_PROJECT" ]]; then
            log "Error: GCP project not set. Run: gcloud config set project PROJECT_ID"
            exit 1
        fi

        # Build and push to GCR
        log "Building and pushing to Google Container Registry..."
        docker build -t "gcr.io/${GCP_PROJECT}/${IMAGE_NAME}:latest" \
            -f "${SCRIPT_DIR}/Dockerfile" "${SCRIPT_DIR}/.."

        gcloud auth configure-docker
        docker push "gcr.io/${GCP_PROJECT}/${IMAGE_NAME}:latest"

        log "✅ Image pushed to: gcr.io/${GCP_PROJECT}/${IMAGE_NAME}:latest"
        log "Create GCE instance with: gcloud compute instances create bleu-os --image-family=cos --image-project=cos-cloud"
        ;;

    azure)
        log "Azure deployment..."

        # Check for Azure CLI
        if ! command -v az &> /dev/null; then
            log "Error: Azure CLI not found. Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
            exit 1
        fi

        # Get Azure resource group
        AZURE_RG="${AZURE_RG:-bleu-os-rg}"
        AZURE_ACR="${AZURE_ACR:-bleuosacr}"

        log "Creating resource group if needed..."
        az group create --name "${AZURE_RG}" --location "${REGION}" 2>/dev/null || true

        log "Creating Azure Container Registry if needed..."
        az acr create --resource-group "${AZURE_RG}" --name "${AZURE_ACR}" --sku Basic 2>/dev/null || true

        log "Building and pushing to Azure Container Registry..."
        az acr build --registry "${AZURE_ACR}" --image "${IMAGE_NAME}:latest" \
            -f "${SCRIPT_DIR}/Dockerfile" "${SCRIPT_DIR}/.."

        log "✅ Image pushed to: ${AZURE_ACR}.azurecr.io/${IMAGE_NAME}:latest"
        ;;

    digitalocean)
        log "DigitalOcean deployment..."

        # Check for doctl
        if ! command -v doctl &> /dev/null; then
            log "Error: doctl not found. Install from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
            exit 1
        fi

        # Build and push to DigitalOcean Container Registry
        DO_REGISTRY="${DO_REGISTRY:-registry.digitalocean.com/bleu-os}"

        log "Building and pushing to DigitalOcean Container Registry..."
        docker build -t "${DO_REGISTRY}/${IMAGE_NAME}:latest" \
            -f "${SCRIPT_DIR}/Dockerfile" "${SCRIPT_DIR}/.."

        doctl registry login
        docker push "${DO_REGISTRY}/${IMAGE_NAME}:latest"

        log "✅ Image pushed to: ${DO_REGISTRY}/${IMAGE_NAME}:latest"
        ;;

    *)
        log "Error: Unknown platform: $PLATFORM"
        log "Supported platforms: aws, gcp, azure, digitalocean"
        exit 1
        ;;
esac

log "✅ Deployment complete!"
