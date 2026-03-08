"""
IBM Quantum runtime integration for Bleu.js.

Run Bleu.js quantum circuits (e.g. teleportation) on IBM Quantum hardware
via qiskit-ibm-runtime. Requires QISKIT_IBM_TOKEN and optionally
QISKIT_IBM_INSTANCE.

Install: pip install 'bleu-js[quantum]' and pip install 'bleu-js[ibm]'
         (or pip install qiskit-ibm-runtime)
Docs: https://bleujs.org
"""

from __future__ import annotations

import os
from typing import Any


def run_teleportation_on_ibm(
    theta: float = 1.234,
    shots: int = 1024,
    *,
    backend_name: str | None = None,
) -> dict[str, Any]:
    """
    Run the Bleu.js teleportation circuit on IBM Quantum hardware.

    Uses the least-busy operational backend with at least 3 qubits and
    support for dynamic circuits (measurement-conditioned gates), unless
    backend_name is specified.

    Environment:
        QISKIT_IBM_TOKEN: IBM Quantum API token (required).
        QISKIT_IBM_INSTANCE: Instance path, e.g. ibm-q/open/main (optional).

    Args:
        theta: Angle for source state Ry(theta)|0>.
        shots: Number of measurement shots.
        backend_name: Optional backend name; if not set, least_busy is used.

    Returns:
        dict with keys: backend, job_id, result (PrimitiveResult),
        counts (derived from result for convenience).

    Raises:
        ImportError: If qiskit-ibm-runtime is not installed.
        ValueError: If QISKIT_IBM_TOKEN is not set.

    Example:
        >>> import os
        >>> os.environ["QISKIT_IBM_TOKEN"] = "..."
        >>> from bleujs.ibm_runtime import run_teleportation_on_ibm
        >>> out = run_teleportation_on_ibm(theta=0.9, shots=1024)
        >>> print(out["backend"], out["job_id"])
    """
    token = os.environ.get("QISKIT_IBM_TOKEN")
    if not token:
        raise ValueError(
            "QISKIT_IBM_TOKEN is not set. "
            "Get a token at https://quantum.ibm.com and set the environment variable."
        )

    from qiskit import transpile
    from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2 as Sampler

    from .teleportation import build_teleportation_circuit

    instance = os.environ.get("QISKIT_IBM_INSTANCE")
    service = QiskitRuntimeService(
        channel="ibm_quantum",
        token=token,
        instance=instance or None,
    )

    if backend_name:
        backend = service.backend(backend_name)
    else:
        backend = service.least_busy(
            operational=True,
            simulator=False,
            min_num_qubits=3,
        )

    qc = build_teleportation_circuit(theta=theta)
    compiled = transpile(qc, backend=backend)

    sampler = Sampler(mode=backend)
    job = sampler.run([compiled], shots=shots)
    prim_result = job.result()

    # Best-effort extraction of counts from PrimitiveResult (V2 format may vary)
    counts = _extract_counts_from_primitive_result(prim_result)

    return {
        "backend": backend.name,
        "job_id": job.job_id(),
        "result": prim_result,
        "counts": counts,
    }


def _extract_counts_from_primitive_result(prim_result: Any) -> dict[str, int] | None:
    """Try to build a counts dict from qiskit.primitives PrimitiveResult."""
    counts: dict[str, int] = {}
    try:
        for pub_result in prim_result:
            if not hasattr(pub_result, "data"):
                continue
            data = pub_result.data
            if hasattr(data, "meas"):
                meas = data.meas
                if hasattr(meas, "get_bitstrings"):
                    for bs in meas.get_bitstrings():
                        key = "".join(str(b) for b in bs)
                        counts[key] = counts.get(key, 0) + 1
            if hasattr(data, "get_bitstrings"):
                for bs in data.get_bitstrings():
                    key = "".join(str(b) for b in bs)
                    counts[key] = counts.get(key, 0) + 1
    except Exception:
        pass
    return counts if counts else None
