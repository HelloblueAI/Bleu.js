"""
Quantum-Enhanced Feature Fusion Module
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np
import tensorflow as tf
from qiskit import ClassicalRegister
from qiskit import QuantumCircuit as QiskitCircuit
from qiskit import QuantumRegister


@dataclass
class QuantumFusionConfig:
    """Configuration for quantum feature fusion."""

    num_qubits: int = 4
    feature_dims: Optional[List[int]] = None
    fusion_dim: int = 2048
    num_layers: int = 3
    dropout_rate: float = 0.1
    use_entanglement: bool = True
    use_superposition: bool = True
    use_adaptive_fusion: bool = True
    rotation_angle: float = np.pi / 4


class QuantumFusion:
    """Quantum-enhanced feature fusion with adaptive weighting."""

    def __init__(self, config: Optional[QuantumFusionConfig] = None):
        self.config = config or QuantumFusionConfig()
        if self.config.feature_dims is None:
            self.config.feature_dims = [2048, 1024, 512]
        self.logger = logging.getLogger(__name__)
        self.quantum_circuit = None
        self.qr = None
        self.cr = None
        self.initialized = False
        self.rng = np.random.default_rng(seed=42)  # Fixed seed for reproducibility
        self.backend = None
        self._state_cache = {}  # Cache for quantum state reshaping
        self._build_quantum_circuit()
        self._build_fusion_layers()

    def __del__(self):
        """Cleanup quantum circuit resources."""
        try:
            if self.backend is not None:
                self.backend = None
            if self.quantum_circuit is not None:
                self.quantum_circuit = None
            if self.qr is not None:
                self.qr = None
            if self.cr is not None:
                self.cr = None
            self._state_cache.clear()
        except Exception as e:
            self.logger.error(f"Error during cleanup: {str(e)}")

    def _get_cached_state(self, state_size: int) -> np.ndarray:
        """Get cached state for given size."""
        if state_size not in self._state_cache:
            self._state_cache[state_size] = np.zeros(2**state_size, dtype=np.complex128)
        return self._state_cache[state_size]

    def _build_quantum_circuit(self) -> None:
        """Build quantum circuit for feature fusion."""
        try:
            # Create quantum registers
            self.qr = QuantumRegister(self.config.num_qubits, "q")
            self.cr = ClassicalRegister(self.config.num_qubits, "c")

            # Create quantum circuit
            self.quantum_circuit = QiskitCircuit(self.qr, self.cr)

            # Apply quantum gates for feature fusion
            self._apply_quantum_gates_to_circuit()

            self.initialized = True

        except Exception as e:
            self.logger.error(f"Failed to build quantum circuit: {str(e)}")
            self.initialized = False
            raise

    def _apply_quantum_gates_to_circuit(self) -> None:
        """Apply quantum gates to circuit."""
        if self.quantum_circuit is None or self.qr is None:
            raise RuntimeError("Quantum circuit or registers not initialized")

        try:
            # Apply Hadamard gates for superposition
            for i in range(self.config.num_qubits):
                self.quantum_circuit.h(self.qr[i])

            # Apply CNOT gates for entanglement
            for i in range(self.config.num_qubits - 1):
                self.quantum_circuit.cx(self.qr[i], self.qr[i + 1])

            # Apply rotation gates for feature weights
            for i in range(self.config.num_qubits):
                self.quantum_circuit.rz(self.config.rotation_angle, self.qr[i])

            # Add measurement
            self.quantum_circuit.measure(self.qr, self.cr)

        except Exception as e:
            self.logger.error(f"Failed to apply quantum gates: {str(e)}")
            raise

    def _build_fusion_layers(self) -> None:
        """Build neural network layers for feature fusion."""
        self.fusion_layers = []

        # Input projection layers
        if self.config.feature_dims is None:
            raise ValueError("feature_dims must be specified in config")
        for _ in self.config.feature_dims:
            self.fusion_layers.append(tf.keras.layers.Dense(self.config.fusion_dim))

        # Quantum fusion layer
        self.fusion_layers.append(self._build_quantum_fusion_layer())

        # Output projection layer
        self.fusion_layers.append(tf.keras.layers.Dense(self.config.fusion_dim))

    def _build_quantum_fusion_layer(self) -> tf.keras.layers.Layer:
        """Build quantum-enhanced fusion layer."""
        return QuantumFusionLayer(self.config)

    def _prepare_quantum_state(self, features: tf.Tensor) -> np.ndarray:
        """Prepare quantum state from features."""
        try:
            if features is None:
                raise ValueError("Features cannot be None")

            # Convert to numpy efficiently
            if not isinstance(features, tf.Tensor):
                features = tf.convert_to_tensor(features)

            # Enable eager execution if needed
            if not tf.executing_eagerly():
                tf.config.run_functions_eagerly(True)

            # Get quantum state efficiently
            quantum_state = tf.keras.backend.eval(features)

            if quantum_state.size == 0:
                raise ValueError("Quantum state array is empty")

            # Create a new state vector with the correct size based on number of qubits
            state_size = 2**self.config.num_qubits

            # Handle both single and batch inputs
            if len(quantum_state.shape) == 1:
                # Single input
                cached_state = np.zeros(state_size, dtype=np.complex128)
                min_size = min(quantum_state.size, state_size)
                cached_state[:min_size] = quantum_state[:min_size]
            else:
                # Batch input
                batch_size = quantum_state.shape[0]
                cached_state = np.zeros((batch_size, state_size), dtype=np.complex128)
                min_size = min(quantum_state.shape[1], state_size)
                cached_state[:, :min_size] = quantum_state[:, :min_size]

            return cached_state

        except Exception as e:
            raise ValueError(f"Failed to prepare quantum state: {str(e)}")

    def fuse_features(self, features: List[tf.Tensor]) -> tf.Tensor:
        """Fuse features using quantum-enhanced fusion."""
        try:
            if not features:
                raise ValueError("No features provided")

            # Project features to fusion dimension
            projected_features = []
            for i, feature in enumerate(features):
                if i >= len(self.fusion_layers) - 2:  # Skip quantum and output layers
                    break
                projected = self.fusion_layers[i](feature)
                projected_features.append(projected)

            # Apply quantum fusion
            quantum_layer = self.fusion_layers[-2]  # Second to last layer
            fused = quantum_layer(projected_features)

            # Apply output projection
            output_layer = self.fusion_layers[-1]  # Last layer
            result = output_layer(fused)

            return result

        except Exception as e:
            self.logger.error(f"Failed to fuse features: {str(e)}")
            raise

    def get_config(self) -> Dict:
        """Get configuration as dictionary."""
        return {
            "num_qubits": self.config.num_qubits,
            "feature_dims": self.config.feature_dims,
            "fusion_dim": self.config.fusion_dim,
            "num_layers": self.config.num_layers,
            "dropout_rate": self.config.dropout_rate,
            "use_entanglement": self.config.use_entanglement,
            "use_superposition": self.config.use_superposition,
            "use_adaptive_fusion": self.config.use_adaptive_fusion,
            "rotation_angle": self.config.rotation_angle,
        }

    @classmethod
    def from_config(cls, config: Dict) -> "QuantumFusion":
        """Create instance from configuration dictionary."""
        fusion_config = QuantumFusionConfig(**config)
        return cls(fusion_config)

    def _apply_quantum_circuit(self, quantum_state: np.ndarray) -> np.ndarray:
        """Apply quantum circuit to state."""
        if quantum_state is None:
            raise ValueError("Quantum state cannot be None")
        try:
            # Handle both single and batch inputs
            if len(quantum_state.shape) == 1:
                # Single input
                quantum_state = self._apply_quantum_gates(quantum_state)
            else:
                # Batch input
                batch_size = quantum_state.shape[0]
                enhanced_states = np.zeros_like(quantum_state)
                for i in range(batch_size):
                    enhanced_states[i] = self._apply_quantum_gates(quantum_state[i])
                quantum_state = enhanced_states

            # Execute circuit if backend is available
            if self.backend is not None:
                if len(quantum_state.shape) == 1:
                    # Single input
                    job = self.backend.run(self.quantum_circuit, shots=1000)
                    result = job.result()
                    counts = result.get_counts(self.quantum_circuit)
                    quantum_state = self._counts_to_state(counts)
                else:
                    # Batch input
                    batch_size = quantum_state.shape[0]
                    enhanced_states = np.zeros_like(quantum_state)
                    for i in range(batch_size):
                        job = self.backend.run(self.quantum_circuit, shots=1000)
                        result = job.result()
                        counts = result.get_counts(self.quantum_circuit)
                        enhanced_states[i] = self._counts_to_state(counts)
                    quantum_state = enhanced_states

            return quantum_state

        except Exception as e:
            raise RuntimeError(f"Failed to apply quantum circuit: {str(e)}")

    def _counts_to_state(self, counts: Dict[str, int]) -> np.ndarray:
        """Convert measurement counts to state vector."""
        total_shots = sum(counts.values())
        state = np.zeros(2**self.config.num_qubits, dtype=np.complex128)
        for bitstring, count in counts.items():
            idx = int(bitstring, 2)
            state[idx] = np.sqrt(count / total_shots)
        return state

    def _measure_quantum_state(self, quantum_state: np.ndarray) -> tf.Tensor:
        """Convert quantum state to features."""
        # Convert quantum state to features
        features = np.abs(quantum_state) ** 2
        
        # Reshape to maintain batch dimension and output fusion_dim
        batch_size = quantum_state.shape[0]
        features = features.reshape(batch_size, -1)
        
        # If the number of features is less than fusion_dim, pad with zeros
        if features.shape[1] < self.config.fusion_dim:
            padding = np.zeros((batch_size, self.config.fusion_dim - features.shape[1]))
            features = np.concatenate([features, padding], axis=1)
        # If the number of features is greater than fusion_dim, take only the first fusion_dim features
        elif features.shape[1] > self.config.fusion_dim:
            features = features[:, :self.config.fusion_dim]
            
        return tf.convert_to_tensor(features, dtype=tf.float32)

    def _apply_quantum_gates(self, quantum_state: np.ndarray) -> np.ndarray:
        """Apply quantum gates to state."""
        try:
            # Apply Hadamard gates for superposition
            for i in range(self.config.num_qubits):
                quantum_state = self._apply_hadamard(quantum_state, i)

            # Apply CNOT gates for entanglement
            for i in range(self.config.num_qubits - 1):
                quantum_state = self._apply_cnot(quantum_state, i, i + 1)

            # Apply rotation gates for feature weights
            for i in range(self.config.num_qubits):
                quantum_state = self._apply_rotation(quantum_state, i)

            return quantum_state
        except Exception as e:
            self.logger.error(f"Failed to apply quantum gates: {str(e)}")
            raise

    def _apply_hadamard(self, quantum_state: np.ndarray, qubit: int) -> np.ndarray:
        """Apply Hadamard gate to specific qubit."""
        # Hadamard gate matrix
        hadamard = np.array([[1, 1], [1, -1]]) / np.sqrt(2)

        # Apply Hadamard gate to the specified qubit
        state = quantum_state.copy()
        for i in range(0, 2**self.config.num_qubits, 2 ** (qubit + 1)):
            for j in range(2**qubit):
                idx = i + j
                state[idx], state[idx + 2**qubit] = (
                    hadamard[0, 0] * quantum_state[idx] + hadamard[0, 1] * quantum_state[idx + 2**qubit],
                    hadamard[1, 0] * quantum_state[idx] + hadamard[1, 1] * quantum_state[idx + 2**qubit]
                )
        return state

    def _apply_cnot(
        self, quantum_state: np.ndarray, control: int, target: int
    ) -> np.ndarray:
        """Apply CNOT gate to specific qubits."""
        # Apply CNOT gate between control and target qubits
        state = quantum_state.copy()
        control_mask = 2**control
        target_mask = 2**target
        
        for i in range(2**self.config.num_qubits):
            if i & control_mask:  # If control qubit is 1
                # Swap the amplitudes of states where target qubit is 0 and 1
                target_bit = i & target_mask
                if target_bit == 0:
                    swap_idx = i | target_mask
                else:
                    swap_idx = i & ~target_mask
                state[i], state[swap_idx] = state[swap_idx], state[i]
        return state

    def _apply_rotation(self, quantum_state: np.ndarray, qubit: int) -> np.ndarray:
        """Apply rotation gate to specific qubit."""
        # Rotation gate matrix
        rotation_z = np.array(
            [
                [np.exp(-1j * self.config.rotation_angle / 2), 0],
                [0, np.exp(1j * self.config.rotation_angle / 2)],
            ]
        )

        # Apply rotation gate to the specified qubit
        state = quantum_state.copy()
        qubit_mask = 2**qubit
        
        for i in range(2**self.config.num_qubits):
            if i & qubit_mask:  # If qubit is 1
                state[i] *= rotation_z[1, 1]
            else:  # If qubit is 0
                state[i] *= rotation_z[0, 0]
        return state


class QuantumFusionLayer(tf.keras.layers.Layer):
    """Quantum-enhanced fusion layer."""

    def __init__(self, config: QuantumFusionConfig, **kwargs):
        super().__init__(**kwargs)
        self.config = config
        self.backend = None
        self.quantum_circuit = None
        self._build_quantum_circuit()

    def _build_quantum_circuit(self) -> None:
        """Build quantum circuit for feature fusion."""
        try:
            # Create quantum registers
            qr = QuantumRegister(self.config.num_qubits, "q")
            cr = ClassicalRegister(self.config.num_qubits, "c")

            # Create quantum circuit
            self.quantum_circuit = QiskitCircuit(qr, cr)

            # Apply quantum gates for feature fusion
            self._apply_quantum_gates_to_circuit()

        except Exception as e:
            self.logger.error(f"Failed to build quantum circuit: {str(e)}")
            raise

    def _apply_quantum_gates_to_circuit(self) -> None:
        """Apply quantum gates to circuit."""
        if self.quantum_circuit is None:
            raise RuntimeError("Quantum circuit not initialized")

        try:
            # Apply Hadamard gates for superposition
            for i in range(self.config.num_qubits):
                self.quantum_circuit.h(i)

            # Apply CNOT gates for entanglement
            for i in range(self.config.num_qubits - 1):
                self.quantum_circuit.cx(i, i + 1)

            # Apply rotation gates for feature weights
            for i in range(self.config.num_qubits):
                self.quantum_circuit.rz(self.config.rotation_angle, i)

            # Add measurement
            self.quantum_circuit.measure(range(self.config.num_qubits), range(self.config.num_qubits))

        except Exception as e:
            self.logger.error(f"Failed to apply quantum gates: {str(e)}")
            raise

    def _prepare_quantum_state(self, features: tf.Tensor) -> np.ndarray:
        """Prepare quantum state from features."""
        try:
            if features is None:
                raise ValueError("Features cannot be None")

            # Convert to numpy efficiently
            if not isinstance(features, tf.Tensor):
                features = tf.convert_to_tensor(features)

            # Enable eager execution if needed
            if not tf.executing_eagerly():
                tf.config.run_functions_eagerly(True)

            # Get quantum state efficiently
            quantum_state = tf.keras.backend.eval(features)

            if quantum_state.size == 0:
                raise ValueError("Quantum state array is empty")

            # Create a new state vector with the correct size based on number of qubits
            state_size = 2**self.config.num_qubits

            # Handle both single and batch inputs
            if len(quantum_state.shape) == 1:
                # Single input
                cached_state = np.zeros(state_size, dtype=np.complex128)
                min_size = min(quantum_state.size, state_size)
                cached_state[:min_size] = quantum_state[:min_size]
            else:
                # Batch input
                batch_size = quantum_state.shape[0]
                cached_state = np.zeros((batch_size, state_size), dtype=np.complex128)
                min_size = min(quantum_state.shape[1], state_size)
                cached_state[:, :min_size] = quantum_state[:, :min_size]

            return cached_state

        except Exception as e:
            raise ValueError(f"Failed to prepare quantum state: {str(e)}")

    def call(self, inputs: List[tf.Tensor]) -> tf.Tensor:
        """Process inputs through quantum fusion layer."""
        # Combine features
        combined = tf.concat(inputs, axis=-1)

        # Apply quantum enhancement
        enhanced = self._apply_quantum_enhancement(combined)

        return enhanced

    def _apply_quantum_enhancement(self, features: tf.Tensor) -> tf.Tensor:
        """Apply quantum enhancement to features."""
        # Convert features to quantum state
        quantum_state = self._prepare_quantum_state(features)

        # Apply quantum circuit
        enhanced_state = self._apply_quantum_circuit(quantum_state)

        # Convert back to tensor
        return self._measure_quantum_state(enhanced_state)

    def _apply_quantum_circuit(self, quantum_state: np.ndarray) -> np.ndarray:
        """Apply quantum circuit to state."""
        if quantum_state is None:
            raise ValueError("Quantum state cannot be None")
        try:
            # Handle both single and batch inputs
            if len(quantum_state.shape) == 1:
                # Single input
                quantum_state = self._apply_quantum_gates(quantum_state)
            else:
                # Batch input
                batch_size = quantum_state.shape[0]
                enhanced_states = np.zeros_like(quantum_state)
                for i in range(batch_size):
                    enhanced_states[i] = self._apply_quantum_gates(quantum_state[i])
                quantum_state = enhanced_states

            # Execute circuit if backend is available
            if self.backend is not None:
                if len(quantum_state.shape) == 1:
                    # Single input
                    job = self.backend.run(self.quantum_circuit, shots=1000)
                    result = job.result()
                    counts = result.get_counts(self.quantum_circuit)
                    quantum_state = self._counts_to_state(counts)
                else:
                    # Batch input
                    batch_size = quantum_state.shape[0]
                    enhanced_states = np.zeros_like(quantum_state)
                    for i in range(batch_size):
                        job = self.backend.run(self.quantum_circuit, shots=1000)
                        result = job.result()
                        counts = result.get_counts(self.quantum_circuit)
                        enhanced_states[i] = self._counts_to_state(counts)
                    quantum_state = enhanced_states

            return quantum_state

        except Exception as e:
            raise RuntimeError(f"Failed to apply quantum circuit: {str(e)}")

    def _counts_to_state(self, counts: Dict[str, int]) -> np.ndarray:
        """Convert measurement counts to state vector."""
        total_shots = sum(counts.values())
        state = np.zeros(2**self.config.num_qubits, dtype=np.complex128)
        for bitstring, count in counts.items():
            idx = int(bitstring, 2)
            state[idx] = np.sqrt(count / total_shots)
        return state

    def _measure_quantum_state(self, quantum_state: np.ndarray) -> tf.Tensor:
        """Convert quantum state to features."""
        # Convert quantum state to features
        features = np.abs(quantum_state) ** 2
        
        # Reshape to maintain batch dimension and output fusion_dim
        batch_size = quantum_state.shape[0]
        features = features.reshape(batch_size, -1)
        
        # If the number of features is less than fusion_dim, pad with zeros
        if features.shape[1] < self.config.fusion_dim:
            padding = np.zeros((batch_size, self.config.fusion_dim - features.shape[1]))
            features = np.concatenate([features, padding], axis=1)
        # If the number of features is greater than fusion_dim, take only the first fusion_dim features
        elif features.shape[1] > self.config.fusion_dim:
            features = features[:, :self.config.fusion_dim]
            
        return tf.convert_to_tensor(features, dtype=tf.float32)

    def _apply_quantum_gates(self, quantum_state: np.ndarray) -> np.ndarray:
        """Apply quantum gates to state."""
        # Apply Hadamard gates
        quantum_state = self._apply_hadamard_gates(quantum_state)

        # Apply CNOT gates
        quantum_state = self._apply_cnot_gates(quantum_state)

        # Apply rotation gates
        quantum_state = self._apply_rotation_gates(quantum_state)

        return quantum_state

    def _apply_hadamard_gates(self, quantum_state: np.ndarray) -> np.ndarray:
        """Apply Hadamard gates to state."""
        for i in range(self.config.num_qubits):
            quantum_state = self._apply_hadamard(quantum_state, i)
        return quantum_state

    def _apply_cnot_gates(self, quantum_state: np.ndarray) -> np.ndarray:
        """Apply CNOT gates to state."""
        for i in range(self.config.num_qubits - 1):
            quantum_state = self._apply_cnot(quantum_state, i, i + 1)
        return quantum_state

    def _apply_rotation_gates(self, quantum_state: np.ndarray) -> np.ndarray:
        """Apply rotation gates to state."""
        for i in range(self.config.num_qubits):
            quantum_state = self._apply_rotation(quantum_state, i)
        return quantum_state

    def _apply_hadamard(self, quantum_state: np.ndarray, qubit: int) -> np.ndarray:
        """Apply Hadamard gate to specific qubit."""
        # Hadamard gate matrix
        hadamard = np.array([[1, 1], [1, -1]]) / np.sqrt(2)

        # Apply Hadamard gate to the specified qubit
        state = quantum_state.copy()
        for i in range(0, 2**self.config.num_qubits, 2 ** (qubit + 1)):
            for j in range(2**qubit):
                idx = i + j
                state[idx], state[idx + 2**qubit] = (
                    hadamard[0, 0] * quantum_state[idx] + hadamard[0, 1] * quantum_state[idx + 2**qubit],
                    hadamard[1, 0] * quantum_state[idx] + hadamard[1, 1] * quantum_state[idx + 2**qubit]
                )
        return state

    def _apply_cnot(
        self, quantum_state: np.ndarray, control: int, target: int
    ) -> np.ndarray:
        """Apply CNOT gate to specific qubits."""
        # Apply CNOT gate between control and target qubits
        state = quantum_state.copy()
        control_mask = 2**control
        target_mask = 2**target
        
        for i in range(2**self.config.num_qubits):
            if i & control_mask:  # If control qubit is 1
                # Swap the amplitudes of states where target qubit is 0 and 1
                target_bit = i & target_mask
                if target_bit == 0:
                    swap_idx = i | target_mask
                else:
                    swap_idx = i & ~target_mask
                state[i], state[swap_idx] = state[swap_idx], state[i]
        return state

    def _apply_rotation(self, quantum_state: np.ndarray, qubit: int) -> np.ndarray:
        """Apply rotation gate to specific qubit."""
        # Rotation gate matrix
        rotation_z = np.array(
            [
                [np.exp(-1j * self.config.rotation_angle / 2), 0],
                [0, np.exp(1j * self.config.rotation_angle / 2)],
            ]
        )

        # Apply rotation gate to the specified qubit
        state = quantum_state.copy()
        qubit_mask = 2**qubit
        
        for i in range(2**self.config.num_qubits):
            if i & qubit_mask:  # If qubit is 1
                state[i] *= rotation_z[1, 1]
            else:  # If qubit is 0
                state[i] *= rotation_z[0, 0]
        return state
