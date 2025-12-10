# Automatic Docker Hub Push Configuration

## ✅ Configured: Automatic Push on Every Update

The workflow is now configured to automatically push to Docker Hub with multiple tags on every update.

## When Images Are Pushed

### 1. Push to Main Branch
**Triggers:** Any push to `main` branch

**Tags pushed:**
- `bleuos/bleu-os:latest` (production)
- `bleuos/bleu-os:main` (production)
- `bleuos/bleu-os:sha-<commit-hash>` (production)
- `bleuos/bleu-os:minimal` (minimal variant)

**Example:**
```bash
git push origin main
# Automatically pushes:
# - bleuos/bleu-os:latest
# - bleuos/bleu-os:main
# - bleuos/bleu-os:sha-abc1234
```

### 2. Create Git Tag
**Triggers:** Push a git tag like `v1.0.0`

**Tags pushed:**
- `bleuos/bleu-os:1.0.0` (full version)
- `bleuos/bleu-os:1.0` (major.minor)
- `bleuos/bleu-os:1` (major version)
- `bleuos/bleu-os:latest` (if on main)
- `bleuos/bleu-os:sha-<commit-hash>`

**Example:**
```bash
git tag v1.0.0
git push origin v1.0.0
# Automatically pushes:
# - bleuos/bleu-os:1.0.0
# - bleuos/bleu-os:1.0
# - bleuos/bleu-os:1
# - bleuos/bleu-os:latest
```

### 3. Manual Trigger
**Triggers:** Manual workflow dispatch

**Tags pushed:** Based on current branch/tag

## Tag Strategy

### Production Image Tags
- `latest` - Always points to most recent stable
- `main` - Current main branch build
- `sha-<hash>` - Specific commit
- `1.0.0` - Full semantic version
- `1.0` - Major.minor version
- `1` - Major version

### Minimal Image Tags
- `minimal` - Minimal variant
- `minimal-sha-<hash>` - Specific commit (minimal)

## Usage Examples

### Users Pull Latest
```bash
docker pull bleuos/bleu-os:latest
```

### Users Pull Specific Version
```bash
docker pull bleuos/bleu-os:1.0.0
docker pull bleuos/bleu-os:1.0
```

### Users Pull Specific Commit
```bash
docker pull bleuos/bleu-os:sha-abc1234
```

### Users Pull Minimal
```bash
docker pull bleuos/bleu-os:minimal
```

## Automatic Workflow

**No manual steps needed!**

1. ✅ Make changes to code
2. ✅ Push to `main` branch
3. ✅ Workflow automatically:
   - Builds images
   - Pushes to Docker Hub with all tags
   - Updates `latest` tag
   - Creates commit SHA tag

## Version Tagging

To create a new version:

```bash
# Create and push version tag
git tag v1.0.0
git push origin v1.0.0

# Workflow automatically:
# - Builds images
# - Pushes: bleuos/bleu-os:1.0.0
# - Pushes: bleuos/bleu-os:1.0
# - Pushes: bleuos/bleu-os:1
# - Updates: bleuos/bleu-os:latest
```

## Benefits

- ✅ **Automatic:** No manual push needed
- ✅ **Versioned:** Multiple tag formats for flexibility
- ✅ **Traceable:** SHA tags for specific commits
- ✅ **User-friendly:** Latest tag always available
- ✅ **Flexible:** Users can pin to specific versions

## Summary

**Every update automatically pushes to Docker Hub with:**
- Latest tag (for easy access)
- Version tags (for versioning)
- SHA tags (for specific commits)
- Branch tags (for tracking)

**No manual `docker push` needed!** 🚀
