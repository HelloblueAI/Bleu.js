"""
Advanced API Client Example

Demonstrates advanced usage patterns including error handling, retries,
and custom configurations.

Installation:
    pip install bleu-js[api]

Setup:
    export BLEUJS_API_KEY="bleujs_sk_your_api_key_here"
"""

import time
from bleu_ai.api_client import (
    BleuAPIClient,
    AuthenticationError,
    RateLimitError,
    InvalidRequestError,
    APIError,
    NetworkError,
)

print("=" * 70)
print("BLEU.JS API CLIENT - ADVANCED EXAMPLES")
print("=" * 70)

# ============================================================================
# EXAMPLE 1: Custom Configuration
# ============================================================================
print("\n⚙️ EXAMPLE 1: Custom Configuration")
print("-" * 70)

client = BleuAPIClient(
    api_key="bleujs_sk_your_key_here",
    base_url="https://bleujs.org",  # Custom base URL
    timeout=30.0,                    # 30 second timeout
    max_retries=5                    # Retry failed requests up to 5 times
)

print(f"Client configured:")
print(f"  Base URL: {client.base_url}")
print(f"  Timeout: {client.timeout}s")
print(f"  Max retries: {client.max_retries}")

# ============================================================================
# EXAMPLE 2: Error Handling
# ============================================================================
print("\n⚠️ EXAMPLE 2: Comprehensive Error Handling")
print("-" * 70)

def safe_chat(client, messages):
    """Chat with comprehensive error handling"""
    try:
        response = client.chat(messages)
        return response.content
    
    except AuthenticationError as e:
        print(f"❌ Authentication failed: {e}")
        print("   → Check your API key")
        return None
    
    except RateLimitError as e:
        print(f"⏰ Rate limit exceeded: {e}")
        print("   → Wait and retry")
        return None
    
    except InvalidRequestError as e:
        print(f"🚫 Invalid request: {e}")
        print("   → Check your parameters")
        return None
    
    except APIError as e:
        print(f"🔥 Server error: {e}")
        print("   → Try again later")
        return None
    
    except NetworkError as e:
        print(f"🌐 Network error: {e}")
        print("   → Check your connection")
        return None
    
    except Exception as e:
        print(f"💥 Unexpected error: {e}")
        return None

# Test error handling
result = safe_chat(client, [
    {"role": "user", "content": "Hello!"}
])

if result:
    print(f"✅ Success: {result}")

# ============================================================================
# EXAMPLE 3: Retry with Backoff
# ============================================================================
print("\n🔄 EXAMPLE 3: Manual Retry with Exponential Backoff")
print("-" * 70)

def chat_with_retry(client, messages, max_attempts=3):
    """Chat with manual retry logic"""
    for attempt in range(max_attempts):
        try:
            response = client.chat(messages)
            return response
        
        except RateLimitError:
            if attempt < max_attempts - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Rate limited. Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
            else:
                raise
        
        except (APIError, NetworkError):
            if attempt < max_attempts - 1:
                wait_time = 2 ** attempt
                print(f"Error occurred. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise

# Test retry logic
try:
    response = chat_with_retry(client, [
        {"role": "user", "content": "Test retry logic"}
    ])
    print(f"✅ Success after retries: {response.content}")
except Exception as e:
    print(f"❌ Failed after all retries: {e}")

# ============================================================================
# EXAMPLE 4: Context Manager Pattern
# ============================================================================
print("\n🎯 EXAMPLE 4: Context Manager (Best Practice)")
print("-" * 70)

# Using context manager ensures proper cleanup
with BleuAPIClient() as client:
    try:
        response = client.chat([
            {"role": "user", "content": "What's the weather like?"}
        ])
        print(f"Response: {response.content}")
    except Exception as e:
        print(f"Error: {e}")
# Client is automatically closed here

print("✅ Client closed automatically")

# ============================================================================
# EXAMPLE 5: Streaming Simulation
# ============================================================================
print("\n🌊 EXAMPLE 5: Simulated Streaming")
print("-" * 70)

def simulate_streaming(client, messages):
    """Simulate streaming by chunking the response"""
    try:
        response = client.chat(messages)
        
        # Simulate streaming by printing word by word
        words = response.content.split()
        for word in words:
            print(word, end=" ", flush=True)
            time.sleep(0.1)  # Simulate delay
        print()
        
    except Exception as e:
        print(f"Error: {e}")

with BleuAPIClient() as client:
    simulate_streaming(client, [
        {"role": "user", "content": "Count to 10"}
    ])

# ============================================================================
# EXAMPLE 6: Batch Processing with Progress
# ============================================================================
print("\n📦 EXAMPLE 6: Batch Processing with Progress")
print("-" * 70)

def process_batch(client, prompts):
    """Process multiple prompts with progress tracking"""
    results = []
    total = len(prompts)
    
    for i, prompt in enumerate(prompts, 1):
        try:
            print(f"Processing {i}/{total}...", end=" ")
            response = client.generate(prompt, max_tokens=50)
            results.append(response.text)
            print("✅")
        except Exception as e:
            print(f"❌ Error: {e}")
            results.append(None)
    
    return results

with BleuAPIClient() as client:
    prompts = [
        "Define AI",
        "Define ML",
        "Define DL"
    ]
    results = process_batch(client, prompts)
    
    print(f"\nProcessed {len([r for r in results if r])} of {len(prompts)} prompts")

# ============================================================================
# EXAMPLE 7: Usage Tracking
# ============================================================================
print("\n📊 EXAMPLE 7: Usage Tracking")
print("-" * 70)

class UsageTracker:
    """Track API usage across requests"""
    
    def __init__(self):
        self.total_tokens = 0
        self.total_requests = 0
    
    def track(self, response):
        """Track usage from a response"""
        self.total_requests += 1
        if hasattr(response, 'usage') and response.usage:
            self.total_tokens += response.usage.get('total_tokens', 0)
    
    def report(self):
        """Print usage report"""
        print(f"\nUsage Report:")
        print(f"  Total requests: {self.total_requests}")
        print(f"  Total tokens: {self.total_tokens}")
        if self.total_requests > 0:
            avg = self.total_tokens / self.total_requests
            print(f"  Avg tokens/request: {avg:.1f}")

tracker = UsageTracker()

with BleuAPIClient() as client:
    for i in range(3):
        try:
            response = client.chat([
                {"role": "user", "content": f"Say hello #{i+1}"}
            ])
            tracker.track(response)
        except Exception as e:
            print(f"Error: {e}")

tracker.report()

print("\n" + "=" * 70)
print("✅ Advanced examples complete!")
print("=" * 70)

