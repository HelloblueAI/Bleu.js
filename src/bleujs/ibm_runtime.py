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

IBM_QUANTUM_PLATFORM_CHANNEL = "ibm_quantum_platform"
LEGACY_IBM_QUANTUM_CHANNEL = "ibm_quantum"


def ibm_token_from_env() -> str | None:
    """Return the IBM token from either env name the CLI and runtime accept."""
    token = os.environ.get("QISKIT_IBM_TOKEN") or os.environ.get(
        "IBM_QUANTUM_API_TOKEN"
    )
    token = token.strip() if token else ""
    return token or None


def supports_dynamic_circuits(backend: Any) -> bool:
    """True when the backend can apply the measurement-conditioned corrections."""
    target = getattr(backend, "target", None)
    names = getattr(target, "operation_names", None)
    if names is None:
        return False
    return "if_else" in names


def select_teleportation_backend(service: Any, backend_name: str | None = None) -> Any:
    """Pick a 3-qubit backend that can run the dynamic X/Z corrections."""
    if backend_name:
        backend = service.backend(backend_name)
        if not supports_dynamic_circuits(backend):
            name = getattr(backend, "name", backend_name)
            raise ValueError(
                f"{name} cannot run measurement-conditioned corrections. "
                "Pick a backend whose target includes if_else."
            )
        return backend

    try:
        return service.least_busy(
            operational=True,
            simulator=False,
            min_num_qubits=3,
            filters=supports_dynamic_circuits,
        )
    except TypeError:
        backends = service.backends(operational=True, simulator=False, min_num_qubits=3)
        matches = [
            backend for backend in backends if supports_dynamic_circuits(backend)
        ]
        if not matches:
            raise ValueError(
                "No operational IBM backend with at least 3 qubits supports dynamic "
                "circuits. Teleportation needs if_else for the X and Z corrections."
            ) from None
        return matches[0]
    except Exception as exc:
        if type(exc).__name__ == "QiskitBackendNotFoundError":
            raise ValueError(
                "No operational IBM backend with at least 3 qubits supports dynamic "
                "circuits. Teleportation needs if_else for the X and Z corrections."
            ) from exc
        raise


def open_runtime_service(token: str, instance: str | None = None) -> Any:
    """Connect to the current IBM Quantum platform, then the retired channel."""
    from qiskit_ibm_runtime import QiskitRuntimeService

    kwargs: dict[str, Any] = {"token": token}
    if instance:
        kwargs["instance"] = instance
    try:
        return QiskitRuntimeService(channel=IBM_QUANTUM_PLATFORM_CHANNEL, **kwargs)
    except Exception as exc:
        if not _is_unsupported_platform_channel_error(exc):
            raise
        return QiskitRuntimeService(channel=LEGACY_IBM_QUANTUM_CHANNEL, **kwargs)


def _is_unsupported_platform_channel_error(exc: Exception) -> bool:
    """Return True for old runtimes rejecting the new IBM platform channel."""
    recoverable_types = {"InvalidAccountError", "IBMInputValueError"}
    if not isinstance(exc, (TypeError, ValueError)) and (
        type(exc).__name__ not in recoverable_types
    ):
        return False
    text = str(exc).lower()
    return "channel" in text or IBM_QUANTUM_PLATFORM_CHANNEL in text


def runtime_job_id(job: Any) -> str:
    """Read a job id whether the runtime exposes a method or a property."""
    raw = getattr(job, "job_id", None)
    if callable(raw):
        raw = raw()
    if not raw:
        raise RuntimeError("IBM Quantum job finished without a job id")
    return str(raw)


def _bitstrings_from_register(register: Any) -> list[str] | None:
    if register is None or not hasattr(register, "get_bitstrings"):
        return None
    bits: list[str] = []
    for raw in register.get_bitstrings():
        if isinstance(raw, str):
            bits.append(raw.strip())
        else:
            bits.append("".join(str(bit) for bit in raw))
    return bits


def _counts_from_data(data: Any) -> dict[str, int]:
    """Read SamplerV2 registers. This circuit uses out, m1, and m0, not meas."""
    counts: dict[str, int] = {}
    named: list[list[str]] = []
    for name in ("out", "m1", "m0"):
        bits = _bitstrings_from_register(getattr(data, name, None))
        if bits is not None:
            named.append(bits)
    if len(named) == 3 and len({len(bits) for bits in named}) == 1 and named[0]:
        for shot in zip(*named, strict=True):
            key = " ".join(shot)
            counts[key] = counts.get(key, 0) + 1
        return counts

    fallback = getattr(data, "meas", None)
    if fallback is None and hasattr(data, "get_bitstrings"):
        fallback = data
    bits = _bitstrings_from_register(fallback)
    if not bits:
        return counts
    for bit in bits:
        counts[bit] = counts.get(bit, 0) + 1
    return counts


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
        QISKIT_IBM_TOKEN or IBM_QUANTUM_API_TOKEN: IBM Quantum API token (required).
        QISKIT_IBM_INSTANCE or IBM_QUANTUM_INSTANCE_CRN: Instance CRN (optional).

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
    token = ibm_token_from_env()
    if not token:
        raise ValueError(
            "QISKIT_IBM_TOKEN or IBM_QUANTUM_API_TOKEN is not set. "
            "Get a token at https://quantum.ibm.com and set the environment variable."
        )

    from qiskit import transpile
    from qiskit_ibm_runtime import SamplerV2 as Sampler

    from .teleportation import build_teleportation_circuit, z_basis_agreement

    instance = os.environ.get("QISKIT_IBM_INSTANCE") or os.environ.get(
        "IBM_QUANTUM_INSTANCE_CRN"
    )
    service = open_runtime_service(token, instance or None)
    backend = select_teleportation_backend(service, backend_name)

    qc = build_teleportation_circuit(theta=theta)
    compiled = transpile(qc, backend=backend)

    sampler = Sampler(mode=backend)
    job = sampler.run([compiled], shots=shots)
    prim_result = job.result()

    counts = _extract_counts_from_primitive_result(prim_result)
    outcome = None
    if counts:
        outcome = z_basis_agreement(theta, counts)

    return {
        "backend": backend.name,
        "job_id": runtime_job_id(job),
        "result": prim_result,
        "counts": counts,
        "outcome": outcome,
    }


def _extract_counts_from_primitive_result(prim_result: Any) -> dict[str, int] | None:
    """Build counts from SamplerV2 registers named out, m1, and m0."""
    counts: dict[str, int] = {}
    try:
        pubs = list(prim_result)
    except TypeError:
        return None
    for pub_result in pubs:
        data = getattr(pub_result, "data", None)
        if data is None:
            continue
        for key, shots in _counts_from_data(data).items():
            counts[key] = counts.get(key, 0) + shots
    return counts or None
