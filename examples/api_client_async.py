"""
Async API Client Example

Demonstrates asynchronous usage of the Bleu.js API client.

Installation:
    pip install bleu-js[api]

Setup:
    export BLEUJS_API_KEY="bleujs_sk_your_api_key_here"
"""

import asyncio
from bleu_ai.api_client import AsyncBleuAPIClient


async def main():
    """Run async examples"""
    
    print("=" * 70)
    print("BLEU.JS ASYNC API CLIENT - EXAMPLES")
    print("=" * 70)
    
    # Use context manager for automatic cleanup
    async with AsyncBleuAPIClient() as client:
        
        # ====================================================================
        # EXAMPLE 1: Async Chat
        # ====================================================================
        print("\n📱 EXAMPLE 1: Async Chat Completion")
        print("-" * 70)
        
        try:
            response = await client.chat([
                {"role": "user", "content": "Explain async programming in one sentence."}
            ])
            print(f"Response: {response.content}")
        except Exception as e:
            print(f"Error: {e}")
        
        # ====================================================================
        # EXAMPLE 2: Concurrent Requests
        # ====================================================================
        print("\n⚡ EXAMPLE 2: Concurrent Requests")
        print("-" * 70)
        
        try:
            # Make multiple requests concurrently
            tasks = [
                client.chat([{"role": "user", "content": f"Tell me about {topic}"}])
                for topic in ["Python", "JavaScript", "Rust"]
            ]
            
            responses = await asyncio.gather(*tasks)
            
            for i, response in enumerate(responses):
                print(f"\nResponse {i + 1}:")
                print(f"  {response.content[:100]}...")
        except Exception as e:
            print(f"Error: {e}")
        
        # ====================================================================
        # EXAMPLE 3: Async Generation
        # ====================================================================
        print("\n📝 EXAMPLE 3: Async Text Generation")
        print("-" * 70)
        
        try:
            response = await client.generate(
                prompt="The future of AI is",
                max_tokens=100
            )
            print(f"Generated: {response.text}")
        except Exception as e:
            print(f"Error: {e}")
        
        # ====================================================================
        # EXAMPLE 4: Async Embeddings
        # ====================================================================
        print("\n🔢 EXAMPLE 4: Async Embeddings")
        print("-" * 70)
        
        try:
            response = await client.embed([
                "Async programming enables concurrency",
                "Coroutines are like lightweight threads"
            ])
            print(f"Created {len(response.embeddings)} embeddings")
        except Exception as e:
            print(f"Error: {e}")
        
        # ====================================================================
        # EXAMPLE 5: Batch Processing
        # ====================================================================
        print("\n🔄 EXAMPLE 5: Batch Processing")
        print("-" * 70)
        
        try:
            prompts = [
                "What is machine learning?",
                "What is deep learning?",
                "What is reinforcement learning?"
            ]
            
            # Process all prompts concurrently
            tasks = [
                client.generate(prompt, max_tokens=50)
                for prompt in prompts
            ]
            
            responses = await asyncio.gather(*tasks)
            
            for prompt, response in zip(prompts, responses):
                print(f"\nPrompt: {prompt}")
                print(f"Response: {response.text[:80]}...")
        except Exception as e:
            print(f"Error: {e}")
    
    print("\n" + "=" * 70)
    print("✅ Async examples complete!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())

