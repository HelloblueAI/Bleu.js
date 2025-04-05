"""Example of using quantum-enhanced XGBoost with self-learning capabilities."""

import asyncio
import time

from sklearn.datasets import make_classification
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

from ..quantum.hybrid.xgboost_quantum_hybrid import HybridConfig, XGBoostQuantumHybrid
from ..quantum.processor import QuantumProcessor
from ..quantum.self_learning import SelfLearningSystem


async def main():
    print("Initializing quantum-enhanced XGBoost with self-learning capabilities...")

    # Generate synthetic data with more complex patterns
    print("\nGenerating synthetic data with complex patterns...")
    X, y = make_classification(
        n_samples=2000,  # Increased sample size
        n_features=30,  # More features
        n_informative=25,  # More informative features
        n_redundant=5,
        n_clusters_per_class=2,  # Multiple clusters per class
        random_state=42,
    )

    # Split data
    print("\nSplitting data into train/test sets...")
    train_features, test_features, train_labels, test_labels = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Initialize self-learning system
    print("\nInitializing self-learning system...")
    self_learning = SelfLearningSystem(
        learning_rate=0.01,
        adaptation_threshold=0.1,
        max_complexity=1.0,
        save_path="learning_history",
        use_advanced_learning=True,
        use_quantum_optimization=True,
        use_meta_learning=True,
    )
    await self_learning.initialize()

    # Configure quantum processor with advanced settings
    print("\nConfiguring quantum processor with advanced settings...")
    quantum_config = {
        "n_qubits": 6,  # Increased number of qubits
        "n_layers": 3,  # More layers for deeper quantum processing
        "entanglement": "full",  # Full entanglement for maximum quantum advantage
        "shots": 2000,  # More shots for better precision
        "optimization_level": 3,
        "error_correction": True,
        "use_advanced_circuits": True,
        "use_quantum_optimization": True,
        "use_noise_mitigation": True,
        "use_quantum_feature_selection": True,
    }

    # Configure hybrid model with advanced settings
    print("\nConfiguring hybrid model with advanced settings...")
    config = HybridConfig(
        # XGBoost parameters
        n_estimators=200,  # More trees
        learning_rate=0.05,  # Lower learning rate for better generalization
        max_depth=5,  # Deeper trees
        min_child_weight=1,
        subsample=0.8,
        colsample_bytree=0.8,
        # Quantum parameters
        quantum_feature_ratio=0.4,  # Increased quantum feature ratio
        n_qubits=6,
        n_layers=3,
        entanglement="full",
        shots=2000,
        optimization_level=3,
        error_correction=True,
        # Performance parameters
        use_gpu=True,
        batch_size=64,  # Larger batch size
        num_workers=8,  # More workers
    )

    # Initialize quantum processor
    print("\nInitializing quantum processor...")
    quantum_processor = QuantumProcessor(**quantum_config)
    await quantum_processor.initialize()

    # Print quantum circuit information
    circuit_info = quantum_processor.get_circuit_info()
    print("\nQuantum Circuit Information:")
    print(f"- Circuit depth: {circuit_info['depth']}")
    print(f"- Circuit size: {circuit_info['size']}")
    print(f"- Circuit width: {circuit_info['width']}")
    print(f"- Number of parameters: {circuit_info['n_parameters']}")
    print(f"- Quantum speedup: {circuit_info['quantum_speedup']:.2f}x")
    print(f"- Coherence time: {circuit_info['coherence_time']:.2f}ms")
    print(f"- Entanglement quality: {circuit_info['entanglement_quality']:.2f}")

    # Create and train hybrid model
    print("\nCreating and training hybrid model...")
    model = XGBoostQuantumHybrid(config=config, quantum_processor=quantum_processor)

    # Training loop with self-learning
    print("\nStarting training loop with self-learning...")
    n_epochs = 10
    best_metrics = {}

    for epoch in range(n_epochs):
        print(f"\nEpoch {epoch + 1}/{n_epochs}")

        # Measure training time
        start_time = time.time()
        metrics = await model.train(train_features, train_labels)
        training_time = time.time() - start_time

        # Get current model state
        model_state = {
            "n_estimators": config.n_estimators,
            "learning_rate": config.learning_rate,
            "max_depth": config.max_depth,
            "quantum_feature_ratio": config.quantum_feature_ratio,
            "n_qubits": config.n_qubits,
            "n_layers": config.n_layers,
        }

        # Get quantum state
        quantum_state = {
            "coherence_time": circuit_info["coherence_time"],
            "entanglement_quality": circuit_info["entanglement_quality"],
            "error_rate": quantum_processor.get_metrics()["error_rate"],
        }

        # Combine metrics for self-learning
        current_metrics = {
            "performance_score": metrics.get("auc", 0.0),
            "quantum_speedup": circuit_info["quantum_speedup"],
            "coherence_time": circuit_info["coherence_time"],
            "entanglement_quality": circuit_info["entanglement_quality"],
            "error_rate": quantum_processor.get_metrics()["error_rate"],
            "model_complexity": config.max_depth / 10.0,  # Normalized complexity
            "adaptation_speed": 1.0 / training_time,
        }

        # Apply self-learning
        print("\nApplying self-learning...")
        updated_state = await self_learning.learn(
            current_metrics=current_metrics,
            model_state=model_state,
            quantum_state=quantum_state,
        )

        # Update model configuration
        config.n_estimators = int(
            updated_state.get("n_estimators", config.n_estimators)
        )
        config.learning_rate = updated_state.get("learning_rate", config.learning_rate)
        config.max_depth = int(updated_state.get("max_depth", config.max_depth))
        config.quantum_feature_ratio = updated_state.get(
            "quantum_feature_ratio", config.quantum_feature_ratio
        )

        # Print learning metrics
        learning_metrics = self_learning.get_learning_metrics()
        print("\nLearning Metrics:")
        for metric, value in learning_metrics.items():
            print(f"- {metric}: {value:.4f}")

        # Update best metrics
        if not best_metrics or metrics.get("auc", 0.0) > best_metrics.get("auc", 0.0):
            best_metrics = metrics

    # Make predictions
    print("\nMaking predictions...")
    start_time = time.time()
    y_pred = await model.predict(test_features)
    y_pred_proba = await model.predict(test_features, return_proba=True)
    prediction_time = time.time() - start_time

    # Calculate metrics
    accuracy = accuracy_score(test_labels, y_pred)
    auc = roc_auc_score(test_labels, y_pred_proba[:, 1])
    f1 = f1_score(test_labels, y_pred)
    precision = precision_score(test_labels, y_pred)
    recall = recall_score(test_labels, y_pred)

    print("\nTest Set Metrics:")
    print(f"- Accuracy: {accuracy:.4f}")
    print(f"- AUC-ROC: {auc:.4f}")
    print(f"- F1 Score: {f1:.4f}")
    print(f"- Precision: {precision:.4f}")
    print(f"- Recall: {recall:.4f}")
    print(f"- Prediction time: {prediction_time:.2f} seconds")

    # Get feature importance
    feature_importance = model.get_feature_importance()
    print("\nFeature Importance:")
    sorted_features = sorted(
        feature_importance.items(), key=lambda x: x[1], reverse=True
    )
    for feature, importance in sorted_features[:10]:  # Show top 10
        print(f"- {feature}: {importance:.4f}")

    # Get quantum processor metrics
    quantum_metrics = quantum_processor.get_metrics()
    print("\nQuantum Processor Metrics:")
    print(f"- Total executions: {quantum_metrics['total_executions']}")
    print(f"- Successful executions: {quantum_metrics['successful_executions']}")
    print(f"- Failed executions: {quantum_metrics['failed_executions']}")
    print(f"- Error rate: {quantum_metrics['error_rate']:.4f}")
    print(f"- Quantum speedup: {quantum_metrics['quantum_speedup']:.2f}x")
    print(f"- Coherence time: {quantum_metrics['coherence_time']:.2f}ms")
    print(f"- Entanglement quality: {quantum_metrics['entanglement_quality']:.2f}")

    # Print learning history
    learning_history = self_learning.get_learning_history()
    print("\nLearning History Summary:")
    print(f"- Total learning iterations: {len(learning_history)}")
    if learning_history:
        initial_metrics = learning_history[0]
        final_metrics = learning_history[-1]
        print(
            f"- Performance improvement: {final_metrics.performance_score - initial_metrics.performance_score:.4f}"
        )
        print(
            f"- Quantum speedup improvement: {final_metrics.quantum_speedup - initial_metrics.quantum_speedup:.2f}x"
        )
        print(
            f"- Error rate reduction: {initial_metrics.error_rate - final_metrics.error_rate:.4f}"
        )

    # Clean up
    print("\nCleaning up resources...")
    await quantum_processor.cleanup()
    print("\nExample completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())
