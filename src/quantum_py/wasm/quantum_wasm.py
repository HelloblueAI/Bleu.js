"""
WASM Bindings for Quantum Computing Operations
Provides high-performance quantum computing operations through WASM.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np
import wasmtime


class QuantumWASM:
    """WASM bindings for quantum computing operations."""

    def __init__(self, wasm_path: Optional[str] = None):
        self.logger = logging.getLogger(__name__)
        self.wasm_path = wasm_path or str(Path(__file__).parent / "quantum_ops.wasm")
        self.store = wasmtime.Store()
        self.instance: Optional[wasmtime.Instance] = None
        self._load_wasm_module()

    def _load_wasm_module(self) -> None:
        """Load and initialize WASM module."""
        try:
            # Load WASM module
            module = wasmtime.Module.from_file(self.store, self.wasm_path)

            # Create WASM instance
            self.instance = wasmtime.Instance(module, [])

            self.logger.info("✅ WASM module loaded successfully")
        except Exception as e:
            self.logger.error(f"❌ Failed to load WASM module: {str(e)}")
            raise

    def _ensure_instance(self) -> wasmtime.Instance:
        """Ensure WASM instance is initialized."""
        if self.instance is None:
            raise RuntimeError("WASM instance not initialized")
        return self.instance

    def apply_quantum_gates(
        self, state: np.ndarray, gates: List[Dict[str, Any]]
    ) -> np.ndarray:
        """Apply quantum gates using WASM implementation."""
        try:
            instance = self._ensure_instance()

            # Convert state to WASM memory
            state_ptr = self._allocate_memory(state)

            # Convert gates to WASM memory
            gates_ptr = self._allocate_memory(gates)

            # Call WASM function
            result_ptr = instance.exports.apply_quantum_gates(
                self.store, state_ptr, gates_ptr
            )

            # Convert result back to numpy array
            result = self._read_memory(result_ptr)

            # Free memory
            self._free_memory(state_ptr)
            self._free_memory(gates_ptr)
            self._free_memory(result_ptr)

            return result

        except Exception as e:
            self.logger.error(f"Error applying quantum gates: {str(e)}")
            raise

    def measure_quantum_state(self, state: np.ndarray, basis: str = "z") -> np.ndarray:
        """Measure quantum state using WASM implementation."""
        try:
            instance = self._ensure_instance()

            # Convert state to WASM memory
            state_ptr = self._allocate_memory(state)

            # Convert basis to WASM memory
            basis_ptr = self._allocate_memory(basis.encode())

            # Call WASM function
            result_ptr = instance.exports.measure_quantum_state(
                self.store, state_ptr, basis_ptr
            )

            # Convert result back to numpy array
            result = self._read_memory(result_ptr)

            # Free memory
            self._free_memory(state_ptr)
            self._free_memory(basis_ptr)
            self._free_memory(result_ptr)

            return result

        except Exception as e:
            self.logger.error(f"Error measuring quantum state: {str(e)}")
            raise

    def prepare_quantum_state(self, classical_data: np.ndarray) -> np.ndarray:
        """Prepare quantum state from classical data using WASM implementation."""
        try:
            instance = self._ensure_instance()

            # Convert data to WASM memory
            data_ptr = self._allocate_memory(classical_data)

            # Call WASM function
            state_ptr = instance.exports.prepare_quantum_state(self.store, data_ptr)

            # Convert result back to numpy array
            state = self._read_memory(state_ptr)

            # Free memory
            self._free_memory(data_ptr)
            self._free_memory(state_ptr)

            return state

        except Exception as e:
            self.logger.error(f"Error preparing quantum state: {str(e)}")
            raise

    def compute_quantum_entropy(self, state: np.ndarray) -> float:
        """Compute quantum entropy using WASM implementation."""
        try:
            instance = self._ensure_instance()

            # Convert state to WASM memory
            state_ptr = self._allocate_memory(state)

            # Call WASM function
            entropy = instance.exports.compute_quantum_entropy(self.store, state_ptr)

            # Free memory
            self._free_memory(state_ptr)

            return entropy

        except Exception as e:
            self.logger.error(f"Error computing quantum entropy: {str(e)}")
            raise

    def apply_quantum_fourier_transform(
        self, state: np.ndarray, start: int, end: int
    ) -> np.ndarray:
        """Apply Quantum Fourier Transform using WASM implementation."""
        try:
            instance = self._ensure_instance()

            # Convert state to WASM memory
            state_ptr = self._allocate_memory(state)

            # Call WASM function
            result_ptr = instance.exports.apply_quantum_fourier_transform(
                self.store, state_ptr, start, end, state.shape[0]
            )

            # Convert result back to numpy array
            result = self._read_memory(result_ptr)

            # Free memory
            self._free_memory(state_ptr)
            self._free_memory(result_ptr)

            return result

        except Exception as e:
            self.logger.error(f"Error applying QFT: {str(e)}")
            raise

    def estimate_phase(
        self, state: np.ndarray, unitary: np.ndarray, precision: int
    ) -> float:
        """Estimate phase of unitary operator using WASM implementation."""
        try:
            instance = self._ensure_instance()

            # Convert state and unitary to WASM memory
            state_ptr = self._allocate_memory(state)
            unitary_ptr = self._allocate_memory(unitary)

            # Call WASM function
            phase = instance.exports.estimate_phase(
                self.store, state_ptr, unitary_ptr, precision, state.shape[0]
            )

            # Free memory
            self._free_memory(state_ptr)
            self._free_memory(unitary_ptr)

            return phase

        except Exception as e:
            self.logger.error(f"Error estimating phase: {str(e)}")
            raise

    def correct_quantum_errors(
        self, state: np.ndarray, syndrome: np.ndarray
    ) -> np.ndarray:
        """Apply quantum error correction using WASM implementation."""
        try:
            instance = self._ensure_instance()

            # Convert state and syndrome to WASM memory
            state_ptr = self._allocate_memory(state)
            syndrome_ptr = self._allocate_memory(syndrome)

            # Call WASM function
            result_ptr = instance.exports.correct_quantum_errors(
                self.store, state_ptr, syndrome_ptr, state.shape[0]
            )

            # Convert result back to numpy array
            result = self._read_memory(result_ptr)

            # Free memory
            self._free_memory(state_ptr)
            self._free_memory(syndrome_ptr)
            self._free_memory(result_ptr)

            return result

        except Exception as e:
            self.logger.error(f"Error correcting quantum errors: {str(e)}")
            raise

    def _allocate_memory(self, data: Union[np.ndarray, List, str]) -> int:
        """Allocate memory in WASM and copy data."""
        try:
            instance = self._ensure_instance()

            # Convert data to bytes
            if isinstance(data, np.ndarray):
                data_bytes = data.tobytes()
            elif isinstance(data, list):
                data_bytes = json.dumps(data).encode()
            elif isinstance(data, str):
                data_bytes = data.encode()
            else:
                raise ValueError(f"Unsupported data type: {type(data)}")

            # Allocate memory in WASM
            ptr = instance.exports.allocate_memory(self.store, len(data_bytes))

            # Copy data to WASM memory
            memory = instance.exports.get_memory(self.store)
            memory.write(self.store, ptr, data_bytes)

            return ptr

        except Exception as e:
            self.logger.error(f"Error allocating memory: {str(e)}")
            raise

    def _read_memory(self, ptr: int) -> np.ndarray:
        """Read data from WASM memory."""
        try:
            instance = self._ensure_instance()

            # Get memory size
            size = instance.exports.get_memory_size(self.store, ptr)

            # Read memory
            memory = instance.exports.get_memory(self.store)
            data = memory.read(self.store, ptr, size)

            # Convert to numpy array
            return np.frombuffer(data, dtype=np.float64)

        except Exception as e:
            self.logger.error(f"Error reading memory: {str(e)}")
            raise

    def _free_memory(self, ptr: int) -> None:
        """Free WASM memory."""
        try:
            instance = self._ensure_instance()
            instance.exports.free_memory(self.store, ptr)
        except Exception as e:
            self.logger.error(f"Error freeing memory: {str(e)}")
            raise
