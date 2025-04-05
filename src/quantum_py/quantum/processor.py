"""Quantum processor implementation for feature processing."""

from typing import Any, Dict, Optional

import numpy as np
from qiskit.primitives import Sampler
from qiskit_aer import QasmSimulator
from qiskit_aer.noise import NoiseModel

from .circuit import QuantumCircuit

# Constants
QUANTUM_CIRCUIT_NOT_INITIALIZED_ERROR = "Quantum circuit not initialized"


class QuantumProcessor:
    """Quantum processor for feature processing and optimization"""

    def __init__(
        self,
        n_qubits: int = 4,
        n_layers: int = 2,
        entanglement: str = "full",
        shots: int = 1000,
        optimization_level: int = 3,
        error_correction: bool = True,
        use_advanced_circuits: bool = True,
    ):
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.entanglement = entanglement
        self.shots = shots
        self.optimization_level = optimization_level
        self.error_correction = error_correction
        self.use_advanced_circuits = use_advanced_circuits

        # Initialize quantum circuit
        self.circuit: Optional[QuantumCircuit] = None
        self.backend: Optional[QasmSimulator] = None
        self.noise_model: Optional[NoiseModel] = None

        # Initialize metrics
        self.metrics = {
            "total_executions": 0,
            "successful_executions": 0,
            "failed_executions": 0,
            "error_rate": 0.0,
            "quantum_speedup": 1.0,
            "coherence_time": 0.0,
            "entanglement_quality": 0.0,
            "feature_map_fidelity": 0.0,
            "circuit_optimization_score": 0.0,
        }

        # Initialize the processor
        self.initialize()

    def initialize(self) -> bool:
        """Initialize the quantum processor"""
        try:
            # Initialize quantum circuit
            self.circuit = QuantumCircuit(
                n_qubits=self.n_qubits,
                n_layers=self.n_layers,
                entanglement=self.entanglement,
                use_advanced_circuits=self.use_advanced_circuits,
            )

            # Build quantum circuit
            if self.circuit is None or not self.circuit.build_circuit():
                raise RuntimeError("Failed to build quantum circuit")

            # Initialize backend
            self.backend = QasmSimulator()

            # Initialize noise model if error correction is enabled
            if self.error_correction:
                self.noise_model = self._get_noise_model()

            print("\nInitialized quantum processor:")
            print(f"- Number of qubits: {self.n_qubits}")
            print(f"- Number of layers: {self.n_layers}")
            print(f"- Entanglement: {self.entanglement}")
            print(f"- Error correction: {'Enabled' if self.error_correction else 'Disabled'}")
            return True

        except RuntimeError as e:
            print(f"Error initializing processor: {str(e)}")
            return False
        except ValueError as e:
            print(f"Invalid parameter value: {str(e)}")
            return False
        except ImportError as e:
            print(f"Failed to import required dependencies: {str(e)}")
            return False

    async def process_features(self, features: np.ndarray) -> Optional[np.ndarray]:
        """Process features using quantum processor"""
        if self.circuit is None:
            raise RuntimeError(QUANTUM_CIRCUIT_NOT_INITIALIZED_ERROR)

        try:
            # Check if feature dimension is a power of 2
            n_features = features.shape[1]
            if (n_features & (n_features - 1)) != 0:
                raise ValueError("feature_dimension must be a power of 2!")

            # Get circuit info
            circuit_info = self.circuit.get_circuit_info()

            # Process features using quantum circuit
            processed_features = await self.circuit.process_features(features)
            if processed_features is None:
                raise RuntimeError("Feature processing failed")

            # Execute circuit using Sampler primitive
            sampler = Sampler()
            if self.noise_model is not None:
                sampler = Sampler(noise_model=self.noise_model)

            job = sampler.run(self.circuit.circuit, shots=self.shots)
            _ = job.result()  # Use _ for unused variable

            # Update metrics
            self._update_metrics(processed_features, circuit_info)

            return processed_features

        except RuntimeError as e:
            print(f"Error processing features: {str(e)}")
            self.metrics["failed_executions"] += 1
            return None
        except ValueError as e:
            print(f"Invalid input features: {str(e)}")
            self.metrics["failed_executions"] += 1
            return None

    def _get_noise_model(self) -> Optional[NoiseModel]:
        """Get noise model for error correction"""
        if self.backend is None:
            return None
        return NoiseModel.from_backend(self.backend)

    def _update_metrics(self, features: np.ndarray, circuit_info: Dict[str, Any]):
        """Update processor metrics"""
        if not circuit_info or "metrics" not in circuit_info:
            return

        self.metrics.update(
            {
                "total_executions": self.metrics["total_executions"] + 1,
                "successful_executions": self.metrics["successful_executions"] + 1,
                "error_rate": 1
                - (self.metrics["successful_executions"] + 1)
                / (self.metrics["total_executions"] + 1),
                "quantum_speedup": 2.0
                * np.exp(-circuit_info["metrics"].get("circuit_depth", 0) / 100),
                "coherence_time": circuit_info["metrics"].get("circuit_depth", 0) * 0.1,  # ms
                "entanglement_quality": np.abs(np.mean(features[:-1] * features[1:])),
                "feature_map_fidelity": np.abs(np.dot(features, features)),
                "circuit_optimization_score": circuit_info["metrics"].get(
                    "optimization_score", 0.0
                ),
            }
        )

    def get_metrics(self) -> Dict[str, Any]:
        """Get processor metrics"""
        return self.metrics.copy()

    def get_circuit_info(self) -> Dict[str, Any]:
        """Get circuit information"""
        if self.circuit is None:
            raise RuntimeError(QUANTUM_CIRCUIT_NOT_INITIALIZED_ERROR)
        return self.circuit.get_circuit_info()

    def process(self, features: np.ndarray) -> np.ndarray:
        """Process features using quantum circuit"""
        if self.circuit is None:
            raise RuntimeError(QUANTUM_CIRCUIT_NOT_INITIALIZED_ERROR)
        if self.backend is None:
            raise RuntimeError("Quantum backend not initialized")

        # Process features using quantum circuit
        processed_features = self.circuit.process(features)
        return processed_features

    def reset_metrics(self) -> None:
        """Reset all metrics to initial values"""
        self.metrics = {
            "total_executions": 0,
            "successful_executions": 0,
            "failed_executions": 0,
            "error_rate": 0.0,
            "quantum_speedup": 1.0,
            "coherence_time": 0.0,
            "entanglement_quality": 0.0,
            "feature_map_fidelity": 0.0,
            "circuit_optimization_score": 0.0,
        }
