"""
Quantum-Enhanced Loss Functions
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Union, cast

import numpy as np
import qiskit
import tensorflow as tf
from qiskit import ClassicalRegister
from qiskit import QuantumCircuit as QiskitCircuit
from qiskit import QuantumRegister


@dataclass
class QuantumLossConfig:
    """Configuration for quantum-enhanced loss functions."""

    num_qubits: int = 4
    feature_dim: int = 2048
    temperature: float = 0.1
    use_entanglement: bool = True
    use_superposition: bool = True
    use_quantum_regularization: bool = True


class QuantumLoss:
    """Quantum-enhanced loss functions for improved training."""

    def __init__(self, config: Optional[QuantumLossConfig] = None):
        self.config = config or QuantumLossConfig()
        self.logger = logging.getLogger(__name__)
        self.quantum_circuit = None
        self._build_quantum_circuit()

    def _build_quantum_circuit(self) -> None:
        """Build quantum circuit for loss computation."""
        try:
            # Create quantum registers
            qr = QuantumRegister(self.config.num_qubits, "q")
            cr = ClassicalRegister(self.config.num_qubits, "c")

            # Create quantum circuit
            self.quantum_circuit = QiskitCircuit(qr, cr)

            # Apply quantum gates for loss computation
            self._apply_quantum_gates()

        except Exception as e:
            self.logger.error(f"Failed to build quantum circuit: {str(e)}")
            raise

    def _apply_quantum_gates(self) -> None:
        """Apply quantum gates for loss computation."""
        if self.quantum_circuit is None:
            raise RuntimeError("Quantum circuit not initialized")

        # Apply Hadamard gates for superposition
        for i in range(self.config.num_qubits):
            self.quantum_circuit.h(self.qr[i])

        # Apply CNOT gates for entanglement
        for i in range(self.config.num_qubits - 1):
            self.quantum_circuit.cx(self.qr[i], self.qr[i + 1])

        # Apply rotation gates for loss weights
        for i in range(self.config.num_qubits):
            self.quantum_circuit.rz(np.pi / 4, self.qr[i])

    def quantum_cross_entropy(self, y_true: tf.Tensor, y_pred: tf.Tensor) -> tf.Tensor:
        """Quantum-enhanced cross-entropy loss."""
        try:
            # Apply quantum enhancement to predictions
            y_pred = self._apply_quantum_enhancement(y_pred)

            # Compute cross-entropy loss
            loss = tf.keras.losses.categorical_crossentropy(y_true, y_pred)

            # Apply quantum regularization if enabled
            if self.config.use_quantum_regularization:
                loss = loss + self._compute_quantum_regularization(y_pred)

            if self.quantum_circuit is not None:
                quantum_loss = self.quantum_circuit(loss)
            else:
                quantum_loss = loss

            return quantum_loss

        except Exception as e:
            self.logger.error(f"Failed to compute quantum cross-entropy loss: {str(e)}")
            raise

    def quantum_focal_loss(
        self, y_true: tf.Tensor, y_pred: tf.Tensor, gamma: float = 2.0
    ) -> tf.Tensor:
        """Quantum-enhanced focal loss."""
        try:
            # Apply quantum enhancement to predictions
            y_pred = self._apply_quantum_enhancement(y_pred)

            # Compute focal loss
            loss = tf.keras.losses.categorical_crossentropy(y_true, y_pred)
            loss = loss * tf.pow(1 - y_pred, gamma)

            # Apply quantum regularization if enabled
            if self.config.use_quantum_regularization:
                loss = loss + self._compute_quantum_regularization(y_pred)

            if self.quantum_circuit is not None:
                quantum_loss = self.quantum_circuit(loss)
            else:
                quantum_loss = loss

            return quantum_loss

        except Exception as e:
            self.logger.error(f"Failed to compute quantum focal loss: {str(e)}")
            raise

    def quantum_triplet_loss(
        self,
        anchor: tf.Tensor,
        positive: tf.Tensor,
        negative: tf.Tensor,
        margin: float = 1.0,
    ) -> tf.Tensor:
        """Quantum-enhanced triplet loss."""
        try:
            # Apply quantum enhancement to embeddings
            anchor = self._apply_quantum_enhancement(anchor)
            positive = self._apply_quantum_enhancement(positive)
            negative = self._apply_quantum_enhancement(negative)

            # Compute distances
            pos_dist = tf.reduce_sum(tf.square(anchor - positive), axis=-1)
            neg_dist = tf.reduce_sum(tf.square(anchor - negative), axis=-1)

            # Compute triplet loss
            loss = tf.maximum(pos_dist - neg_dist + margin, 0.0)

            # Apply quantum regularization if enabled
            if self.config.use_quantum_regularization:
                loss = loss + self._compute_quantum_regularization(
                    [anchor, positive, negative]
                )

            if self.quantum_circuit is not None:
                quantum_loss = self.quantum_circuit(loss)
            else:
                quantum_loss = loss

            return quantum_loss

        except Exception as e:
            self.logger.error(f"Failed to compute quantum triplet loss: {str(e)}")
            raise

    def _apply_quantum_enhancement(self, features: tf.Tensor) -> tf.Tensor:
        """Apply quantum enhancement to features."""
        # Convert features to quantum state
        quantum_state = self._prepare_quantum_state(features)

        # Apply quantum circuit
        enhanced_state = self._apply_quantum_circuit(quantum_state)

        # Convert back to classical state
        enhanced_features = self._measure_quantum_state(enhanced_state)

        return enhanced_features

    def _prepare_quantum_state(self, features: tf.Tensor) -> np.ndarray:
        """Prepare quantum state from features."""
        # Normalize features
        features = tf.nn.l2_normalize(features, axis=-1)

        # Convert to quantum state
        if features is None:
            raise ValueError("Features cannot be None")
        quantum_state = features.numpy()  # type: ignore
        if quantum_state is None:
            raise ValueError("Failed to convert features to numpy array")

        # Ensure quantum state is not None before normalization
        if quantum_state.size == 0:
            raise ValueError("Quantum state array is empty")

        quantum_state = quantum_state / np.linalg.norm(quantum_state)

        return quantum_state

    def _apply_quantum_circuit(self, quantum_state: np.ndarray) -> np.ndarray:
        """Apply quantum circuit to quantum state."""
        if self.quantum_circuit is None:
            raise RuntimeError("Quantum circuit not initialized")

        # Create quantum circuit with current state
        circuit = QiskitCircuit(self.qr, self.cr)
        circuit.compose(self.quantum_circuit)
        circuit.initialize(quantum_state, self.qr)

        # Execute circuit
        backend = qiskit.Aer.get_backend("statevector_simulator")
        job = qiskit.execute(circuit, backend)
        result = job.result()

        return result.get_statevector()

    def _measure_quantum_state(self, quantum_state: np.ndarray) -> tf.Tensor:
        """Measure quantum state and convert back to features."""
        # Convert quantum state to features
        features = np.abs(quantum_state) ** 2
        features = features.reshape(features.shape[0], -1)

        return tf.convert_to_tensor(features, dtype=tf.float32)

    def _compute_quantum_regularization(
        self, features: Union[tf.Tensor, List[tf.Tensor]]
    ) -> tf.Tensor:
        """Compute quantum regularization term."""
        if isinstance(features, list):
            features = tf.concat(features, axis=-1)

        # Compute quantum state entropy
        quantum_state = self._prepare_quantum_state(features)
        entropy = -tf.reduce_sum(quantum_state * tf.math.log(quantum_state + 1e-10))

        # Scale by temperature
        return self.config.temperature * entropy

    def get_config(self) -> Dict:
        """Get configuration dictionary."""
        return {
            "num_qubits": self.config.num_qubits,
            "feature_dim": self.config.feature_dim,
            "temperature": self.config.temperature,
            "use_entanglement": self.config.use_entanglement,
            "use_superposition": self.config.use_superposition,
            "use_quantum_regularization": self.config.use_quantum_regularization,
        }

    @classmethod
    def from_config(cls, config: Dict) -> "QuantumLoss":
        """Create instance from configuration dictionary."""
        return cls(QuantumLossConfig(**config))
