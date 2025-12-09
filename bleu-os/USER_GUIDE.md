# 👥 Bleu OS User Guide

## Welcome to Bleu OS!

This guide is for users who want to use Bleu OS. No technical knowledge required!

## What is Bleu OS?

Bleu OS is a special operating system designed for:
- ⚛️ **Quantum Computing** - Run quantum algorithms faster
- 🧠 **AI/ML Work** - Train models 1.5x faster
- 🚀 **Bleu.js Integration** - Pre-installed and optimized

## How to Get Bleu OS

### Method 1: Docker (Easiest - 5 minutes)

**Step 1: Install Docker**
```bash
# On Linux/Mac/Windows
curl -fsSL https://get.docker.com | sh
```

**Step 2: Get Bleu OS**
```bash
docker pull bleuos/bleu-os:latest
```

**Step 3: Run It**
```bash
docker run -it --gpus all bleuos/bleu-os:latest
```

**That's it!** You're now running Bleu OS!

### Method 2: Download ISO (15 minutes)

**Step 1: Download**
- Go to: https://github.com/HelloblueAI/Bleu.js/releases
- Download: `bleu-os-1.0.0-x86_64.iso`

**Step 2: Create Bootable USB**
```bash
# On Linux/Mac
sudo dd if=bleu-os-1.0.0-x86_64.iso of=/dev/sdX bs=4M

# On Windows
# Use Rufus or similar tool
```

**Step 3: Install**
- Boot from USB
- Follow installation wizard
- Done!

### Method 3: Cloud (10 minutes)

**AWS:**
1. Go to AWS Marketplace
2. Search "Bleu OS"
3. Launch instance
4. Connect and use!

**Google Cloud:**
1. Go to GCP Marketplace
2. Find Bleu OS
3. Deploy instance
4. Start using!

## First Steps After Installation

### 1. Verify Installation

```bash
# Check Bleu OS version
cat /etc/bleu-os-release

# Check Python
python3 --version

# Check Bleu.js
python3 -c "import bleujs; print('Bleu.js ready!')"
```

### 2. Run Your First Quantum Circuit

```python
from bleujs import BleuJS
from qiskit import QuantumCircuit

# Initialize Bleu.js
bleu = BleuJS(quantum_mode=True)

# Create quantum circuit
qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()

# Process with Bleu.js
result = bleu.process(qc, quantum_features=True)
print(result)
```

### 3. Train Your First ML Model

```python
from bleujs import BleuJS
import numpy as np

# Initialize
bleu = BleuJS(quantum_mode=True, device="cuda")

# Your data
data = np.random.rand(100, 20)

# Process
result = bleu.process(data, quantum_features=True)
print(f"Processed {len(data)} samples")
```

## Common Tasks

### Start Jupyter Notebook

```bash
jupyter notebook --ip=0.0.0.0 --port=8888
# Access at http://localhost:8888
```

### Use GPU

```bash
# Check GPU
nvidia-smi  # NVIDIA
rocminfo    # AMD

# Bleu.js will automatically use GPU if available
```

### Install Additional Packages

```bash
pip3 install --break-system-packages your-package
```

### Access Quantum Hardware

```python
# IBM Quantum
from qiskit import IBMQ
IBMQ.load_account()

# Google Quantum
import cirq
# Configure your credentials
```

## Benefits You Get

### ⚡ Performance

- **2x faster** quantum processing
- **1.5x faster** ML training
- **3.75x faster** boot time

### 🎯 Convenience

- Everything pre-installed
- No configuration needed
- Works immediately

### 🔒 Security

- Quantum-resistant encryption
- Secure by default
- Regular updates

## Troubleshooting

### Docker Permission Error

```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### GPU Not Detected

```bash
# Check GPU drivers
nvidia-smi  # NVIDIA
rocminfo    # AMD

# Install drivers if needed
```

### Bleu.js Not Found

```bash
# Reinstall Bleu.js
pip3 install --break-system-packages bleu-js
```

## Getting Help

- **GitHub Issues:** Report problems
- **Discussions:** Ask questions
- **Documentation:** Read guides
- **Examples:** See use cases

## Next Steps

1. ✅ Install Bleu OS
2. ✅ Run first example
3. ✅ Explore features
4. ✅ Build your projects!

---

**Enjoy Bleu OS!** 🚀
