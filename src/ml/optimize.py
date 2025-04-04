import json
import os
from datetime import datetime

import joblib
import numpy as np
import optuna
import pandas as pd
import torch
import torch.nn as nn
import xgboost as xgb
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import KFold
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader, TensorDataset


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
        X = data.drop("target", axis=1)
        y = data["target"]

        # Scale the features
        X_scaled = self.scaler.fit_transform(X)

        return X_scaled, y, X.columns

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

    def train_neural_network(self, X, y, params):
        """Train a neural network model."""
        # Convert data to PyTorch tensors
        X_tensor = torch.FloatTensor(X)
        y_tensor = torch.FloatTensor(y.values)

        # Create data loader
        dataset = TensorDataset(X_tensor, y_tensor)
        dataloader = DataLoader(dataset, batch_size=params["batch_size"], shuffle=True)

        # Create model
        model = self.create_neural_network(X.shape[1])
        criterion = nn.BCELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=params["learning_rate"])

        # Train model
        model.train()
        for epoch in range(params["epochs"]):
            for batch_X, batch_y in dataloader:
                optimizer.zero_grad()
                outputs = model(batch_X)
                loss = criterion(outputs.squeeze(), batch_y)
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
        X_scaled, y, feature_names = self.load_data()

        # Perform k-fold cross-validation
        kf = KFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = []

        for train_idx, val_idx in kf.split(X_scaled):
            X_train, X_val = X_scaled[train_idx], X_scaled[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]

            # Train XGBoost model
            xgb_model = xgb.XGBClassifier(
                **{
                    k: v
                    for k, v in param.items()
                    if k not in ["batch_size", "epochs", "neural_network_lr"]
                },
                random_state=42,
            )
            xgb_model.fit(X_train, y_train)

            # Train neural network
            nn_model = self.train_neural_network(X_train, y_train, param)

            # Make predictions
            xgb_pred = xgb_model.predict_proba(X_val)[:, 1]
            nn_pred = nn_model(torch.FloatTensor(X_val)).detach().numpy().squeeze()

            # Ensemble predictions
            ensemble_pred = 0.7 * xgb_pred + 0.3 * nn_pred

            # Calculate metrics
            cv_scores.append(
                {
                    "accuracy": accuracy_score(y_val, ensemble_pred > 0.5),
                    "roc_auc": roc_auc_score(y_val, ensemble_pred),
                    "f1": f1_score(y_val, ensemble_pred > 0.5),
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

        X_scaled, y, feature_names = self.load_data()

        # Train XGBoost model
        if self.best_params is None:
            raise ValueError("Hyperparameters not optimized yet")
        xgb_params = {
            k: v
            for k, v in self.best_params.items()
            if k not in ["batch_size", "epochs", "neural_network_lr"]
        }
        xgb_model = xgb.XGBClassifier(**xgb_params, random_state=42)
        xgb_model.fit(X_scaled, y)

        # Train neural network
        nn_model = self.train_neural_network(X_scaled, y, self.best_params)

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
