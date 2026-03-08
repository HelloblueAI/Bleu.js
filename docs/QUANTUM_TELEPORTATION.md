# Quantum Teleportation in Bleu.js

Bleu.js implements the **standard three-qubit quantum teleportation protocol** as part of its quantum-enhanced AI platform. This document describes the protocol, how to use it (Python API and CLI), and how to use it in **research and reproducibility studies**.

## What is quantum teleportation?

Quantum teleportation transfers an **unknown qubit state** from one place to another using:

1. **Entanglement** — a shared Bell pair between sender and receiver
2. **Classical communication** — two classical bits from a Bell measurement
3. **Conditional corrections** — Pauli X/Z on the receiver qubit depending on those bits

The protocol does **not** teleport matter or objects; it teleports **quantum information** (the qubit state). The original qubit is destroyed in the process (no-cloning).

## Research and citations

The implementation follows the canonical construction from:

> **Bennett, C. H., Brassard, G., Crépeau, C., Jozsa, R., Peres, A., & Wootters, W. K. (1993).**
> Teleporting an unknown quantum state via dual classical and Einstein-Podolsky-Rosen channels.
> *Physical Review Letters*, **70**(13), 1895–1899.

For papers or reports that use Bleu.js teleportation, you can cite:

- **Software:** Bleu.js (quantum-enhanced AI platform), https://github.com/HelloblueAI/Bleu.js
- **Protocol:** Bennett et al. (1993), *Phys. Rev. Lett.* 70, 1895

## Circuit layout (Bleu.js / IBM)

- **q0:** Source qubit — state to teleport is prepared as Ry(θ)|0⟩
- **q1, q2:** Bell pair (q1 at sender, q2 at receiver)
- Bell measurement on q0, q1 → two classical bits
- Classical feed-forward: apply X on q2 if bit1=1, Z on q2 if bit0=1
- Final measurement on q2 gives the teleported state outcome

The circuit uses **dynamic circuits** (measurement-conditioned gates) and is compatible with Qiskit Aer and IBM Quantum backends that support them.

## Installation

```bash
# Simulator (local)
pip install 'bleu-js[quantum]'

# IBM Quantum hardware (optional)
pip install 'bleu-js[ibm]'
# or
pip install qiskit-ibm-runtime
```

## Python API

### Build and run locally (simulator)

```python
from bleujs.teleportation import (
    build_teleportation_circuit,
    run_teleportation_simulator,
    teleportation_fidelity_report,
)

# Build circuit (theta = 1.234 radians for source state Ry(θ)|0⟩)
qc = build_teleportation_circuit(theta=1.234)
print(qc.draw())

# Run on Aer simulator
out = run_teleportation_simulator(theta=1.234, shots=2048)
print(out["counts"])
```

### Run on IBM Quantum

```python
import os
os.environ["QISKIT_IBM_TOKEN"] = "your-token"  # from https://quantum.ibm.com
# Optional: os.environ["QISKIT_IBM_INSTANCE"] = "ibm-q/open/main"

from bleujs.ibm_runtime import run_teleportation_on_ibm

result = run_teleportation_on_ibm(theta=0.9, shots=1024)
print(result["backend"], result["job_id"], result.get("counts"))
```

### Research: fidelity report over multiple angles

Use `teleportation_fidelity_report` to run the protocol at several angles and collect counts for reproducibility or comparison with theory:

```python
from bleujs.teleportation import teleportation_fidelity_report

report = teleportation_fidelity_report(
    thetas=[0, 0.5, 1.0, 1.234, 1.57],
    shots=4096,
)
for theta, counts in zip(report["thetas"], report["results"]):
    print(f"θ = {theta}: {counts}")
# Compare with ideal |⟨0|ψ⟩|², |⟨1|ψ⟩|² for Ry(θ)|0⟩
```

## CLI

```bash
# Local simulator (default)
bleu quantum teleport
bleu quantum teleport --theta 0.9 --shots 1024
bleu quantum teleport --draw          # print circuit
bleu quantum teleport --json          # machine-readable output

# IBM Quantum hardware
export QISKIT_IBM_TOKEN=your-token
bleu quantum teleport --ibm --shots 1024
```

## Links

- **Bleu.js:** https://bleujs.org
- **GitHub:** https://github.com/HelloblueAI/Bleu.js
- **IBM Quantum:** https://quantum.ibm.com
