"""Teleportation count readout and IBM backend selection. No live IBM calls."""

import math

import pytest

from bleujs.ibm_runtime import (
    _counts_from_data,
    _extract_counts_from_primitive_result,
    ibm_token_from_env,
    runtime_job_id,
    select_teleportation_backend,
    supports_dynamic_circuits,
)
from bleujs.teleportation import teleported_bit_counts, z_basis_agreement


class _Bits:
    def __init__(self, values):
        self._values = values

    def get_bitstrings(self):
        return self._values


class _Data:
    def __init__(self, **registers):
        for name, values in registers.items():
            setattr(self, name, _Bits(values))


class _Pub:
    def __init__(self, data):
        self.data = data


class _Target:
    def __init__(self, names):
        self.operation_names = names


class _Backend:
    def __init__(self, name, dynamic):
        self.name = name
        names = ["if_else", "x"] if dynamic else ["x", "cz"]
        self.target = _Target(names)


class _Service:
    def __init__(self, dynamic_names=("ibm_dynamic",)):
        self.dynamic_names = set(dynamic_names)
        self.least_busy_kwargs = None

    def backend(self, name):
        return _Backend(name, name in self.dynamic_names)

    def least_busy(self, **kwargs):
        self.least_busy_kwargs = kwargs
        predicate = kwargs["filters"]
        backend = _Backend("ibm_dynamic", True)
        assert predicate(backend)
        assert not predicate(_Backend("ibm_heron", False))
        return backend


def test_counts_use_out_m1_m0_not_meas():
    data = _Data(out=["1", "0"], m1=["1", "0"], m0=["0", "1"])
    counts = _extract_counts_from_primitive_result([_Pub(data)])
    assert counts == {"1 1 0": 1, "0 0 1": 1}
    assert teleported_bit_counts(counts) == {"0": 1, "1": 1}


def test_meas_register_still_counts_when_named_registers_are_absent():
    data = _Data(meas=["00", "11", "00"])
    assert _counts_from_data(data) == {"00": 2, "11": 1}


def test_output_bit_matches_ry_probabilities():
    perfect = z_basis_agreement(0.0, {"0 0 0": 100})
    assert perfect["hellinger_fidelity"] == pytest.approx(1.0)
    assert perfect["ideal_p1"] == pytest.approx(0.0)

    flipped = z_basis_agreement(math.pi, {"1 0 0": 50})
    assert flipped["p1"] == pytest.approx(1.0)
    assert flipped["hellinger_fidelity"] == pytest.approx(1.0)


def test_backend_must_support_dynamic_corrections():
    service = _Service()
    chosen = select_teleportation_backend(service)
    assert chosen.name == "ibm_dynamic"
    assert service.least_busy_kwargs["min_num_qubits"] == 3
    assert supports_dynamic_circuits(chosen)

    with pytest.raises(ValueError, match="if_else"):
        select_teleportation_backend(service, backend_name="ibm_heron")


def test_job_id_accepts_method_or_property():
    class MethodJob:
        def job_id(self):
            return "job-method"

    class PropertyJob:
        job_id = "job-property"

    assert runtime_job_id(MethodJob()) == "job-method"
    assert runtime_job_id(PropertyJob()) == "job-property"


def test_token_accepts_either_env_name(monkeypatch):
    monkeypatch.delenv("QISKIT_IBM_TOKEN", raising=False)
    monkeypatch.delenv("IBM_QUANTUM_API_TOKEN", raising=False)
    assert ibm_token_from_env() is None
    monkeypatch.setenv("IBM_QUANTUM_API_TOKEN", "  platform-token  ")
    assert ibm_token_from_env() == "platform-token"
