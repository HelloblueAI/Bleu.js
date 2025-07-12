# Bleu.js AI Components

## 🧠 Unified Quantum Processor Interface

Bleu.js now uses a unified abstract base class for all quantum processor implementations:

- **Location:** `src/quantum_py/quantum/quantum_processor_base.py`
- **Purpose:** Ensures all quantum backends (Qiskit, PennyLane, Cirq, etc.) implement a common interface.
- **Key Methods:**
  - `initialize()`
  - `process_features(features: np.ndarray)`
  - `apply_error_correction()`
  - `get_backend_name()`

All major `QuantumProcessor` classes now inherit from this base, making it easy to swap or extend quantum backends.

## 🧩 Shared Constants

- **Location:** `src/utils/constants.py`
- **Purpose:** Centralizes error messages and common strings to reduce duplication and improve maintainability.
- **Usage:** All modules now import error messages and common labels from this file.

## 🏗️ Base Classes for Services & Processors

- **Location:** `src/utils/base_classes.py`
- **Purpose:** All `Service`, `Processor`, and `Manager` classes now inherit from these base classes, ensuring consistent structure and reducing boilerplate.
- **Benefits:**
  - DRY code
  - Easier to maintain and extend
  - Consistent logging and configuration

---

**For more details, see the code comments in each base class and the new constants module.**
