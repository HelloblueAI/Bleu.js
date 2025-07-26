"""
Quantum Attention Mechanism
"""

import logging
from typing import List, Optional, Tuple

import numpy as np
import pennylane as qml

logger = logging.getLogger(__name__)


class Attention:
    """Quantum attention mechanism using PennyLane."""

    def __init__(
        self,
        n_qubits: int,
        n_layers: int = 2,
        learning_rate: float = 0.01,
        shots: Optional[int] = None,
    ) -> None:
        """Initialize quantum attention.

        Args:
            n_qubits: Number of qubits
            n_layers: Number of layers
            learning_rate: Learning rate for parameter updates
            shots: Number of shots for measurement
        """
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.learning_rate = learning_rate
        self.shots = shots
        self.params = self._init_parameters()

        # Create device conditionally
        try:
            self.device = qml.device("default.qubit", wires=n_qubits, shots=shots)
            self._circuit = qml.qnode(self.device)(self._circuit_impl)
        except Exception as e:
            logger.warning(f"Could not create PennyLane device: {e}")
            # Create a mock circuit
            self._circuit = self._mock_circuit

    def _init_parameters(self) -> np.ndarray:
        """Initialize circuit parameters.

        Returns:
            np.ndarray: Circuit parameters
        """
        # Parameters for each layer
        params_per_layer = self.n_qubits * 3  # Rx, Ry, Rz rotations
        total_params = params_per_layer * self.n_layers

        # Initialize with random values
        return np.random.uniform(low=-np.pi, high=np.pi, size=total_params)

    def _circuit_impl(self, x: np.ndarray, params: np.ndarray) -> List[float]:
        """Quantum circuit implementation for attention mechanism.

        Args:
            x: Input data
            params: Circuit parameters

        Returns:
            List[float]: Measurement results
        """
        # Encode input data
        for i in range(self.n_qubits):
            qml.RY(x[i], wires=i)

        # Apply parameterized layers
        param_idx = 0
        for _ in range(self.n_layers):
            # Single-qubit rotations
            for i in range(self.n_qubits):
                qml.RX(params[param_idx], wires=i)
                qml.RY(params[param_idx + 1], wires=i)
                qml.RZ(params[param_idx + 2], wires=i)
                param_idx += 3

            # Entangling layer
            for i in range(self.n_qubits - 1):
                qml.CNOT(wires=[i, i + 1])
            qml.CNOT(wires=[self.n_qubits - 1, 0])

        # Measure all qubits
        return [qml.expval(qml.PauliZ(i)) for i in range(self.n_qubits)]

    def _mock_circuit(self, x: np.ndarray, params: np.ndarray) -> List[float]:
        """Mock circuit for when PennyLane is not available.

        Args:
            x: Input data
            params: Circuit parameters

        Returns:
            List[float]: Mock measurement results
        """
        # Return mock measurements
        return [0.1] * self.n_qubits

    def forward(self, x: np.ndarray) -> np.ndarray:
        """Forward pass through quantum attention.

        Args:
            x: Input data

        Returns:
            np.ndarray: Attention weights
        """
        # Normalize input
        x_norm = x / np.linalg.norm(x)

        # Get quantum measurements
        measurements = self._circuit(x_norm, self.params)

        # Convert to attention weights
        weights = np.array(measurements)
        weights = (weights + 1) / 2  # Map from [-1, 1] to [0, 1]
        weights = weights / np.sum(weights)  # Normalize to sum to 1

        return weights

    def backward(
        self, x: np.ndarray, grad: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Backward pass through quantum attention.

        Args:
            x: Input data
            grad: Gradient from next layer

        Returns:
            Tuple[np.ndarray, np.ndarray]: Input gradients and parameter gradients
        """
        # Normalize input
        x_norm = x / np.linalg.norm(x)

        # Get quantum gradients
        grad_x = qml.grad(self._circuit, argnum=0)(x_norm, self.params)
        grad_params = qml.grad(self._circuit, argnum=1)(x_norm, self.params)

        # Update parameters
        self.params = self.params - self.learning_rate * grad_params

        return grad_x, grad_params

    def __call__(self, x: np.ndarray) -> np.ndarray:
        """Call quantum attention.

        Args:
            x: Input data

        Returns:
            np.ndarray: Attention weights
        """
        return self.forward(x)
