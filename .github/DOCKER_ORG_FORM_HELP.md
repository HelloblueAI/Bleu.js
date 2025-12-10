# Docker Hub Organization Form - How to Fill

## Form Fields

### Organization namespace (Required)
**What to enter:** `bleuos`

**Important:**
- This is the unique ID that appears in image names
- Will make: `bleuos/bleu-os:latest` ✅
- **Cannot be changed later** - choose carefully!
- Must be lowercase, alphanumeric, hyphens allowed
- Must be unique (not already taken)

**Example:** `bleuos`

### Organization name
**What to enter:** `Bleu OS` or `Bleuos` or `Bleu`

**Important:**
- This is the display name (can be changed later)
- Shows up in Docker Hub UI
- Can have spaces and capital letters
- Not used in image names

**Examples:**
- `Bleu OS`
- `Bleuos`
- `Bleu Operating System`

## Recommended Values

**Organization namespace:** `bleuos`
- Matches your tweet command
- Short and memorable
- Professional

**Organization name:** `Bleu OS`
- Clear and descriptive
- Matches your product name

## After Creating

Once created:
1. Create repository `bleu-os` under the organization
2. Update workflow to use `bleuos/bleu-os`
3. Your tweet command will work: `docker pull bleuos/bleu-os:latest`

## Quick Checklist

- [ ] Organization namespace: `bleuos` (lowercase, unique)
- [ ] Organization name: `Bleu OS` (display name, can change later)
- [ ] Click "Create"
- [ ] Create repository `bleu-os` under organization
- [ ] Update workflow
