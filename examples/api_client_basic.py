"""
Basic API Client Example

Demonstrates basic usage of the Bleu.js API client for chat, generation, and embeddings.

Installation:
    pip install bleu-js[api]

Setup:
    export BLEUJS_API_KEY="bleujs_sk_your_api_key_here"
"""

from bleu_ai.api_client import BleuAPIClient

# Initialize client (reads API key from BLEUJS_API_KEY env var)
# Or pass directly: BleuAPIClient(api_key="bleujs_sk_...")
client = BleuAPIClient()

print("=" * 70)
print("BLEU.JS API CLIENT - BASIC EXAMPLES")
print("=" * 70)

# ============================================================================
# EXAMPLE 1: Chat Completion
# ============================================================================
print("\n📱 EXAMPLE 1: Chat Completion")
print("-" * 70)

try:
    response = client.chat([
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "What is quantum computing?"}
    ])
    
    print(f"Model: {response.model}")
    print(f"Response: {response.content}")
    
    if response.usage:
        print(f"Tokens used: {response.usage.get('total_tokens', 'N/A')}")
except Exception as e:
    print(f"Error: {e}")

# ============================================================================
# EXAMPLE 2: Text Generation
# ============================================================================
print("\n📝 EXAMPLE 2: Text Generation")
print("-" * 70)

try:
    response = client.generate(
        prompt="Write a haiku about artificial intelligence:",
        temperature=0.8,
        max_tokens=50
    )
    
    print(f"Generated text:\n{response.text}")
    print(f"Finish reason: {response.finish_reason}")
except Exception as e:
    print(f"Error: {e}")

# ============================================================================
# EXAMPLE 3: Embeddings
# ============================================================================
print("\n🔢 EXAMPLE 3: Text Embeddings")
print("-" * 70)

try:
    texts = [
        "Quantum computing uses quantum mechanics",
        "Machine learning is a subset of AI",
        "Neural networks mimic the human brain"
    ]
    
    response = client.embed(texts)
    
    print(f"Embedded {len(response.embeddings)} texts")
    print(f"Embedding dimension: {len(response.embeddings[0])}")
    print(f"First embedding (first 5 dims): {response.embeddings[0][:5]}")
except Exception as e:
    print(f"Error: {e}")

# ============================================================================
# EXAMPLE 4: List Available Models
# ============================================================================
print("\n🤖 EXAMPLE 4: List Available Models")
print("-" * 70)

try:
    models = client.list_models()
    
    print(f"Found {len(models)} models:\n")
    for model in models:
        print(f"  • {model.id}")
        if model.description:
            print(f"    {model.description}")
        if model.capabilities:
            print(f"    Capabilities: {', '.join(model.capabilities)}")
        print()
except Exception as e:
    print(f"Error: {e}")

# ============================================================================
# Clean up
# ============================================================================
client.close()

print("=" * 70)
print("✅ Examples complete!")
print("=" * 70)

