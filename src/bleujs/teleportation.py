"""
Quantum teleportation circuits for Bleu.js.

Part of the Bleu.js quantum-enhanced AI platform. Implements the standard
three-qubit teleportation protocol: transfer a qubit state using entanglement
plus classical communication (IBM's definition). This is quantum *information*
transfer—not matter or object teleportation.

Use with the Bleu.js CLI: ``bleu quantum teleport`` (simulator or IBM Quantum).
Cloud API and docs: https://bleujs.org

Research
--------
The protocol follows the canonical construction of Bennett et al. (1993).
Use :func:`teleportation_fidelity_report` to compare simulated or hardware
outcomes with the ideal state for reproducibility in studies.

References
----------
.. [1] Bennett, C. H., Brassard, G., Crépeau, C., Jozsa, R., Peres, A., &
       Wootters, W. K. (1993). Teleporting an unknown quantum state via
       dual classical and Einstein-Podolsky-Rosen channels.
       *Physical Review Letters*, 70(13), 1895–1899.

Requires: pip install 'bleu-js[quantum]'
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from qiskit import QuantumCircuit


def build_teleportation_circuit(theta: float = 1.234) -> "QuantumCircuit":
    """
    Build the standard three-qubit teleportation circuit (Bleu.js / IBM layout).

    Teleport the state prepared on q0 onto q2. The source state is
    Ry(theta)|0> on q0. Uses a Bell pair between q1 and q2, Bell measurement
    on q0 and q1, and classical feed-forward corrections on q2. Compatible
    with Qiskit simulators and IBM Quantum hardware (dynamic circuits).

    Args:
        theta: Angle for source state preparation via Ry(theta)|0>.

    Returns:
        QuantumCircuit: The teleportation circuit (3 qubits, 3 classical bits).

    Example:
        >>> from bleujs.teleportation import build_teleportation_circuit
        >>> qc = build_teleportation_circuit(theta=1.234)
        >>> print(qc.draw())

    See also:
        https://bleujs.org — Bleu.js cloud API and documentation.
    """
    from qiskit import ClassicalRegister, QuantumCircuit, QuantumRegister

    q = QuantumRegister(3, "q")
    m0 = ClassicalRegister(1, "m0")
    m1 = ClassicalRegister(1, "m1")
    out = ClassicalRegister(1, "out")

    qc = QuantumCircuit(q, m0, m1, out)

    # Prepare source state on q0
    qc.ry(theta, q[0])

    # Create Bell pair between q1 and q2
    qc.h(q[1])
    qc.cx(q[1], q[2])

    # Bell measurement on q0 and q1
    qc.cx(q[0], q[1])
    qc.h(q[0])

    qc.measure(q[0], m0[0])
    qc.measure(q[1], m1[0])

    # Classical feed-forward corrections
    with qc.if_test((m1[0], 1)):
        qc.x(q[2])

    with qc.if_test((m0[0], 1)):
        qc.z(q[2])

    qc.measure(q[2], out[0])
    return qc


def run_teleportation_simulator(
    theta: float = 1.234,
    shots: int = 2048,
):
    """
    Run the teleportation circuit on a local Qiskit Aer simulator.

    Use this to verify the circuit before running on IBM Quantum hardware.
    Requires ``qiskit-aer`` (install with ``pip install 'bleu-js[quantum]'``
    or ``pip install qiskit-aer``).

    Args:
        theta: Angle for source state Ry(theta)|0>.
        shots: Number of measurement shots.

    Returns:
        dict: With keys ``"counts"`` (measurement counts), ``"circuit"`` (QuantumCircuit).

    Example:
        >>> from bleujs.teleportation import run_teleportation_simulator
        >>> out = run_teleportation_simulator(theta=0.9, shots=1024)
        >>> print(out["counts"])
    """
    from qiskit_aer import AerSimulator

    qc = build_teleportation_circuit(theta=theta)
    sim = AerSimulator()
    result = sim.run(qc, shots=shots).result()
    counts = result.get_counts()
    return {"counts": counts, "circuit": qc}


def teleportation_fidelity_report(
    thetas: list[float] | None = None,
    shots: int = 4096,
) -> dict[str, object]:
    """
    Run teleportation at multiple angles and report outcome statistics for research.

    Useful for studies comparing simulator vs hardware, or for documenting
    reproducibility. The source state is Ry(theta)|0>; ideal teleportation
    leaves the destination qubit in that state. This function runs the
    simulator and returns counts per theta so you can compute empirical
    probabilities and compare with theory (e.g. |<0|psi>|^2, |<1|psi>|^2).

    Args:
        thetas: Angles for Ry(theta)|0>. Defaults to [0, 0.5, 1.0, 1.234, 1.57].
        shots: Shots per circuit.

    Returns:
        dict with keys: thetas, results (list of counts per theta), circuits (list of circuits).

    Example:
        >>> from bleujs.teleportation import teleportation_fidelity_report
        >>> report = teleportation_fidelity_report(thetas=[0, 1.57], shots=2048)
        >>> for t, c in zip(report["thetas"], report["results"]):
        ...     print(f"theta={t}: {c}")
    """
    if thetas is None:
        thetas = [0.0, 0.5, 1.0, 1.234, 1.57]
    results = []
    circuits = []
    for theta in thetas:
        out = run_teleportation_simulator(theta=theta, shots=shots)
        results.append(out["counts"])
        circuits.append(out["circuit"])
    return {"thetas": thetas, "results": results, "circuits": circuits}
