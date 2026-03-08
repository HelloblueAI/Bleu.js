# 🚀 Bleu.js Quick Start Guide

Get up and running with Bleu.js in 5 minutes!

**Requirements:** Python 3.11+

## 📦 Installation

### Option 1: Core Package (Minimal, Fastest)

```bash
pip install bleu-js
```

**Size:** ~50MB | **Install Time:** ~30 seconds

### Option 2: With Machine Learning

```bash
pip install 'bleu-js[ml]'
```

**Includes:** XGBoost, scikit-learn, pandas

### Option 3: With Quantum Computing

```bash
pip install 'bleu-js[quantum]'
```

**Includes:** Qiskit, PennyLane for quantum features

### Option 4: Full Installation (All Features)

```bash
pip install 'bleu-js[all]'
```

**Includes:** All ML, quantum, and deep learning features

---

## 🎯 Your First Program

### 1. Basic Usage (Works Immediately)

```python
from bleujs import BleuJS

# Create instance
bleu = BleuJS()

# Process data
result = bleu.process({'data': [1, 2, 3, 4, 5]})

print(result['status'])  # 'success'
print(result['device'])  # 'cuda' or 'cpu'
```

**✅ This works with just `pip install bleu-js` - no other dependencies needed!**

---

### 2. With NumPy Arrays

```python
from bleujs import BleuJS
import numpy as np

bleu = BleuJS()

# Process numpy array
data = np.array([[1, 2], [3, 4], [5, 6]])
result = bleu.process(data)

print(f"Shape: {result['shape']}")  # (3, 2)
print(f"Status: {result['status']}")  # 'success'
```

---

### 3. Quantum-Enhanced Processing

```python
from bleujs import BleuJS
from bleujs.quantum import QuantumFeatureExtractor

# Enable quantum mode
bleu = BleuJS(quantum_mode=True)

# Process with quantum features
result = bleu.process(data, quantum_features=True)

print(f"Quantum Enhanced: {result['quantum_enhanced']}")
```

**Note:** Works with or without quantum libraries! Uses classical simulation if quantum libs not installed.

**To get full quantum support:**

```bash
pip install 'bleu-js[quantum]'
```

---

### 4. Machine Learning Training

```python
from bleujs.ml import HybridTrainer
import numpy as np

# Generate sample data
X_train = np.random.randn(1000, 20)
y_train = (X_train[:, 0] > 0).astype(int)

# Create trainer
trainer = HybridTrainer(model_type='xgboost')

# Train model
model = trainer.train(X_train, y_train)

# Evaluate
X_test = np.random.randn(200, 20)
y_test = (X_test[:, 0] > 0).astype(int)
metrics = trainer.evaluate(model, X_test, y_test)

print(f"Accuracy: {metrics['accuracy']:.4f}")
```

**Requires:**

```bash
pip install 'bleu-js[ml]'
```

---

## 📚 Run Example Scripts

We've included ready-to-run examples:

### Basic Example (No Extra Dependencies)

```bash
python examples/quick_start.py
```

### Quantum Example

```bash
pip install 'bleu-js[quantum]'  # Optional, works without it too
python examples/quantum_example.py
```

### Machine Learning Example

```bash
pip install 'bleu-js[ml]'
python examples/ml_example.py
```

---

## 🔍 Check What's Installed

```python
from bleujs import check_dependencies

# Check core dependencies
print(check_dependencies('core'))

# Check quantum dependencies
print(check_dependencies('quantum'))

# Check ML dependencies
print(check_dependencies('ml'))

# Check all dependencies
print(check_dependencies('all'))
```

---

## 💻 Detect Your Device

```python
from bleujs import get_device

device = get_device()
print(f"Using: {device}")  # 'cuda' if GPU available, else 'cpu'
```

---

## 🎓 Common Use Cases

### Use Case 1: Data Processing

```python
from bleujs import BleuJS

bleu = BleuJS()
result = bleu.process(your_data)
```

### Use Case 2: Quantum Feature Extraction

```python
from bleujs.quantum import QuantumFeatureExtractor

extractor = QuantumFeatureExtractor(num_qubits=4)
quantum_features = extractor.extract(your_data)
```

### Use Case 3: ML Model Training

```python
from bleujs.ml import HybridTrainer

trainer = HybridTrainer(model_type='xgboost')
model = trainer.train(X_train, y_train)
```

### Use Case 4: Computer Vision

```python
from bleujs.ml import QuantumVisionModel

model = QuantumVisionModel(model_type='resnet')
results = model.process(images)
```

---

## ❓ Troubleshooting

### Problem: Import Error

**Solution:**

```bash
# Make sure you installed the package
pip install bleu-js

# Verify installation
pip show bleu-js
```

### Problem: Quantum features not working

**Solution:**

```bash
# Install quantum dependencies
pip install 'bleu-js[quantum]'

# Or install manually
pip install qiskit pennylane
```

**Note:** Bleu.js works without quantum libraries using classical simulation!

### Problem: ML training fails

**Solution:**

```bash
# Install ML dependencies
pip install 'bleu-js[ml]'

# Or install manually
pip install scikit-learn xgboost pandas
```

### Problem: CUDA/GPU not detected

**Solution:**

```python
# Check your device
from bleujs import get_device
print(get_device())  # Should show 'cuda' if GPU available

# Force CPU mode if needed
from bleujs import BleuJS
bleu = BleuJS(device='cpu')
```

---

## 🎯 Next Steps

1. ✅ **You're ready!** Start building with Bleu.js
2. 📖 Read full documentation: [README.md](README.md)
3. 🔬 Explore quantum computing features
4. 🤖 Try ML training examples
5. 🌟 Star us on GitHub: [HelloblueAI/Bleu.js](https://github.com/HelloblueAI/Bleu.js)

---

## 📞 Get Help

- **Documentation:** [GitHub README](https://github.com/HelloblueAI/Bleu.js)
- **Issues:** [GitHub Issues](https://github.com/HelloblueAI/Bleu.js/issues)
- **Email:** support@helloblue.ai

---

## ⚡ Pro Tips

1. **Start minimal:** Install just `bleu-js` first, add features as needed
2. **Check dependencies:** Use `check_dependencies()` to see what's installed
3. **No quantum libs?** No problem! Classical simulation works great
4. **GPU optional:** Bleu.js works fine on CPU
5. **Examples included:** Check the `examples/` directory

---

**✨ Enjoy using Bleu.js! ✨**

Made with ❤️ by [Helloblue AI](https://github.com/HelloblueAI)
