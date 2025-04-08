# Machine Learning with BleuJS

BleuJS provides a comprehensive suite of machine learning tools and algorithms, combining classical ML, quantum computing, and hybrid approaches. This guide covers the various ML capabilities and how to use them effectively.

## Available ML Models

### Gradient Boosting Models

#### XGBoost Integration
```python
from bleujs.ml import XGBoostModel
from bleujs.preprocessing import QuantumFeatureExtractor

# Configure XGBoost with quantum enhancement
model = XGBoostModel(
    quantum_features=True,
    n_estimators=1000,
    max_depth=7,
    learning_rate=0.01,
    objective='multi:softmax',
    tree_method='gpu_hist'  # For GPU acceleration
)

# Train the model
model.fit(X_train, y_train)

# Make predictions
predictions = model.predict(X_test)
```

#### LightGBM for Large-Scale Learning
```python
from bleujs.ml import LightGBMModel

# Initialize LightGBM with distributed training
model = LightGBMModel(
    num_leaves=31,
    learning_rate=0.05,
    feature_fraction=0.9,
    distributed_training=True,
    num_threads=8
)

# Train in distributed mode
model.fit(X_train, y_train)
```

### Quantum-Enhanced Features

#### Feature Extraction
```python
from bleujs.quantum import QuantumFeatureExtractor

extractor = QuantumFeatureExtractor(
    n_qubits=8,
    feature_map='amplitude_encoding',
    backend='aer_simulator',
    shots=1000
)

# Extract quantum features
quantum_features = extractor.transform(X)
```

#### Hybrid Feature Selection
```python
from bleujs.feature_selection import HybridFeatureSelector

selector = HybridFeatureSelector(
    quantum_method='vqe',
    classical_method='mutual_info',
    n_features=10
)

# Select best features using both quantum and classical methods
selected_features = selector.fit_transform(X, y)
```

### Deep Learning Integration

#### Neural Network Models
```python
from bleujs.deep_learning import QuantumNeuralNetwork

# Create a hybrid quantum-classical neural network
model = QuantumNeuralNetwork(
    classical_layers=[512, 256, 128],
    quantum_layers=2,
    activation='relu',
    quantum_activation='quantum_relu'
)

# Train the model
history = model.fit(
    X_train, y_train,
    epochs=100,
    batch_size=32,
    validation_split=0.2
)
```

## Advanced Features

### Ensemble Methods

#### Quantum-Classical Ensemble
```python
from bleujs.ensemble import HybridEnsemble

ensemble = HybridEnsemble(
    models=[
        ('xgb', XGBoostModel()),
        ('quantum', QuantumClassifier()),
        ('lightgbm', LightGBMModel())
    ],
    weights=[0.4, 0.3, 0.3]
)

# Train ensemble
ensemble.fit(X_train, y_train)
```

### Hyperparameter Optimization

#### Quantum-Assisted Optimization
```python
from bleujs.optimization import QuantumHyperOpt

optimizer = QuantumHyperOpt(
    model=XGBoostModel(),
    param_space={
        'max_depth': [3, 5, 7, 9],
        'learning_rate': [0.01, 0.1, 0.3],
        'n_estimators': [100, 500, 1000]
    },
    optimization_method='quantum_annealing'
)

# Find optimal parameters
best_params = optimizer.optimize(X_train, y_train)
```

## Performance Considerations

### Hardware Acceleration
- **GPU Support**:
  - NVIDIA GPUs with CUDA 11.x
  - AMD GPUs with ROCm 5.x
  - Multi-GPU training support

### Distributed Training
```python
from bleujs.distributed import DistributedTrainer

trainer = DistributedTrainer(
    model=XGBoostModel(),
    num_workers=4,
    strategy='data_parallel'
)

# Train in distributed mode
trainer.fit(X_train, y_train)
```

### Memory Optimization
- Gradient checkpointing for large models
- Quantization for reduced memory footprint
- Streaming data processing for large datasets

## Best Practices

### Model Selection
1. **Small Datasets** (<10k samples):
   - XGBoost with quantum feature enhancement
   - Full quantum models for specific cases

2. **Medium Datasets** (10k-1M samples):
   - LightGBM with classical features
   - Hybrid quantum-classical approaches

3. **Large Datasets** (>1M samples):
   - Distributed LightGBM
   - GPU-accelerated XGBoost
   - Classical deep learning with quantum layers

### Feature Engineering
- Use quantum feature extraction for high-dimensional data
- Combine classical and quantum features for optimal performance
- Apply feature selection before quantum processing

### Model Evaluation
```python
from bleujs.evaluation import HybridModelEvaluator

evaluator = HybridModelEvaluator(
    metrics=['accuracy', 'quantum_advantage', 'inference_time']
)

# Evaluate model performance
scores = evaluator.evaluate(model, X_test, y_test)
```

## Error Handling and Debugging

### Common Issues
- Quantum backend availability
- GPU memory limitations
- Distributed training synchronization

### Logging and Monitoring
```python
from bleujs.monitoring import MLMonitor

monitor = MLMonitor(
    log_quantum_metrics=True,
    log_classical_metrics=True,
    export_format='tensorboard'
)

# Monitor training
with monitor:
    model.fit(X_train, y_train)
```
