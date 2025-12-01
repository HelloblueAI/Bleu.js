# How to Add Token to .env.local

Add this line to your `.env.local` file:

```
HF_TOKEN=hf_YOUR_TOKEN_HERE
```

**Important:**
- No spaces around the `=` sign
- No quotes needed (but they're okay if you use them)
- The file should be in the root of your project: `/home/pejmanhaghighatnia/Documents/Bleu.js/.env.local`

## Quick Add Command

Run this to add it automatically:

```bash
echo "HF_TOKEN=hf_YOUR_TOKEN_HERE" >> .env.local
```

Or edit the file manually:

```bash
nano .env.local
# Add the line: HF_TOKEN=hf_YOUR_TOKEN_HERE
```

## Then Run

After adding the token, you can run:

```bash
python3 scripts/setup_hf_model_auto.py --organization pejmantheory
```

The script will automatically read the token from `.env.local`!
