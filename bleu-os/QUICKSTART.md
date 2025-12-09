# Bleu OS Quick Start Guide

Get up and running with Bleu OS in 5 minutes!

## Option 1: Docker (Fastest)

```bash
# Build Docker image
cd bleu-os
docker build -t bleu-os:latest -f Dockerfile .

# Run container
docker run -it --gpus all bleu-os:latest

# Inside container, Bleu.js is ready to use!
python3 -c "from bleujs import BleuJS; print('Bleu.js loaded!')"
```

## Option 2: Build ISO Image

```bash
cd bleu-os

# Install build dependencies
sudo apt-get install -y debootstrap genisoimage qemu-utils

# Build OS
./build.sh --arch x86_64 --variant quantum-ai

# ISO will be in: build/iso/bleu-os-1.0.0-x86_64-quantum-ai.iso
```

## Option 3: Use Pre-built Image

```bash
# Pull from registry (when available)
docker pull bleuos/bleu-os:latest
docker run -it --gpus all bleuos/bleu-os:latest
```

## Verify Installation

```bash
# Check Bleu.js
python3 -c "import bleujs; print(bleujs.__version__)"

# Check quantum libraries
python3 -c "import qiskit; print('Qiskit:', qiskit.__version__)"

# Check ML libraries
python3 -c "import torch; print('PyTorch:', torch.__version__)"

# Check GPU (if available)
nvidia-smi  # NVIDIA
# or
rocminfo    # AMD
```

## First Quantum Circuit

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

## First ML Model

```python
from bleujs import BleuJS
import numpy as np

# Initialize
bleu = BleuJS(quantum_mode=True, device="cuda")

# Sample data
data = np.random.rand(100, 20)

# Process
result = bleu.process(data, quantum_features=True)
print(f"Processed {len(data)} samples")
```

## Performance Check

```bash
# System info
cat /etc/bleu-os-release

# CPU info
lscpu

# Memory
free -h

# GPU (if available)
nvidia-smi
```

## Next Steps

- Read the [full documentation](README.md)
- Check [configuration options](config/bleu-optimizations.conf)
- Explore [examples](../../examples/)
- Join [Discussions](https://github.com/HelloblueAI/Bleu.js/discussions)

## Troubleshooting

### Bleu.js not found
```bash
pip3 install -e /opt/bleu-js
```

### GPU not detected
```bash
# Check NVIDIA
nvidia-smi

# Check AMD
rocminfo
```

### Quantum hardware not available
```bash
# Check configuration
cat /etc/bleu-os/bleu-optimizations.conf | grep quantum
```

## Support

- **Issues**: [GitHub Issues](https://github.com/HelloblueAI/Bleu.js/issues)
- **Discussions**: [GitHub Discussions](https://github.com/HelloblueAI/Bleu.js/discussions)
- **Email**: os-support@helloblue.ai

---

**Welcome to Bleu OS!** 🚀
