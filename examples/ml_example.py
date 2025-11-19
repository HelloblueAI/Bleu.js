#!/usr/bin/env python3
"""
Bleu.js Machine Learning Example
=================================

This example demonstrates ML training with optional quantum features.

Installation:
    pip install 'bleu-js[ml]'        # For ML features
    pip install 'bleu-js[ml,quantum]' # For ML + Quantum

Or minimal:
    pip install bleu-js  # Works with simple models
"""

print("🎯 Bleu.js Machine Learning Example")
print("=" * 60)

# Import BleuJS
print("\n📦 Importing Bleu.js...")
from bleujs import BleuJS, __version__, check_dependencies
print(f"✅ Bleu.js v{__version__} imported")

# Check ML dependencies
print("\n🔍 Checking ML dependencies...")
ml_deps = check_dependencies('ml')
for dep, status in ml_deps.items():
    emoji = "✅" if status == "installed" else "❌"
    print(f"   {emoji} {dep}: {status}")

# Import ML features
print("\n🤖 Loading ML features...")
try:
    from bleujs.ml import HybridTrainer, QuantumVisionModel
    ml_available = True
    print("✅ ML features available")
except ImportError:
    ml_available = False
    print("⚠️  ML libraries not fully installed")
    print("💡 For full ML support: pip install 'bleu-js[ml]'")

# Generate sample dataset
print("\n📊 Generating sample dataset...")
import numpy as np

np.random.seed(42)
n_samples = 1000
n_features = 20

# Create synthetic classification data
X = np.random.randn(n_samples, n_features)
y = (X[:, 0] + X[:, 1] + np.random.normal(0, 0.1, n_samples) > 0).astype(int)

print(f"✅ Generated dataset:")
print(f"   Samples: {n_samples}")
print(f"   Features: {n_features}")
print(f"   Classes: {len(np.unique(y))}")

# Split data
split_idx = int(0.8 * n_samples)
X_train, X_test = X[:split_idx], X[split_idx:]
y_train, y_test = y[:split_idx], y[split_idx:]

print(f"   Training: {len(X_train)} samples")
print(f"   Testing: {len(X_test)} samples")

if ml_available:
    # Train hybrid model
    print("\n🏋️  Training hybrid model...")
    
    trainer = HybridTrainer(
        model_type='xgboost',
        quantum_components=False  # Set to True for quantum features
    )
    print(f"✅ Created trainer: {trainer.model_type}")
    
    # Train the model
    print("\n⚡ Training in progress...")
    model = trainer.train(
        X_train=X_train,
        y_train=y_train,
        validation_data=(X_test, y_test),
        quantum_features=False,  # Set to True with quantum installed
    )
    print("✅ Training complete!")
    
    # Evaluate model
    print("\n📊 Evaluating model...")
    metrics = trainer.evaluate(model, X_test, y_test)
    
    print("✅ Evaluation complete!")
    print(f"\n📈 Performance Metrics:")
    print(f"   Accuracy: {metrics.get('accuracy', 0):.4f}")
    print(f"   F1 Score: {metrics.get('f1_score', 0):.4f}")
    print(f"   Test Samples: {metrics.get('test_samples', 0)}")
    
    # Demonstrate vision model
    print("\n👁️  Testing QuantumVisionModel...")
    
    vision_model = QuantumVisionModel(
        model_type='resnet',
        quantum_enhanced=False
    )
    print(f"✅ Created vision model: {vision_model.model_type}")
    
    # Generate sample images
    sample_images = np.random.rand(10, 224, 224, 3)
    vision_results = vision_model.process(sample_images)
    
    print(f"✅ Processed {vision_results['num_images']} images")
    
    # Analyze results
    analysis = vision_model.analyze(vision_results, detailed=True)
    print(f"✅ Analysis confidence: {analysis['confidence']:.2f}")

else:
    print("\n📝 Note: Install ML libraries for full features:")
    print("   pip install scikit-learn xgboost pandas")
    print("\n   Or use shorthand:")
    print("   pip install 'bleu-js[ml]'")
    
    print("\n⚙️  Using simple fallback model...")
    # Simple demonstration with basic BleuJS
    bleu = BleuJS()
    result = bleu.process(X_train[:10])
    print(f"✅ Processed data: {result['status']}")

# Final summary
print("\n" + "=" * 60)
print("🎉 Machine Learning Example Complete!")
print("=" * 60)
print("\n💡 Key Features:")
print("   ✅ Hybrid classical-quantum ML training")
print("   ✅ Multiple model types supported")
print("   ✅ Computer vision capabilities")
print("   ✅ Works even without ML libs (fallback mode)")
print("\n🚀 Advanced Usage:")
print("   • Set quantum_components=True for quantum enhancement")
print("   • Install with 'bleu-js[ml,quantum]' for full features")
print("   • Try different model_types: 'xgboost', 'neural', 'hybrid'")
print("\n📚 Learn more: https://github.com/HelloblueAI/Bleu.js")

