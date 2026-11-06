# Bleu.js Technical Documentation

> **Historical architecture notes.** This page is retained for older design
> context and may mention components that are not part of the current hosted
> Developer API. For current API auth, base URL, website assistant, local utility,
> and test-stub boundaries, see
> [API, assistants, and local utilities](WHO_SERVES_THE_API.md). Do not use this
> page for pricing, rate limits, billing, entitlement, or deployment claims.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quantum Computing Integration](#quantum-computing-integration)
3. [Machine Learning Capabilities](#machine-learning-capabilities)
4. [API Architecture](#api-architecture)
5. [Security Implementation](#security-implementation)
6. [Performance Optimization](#performance-optimization)
7. [Deployment Guide](#deployment-guide)

## Architecture Overview

### System Components

- **Frontend**: Next.js application with TypeScript
- **Backend**: Python-based API server
- **Quantum Processing**: Qiskit-based quantum computing integration
- **ML Pipeline**: Enhanced XGBoost with quantum features
- **Database**: PostgreSQL with quantum-optimized queries

### Technology Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Backend**: Python, FastAPI
- **Quantum**: Qiskit, PennyLane
- **ML**: XGBoost, TensorFlow, PyTorch
- **Infrastructure**: Docker, Kubernetes

## Quantum Computing Integration

### Quantum Feature Processing

```python
class QuantumFeatureProcessor:
    """Enhanced quantum feature processor with advanced capabilities."""

    def __init__(self, config: Optional[QuantumFeatureConfig] = None):
        self.config = config or QuantumFeatureConfig()
        self.quantum_circuit = None
        self.sampler = Sampler()
```

### Key Features

- Quantum-enhanced feature selection
- Quantum dimensionality reduction
- Quantum state preparation
- Error correction and mitigation
- Adaptive quantum circuits

### Configuration Options

```python
@dataclass
class QuantumFeatureConfig:
    num_qubits: int = 4
    feature_dim: int = 2048
    reduced_dim: int = 64
    use_entanglement: bool = True
    use_superposition: bool = True
    error_correction: bool = True
```

## Machine Learning Capabilities

### Enhanced XGBoost

```python
class EnhancedXGBoost:
    """Enhanced XGBoost model with quantum computing capabilities"""

    def __init__(self, quantum_config: Optional[Dict] = None):
        self.quantum_processor = QuantumProcessor()
        self.quantum_circuit = QuantumCircuit()
```

### Features

- Quantum-enhanced feature processing
- Advanced model explainability
- Adaptive learning rates
- Quantum-optimized loss functions
- Multi-scale feature fusion

### Model Training

```python
async def train(self, features: np.ndarray, labels: np.ndarray):
    # Process features with quantum enhancement
    features_enhanced = await self._enhance_features(features)

    # Train XGBoost model
    self.model = xgb.XGBClassifier(
        **self.quantum_config.get("xgb_params", {}),
        use_label_encoder=False,
        eval_metric=["logloss", "auc"]
    )
```

## API Architecture

### Current hosted Developer API

- Base URL: `https://api.bleujs.org`
- Auth: `Authorization: Bearer <BLEUJS_API_KEY>`
- Canonical paths: `/api/v1/chat`, `/api/v1/generate`, `/api/v1/embed`,
  `/api/v1/models`, plus `/health`
- API contract: [docs/api/openapi.yaml](api/openapi.yaml)

Website assistants are configured on bleujs.org and are not the same surface as
the Developer API. Optional local utilities such as `BleuJS().process(...)`,
`bleu-js[ml]`, and `bleu-js[quantum]` can run without a hosted API key because
they do not call the hosted chat/generate/embed API.

### Historical endpoint notes

The older `/v1/auth/*`, `/v1/subscriptions/*`, `/v1/quantum/*`, and `/v1/ml/*`
bullets that appeared here were design notes for the app/server direction, not
the current public SDK contract. Use [API.md](API.md), [API_CLIENT_GUIDE.md](API_CLIENT_GUIDE.md),
and the OpenAPI spec for current client-facing paths.

### Historical authentication sketch

The following snippet is retained as an old self-hosted app sketch. Hosted
Developer API keys are created in the bleujs.org dashboard and sent as bearer
tokens by the SDK/CLI.

```python
@router.post("/auth/api-key")
async def generate_api_key(
    request: Request,
    user: User = Depends(get_current_user)
):
    api_key = generate_secret_key()
    return {"api_key": api_key}
```

## Security Implementation

### Data Protection

- End-to-end encryption
- Quantum-resistant cryptography
- Differential privacy
- Secure key management

### Access Control

```python
class SecurityConfig:
    differential_privacy: bool = True
    privacy_budget: float = 0.1
    encryption_level: str = "AES-256"
    key_rotation_days: int = 30
```

## Performance Optimization

### Quantum Optimization

- Circuit optimization
- Error mitigation
- Resource allocation
- Parallel processing

### Caching Strategy

- Quantum state caching
- Feature cache
- Model cache
- API response cache

## Deployment Guide

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker
- Kubernetes cluster
- Quantum computing access

### Environment Variables

```bash
# Core Configuration
VITE_APP_NAME="Bleu.js"
VITE_APP_ENV="production"
VITE_API_URL="https://api.bleujs.org"

# Quantum Configuration
QUANTUM_NUM_QUBITS=4
QUANTUM_OPTIMIZATION_LEVEL=3
QUANTUM_ERROR_CORRECTION=true

# ML Configuration
ML_BATCH_SIZE=128
ML_LEARNING_RATE=0.01
ML_NUM_EPOCHS=1000
```

### Deployment Steps

1. Set up environment variables
2. Build frontend application
3. Deploy backend services
4. Configure quantum processors
5. Initialize ML models
6. Set up monitoring

### Monitoring

- Performance metrics
- Quantum circuit metrics
- API usage statistics
- Error rates
- Resource utilization

## Support and Resources

### Documentation

- API Documentation: `/docs/API.md`
- Research Papers: `/docs/academic/`
- Architecture Details: `/docs/python-architecture/`

### Contact

- Technical Support: tech@bleujs.com
- Enterprise Support: enterprise@bleujs.com
- Documentation: docs.bleujs.com
