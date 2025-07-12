"""
Adaptive Learning Rate Implementation
Provides dynamic learning rate optimization for neural networks.
"""

import logging
from typing import Optional

import numpy as np
import optuna
import torch
import torch.nn as nn
from sklearn.metrics import roc_auc_score
from torch.optim.lr_scheduler import (
    CosineAnnealingLR,
    CyclicLR,
    OneCycleLR,
    ReduceLROnPlateau,
)

logger = logging.getLogger(__name__)


class AdaptiveLearningRate:
    def __init__(
        self,
        method: str = "cosine",
        min_lr: float = 1e-6,
        max_lr: float = 1e-2,
        patience: int = 10,
        factor: float = 0.5,
        n_trials: int = 20,
    ):
        self.method = method
        self.min_lr = min_lr
        self.max_lr = max_lr
        self.patience = patience
        self.factor = factor
        self.n_trials = n_trials
        self.optimizer = None
        self.scheduler = None
        self.best_lr = None
        self.learning_history = []
        self.initialized = False

    def initialize(self):
        """Initialize the adaptive learning rate optimizer."""
        try:
            logging.info("Initializing adaptive learning rate optimizer...")
            # Add any initialization logic here
            logging.info("✅ Adaptive learning rate optimizer initialized successfully")
            self.initialized = True
        except Exception as e:
            logging.error(
                f"❌ Failed to initialize adaptive learning rate optimizer: {str(e)}"
            )
            raise

    def calculate_optimal_rate(
        self, features: np.ndarray, targets: np.ndarray, method: Optional[str] = None
    ) -> float:
        """Calculate optimal learning rate using various strategies."""
        try:
            if not self.initialized:
                self.initialize()

            if method is None and self.method is None:
                raise ValueError("No learning rate method specified")
            method = method or self.method

            if method == "cosine":
                return self._cosine_schedule(features, targets)
            elif method == "one_cycle":
                return self._one_cycle_schedule(features, targets)
            elif method == "cyclic":
                return self._cyclic_schedule(features, targets)
            elif method == "reduce_on_plateau":
                return self._reduce_on_plateau(features, targets)
            elif method == "optuna":
                return self._optuna_optimization(features, targets)
            else:
                raise ValueError(f"Unsupported learning rate method: {method}")

        except Exception as e:
            logging.error(f"❌ Learning rate calculation failed: {str(e)}")
            raise

    def _cosine_schedule(self, features: np.ndarray, targets: np.ndarray) -> float:
        """Calculate optimal learning rate using cosine annealing."""
        try:
            if self.max_lr is None or self.min_lr is None:
                raise ValueError("Learning rate bounds not initialized")

            # Create PyTorch model for learning rate search
            model = self._create_model(features.shape[1])
            optimizer = torch.optim.Adam(
                model.parameters(), lr=self.max_lr, weight_decay=1e-4
            )
            scheduler = CosineAnnealingLR(optimizer, T_max=100, eta_min=self.min_lr)

            # Train model with cosine annealing
            best_lr = self.max_lr
            best_score = 0

            for _ in range(100):
                # Train one epoch
                model.train()
                optimizer.zero_grad()
                outputs = model(torch.FloatTensor(features))
                loss = nn.BCEWithLogitsLoss()(outputs, torch.FloatTensor(targets))
                loss.backward()
                optimizer.step()
                scheduler.step()

                # Evaluate
                model.eval()
                with torch.no_grad():
                    outputs = model(torch.FloatTensor(features))
                    predictions = torch.sigmoid(outputs).numpy()
                    score = roc_auc_score(targets, predictions)

                    if score > best_score:
                        best_score = score
                        best_lr = optimizer.param_groups[0]["lr"]

            return best_lr

        except Exception as e:
            logging.error(f"❌ Cosine schedule failed: {str(e)}")
            raise

    def _one_cycle_schedule(self, features: np.ndarray, targets: np.ndarray) -> float:
        """Calculate optimal learning rate using one cycle policy."""
        try:
            if self.max_lr is None:
                raise ValueError("Maximum learning rate not initialized")

            # Create PyTorch model for learning rate search
            model = self._create_model(features.shape[1])
            optimizer = torch.optim.Adam(
                model.parameters(), lr=self.max_lr, weight_decay=1e-4
            )
            scheduler = OneCycleLR(
                optimizer,
                max_lr=self.max_lr,
                epochs=100,
                steps_per_epoch=1,
                pct_start=0.3,
            )

            # Train model with one cycle policy
            best_lr = self.max_lr
            best_score = 0

            for _ in range(100):
                # Train one epoch
                model.train()
                optimizer.zero_grad()
                outputs = model(torch.FloatTensor(features))
                loss = nn.BCEWithLogitsLoss()(outputs, torch.FloatTensor(targets))
                loss.backward()
                optimizer.step()
                scheduler.step()

                # Evaluate
                model.eval()
                with torch.no_grad():
                    outputs = model(torch.FloatTensor(features))
                    predictions = torch.sigmoid(outputs).numpy()
                    score = roc_auc_score(targets, predictions)

                    if score > best_score:
                        best_score = score
                        best_lr = optimizer.param_groups[0]["lr"]

            return best_lr

        except Exception as e:
            logging.error(f"❌ One cycle schedule failed: {str(e)}")
            raise

    def _cyclic_schedule(self, features: np.ndarray, targets: np.ndarray) -> float:
        """Calculate optimal learning rate using cyclic learning rate."""
        try:
            if self.max_lr is None or self.min_lr is None:
                raise ValueError("Learning rate bounds not initialized")

            # Create PyTorch model for learning rate search
            model = self._create_model(features.shape[1])
            optimizer = torch.optim.Adam(
                model.parameters(), lr=self.max_lr, weight_decay=1e-4
            )
            scheduler = CyclicLR(
                optimizer,
                base_lr=self.min_lr,
                max_lr=self.max_lr,
                step_size_up=20,
                step_size_down=20,
            )

            # Train model with cyclic learning rate
            best_lr = self.max_lr
            best_score = 0

            for _ in range(100):
                # Train one epoch
                model.train()
                optimizer.zero_grad()
                outputs = model(torch.FloatTensor(features))
                loss = nn.BCEWithLogitsLoss()(outputs, torch.FloatTensor(targets))
                loss.backward()
                optimizer.step()
                scheduler.step()

                # Evaluate
                model.eval()
                with torch.no_grad():
                    outputs = model(torch.FloatTensor(features))
                    predictions = torch.sigmoid(outputs).numpy()
                    score = roc_auc_score(targets, predictions)

                    if score > best_score:
                        best_score = score
                        best_lr = optimizer.param_groups[0]["lr"]

            return best_lr

        except Exception as e:
            logging.error(f"❌ Cyclic schedule failed: {str(e)}")
            raise

    def _reduce_on_plateau(self, features: np.ndarray, targets: np.ndarray) -> float:
        """Calculate optimal learning rate using reduce on plateau."""
        try:
            if (
                self.max_lr is None
                or self.min_lr is None
                or self.factor is None
                or self.patience is None
            ):
                raise ValueError("Learning rate parameters not initialized")

            # Create PyTorch model for learning rate search
            model = self._create_model(features.shape[1])
            optimizer = torch.optim.Adam(
                model.parameters(), lr=self.max_lr, weight_decay=1e-4
            )
            scheduler = ReduceLROnPlateau(
                optimizer,
                mode="max",
                factor=self.factor,
                patience=self.patience,
                min_lr=self.min_lr,
            )

            # Train model with reduce on plateau
            best_lr = self.max_lr
            best_score = 0

            for _ in range(100):
                # Train one epoch
                model.train()
                optimizer.zero_grad()
                outputs = model(torch.FloatTensor(features))
                loss = nn.BCEWithLogitsLoss()(outputs, torch.FloatTensor(targets))
                loss.backward()
                optimizer.step()

                # Evaluate
                model.eval()
                with torch.no_grad():
                    outputs = model(torch.FloatTensor(features))
                    predictions = torch.sigmoid(outputs).numpy()
                    score = roc_auc_score(targets, predictions)

                    if score > best_score:
                        best_score = score
                        best_lr = optimizer.param_groups[0]["lr"]

                    scheduler.step(score)

            return best_lr

        except Exception as e:
            logging.error(f"❌ Reduce on plateau failed: {str(e)}")
            raise

    def _optuna_optimization(self, features: np.ndarray, targets: np.ndarray) -> float:
        """Calculate optimal learning rate using Optuna optimization."""
        try:

            def objective(trial):
                # Create PyTorch model for learning rate search
                lr = trial.suggest_float("lr", self.min_lr, self.max_lr, log=True)
                model = self._create_model(features.shape[1])
                optimizer = torch.optim.Adam(
                    model.parameters(), lr=lr, weight_decay=1e-4
                )

                # Train model
                for _ in range(50):
                    model.train()
                    optimizer.zero_grad()
                    outputs = model(torch.FloatTensor(features))
                    loss = nn.BCEWithLogitsLoss()(outputs, torch.FloatTensor(targets))
                    loss.backward()
                    optimizer.step()

                # Evaluate
                model.eval()
                with torch.no_grad():
                    outputs = model(torch.FloatTensor(features))
                    predictions = torch.sigmoid(outputs).numpy()
                    score = roc_auc_score(targets, predictions)

                return score

            # Run Optuna optimization
            study = optuna.create_study(direction="maximize")
            study.optimize(objective, n_trials=self.n_trials)

            return study.best_params["lr"]

        except Exception as e:
            logging.error(f"❌ Optuna optimization failed: {str(e)}")
            raise

    def _create_model(self, input_size: int) -> nn.Module:
        """Create a simple neural network model."""
        return nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, 1),
        )

    def dispose(self):
        """Clean up resources."""
        try:
            self.learning_history = []
            self.best_lr = None
            self.initialized = False
            logging.info("✅ Adaptive learning rate optimizer disposed successfully")
        except Exception as e:
            logging.error(
                f"❌ Failed to dispose adaptive learning rate optimizer: {str(e)}"
            )
            raise
