"""Tests for Bleu.js quantum teleportation (requires bleu-js[quantum])."""

import pytest

qiskit = pytest.importorskip("qiskit")
aer = pytest.importorskip(
    "qiskit_aer", reason="qiskit-aer required for teleportation tests"
)


def test_build_teleportation_circuit():
    """Teleportation circuit has 3 qubits and correct structure."""
    from bleujs.teleportation import build_teleportation_circuit

    qc = build_teleportation_circuit(theta=1.234)
    assert qc.num_qubits == 3
    assert qc.num_clbits == 3
    # Should contain ry, h, cx, measure, and conditional gates
    names = [instr.operation.name for instr in qc.data]
    assert "ry" in names
    assert "h" in names
    assert "cx" in names
    assert "measure" in names


def test_run_teleportation_simulator():
    """Simulator returns counts and circuit."""
    from bleujs.teleportation import run_teleportation_simulator

    out = run_teleportation_simulator(theta=0.5, shots=256)
    assert "counts" in out
    assert "circuit" in out
    assert isinstance(out["counts"], dict)
    assert sum(out["counts"].values()) == 256


def test_teleportation_fidelity_report():
    """Fidelity report runs at multiple thetas."""
    from bleujs.teleportation import teleportation_fidelity_report

    report = teleportation_fidelity_report(thetas=[0.0, 1.0], shots=128)
    assert report["thetas"] == [0.0, 1.0]
    assert len(report["results"]) == 2
    assert len(report["circuits"]) == 2
