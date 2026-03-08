#!/usr/bin/env python3
"""
Bleu.js Quantum Features Example
=================================

This example demonstrates quantum-enhanced processing.

Installation:
    pip install 'bleu-js[quantum]'

Or for classical simulation (no quantum libs needed):
    pip install bleu-js
"""

print("🔬 Bleu.js Quantum Features Example")
print("=" * 60)

# Import BleuJS
print("\n📦 Importing Bleu.js...")
from bleujs import BleuJS, __version__

print(f"✅ Bleu.js v{__version__} imported")

# Try to import quantum features
print("\n🔬 Loading quantum features...")
try:
    from bleujs.quantum import QuantumAttention, QuantumFeatureExtractor

    quantum_available = True
    print("✅ Quantum features available")
except ImportError:
    quantum_available = False
    print("⚠️  Quantum libraries not installed")
    print("💡 For full quantum support: pip install 'bleu-js[quantum]'")
    print("📝 Note: Classical simulation will be used")

# Create quantum-enabled instance
print("\n⚙️  Creating quantum-enabled BleuJS...")
bleu = BleuJS(quantum_mode=True)
print(f"✅ Created: {bleu}")

# Generate sample data
print("\n📊 Generating sample data...")
import numpy as np

np.random.seed(42)
data = np.random.randn(100, 10)  # 100 samples, 10 features
print(f"✅ Generated data shape: {data.shape}")

# Process with quantum features
print("\n⚡ Processing with quantum features...")
result = bleu.process(data, quantum_features=True)

print("✅ Quantum processing complete!")
print("\n📊 Results:")
print(f"   Status: {result['status']}")
print(f"   Quantum Enhanced: {result['quantum_enhanced']}")
print(f"   Device: {result['device']}")

# If quantum features are available, demonstrate them directly
if quantum_available:
    print("\n🔬 Demonstrating QuantumFeatureExtractor...")

    extractor = QuantumFeatureExtractor(num_qubits=4, entanglement_type="full")
    print(f"✅ Created quantum extractor with 4 qubits")

    # Extract quantum features
    sample_data = np.random.randn(5, 8)
    quantum_features = extractor.extract(sample_data, use_entanglement=True)

    print(f"✅ Extracted quantum features")
    print(f"   Input shape: {sample_data.shape}")
    print(f"   Output shape: {quantum_features.shape}")
    print(f"   Feature values (first 5): {quantum_features[:5]}")

    # Demonstrate quantum attention
    print("\n🧠 Demonstrating QuantumAttention...")

    attention = QuantumAttention(num_heads=8, dim=512)
    print(f"✅ Created quantum attention (8 heads, dim=512)")

    text_data = ["Quantum computing", "Artificial intelligence", "Machine learning"]
    attention_output = attention.process(text_data, quantum_enhanced=True)

    print(f"✅ Applied quantum attention")
    print(f"   Output shape: {attention_output.shape}")

else:
    print("\n📝 Note: Install quantum libraries for full features:")
    print("   pip install qiskit pennylane")
    print("\n   Current mode: Classical simulation")
    print("   (Works without quantum libraries, but uses approximations)")

# Final summary
print("\n" + "=" * 60)
print("🎉 Quantum Example Complete!")
print("=" * 60)
print("\n💡 Key Takeaways:")
print("   ✅ Bleu.js works even without quantum libraries")
print("   ✅ Classical simulation provides quantum-inspired features")
print("   ✅ Install quantum libs for true quantum computing")
print("\n📚 Learn more: https://github.com/HelloblueAI/Bleu.js")
