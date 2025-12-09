#!/bin/bash
set -euo pipefail

# Bleu OS Performance Benchmark Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-${SCRIPT_DIR}/benchmarks}"
RESULTS_FILE="${OUTPUT_DIR}/benchmark_results_$(date +%Y%m%d_%H%M%S).json"

mkdir -p "${OUTPUT_DIR}"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting Bleu OS benchmarks..."

# Initialize results
cat > "${RESULTS_FILE}" << 'EOF'
{
  "timestamp": "",
  "system": {},
  "benchmarks": {}
}
EOF

TIMESTAMP=$(date -Iseconds)
SYSTEM_INFO=$(uname -a)

# Update results with timestamp
python3 << PYTHON
import json
with open("${RESULTS_FILE}", 'r') as f:
    results = json.load(f)
results['timestamp'] = "${TIMESTAMP}"
results['system']['uname'] = "${SYSTEM_INFO}"
with open("${RESULTS_FILE}", 'w') as f:
    json.dump(results, f, indent=2)
PYTHON

# Benchmark 1: Python import time
log "Benchmarking Python imports..."
IMPORT_TIME=$(python3 -c "
import time
start = time.time()
import numpy
import scipy
end = time.time()
print(f'{end - start:.4f}')
")
python3 << PYTHON
import json
with open("${RESULTS_FILE}", 'r') as f:
    results = json.load(f)
results['benchmarks']['python_imports'] = {
    'time_seconds': float("${IMPORT_TIME}"),
    'description': 'Time to import numpy and scipy'
}
with open("${RESULTS_FILE}", 'w') as f:
    json.dump(results, f, indent=2)
PYTHON
log "Python imports: ${IMPORT_TIME}s"

# Benchmark 2: Bleu.js initialization
if python3 -c "import bleujs" 2>/dev/null; then
    log "Benchmarking Bleu.js initialization..."
    BLEU_TIME=$(python3 << 'PYTHON'
import time
try:
    from bleujs import BleuJS
    start = time.time()
    bleu = BleuJS()
    end = time.time()
    print(f'{end - start:.4f}')
except Exception as e:
    print('999.9999')
PYTHON
    )
    python3 << PYTHON
import json
with open("${RESULTS_FILE}", 'r') as f:
    results = json.load(f)
results['benchmarks']['bleujs_init'] = {
    'time_seconds': float("${BLEU_TIME}"),
    'description': 'Time to initialize BleuJS'
}
with open("${RESULTS_FILE}", 'w') as f:
    json.dump(results, f, indent=2)
PYTHON
    log "Bleu.js init: ${BLEU_TIME}s"
fi

# Benchmark 3: Quantum library performance
if python3 -c "import qiskit" 2>/dev/null; then
    log "Benchmarking quantum circuit creation..."
    QUANTUM_TIME=$(python3 << 'PYTHON'
import time
try:
    from qiskit import QuantumCircuit
    start = time.time()
    qc = QuantumCircuit(4)
    qc.h(0)
    qc.cx(0, 1)
    qc.measure_all()
    end = time.time()
    print(f'{end - start:.4f}')
except Exception as e:
    print('999.9999')
PYTHON
    )
    python3 << PYTHON
import json
with open("${RESULTS_FILE}", 'r') as f:
    results = json.load(f)
results['benchmarks']['quantum_circuit'] = {
    'time_seconds': float("${QUANTUM_TIME}"),
    'description': 'Time to create a 4-qubit quantum circuit'
}
with open("${RESULTS_FILE}", 'w') as f:
    json.dump(results, f, indent=2)
PYTHON
    log "Quantum circuit: ${QUANTUM_TIME}s"
fi

# Benchmark 4: NumPy operations
log "Benchmarking NumPy operations..."
NUMPY_TIME=$(python3 << 'PYTHON'
import time
import numpy as np
start = time.time()
a = np.random.rand(1000, 1000)
b = np.random.rand(1000, 1000)
c = np.dot(a, b)
end = time.time()
print(f'{end - start:.4f}')
PYTHON
)
python3 << PYTHON
import json
with open("${RESULTS_FILE}", 'r') as f:
    results = json.load(f)
results['benchmarks']['numpy_operations'] = {
    'time_seconds': float("${NUMPY_TIME}"),
    'description': 'Time for 1000x1000 matrix multiplication'
}
with open("${RESULTS_FILE}", 'w') as f:
    json.dump(results, f, indent=2)
PYTHON
log "NumPy operations: ${NUMPY_TIME}s"

# Benchmark 5: System info
log "Collecting system information..."
CPU_INFO=$(lscpu | grep "Model name" | cut -d: -f2 | xargs || echo "unknown")
MEM_TOTAL=$(free -h | awk '/^Mem:/ {print $2}' || echo "unknown")
python3 << PYTHON
import json
with open("${RESULTS_FILE}", 'r') as f:
    results = json.load(f)
results['system']['cpu'] = "${CPU_INFO}"
results['system']['memory'] = "${MEM_TOTAL}"
with open("${RESULTS_FILE}", 'w') as f:
    json.dump(results, f, indent=2)
PYTHON

log "Benchmarks complete!"
log "Results saved to: ${RESULTS_FILE}"

# Display summary
echo ""
echo "=========================================="
echo "Benchmark Summary"
echo "=========================================="
python3 << 'PYTHON'
import json
with open("${RESULTS_FILE}", 'r') as f:
    results = json.load(f)

print(f"Timestamp: {results['timestamp']}")
print(f"CPU: {results['system'].get('cpu', 'unknown')}")
print(f"Memory: {results['system'].get('memory', 'unknown')}")
print("\nBenchmark Results:")
for name, data in results['benchmarks'].items():
    print(f"  {name}: {data['time_seconds']:.4f}s - {data['description']}")
PYTHON
