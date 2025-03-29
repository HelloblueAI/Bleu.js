import asyncio
import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import matplotlib.pyplot as plt
import seaborn as sns
from ..quantum.hybrid.xgboost_quantum_hybrid import XGBoostQuantumHybrid, HybridConfig

async def main():
    """Example usage of XGBoostQuantumHybrid"""
    # Generate synthetic data
    print("Generating synthetic data...")
    X, y = make_classification(
        n_samples=1000,
        n_features=20,
        n_informative=10,
        n_redundant=5,
        n_classes=2,
        random_state=42
    )
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Initialize hybrid model with custom configuration
    config = HybridConfig(
        # XGBoost parameters
        n_estimators=200,
        learning_rate=0.1,
        max_depth=5,
        min_child_weight=1,
        subsample=0.8,
        colsample_bytree=0.8,
        
        # Quantum parameters
        n_qubits=4,
        n_layers=2,
        quantum_feature_ratio=0.3,  # Process 30% of features using quantum computing
        
        # Performance parameters
        use_gpu=True,
        batch_size=64,
        early_stopping_rounds=20
    )
    
    model = XGBoostQuantumHybrid(config=config)
    
    # Optimize hyperparameters
    print("\nOptimizing hyperparameters...")
    best_params = await model.optimize_hyperparameters(
        X_train, y_train,
        n_trials=50  # Reduce for faster execution
    )
    print("Best parameters:", best_params)
    
    # Train model
    print("\nTraining hybrid model...")
    metrics = await model.train(X_train, y_train, validation_split=0.2)
    print("Training metrics:", metrics)
    
    # Make predictions
    print("\nMaking predictions...")
    y_pred = await model.predict(X_test)
    y_pred_proba = await model.predict(X_test, return_proba=True)
    
    # Print classification report
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Get feature importance
    feature_importance = model.get_feature_importance()
    
    # Plot feature importance
    plt.figure(figsize=(12, 6))
    features = [f"Feature {i}" for i in range(len(feature_importance))]
    importance_df = pd.DataFrame({
        'Feature': features,
        'Importance': feature_importance
    }).sort_values('Importance', ascending=False)
    
    sns.barplot(data=importance_df, x='Importance', y='Feature')
    plt.title('Feature Importance (Hybrid Model)')
    plt.tight_layout()
    plt.savefig('feature_importance.png')
    
    # Plot ROC curve
    plt.figure(figsize=(8, 8))
    from sklearn.metrics import roc_curve, auc
    fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
    roc_auc = auc(fpr, tpr)
    
    plt.plot(fpr, tpr, color='darkorange', lw=2,
             label=f'ROC curve (AUC = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic')
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig('roc_curve.png')

if __name__ == "__main__":
    asyncio.run(main()) 