import pytest
import numpy as np
from ..processor import QuantumProcessor
from ..types import (
    QuantumGate, QuantumBackend, GateType, MeasurementBasis,
    ErrorSeverity
)

@pytest.fixture
async def processor():
    backend = QuantumBackend(
        name='simulator',
        capabilities={
            'max_qubits': 8,
            'gate_types': [gt.value for gt in GateType],
            'error_rates': {},
            'coherence_time': 1000.0
        }
    )
    
    processor = QuantumProcessor({
        'max_qubits': 4,
        'backend': backend,
        'error_correction': True,
        'optimization_level': 'optimal'
    })
    
    await processor.initialize()
    yield processor
    await processor.cleanup()

@pytest.mark.asyncio
async def test_quantum_superposition(processor):
    """Test creation and maintenance of superposition states."""
    # Create superposition using Hadamard gate
    await processor.apply_gate(QuantumGate(type=GateType.H, target=0))
    
    state = processor.get_state()
    qubit = state.qubits[0]
    
    # Verify superposition state
    assert np.isclose(np.abs(qubit.state[0]), 1 / np.sqrt(2), atol=1e-6)
    assert np.isclose(np.abs(qubit.state[1]), 1 / np.sqrt(2), atol=1e-6)
    
    # Verify coherence is maintained
    assert qubit.coherence > 0.9

@pytest.mark.asyncio
async def test_multiple_qubit_superposition(processor):
    """Test handling multiple qubit superposition."""
    # Create superposition on multiple qubits
    await processor.apply_gate(QuantumGate(type=GateType.H, target=0))
    await processor.apply_gate(QuantumGate(type=GateType.H, target=1))
    
    state = processor.get_state()
    
    # Verify both qubits are in superposition
    assert np.isclose(np.abs(state.qubits[0].state[0]), 1 / np.sqrt(2), atol=1e-6)
    assert np.isclose(np.abs(state.qubits[1].state[0]), 1 / np.sqrt(2), atol=1e-6)

@pytest.mark.asyncio
async def test_quantum_entanglement(processor):
    """Test creation and maintenance of entangled states."""
    # Create Bell state using Hadamard and CNOT
    await processor.apply_gate(QuantumGate(type=GateType.H, target=1))
    await processor.apply_gate(QuantumGate(type=GateType.CNOT, target=1, control=0))
    
    state = processor.get_state()
    
    # Verify entanglement
    assert state.entanglement.get('0,1', 0) > 0.8

@pytest.mark.asyncio
async def test_entanglement_preservation(processor):
    """Test maintaining entanglement under operations."""
    # Create entangled state
    await processor.apply_gate(QuantumGate(type=GateType.H, target=1))
    await processor.apply_gate(QuantumGate(type=GateType.CNOT, target=1, control=0))
    
    # Apply operations that preserve entanglement
    await processor.apply_gate(QuantumGate(type=GateType.X, target=0))
    
    state = processor.get_state()
    assert state.entanglement.get('0,1', 0) > 0.8

@pytest.mark.asyncio
async def test_error_correction(processor):
    """Test detection and correction of quantum errors."""
    # Apply gate with high error rate
    await processor.apply_gate(QuantumGate(
        type=GateType.X,
        target=0,
        error_rate=0.2
    ))
    
    state = processor.get_state()
    assert state.qubits[0].error_rate < 0.2

@pytest.mark.asyncio
async def test_state_fidelity(processor):
    """Test maintaining state fidelity under errors."""
    # Create superposition
    await processor.apply_gate(QuantumGate(type=GateType.H, target=0))
    
    # Apply noisy operations
    for _ in range(5):
        await processor.apply_gate(QuantumGate(
            type=GateType.X,
            target=0,
            error_rate=0.1
        ))
    
    state = processor.get_state()
    assert state.qubits[0].coherence > 0.8

@pytest.mark.asyncio
async def test_measurements(processor):
    """Test measurements in different bases."""
    # Prepare state
    await processor.apply_gate(QuantumGate(type=GateType.H, target=0))
    
    # Measure in different bases
    results = await asyncio.gather(
        processor.measure(0, MeasurementBasis.COMPUTATIONAL),
        processor.measure(0, MeasurementBasis.HADAMARD),
        processor.measure(0, MeasurementBasis.PHASE)
    )
    
    # Verify measurements are valid
    for result in results:
        assert result in [0, 1]

@pytest.mark.asyncio
async def test_measurement_statistics(processor):
    """Test maintaining measurement statistics."""
    # Prepare state
    await processor.apply_gate(QuantumGate(type=GateType.H, target=0))
    
    # Perform multiple measurements
    measurements = []
    for _ in range(100):
        measurements.append(await processor.measure(0))
    
    # Verify approximately 50/50 distribution
    ones = sum(1 for m in measurements if m == 1)
    assert abs(ones - 50) < 20

@pytest.mark.asyncio
async def test_circuit_optimization(processor):
    """Test quantum circuit optimization."""
    # Create a complex circuit
    await processor.apply_gate(QuantumGate(type=GateType.H, target=0))
    await processor.apply_gate(QuantumGate(type=GateType.X, target=1))
    await processor.apply_gate(QuantumGate(type=GateType.CNOT, target=1, control=0))
    await processor.apply_gate(QuantumGate(type=GateType.Z, target=2))
    
    # Optimize circuit
    await processor.optimize()
    
    state = processor.get_state()
    assert state.qubits[0].coherence > 0.8

@pytest.mark.asyncio
async def test_circuit_fidelity(processor):
    """Test maintaining circuit fidelity during optimization."""
    # Create initial state
    await processor.apply_gate(QuantumGate(type=GateType.H, target=0))
    initial_state = processor.get_state()
    
    # Apply and optimize complex circuit
    await processor.apply_gate(QuantumGate(type=GateType.X, target=1))
    await processor.apply_gate(QuantumGate(type=GateType.CNOT, target=1, control=0))
    await processor.optimize()
    
    final_state = processor.get_state()
    assert np.abs(final_state.qubits[0].state[0] - initial_state.qubits[0].state[0]) < 0.1

@pytest.mark.asyncio
async def test_state_coherence(processor):
    """Test maintaining quantum state coherence."""
    # Create complex quantum state
    await processor.apply_gate(QuantumGate(type=GateType.H, target=0))
    await processor.apply_gate(QuantumGate(type=GateType.CNOT, target=1, control=0))
    await processor.apply_gate(QuantumGate(type=GateType.H, target=2))
    
    # Apply multiple operations
    for _ in range(10):
        await processor.apply_gate(QuantumGate(type=GateType.X, target=0))
    
    state = processor.get_state()
    for qubit in state.qubits:
        assert qubit.coherence > 0.8

@pytest.mark.asyncio
async def test_state_transitions(processor):
    """Test handling quantum state transitions."""
    # Create initial state
    await processor.apply_gate(QuantumGate(type=GateType.H, target=0))
    
    # Apply sequence of gates
    gates = [
        QuantumGate(type=GateType.X, target=0),
        QuantumGate(type=GateType.Y, target=0),
        QuantumGate(type=GateType.Z, target=0)
    ]
    
    for gate in gates:
        await processor.apply_gate(gate)
    
    state = processor.get_state()
    assert state.qubits[0].coherence > 0.8 