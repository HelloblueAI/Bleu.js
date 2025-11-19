# Bleu.js API Reference

Complete API reference for Bleu.js Python package.

---

## Table of Contents

1. [Core API](#core-api)
2. [Quantum API](#quantum-api)
3. [ML API](#ml-api)
4. [Monitoring API](#monitoring-api)
5. [Security API](#security-api)
6. [API Client](#api-client)
7. [Utilities](#utilities)

---

## Core API

### `BleuJS`

Main class for quantum-enhanced AI processing.

#### Constructor

```python
BleuJS(
    quantum_mode: bool = False,
    model_path: Optional[str] = None,
    device: str = "cpu",
    **kwargs
)
```

**Parameters:**
- `quantum_mode` (bool): Enable quantum computing features (default: False)
- `model_path` (str, optional): Path to trained model file
- `device` (str): Computing device - "cuda" or "cpu" (default: "cpu")
- `**kwargs`: Additional configuration options

**Example:**
```python
from bleujs import BleuJS

# Basic usage
bleu = BleuJS()

# With quantum features
bleu = BleuJS(quantum_mode=True, device="cuda")
```

#### Methods

##### `process()`

Process input data with optional quantum enhancements.

```python
process(
    input_data: Union[Dict, np.ndarray, list],
    quantum_features: bool = False,
    **kwargs
) -> Dict[str, Any]
```

**Parameters:**
- `input_data`: Input data (dict, numpy array, or list)
- `quantum_features` (bool): Enable quantum feature extraction (default: False)
- `**kwargs`: Additional processing options

**Returns:**
- `Dict[str, Any]`: Processed results with status and data

**Example:**
```python
result = bleu.process(
    input_data={"text": "Hello, world!"},
    quantum_features=True
)
print(result['status'])  # 'success'
```

---

## Quantum API

### `QuantumFeatureExtractor`

Extract quantum features from data.

#### Constructor

```python
QuantumFeatureExtractor(
    num_qubits: int = 4,
    entanglement_type: str = "full",
    **kwargs
)
```

**Parameters:**
- `num_qubits` (int): Number of qubits (default: 4)
- `entanglement_type` (str): Type of entanglement - "full", "linear", or "circular" (default: "full")
- `**kwargs`: Additional quantum circuit parameters

**Example:**
```python
from bleujs.quantum import QuantumFeatureExtractor

extractor = QuantumFeatureExtractor(num_qubits=4)
features = extractor.extract(data)
```

#### Methods

##### `extract()`

Extract quantum features from input data.

```python
extract(
    data: Union[np.ndarray, list],
    use_entanglement: bool = True,
    **kwargs
) -> np.ndarray
```

**Parameters:**
- `data`: Input data array
- `use_entanglement` (bool): Enable entanglement (default: True)
- `**kwargs`: Additional extraction options

**Returns:**
- `np.ndarray`: Extracted quantum features

---

### `QuantumAttention`

Quantum-inspired attention mechanism.

#### Constructor

```python
QuantumAttention(
    num_heads: int = 8,
    dim: int = 512,
    dropout: float = 0.1,
    **kwargs
)
```

**Parameters:**
- `num_heads` (int): Number of attention heads (default: 8)
- `dim` (int): Input dimension (default: 512)
- `dropout` (float): Dropout rate (default: 0.1)
- `**kwargs`: Additional attention parameters

**Example:**
```python
from bleujs.quantum import QuantumAttention

attention = QuantumAttention(num_heads=8, dim=512)
output = attention(query, key, value)
```

---

## ML API

### `HybridTrainer`

Train hybrid classical-quantum ML models.

#### Constructor

```python
HybridTrainer(
    model_type: str = "xgboost",
    quantum_components: bool = True,
    **kwargs
)
```

**Parameters:**
- `model_type` (str): Model type - "xgboost", "random_forest", etc. (default: "xgboost")
- `quantum_components` (bool): Enable quantum components (default: True)
- `**kwargs`: Additional training parameters

**Example:**
```python
from bleujs.ml import HybridTrainer

trainer = HybridTrainer(model_type="xgboost")
model = trainer.train(X_train, y_train)
```

#### Methods

##### `train()`

Train the hybrid model.

```python
train(
    X_train: np.ndarray,
    y_train: np.ndarray,
    quantum_features: bool = True,
    **kwargs
) -> Any
```

**Parameters:**
- `X_train`: Training features
- `y_train`: Training labels
- `quantum_features` (bool): Use quantum features (default: True)
- `**kwargs`: Additional training options

**Returns:**
- Trained model object

---

### `QuantumVisionModel`

Quantum-enhanced computer vision model.

#### Constructor

```python
QuantumVisionModel(
    num_classes: int = 10,
    quantum_layers: int = 2,
    **kwargs
)
```

**Parameters:**
- `num_classes` (int): Number of output classes (default: 10)
- `quantum_layers` (int): Number of quantum layers (default: 2)
- `**kwargs`: Additional model parameters

**Example:**
```python
from bleujs.ml import QuantumVisionModel

model = QuantumVisionModel(num_classes=10)
predictions = model.predict(images)
```

---

## Monitoring API

### `PerformanceTracker`

Track and monitor performance metrics.

#### Constructor

```python
PerformanceTracker(
    enable_logging: bool = True,
    metrics_interval: float = 1.0,
    **kwargs
)
```

**Parameters:**
- `enable_logging` (bool): Enable logging (default: True)
- `metrics_interval` (float): Metrics collection interval in seconds (default: 1.0)
- `**kwargs`: Additional tracking options

**Example:**
```python
from bleujs.monitoring import PerformanceTracker

tracker = PerformanceTracker()
tracker.start()
# ... your code ...
metrics = tracker.get_metrics()
tracker.stop()
```

#### Methods

##### `start()`

Start performance tracking.

```python
start() -> None
```

##### `stop()`

Stop performance tracking.

```python
stop() -> None
```

##### `get_metrics()`

Get current performance metrics.

```python
get_metrics() -> Dict[str, Any]
```

**Returns:**
- Dictionary with performance metrics (CPU, memory, GPU, etc.)

---

## Security API

### `QuantumSecurityManager`

Quantum-resistant security management.

#### Constructor

```python
QuantumSecurityManager(
    encryption_key: Optional[str] = None,
    algorithm: str = "AES-256",
    **kwargs
)
```

**Parameters:**
- `encryption_key` (str, optional): Encryption key (auto-generated if None)
- `algorithm` (str): Encryption algorithm (default: "AES-256")
- `**kwargs`: Additional security options

**Example:**
```python
from bleujs.security import QuantumSecurityManager

security = QuantumSecurityManager()
encrypted = security.encrypt(data)
decrypted = security.decrypt(encrypted)
```

---

## API Client

### `BleuAPIClient`

Client for Bleu.js cloud API.

#### Constructor

```python
BleuAPIClient(
    api_key: str,
    base_url: str = "https://bleujs.org",
    timeout: float = 30.0,
    **kwargs
)
```

**Parameters:**
- `api_key` (str): API key for authentication
- `base_url` (str): Base URL for API (default: "https://bleujs.org")
- `timeout` (float): Request timeout in seconds (default: 30.0)
- `**kwargs`: Additional client options

**Example:**
```python
from bleujs.api_client import BleuAPIClient

client = BleuAPIClient(api_key="bleujs_sk_...")
response = client.chat([{"role": "user", "content": "Hello!"}])
```

#### Methods

##### `chat()`

Send chat completion request.

```python
chat(
    messages: List[Dict[str, str]],
    model: str = "default",
    **kwargs
) -> ChatCompletionResponse
```

**Parameters:**
- `messages`: List of message dictionaries with "role" and "content"
- `model` (str): Model to use (default: "default")
- `**kwargs`: Additional request options

**Returns:**
- `ChatCompletionResponse`: Response object with content and metadata

##### `generate()`

Generate text from prompt.

```python
generate(
    prompt: str,
    max_tokens: int = 100,
    **kwargs
) -> GenerateResponse
```

**Parameters:**
- `prompt` (str): Input prompt
- `max_tokens` (int): Maximum tokens to generate (default: 100)
- `**kwargs`: Additional generation options

**Returns:**
- `GenerateResponse`: Response object with generated text

##### `embed()`

Generate embeddings for text.

```python
embed(
    inputs: List[str],
    **kwargs
) -> EmbedResponse
```

**Parameters:**
- `inputs`: List of text strings to embed
- `**kwargs`: Additional embedding options

**Returns:**
- `EmbedResponse`: Response object with embeddings array

##### `list_models()`

List available models.

```python
list_models() -> List[Dict[str, Any]]
```

**Returns:**
- List of available model dictionaries

---

## Utilities

### `setup_logging()`

Configure logging for Bleu.js.

```python
setup_logging(
    level: str = "INFO",
    format: Optional[str] = None,
    **kwargs
) -> None
```

**Parameters:**
- `level` (str): Logging level - "DEBUG", "INFO", "WARNING", "ERROR" (default: "INFO")
- `format` (str, optional): Custom log format
- `**kwargs`: Additional logging options

**Example:**
```python
from bleujs import setup_logging

setup_logging(level="DEBUG")
```

---

### `get_device()`

Get available computing device.

```python
get_device() -> str
```

**Returns:**
- Device string - "cuda" if GPU available, "cpu" otherwise

**Example:**
```python
from bleujs import get_device

device = get_device()  # "cuda" or "cpu"
```

---

### `check_dependencies()`

Check if required dependencies are installed.

```python
check_dependencies(
    features: List[str],
    raise_on_missing: bool = False
) -> Dict[str, bool]
```

**Parameters:**
- `features`: List of feature names to check (e.g., ["quantum", "ml"])
- `raise_on_missing` (bool): Raise exception if dependencies missing (default: False)

**Returns:**
- Dictionary mapping feature names to availability (True/False)

**Example:**
```python
from bleujs import check_dependencies

status = check_dependencies(["quantum", "ml"])
if not status["quantum"]:
    print("Quantum features not available")
```

---

## Error Handling

### Exceptions

#### `BleuJSError`

Base exception for all Bleu.js errors.

```python
class BleuJSError(Exception):
    pass
```

#### `QuantumFeatureError`

Error in quantum feature extraction.

```python
class QuantumFeatureError(BleuJSError):
    pass
```

#### `ModelLoadError`

Error loading model.

```python
class ModelLoadError(BleuJSError):
    pass
```

#### `APIError`

Error from API client.

```python
class APIError(BleuJSError):
    pass
```

---

## Type Hints

All functions include type hints for better IDE support and type checking.

**Example:**
```python
from typing import Dict, Any, Optional, Union
import numpy as np

def process(
    input_data: Union[Dict, np.ndarray, list],
    quantum_features: bool = False
) -> Dict[str, Any]:
    ...
```

---

## Additional Resources

- **Quick Start:** [`QUICKSTART.md`](./QUICKSTART.md)
- **API Client Guide:** [`API_CLIENT_GUIDE.md`](./API_CLIENT_GUIDE.md)
- **Examples:** [`../examples/`](../examples/)
- **User Guide:** [`../COMPLETE_USER_GUIDE.md`](../COMPLETE_USER_GUIDE.md)

---

**Last Updated:** 2025-01-XX  
**Version:** 1.2.1

