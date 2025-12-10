# 📖 Bleu OS Usage Guide

Complete guide for using Bleu OS in your projects.

## 🚀 Quick Start

### Pull and Run (Fastest Way)

```bash
# Pull the latest production image
docker pull ghcr.io/helloblueai/bleu-os:latest

# Run interactively
docker run -it --rm ghcr.io/helloblueai/bleu-os:latest

# You're ready! Try:
python3 -c "import qiskit, numpy, bleujs; print('✅ All libraries available!')"
```

## 📋 Available Images

| Image | Size | Use Case | Pull Command |
|-------|------|----------|--------------|
| `ghcr.io/helloblueai/bleu-os:latest` | ~2.8GB | Full quantum + AI stack | `docker pull ghcr.io/helloblueai/bleu-os:latest` |
| `ghcr.io/helloblueai/bleu-os:minimal` | ~200MB | Lightweight, essential only | `docker pull ghcr.io/helloblueai/bleu-os:minimal` |
| `ghcr.io/helloblueai/bleu-os:1.0.0` | ~2.8GB | Specific version | `docker pull ghcr.io/helloblueai/bleu-os:1.0.0` |

## 💻 Common Use Cases

### 1. Interactive Development

**Start an interactive shell:**
```bash
docker run -it --rm \
  -v $(pwd)/workspace:/workspace \
  ghcr.io/helloblueai/bleu-os:latest
```

**With GPU support:**
```bash
docker run -it --rm --gpus all \
  -v $(pwd)/workspace:/workspace \
  ghcr.io/helloblueai/bleu-os:latest
```

### 2. Running Python Scripts

**Run a script:**
```bash
docker run --rm \
  -v $(pwd):/workspace \
  ghcr.io/helloblueai/bleu-os:latest \
  python3 /workspace/your_script.py
```

**Run with environment variables:**
```bash
docker run --rm \
  -v $(pwd):/workspace \
  -e BLEU_QUANTUM_MODE=true \
  -e BLEU_OPTIMIZATION_LEVEL=3 \
  ghcr.io/helloblueai/bleu-os:latest \
  python3 /workspace/script.py
```

### 3. Jupyter Lab

**Start Jupyter Lab:**
```bash
docker run -it --rm -p 8888:8888 \
  -v $(pwd)/notebooks:/workspace/notebooks \
  ghcr.io/helloblueai/bleu-os:latest \
  jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root
```

**Access at:** `http://localhost:8888`

**With token (more secure):**
```bash
docker run -it --rm -p 8888:8888 \
  -v $(pwd)/notebooks:/workspace/notebooks \
  ghcr.io/helloblueai/bleu-os:latest \
  jupyter lab --ip=0.0.0.0 --port=8888 --no-browser \
    --NotebookApp.token='your-secret-token'
```

### 4. Quantum Computing

**Qiskit Example:**
```bash
docker run --rm \
  -v $(pwd):/workspace \
  ghcr.io/helloblueai/bleu-os:latest \
  python3 << 'EOF'
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

# Create a quantum circuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()

# Simulate
simulator = AerSimulator()
compiled_circuit = transpile(qc, simulator)
job = simulator.run(compiled_circuit, shots=1000)
result = job.result()
counts = result.get_counts(qc)

print("Results:", counts)
EOF
```

**PennyLane Example:**
```bash
docker run --rm \
  ghcr.io/helloblueai/bleu-os:latest \
  python3 << 'EOF'
import pennylane as qml

dev = qml.device('default.qubit', wires=2)

@qml.qnode(dev)
def circuit():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.state()

print("Quantum state:", circuit())
EOF
```

### 5. Machine Learning

**scikit-learn Example:**
```bash
docker run --rm \
  -v $(pwd):/workspace \
  ghcr.io/helloblueai/bleu-os:latest \
  python3 << 'EOF'
from sklearn import datasets
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load data
iris = datasets.load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# Train model
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Evaluate
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)
print(f"Accuracy: {accuracy:.2%}")
EOF
```

**Pandas Data Analysis:**
```bash
docker run --rm \
  -v $(pwd)/data:/workspace/data \
  ghcr.io/helloblueai/bleu-os:latest \
  python3 << 'EOF'
import pandas as pd
import numpy as np

# Create sample data
df = pd.DataFrame({
    'A': np.random.randn(100),
    'B': np.random.randn(100),
    'C': np.random.choice(['X', 'Y', 'Z'], 100)
})

print(df.describe())
print("\nGroup by C:")
print(df.groupby('C').mean())
EOF
```

### 6. Using Bleu.js

**Basic Bleu.js Usage:**
```bash
docker run --rm \
  ghcr.io/helloblueai/bleu-os:latest \
  python3 << 'EOF'
import bleujs
import numpy as np

# Check installation
print("✅ Bleu.js is installed and ready!")

# Use with NumPy
arr = np.array([1, 2, 3, 4, 5])
print(f"NumPy array: {arr}")
print(f"Mean: {np.mean(arr)}")
EOF
```

## 🐙 Docker Compose

### Production Setup

**Create `docker-compose.yml`:**
```yaml
version: '3.8'

services:
  bleu-os:
    image: ghcr.io/helloblueai/bleu-os:latest
    container_name: bleu-os
    restart: unless-stopped
    ports:
      - "8888:8888"  # Jupyter
      - "9090:9090"  # Metrics
    volumes:
      - ./workspace:/workspace
      - ./data:/data
    environment:
      - BLEU_QUANTUM_MODE=true
      - BLEU_OPTIMIZATION_LEVEL=3
```

**Start:**
```bash
docker compose up -d
docker compose logs -f
```

**Stop:**
```bash
docker compose down
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BLEU_QUANTUM_MODE` | `true` | Enable quantum computing features |
| `BLEU_OPTIMIZATION_LEVEL` | `3` | Optimization level (1-3) |
| `BLEU_OS_VERSION` | `1.0.0` | OS version |
| `PYTHONUNBUFFERED` | `1` | Python output buffering |

**Example:**
```bash
docker run --rm \
  -e BLEU_QUANTUM_MODE=false \
  -e BLEU_OPTIMIZATION_LEVEL=1 \
  ghcr.io/helloblueai/bleu-os:latest
```

### Volume Mounts

**Common mount points:**
- `/workspace` - Your working directory
- `/data` - Data storage
- `/home/bleuos/.local` - User Python packages (persistent)

**Example:**
```bash
docker run -it --rm \
  -v $(pwd)/my-project:/workspace \
  -v $(pwd)/data:/data \
  ghcr.io/helloblueai/bleu-os:latest
```

## 🎯 Use Case Examples

### Research & Development

```bash
# Start interactive session for research
docker run -it --rm \
  -v $(pwd)/research:/workspace \
  -p 8888:8888 \
  ghcr.io/helloblueai/bleu-os:latest \
  jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root
```

### Production Deployment

```bash
# Run as a service
docker run -d --name bleu-os \
  --restart unless-stopped \
  -v /data/bleu-os:/data \
  -p 8000:8000 \
  ghcr.io/helloblueai/bleu-os:latest
```

### CI/CD Pipeline

```yaml
# .github/workflows/example.yml
- name: Run tests
  run: |
    docker run --rm \
      -v ${{ github.workspace }}:/workspace \
      ghcr.io/helloblueai/bleu-os:latest \
      python3 -m pytest /workspace/tests
```

## 🔍 Troubleshooting

### Check Installation

```bash
# Verify all libraries are installed
docker run --rm ghcr.io/helloblueai/bleu-os:latest \
  python3 << 'EOF'
try:
    import qiskit
    print("✅ Qiskit:", qiskit.__version__)
except ImportError:
    print("❌ Qiskit not found")

try:
    import numpy
    print("✅ NumPy:", numpy.__version__)
except ImportError:
    print("❌ NumPy not found")

try:
    import bleujs
    print("✅ Bleu.js: installed")
except ImportError:
    print("❌ Bleu.js not found")
EOF
```

### Access Container Shell

```bash
# Get a shell in running container
docker exec -it bleu-os bash

# Or start new container with shell
docker run -it --rm ghcr.io/helloblueai/bleu-os:latest bash
```

### View Logs

```bash
# Container logs
docker logs bleu-os

# Follow logs
docker logs -f bleu-os
```

### Permission Issues

```bash
# Fix workspace permissions
docker run --rm \
  -v $(pwd)/workspace:/workspace \
  ghcr.io/helloblueai/bleu-os:latest \
  chown -R 1000:1000 /workspace
```

## 📚 Next Steps

- Read the [Full README](./README.md) for complete documentation
- Check [Distribution Strategy](./DISTRIBUTION_STRATEGY.md) for deployment options
- See [Industry Comparison](./INDUSTRY_COMPARISON.md) for best practices
- Explore [Docker Usage Guide](./DOCKER_USAGE.md) for advanced Docker commands

## 🆘 Need Help?

- **Issues**: [GitHub Issues](https://github.com/HelloblueAI/Bleu.js/issues)
- **Discussions**: [GitHub Discussions](https://github.com/HelloblueAI/Bleu.js/discussions)
- **Email**: os-support@helloblue.ai
