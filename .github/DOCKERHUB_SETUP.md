# Docker Hub Setup Instructions

To enable `docker pull bleuos/bleu-os:latest`, you need to set up Docker Hub publishing.

## Steps to Enable Docker Hub Publishing

### 1. Create Docker Hub Account (if you don't have one)

1. Go to https://hub.docker.com
2. Sign up for a free account
3. Choose username: `bleuos` (or your preferred name)
4. Verify your email

### 2. Create Access Token

1. Go to Docker Hub → Account Settings → Security
2. Click "New Access Token"
3. Name it: `github-actions-bleu-os`
4. Set permissions: **Read & Write**
5. Copy the token (you'll only see it once!)

### 3. Add Secrets to GitHub

1. Go to your GitHub repository: https://github.com/HelloblueAI/Bleu.js
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add two secrets:

   **Secret 1:**
   - Name: `DOCKERHUB_USERNAME`
   - Value: `bleuos` (or your Docker Hub username)

   **Secret 2:**
   - Name: `DOCKERHUB_TOKEN`
   - Value: `dckr_pat_...` (the access token you created)

### 4. Create Repository on Docker Hub

1. Go to https://hub.docker.com/repositories
2. Click **Create Repository**
3. Repository name: `bleu-os`
4. Visibility: **Public** (or Private if you prefer)
5. Description: "Bleu OS - Quantum Computing & AI Operating System"
6. Click **Create**

### 5. Verify Setup

After pushing to main, check:
- GitHub Actions workflow should push to both GHCR and Docker Hub
- Visit: https://hub.docker.com/r/bleuos/bleu-os
- You should see the image tags

### 6. Test Pull Command

Once published, users can pull with:

```bash
# Short format (Docker Hub)
docker pull bleuos/bleu-os:latest

# Full format (GHCR)
docker pull ghcr.io/helloblueai/bleu-os:latest
```

Both commands will work! 🎉

## Troubleshooting

### "authentication required" error
- Check that `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets are set correctly
- Verify the token has Read & Write permissions
- Make sure the repository name matches: `bleuos/bleu-os`

### "repository not found" error
- Create the repository on Docker Hub first
- Check the repository name matches exactly
- Verify the repository is public (or you have access if private)

### Workflow fails on Docker Hub push
- Check Docker Hub rate limits (free tier: 200 pulls per 6 hours)
- Verify the access token is valid and not expired
- Check GitHub Actions logs for specific error messages

## Current Status

✅ **GHCR Publishing**: Working
- Users can pull: `ghcr.io/helloblueai/bleu-os:latest`

⏳ **Docker Hub Publishing**: Pending setup
- After setup, users can pull: `bleuos/bleu-os:latest`

## Benefits of Dual Publishing

1. **User Choice**: Users can use either registry
2. **Redundancy**: If one registry is down, the other works
3. **Familiarity**: Docker Hub is more familiar to many users
4. **Rate Limits**: Distributes load across registries
