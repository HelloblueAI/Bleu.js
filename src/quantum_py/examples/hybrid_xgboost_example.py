import asyncio
import logging
import time

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sklearn.datasets import make_classification
from sklearn.metrics import auc, classification_report, roc_curve
from sklearn.model_selection import train_test_split

from ..quantum.hybrid.xgboost_quantum_hybrid import HybridConfig, XGBoostQuantumHybrid

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def main():
    """Example usage of XGBoostQuantumHybrid with enhanced capabilities"""
    logger.info("Starting quantum-enhanced XGBoost example...")

    # Generate synthetic data with complex patterns
    logger.info("Generating synthetic data...")
    X, y = make_classification(
        n_samples=2000,  # Increased sample size
        n_features=30,  # More features
        n_informative=25,  # More informative features
        n_redundant=5,
        n_clusters_per_class=2,  # Multiple clusters per class
        random_state=42,
    )

    # Split data
    logger.info("Splitting data into train/test sets...")
    features_train, features_test, labels_train, labels_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Initialize hybrid model with enhanced configuration
    logger.info("Initializing hybrid model with enhanced configuration...")
    config = HybridConfig(
        # XGBoost parameters
        n_estimators=200,  # More trees
        learning_rate=0.05,  # Lower learning rate for better generalization
        max_depth=5,  # Deeper trees
        objective="binary:logistic",
        eval_metric="auc",
        # Quantum parameters
        n_qubits=6,  # Increased number of qubits
        n_layers=3,  # More layers for deeper quantum processing
        entanglement="full",  # Full entanglement for maximum quantum advantage
        shots=2000,  # More shots for better precision
        optimization_level=3,
        error_correction=True,
        use_advanced_circuits=True,
        quantum_feature_ratio=0.4,  # Increased quantum feature ratio
        # Enhanced features
        use_error_mitigation=True,
        use_quantum_memory=True,
        use_adaptive_entanglement=True,
        quantum_feature_selection=True,
        # Performance parameters
        batch_size=64,  # Larger batch size
        early_stopping_rounds=10,
        use_gpu=True,
    )

    # Create and train model
    logger.info("Creating and training hybrid model...")
    model = XGBoostQuantumHybrid(config=config)

    # Train model and get metrics
    start_time = time.time()
    metrics = await model.train(features_train, labels_train, validation_split=0.2)
    training_time = time.time() - start_time

    logger.info(f"Training completed in {training_time:.2f} seconds")
    logger.info("Training metrics:")
    logger.info(f"- Train AUC: {metrics['train']['auc']:.4f}")
    logger.info(f"- Validation AUC: {metrics['val']['auc']:.4f}")
    logger.info(f"- Quantum metrics: {metrics['quantum_metrics']}")

    # Make predictions
    logger.info("Making predictions...")
    y_pred = await model.predict(features_test)
    y_pred_proba = await model.predict(features_test, return_proba=True)

    # Print classification report
    logger.info("\nClassification Report:")
    print(classification_report(labels_test, y_pred))

    # Get feature importance
    feature_importance = model.get_feature_importance()

    # Plot feature importance
    plt.figure(figsize=(12, 6))
    features = [f"Feature {i}" for i in range(len(feature_importance))]
    importance_df = pd.DataFrame(
        {"Feature": features, "Importance": feature_importance}
    ).sort_values("Importance", ascending=False)

    sns.barplot(data=importance_df, x="Importance", y="Feature")
    plt.title("Feature Importance (Hybrid Model)")
    plt.tight_layout()
    plt.savefig("feature_importance.png")
    logger.info("Feature importance plot saved as 'feature_importance.png'")

    # Plot ROC curve
    plt.figure(figsize=(8, 8))
    fpr, tpr, _ = roc_curve(labels_test, y_pred_proba)
    roc_auc = auc(fpr, tpr)

    plt.plot(
        fpr, tpr, color="darkorange", lw=2, label=f"ROC curve (AUC = {roc_auc:.2f})"
    )
    plt.plot([0, 1], [0, 1], color="navy", lw=2, linestyle="--")
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("Receiver Operating Characteristic")
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig("roc_curve.png")
    logger.info("ROC curve plot saved as 'roc_curve.png'")

    # Plot training history
    training_history = model.get_training_history()
    plt.figure(figsize=(10, 6))

    # Extract metrics
    iterations = [h["iteration"] for h in training_history]
    train_auc = [h["metrics"]["train-auc"] for h in training_history]
    val_auc = [h["metrics"]["val-auc"] for h in training_history]

    plt.plot(iterations, train_auc, label="Train AUC")
    plt.plot(iterations, val_auc, label="Validation AUC")
    plt.xlabel("Iteration")
    plt.ylabel("AUC")
    plt.title("Training History")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig("training_history.png")
    logger.info("Training history plot saved as 'training_history.png'")

    # Plot quantum metrics
    quantum_metrics = model.get_quantum_metrics()
    plt.figure(figsize=(10, 6))

    metrics_to_plot = ["error_rate", "entanglement_quality", "memory_usage"]
    for metric in metrics_to_plot:
        if metric in quantum_metrics:
            plt.plot(
                iterations, [quantum_metrics[metric]] * len(iterations), label=metric
            )

    plt.xlabel("Iteration")
    plt.ylabel("Value")
    plt.title("Quantum Metrics")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig("quantum_metrics.png")
    logger.info("Quantum metrics plot saved as 'quantum_metrics.png'")


if __name__ == "__main__":
    asyncio.run(main())
