"""Tests for quantum error correction implementation."""

import numpy as np
import pytest
from qiskit import QuantumCircuit
from qiskit.providers.aer.noise import NoiseModel

from src.quantum.error_correction.stabilizer import StabilizerCode
from src.quantum.error_correction.syndrome import SyndromeMeasurement
from src.quantum.error_correction.recovery import ErrorRecovery


@pytest.mark.quantum
@pytest.mark.quantum_simulator
class TestQuantumErrorCorrection:
    """Test suite for quantum error correction."""

    @pytest.fixture
    def stabilizer_code(self):
        """Create a basic stabilizer code instance."""
        return StabilizerCode(
            num_data_qubits=1,
            num_ancilla_qubits=2
        )

    @pytest.fixture
    def syndrome_measurement(self):
        """Create a syndrome measurement instance."""
        return SyndromeMeasurement()

    @pytest.fixture
    def error_recovery(self):
        """Create an error recovery instance."""
        return ErrorRecovery()

    @pytest.fixture
    def noise_model(self):
        """Create a simple noise model for testing."""
        noise_model = NoiseModel()
        # Add bit-flip noise
        noise_model.add_all_qubit_quantum_error(
            [([{"name": "x", "qubits": [0]}], 0.1)],
            "id",
        )
        return noise_model

    def test_stabilizer_encoding(self, stabilizer_code):
        """Test quantum state encoding using stabilizer code."""
        # Prepare logical |0⟩ state
        circuit = stabilizer_code.encode_state(basis_state=0)
        assert isinstance(circuit, QuantumCircuit)
        assert circuit.num_qubits == 3  # 1 data + 2 ancilla

    def test_syndrome_measurement(self, stabilizer_code, syndrome_measurement):
        """Test syndrome measurement process."""
        # Encode state and measure syndrome
        encoded_circuit = stabilizer_code.encode_state(basis_state=0)
        syndrome = syndrome_measurement.measure(encoded_circuit)
        
        # Verify syndrome format
        assert isinstance(syndrome, list)
        assert all(isinstance(x, int) for x in syndrome)
        assert len(syndrome) == 2  # Two syndrome bits for bit-flip code

    def test_error_detection(self, stabilizer_code, syndrome_measurement, noise_model):
        """Test error detection capabilities."""
        # Prepare noisy state
        circuit = stabilizer_code.encode_state(basis_state=0)
        noisy_circuit = circuit.copy()
        noisy_circuit.x(0)  # Manually introduce error
        
        # Measure syndrome
        syndrome = syndrome_measurement.measure(noisy_circuit)
        assert syndrome != [0, 0]  # Should detect error

    def test_error_recovery(self, stabilizer_code, syndrome_measurement, error_recovery):
        """Test error recovery process."""
        # Prepare erroneous state
        circuit = stabilizer_code.encode_state(basis_state=0)
        circuit.x(0)  # Introduce error
        
        # Measure syndrome and recover
        syndrome = syndrome_measurement.measure(circuit)
        recovered_circuit = error_recovery.correct_errors(circuit, syndrome)
        
        # Verify recovery
        final_syndrome = syndrome_measurement.measure(recovered_circuit)
        assert final_syndrome == [0, 0]  # Should be error-free

    def test_logical_operations(self, stabilizer_code):
        """Test logical operations on encoded states."""
        # Prepare logical states
        zero_state = stabilizer_code.encode_state(basis_state=0)
        one_state = stabilizer_code.encode_state(basis_state=1)
        
        # Apply logical X gate
        logical_x = stabilizer_code.logical_x()
        zero_state.compose(logical_x, inplace=True)
        
        # Verify transformation
        decoded_state = stabilizer_code.decode_state(zero_state)
        assert decoded_state == 1  # |0⟩ -> |1⟩

    @pytest.mark.quantum_benchmark
    def test_error_correction_performance(
        self,
        stabilizer_code,
        syndrome_measurement,
        error_recovery,
        noise_model,
        quantum_test_utils
    ):
        """Test performance of error correction under noise."""
        num_trials = 100
        success_count = 0
        
        for _ in range(num_trials):
            # Prepare and encode state
            circuit = stabilizer_code.encode_state(basis_state=0)
            
            # Apply noise
            noisy_circuit = circuit.copy()
            noisy_circuit.x(0)  # Introduce error with probability
            
            # Perform correction
            syndrome = syndrome_measurement.measure(noisy_circuit)
            recovered_circuit = error_recovery.correct_errors(noisy_circuit, syndrome)
            
            # Check if correction was successful
            final_syndrome = syndrome_measurement.measure(recovered_circuit)
            if final_syndrome == [0, 0]:
                success_count += 1
        
        success_rate = success_count / num_trials
        assert success_rate > 0.85  # Expect >85% success rate 