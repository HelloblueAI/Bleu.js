# 🚀 Bleu.js Installation Guide

## 📋 System Requirements

- **Python**: 3.10 or higher
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 2GB free space
- **OS**: Linux, macOS, or Windows

## 🎯 Installation Options

### **Option 1: Basic Installation (Recommended for New Users)**

```bash
# Simple installation with core features
pip install bleu-js
```

**What's included:**
- ✅ Core AI/ML functionality
- ✅ Web framework (FastAPI)
- ✅ Security features
- ✅ Database support
- ✅ AWS integration

### **Option 2: ML Features Installation**

```bash
# Install with machine learning capabilities
pip install "bleu-js[ml]"
```

**Additional features:**
- ✅ TensorFlow 2.16+
- ✅ PyTorch 2.2+
- ✅ Transformers 4.37+

### **Option 3: Quantum Computing Installation**

```bash
# Install with quantum computing features
pip install "bleu-js[quantum]"
```

**Additional features:**
- ✅ Qiskit 0.44+
- ✅ Cirq 1.2+
- ✅ PennyLane 0.32+
- ✅ Quantum optimization tools

### **Option 4: Full Installation (Advanced Users)**

```bash
# Install with all features
pip install "bleu-js[all]"
```

**Includes everything:**
- ✅ All ML features
- ✅ All quantum features
- ✅ Development tools
- ✅ Monitoring and observability

### **Option 5: Development Installation**

```bash
# Clone and install in development mode
git clone https://github.com/HelloblueAI/Bleu.js.git
cd Bleu.js
pip install -e ".[dev]"
```

## 🔧 Troubleshooting

### **Common Issues and Solutions**

#### **1. Dependency Resolution Errors**

**Problem:**
```
error: resolution-too-deep
× Dependency resolution exceeded maximum depth
```

**Solution:**
```bash
# Install with constraints
pip install "bleu-js[ml]" --constraint requirements-basic.txt

# Or use a virtual environment
python3 -m venv bleujs-env
source bleujs-env/bin/activate
pip install bleu-js
```

#### **2. NumPy Version Conflicts**

**Problem:**
```
numpy version conflicts with quantum libraries
```

**Solution:**
```bash
# Install with specific NumPy version
pip install "numpy>=1.24.3,<2.0.0"
pip install "bleu-js[quantum]"
```

#### **3. Memory Issues**

**Problem:**
```
Out of memory errors during installation
```

**Solution:**
```bash
# Install with reduced memory usage
pip install --no-cache-dir bleu-js

# Or install in smaller chunks
pip install bleu-js --no-deps
pip install -r requirements-basic.txt
```

#### **4. GPU Compatibility**

**Problem:**
```
CUDA/GPU compatibility issues
```

**Solution:**
```bash
# Install CPU-only versions
pip install "tensorflow-cpu>=2.16.2"
pip install "bleu-js[ml]"
```

## ✅ Verification

### **Test Basic Installation**

```bash
# Verify installation
python -c "import bleu_js; print('✅ Bleu.js installed successfully!')"

# Check version
python -c "import bleu_js; print(f'Version: {bleu_js.__version__}')"
```

### **Test ML Features**

```python
# Test TensorFlow
import tensorflow as tf
print(f"TensorFlow version: {tf.__version__}")

# Test PyTorch
import torch
print(f"PyTorch version: {torch.__version__}")
```

### **Test Quantum Features**

```python
# Test Qiskit
import qiskit
print(f"Qiskit version: {qiskit.__version__}")

# Test Cirq
import cirq
print(f"Cirq version: {cirq.__version__}")
```

## 📦 Package Structure

### **Core Package (`bleu-js`)**
- Web framework (FastAPI)
- Database integration
- Security features
- AWS integration
- Basic utilities

### **ML Package (`bleu-js[ml]`)**
- TensorFlow integration
- PyTorch support
- Transformers library
- Scikit-learn utilities

### **Quantum Package (`bleu-js[quantum]`)**
- Qiskit quantum computing
- Cirq quantum circuits
- PennyLane quantum ML
- Quantum optimization

### **Development Package (`bleu-js[dev]`)**
- Testing tools (pytest)
- Code formatting (black)
- Linting (flake8)
- Type checking (mypy)

### **Monitoring Package (`bleu-js[monitoring]`)**
- Prometheus metrics
- OpenTelemetry tracing
- Structured logging

## 🚀 Quick Start Examples

### **Basic Usage**

```python
from bleu_js import BleuJS

# Initialize the framework
bleu = BleuJS()

# Start the web server
bleu.run()
```

### **ML Usage**

```python
from bleu_js.ml import MLProcessor

# Initialize ML processor
ml = MLProcessor()

# Train a model
model = ml.train_model(data)
```

### **Quantum Usage**

```python
from bleu_js.quantum import QuantumProcessor

# Initialize quantum processor
quantum = QuantumProcessor()

# Run quantum circuit
result = quantum.run_circuit(circuit)
```

## 📞 Support

### **Getting Help**

1. **Documentation**: Check the main README.md
2. **Issues**: Report on GitHub Issues
3. **Discussions**: Use GitHub Discussions
4. **Email**: support@helloblue.ai

### **Common Commands**

```bash
# Check installed packages
pip list | grep bleu

# Update to latest version
pip install --upgrade bleu-js

# Uninstall
pip uninstall bleu-js

# Check for conflicts
pip check
```

## 🎯 Best Practices

### **For Production**

1. **Use virtual environments**
2. **Pin dependency versions**
3. **Test thoroughly before deployment**
4. **Monitor resource usage**

### **For Development**

1. **Install with dev dependencies**
2. **Use code formatting tools**
3. **Run tests regularly**
4. **Follow contribution guidelines**

### **For Research**

1. **Install quantum features**
2. **Use Jupyter notebooks**
3. **Experiment with different configurations**
4. **Document your findings**

---

**Happy coding with Bleu.js! 🚀**
