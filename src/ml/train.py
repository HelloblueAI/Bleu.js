import json
import os
from datetime import datetime

import joblib
import optuna
import pandas as pd
import xgboost as xgb
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


class ModelTrainer:
    def __init__(self, data_path, output_dir="models"):
        self.data_path = data_path
        self.output_dir = output_dir
        self.scaler = StandardScaler()
        self.best_params = None
        self.best_model = None
        self.metrics = {}

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

        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Scale the features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        return X_train_scaled, X_test_scaled, y_train, y_test

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
        }

        # Load data
        X_train_scaled, X_test_scaled, y_train, y_test = self.load_data()

        # Train model
        model = xgb.XGBClassifier(**param, random_state=42)
        model.fit(X_train_scaled, y_train)

        # Make predictions
        y_pred = model.predict(X_test_scaled)
        y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]

        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        f1 = f1_score(y_test, y_pred)

        return accuracy, roc_auc, f1

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
        """Train the final model with the best hyperparameters."""
        print("Training final model...")

        X_train_scaled, X_test_scaled, y_train, y_test = self.load_data()

        # Train model with best parameters
        self.best_model = xgb.XGBClassifier(**self.best_params, random_state=42)
        self.best_model.fit(X_train_scaled, y_train)

        # Make predictions
        y_pred = self.best_model.predict(X_test_scaled)
        y_pred_proba = self.best_model.predict_proba(X_test_scaled)[:, 1]

        # Calculate metrics
        self.metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "roc_auc": roc_auc_score(y_test, y_pred_proba),
            "f1": f1_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred),
        }

        print("\nFinal model metrics:")
        for metric, value in self.metrics.items():
            print(f"{metric}: {value:.4f}")

        return self.metrics

    def save_model(self):
        """Save the trained model and scaler."""
        print("Saving model...")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Save model
        model_path = os.path.join(self.output_dir, f"model_{timestamp}.pkl")
        joblib.dump(self.best_model, model_path)

        # Save scaler
        scaler_path = os.path.join(self.output_dir, f"scaler_{timestamp}.pkl")
        joblib.dump(self.scaler, scaler_path)

        # Save metrics
        metrics_path = os.path.join(self.output_dir, f"metrics_{timestamp}.json")
        with open(metrics_path, "w") as f:
            json.dump(self.metrics, f, indent=4)

        # Save hyperparameters
        params_path = os.path.join(self.output_dir, f"params_{timestamp}.json")
        with open(params_path, "w") as f:
            json.dump(self.best_params, f, indent=4)

        print(f"\nModel saved to: {model_path}")
        print(f"Scaler saved to: {scaler_path}")
        print(f"Metrics saved to: {metrics_path}")
        print(f"Parameters saved to: {params_path}")


def main():
    # Get command line arguments
    import argparse

    parser = argparse.ArgumentParser(
        description="Train XGBoost model with Optuna optimization"
    )
    parser.add_argument("--data", type=str, required=True, help="Path to training data")
    parser.add_argument("--output", type=str, default="models", help="Output directory")
    parser.add_argument(
        "--trials", type=int, default=100, help="Number of optimization trials"
    )
    args = parser.parse_args()

    # Initialize trainer
    trainer = ModelTrainer(args.data, args.output)

    # Train model
    trainer.optimize_hyperparameters(n_trials=args.trials)
    trainer.train_final_model()
    trainer.save_model()


if __name__ == "__main__":
    main()
