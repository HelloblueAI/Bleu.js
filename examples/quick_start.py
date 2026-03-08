#!/usr/bin/env python3
"""
Bleu.js Quick Start Example
============================

This example works with just: pip install bleu-js

No additional dependencies required!
"""

print("🚀 Bleu.js Quick Start Example")
print("=" * 60)

# Step 1: Import Bleu.js
print("\n📦 Step 1: Importing Bleu.js...")
try:
    from bleujs import BleuJS, __version__

    print(f"✅ Successfully imported Bleu.js v{__version__}")
except ImportError as e:
    print(f"❌ Error: {e}")
    print("💡 Install with: pip install bleu-js")
    exit(1)

# Step 2: Create BleuJS instance
print("\n⚙️  Step 2: Creating BleuJS instance...")
bleu = BleuJS()
print(f"✅ Created: {bleu}")

# Step 3: Process simple data
print("\n🔄 Step 3: Processing data...")
data = {"data": [1, 2, 3, 4, 5], "name": "test_data"}

result = bleu.process(data)

print("✅ Processing complete!")
print("\n📊 Results:")
print(f"   Status: {result['status']}")
print(f"   Device: {result['device']}")
print(f"   Version: {result['version']}")

if "shape" in result:
    print(f"   Shape: {result['shape']}")

# Step 4: Process with numpy array
print("\n🔄 Step 4: Processing numpy array...")
import numpy as np

array_data = np.array([[1, 2], [3, 4], [5, 6]])
result2 = bleu.process(array_data)

print("✅ Array processing complete!")
print(f"   Shape: {result2.get('shape', 'N/A')}")
print(f"   Dtype: {result2.get('dtype', 'N/A')}")

# Step 5: Check available features
print("\n🎯 Step 5: Checking available features...")
from bleujs import check_dependencies

core_deps = check_dependencies("core")
print("   Core dependencies:")
for dep, status in core_deps.items():
    emoji = "✅" if status == "installed" else "❌"
    print(f"   {emoji} {dep}: {status}")

# Step 6: Device detection
print("\n💻 Step 6: Device detection...")
from bleujs import get_device

device = get_device()
print(f"   Detected device: {device}")

# Final summary
print("\n" + "=" * 60)
print("🎉 Quick Start Complete!")
print("=" * 60)
print("\n📚 Next Steps:")
print("   1. Install quantum features: pip install 'bleu-js[quantum]'")
print("   2. Install ML features: pip install 'bleu-js[ml]'")
print("   3. Install all features: pip install 'bleu-js[all]'")
print("\n📖 Documentation: https://github.com/HelloblueAI/Bleu.js")
print("🐛 Issues: https://github.com/HelloblueAI/Bleu.js/issues")
print("\n✨ Enjoy using Bleu.js! ✨")
