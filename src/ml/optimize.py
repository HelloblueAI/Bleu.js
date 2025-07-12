import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import optuna
import pandas as pd
import torch
import torch.nn as nn
import xgboost as xgb
from sklearn.base import BaseEstimator
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.model_selection import (
    GridSearchCV,
    KFold,
    RandomizedSearchCV,
    cross_val_score,
    train_test_split,
)
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader, TensorDataset

from src.ml.metrics import PerformanceMetrics


class ModelOptimizer:
    def __init__(self, data_path, output_dir="optimized_models"):
        self.data_path = data_path
        self.output_dir = output_dir
        self.scaler = StandardScaler()
        self.best_params = None
        self.best_model = None
        self.metrics = {}
        self.feature_importance = {}

        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def load_data(self):
        """Load and preprocess the data."""
        print("Loading data...")
        data = pd.read_csv(self.data_path)

        # Separate features and target
        features = data.drop("target", axis=1)
        targets = data["target"]

        # Scale the features
        features_scaled = self.scaler.fit_transform(features)

        return features_scaled, targets, features.columns

    def create_neural_network(self, input_dim):
        """Create a neural network model."""
        return nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 1),
            nn.Sigmoid(),
        )

    def train_neural_network(self, features, targets, params):
        """Train a neural network model."""
        # Convert data to PyTorch tensors
        features_tensor = torch.FloatTensor(features)
        targets_tensor = torch.FloatTensor(targets.values)

        # Create data loader
        dataset = TensorDataset(features_tensor, targets_tensor)
        dataloader = DataLoader(dataset, batch_size=params["batch_size"], shuffle=True)

        # Create model
        model = self.create_neural_network(features.shape[1])
        criterion = nn.BCELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=params["learning_rate"])

        # Train model
        model.train()
        for epoch in range(params["epochs"]):
            for batch_features, batch_targets in dataloader:
                optimizer.zero_grad()
                outputs = model(batch_features)
                loss = criterion(outputs.squeeze(), batch_targets)
                loss.backward()
                optimizer.step()

        return model

    def objective(self, trial):
        """Optuna objective function for hyperparameter optimization."""
        param = {
            "n_estimators": trial.suggest_int("n_estimators", 100, 1000),
            "max_depth": trial.suggest_int("max_depth", 3, 10),
            "learning_rate": trial.suggest_loguniform("learning_rate", 0.01, 0.3),
            "subsample": trial.suggest_uniform("subsample", 0.6, 0.9),
            "colsample_bytree": trial.suggest_uniform("colsample_bytree", 0.6, 0.9),
            "reg_alpha": trial.suggest_loguniform("reg_alpha", 1e-3, 10.0),
            "reg_lambda": trial.suggest_loguniform("reg_lambda", 1e-3, 10.0),
            "batch_size": trial.suggest_int("batch_size", 32, 256),
            "epochs": trial.suggest_int("epochs", 10, 100),
            "neural_network_lr": trial.suggest_loguniform(
                "neural_network_lr", 1e-4, 1e-2
            ),
        }

        # Load data
        features_scaled, targets, feature_names = self.load_data()

        # Perform k-fold cross-validation
        kf = KFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = []

        for train_idx, val_idx in kf.split(features_scaled):
            features_train, features_val = (
                features_scaled[train_idx],
                features_scaled[val_idx],
            )
            targets_train, targets_val = targets[train_idx], targets[val_idx]

            # Train XGBoost model
            xgb_model = xgb.XGBClassifier(
                **{
                    k: v
                    for k, v in param.items()
                    if k not in ["batch_size", "epochs", "neural_network_lr"]
                },
                random_state=42,
            )
            xgb_model.fit(features_train, targets_train)

            # Train neural network
            nn_model = self.train_neural_network(features_train, targets_train, param)

            # Make predictions
            xgb_pred = xgb_model.predict_proba(features_val)[:, 1]
            nn_pred = (
                nn_model(torch.FloatTensor(features_val)).detach().numpy().squeeze()
            )

            # Ensemble predictions
            ensemble_pred = 0.7 * xgb_pred + 0.3 * nn_pred

            # Calculate metrics
            cv_scores.append(
                {
                    "accuracy": accuracy_score(targets_val, ensemble_pred > 0.5),
                    "roc_auc": roc_auc_score(targets_val, ensemble_pred),
                    "f1": f1_score(targets_val, ensemble_pred > 0.5),
                }
            )

        # Calculate average metrics
        avg_metrics = {
            metric: np.mean([score[metric] for score in cv_scores])
            for metric in ["accuracy", "roc_auc", "f1"]
        }

        return avg_metrics["accuracy"], avg_metrics["roc_auc"], avg_metrics["f1"]

    def optimize_hyperparameters(self, n_trials=100):
        """Optimize hyperparameters using Optuna."""
        print("Optimizing hyperparameters...")

        study = optuna.create_study(directions=["maximize", "maximize", "maximize"])
        study.optimize(self.objective, n_trials=n_trials)

        # Get the best trial
        best_trial = study.best_trials[0]
        self.best_params = best_trial.params

        print("\nBest hyperparameters:")
        for param, value in self.best_params.items():
            print(f"{param}: {value}")

        return self.best_params

    def train_final_model(self):
        """Train the final ensemble model."""
        print("Training final model...")

        features_scaled, targets, feature_names = self.load_data()

        # Train XGBoost model
        if self.best_params is None:
            raise ValueError("Hyperparameters not optimized yet")
        xgb_params = {
            k: v
            for k, v in self.best_params.items()
            if k not in ["batch_size", "epochs", "neural_network_lr"]
        }
        xgb_model = xgb.XGBClassifier(**xgb_params, random_state=42)
        xgb_model.fit(features_scaled, targets)

        # Train neural network
        nn_model = self.train_neural_network(features_scaled, targets, self.best_params)

        # Get feature importance from XGBoost
        self.feature_importance = dict(
            zip(feature_names, xgb_model.feature_importances_)
        )

        # Save models
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Save XGBoost model
        xgb_path = os.path.join(self.output_dir, f"xgb_model_{timestamp}.pkl")
        joblib.dump(xgb_model, xgb_path)

        # Save neural network model
        nn_path = os.path.join(self.output_dir, f"nn_model_{timestamp}.pt")
        torch.save(nn_model.state_dict(), nn_path)

        # Save scaler
        scaler_path = os.path.join(self.output_dir, f"scaler_{timestamp}.pkl")
        joblib.dump(self.scaler, scaler_path)

        # Save feature importance
        importance_path = os.path.join(
            self.output_dir, f"feature_importance_{timestamp}.json"
        )
        with open(importance_path, "w") as f:
            json.dump(self.feature_importance, f, indent=4)

        print(f"\nModels saved to: {self.output_dir}")
        print(f"Feature importance saved to: {importance_path}")


class HyperparameterOptimizer:
    """Class for hyperparameter optimization."""

    def __init__(
        self,
        model: BaseEstimator,
        param_grid: Dict[str, Any],
        X: np.ndarray,
        y: np.ndarray,
        test_size: float = 0.2,
        random_state: Optional[int] = None,
    ) -> None:
        """Initialize hyperparameter optimizer.

        Args:
            model: Scikit-learn model
            param_grid: Parameter grid to search
            X: Feature matrix
            y: Target vector
            test_size: Test set size (default: 0.2)
            random_state: Random state for reproducibility
        """
        self.model = model
        self.param_grid = param_grid
        self.X = X
        self.y = y
        self.test_size = test_size
        self.random_state = random_state

        # Split data
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

    def grid_search(
        self,
        cv: int = 5,
        scoring: Optional[str] = None,
        n_jobs: int = -1,
    ) -> Tuple[BaseEstimator, Dict[str, Any]]:
        """Perform grid search.

        Args:
            cv: Number of folds (default: 5)
            scoring: Scoring metric (default: None)
            n_jobs: Number of jobs to run in parallel (default: -1)

        Returns:
            Tuple[BaseEstimator, Dict[str, Any]]: Best model and results
        """
        # Create grid search object
        grid_search = GridSearchCV(
            self.model,
            self.param_grid,
            cv=cv,
            scoring=scoring,
            n_jobs=n_jobs,
            return_train_score=True,
        )

        # Fit grid search
        grid_search.fit(self.X_train, self.y_train)

        # Get results
        results = {
            "best_params": grid_search.best_params_,
            "best_score": grid_search.best_score_,
            "cv_results": grid_search.cv_results_,
        }

        return grid_search.best_estimator_, results

    def random_search(
        self,
        n_iter: int = 10,
        cv: int = 5,
        scoring: Optional[str] = None,
        n_jobs: int = -1,
    ) -> Tuple[BaseEstimator, Dict[str, Any]]:
        """Perform random search.

        Args:
            n_iter: Number of iterations (default: 10)
            cv: Number of folds (default: 5)
            scoring: Scoring metric (default: None)
            n_jobs: Number of jobs to run in parallel (default: -1)

        Returns:
            Tuple[BaseEstimator, Dict[str, Any]]: Best model and results
        """
        # Create random search object
        random_search = RandomizedSearchCV(
            self.model,
            self.param_grid,
            n_iter=n_iter,
            cv=cv,
            scoring=scoring,
            n_jobs=n_jobs,
            return_train_score=True,
        )

        # Fit random search
        random_search.fit(self.X_train, self.y_train)

        # Get results
        results = {
            "best_params": random_search.best_params_,
            "best_score": random_search.best_score_,
            "cv_results": random_search.cv_results_,
        }

        return random_search.best_estimator_, results

    def evaluate_model(
        self, model: BaseEstimator
    ) -> Tuple[PerformanceMetrics, Dict[str, Any]]:
        """Evaluate model performance.

        Args:
            model: Model to evaluate

        Returns:
            Tuple[PerformanceMetrics, Dict[str, Any]]: Performance metrics
            and evaluation info
        """
        # Get predictions
        y_pred = model.predict(self.X_test)
        y_prob = (
            model.predict_proba(self.X_test)
            if hasattr(model, "predict_proba")
            else None
        )

        # Calculate metrics
        metrics = PerformanceMetrics(
            y_true=self.y_test,
            y_pred=y_pred,
            y_prob=y_prob,
        )

        # Get evaluation info
        evaluation_info = {
            "model_type": type(model).__name__,
            "n_samples": len(self.X),
            "n_features": self.X.shape[1],
            "test_size": self.test_size,
            "random_state": self.random_state,
        }

        return metrics, evaluation_info

    def cross_validate(
        self,
        model: BaseEstimator,
        cv: int = 5,
        scoring: Optional[List[str]] = None,
    ) -> Dict[str, List[float]]:
        """Perform cross-validation.

        Args:
            model: Model to validate
            cv: Number of folds (default: 5)
            scoring: List of scoring metrics (default: None)

        Returns:
            Dict[str, List[float]]: Cross-validation scores
        """
        # Default scoring metrics
        if scoring is None:
            scoring = [
                "accuracy",
                "precision_weighted",
                "recall_weighted",
                "f1_weighted",
            ]

        # Perform cross-validation
        cv_scores = {}
        for metric in scoring:
            scores = cross_val_score(model, self.X, self.y, cv=cv, scoring=metric)
            cv_scores[metric] = scores.tolist()

        return cv_scores

    def save_model(self, model: BaseEstimator, filepath: str) -> None:
        """Save model to file.

        Args:
            model: Model to save
            filepath: Path to save model
        """
        joblib.dump(model, filepath)

    @classmethod
    def load_model(cls, filepath: str) -> BaseEstimator:
        """Load model from file.

        Args:
            filepath: Path to load model from

        Returns:
            BaseEstimator: Loaded model
        """
        return joblib.load(filepath)


def main():
    # Get command line arguments
    import argparse

    parser = argparse.ArgumentParser(description="Optimize and train ensemble model")
    parser.add_argument("--data", type=str, required=True, help="Path to training data")
    parser.add_argument(
        "--output", type=str, default="optimized_models", help="Output directory"
    )
    parser.add_argument(
        "--trials", type=int, default=100, help="Number of optimization trials"
    )
    args = parser.parse_args()

    # Initialize optimizer
    optimizer = ModelOptimizer(args.data, args.output)

    # Train model
    optimizer.optimize_hyperparameters(n_trials=args.trials)
    optimizer.train_final_model()


if __name__ == "__main__":
    main()
