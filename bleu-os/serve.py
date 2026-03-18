"""
Minimal HTTP server for Railway / Bleu OS.
Serves / and /health so the container responds on $PORT and passes health checks.
"""

from fastapi import FastAPI

app = FastAPI(title="Bleu OS", version="1.0.0")


@app.get("/")
async def root():
    return {"message": "Bleu OS", "status": "ok"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
