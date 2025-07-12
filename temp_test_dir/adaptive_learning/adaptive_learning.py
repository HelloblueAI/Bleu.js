"""
Quantum-Aware Adaptive Learning Rate Optimization
Implements advanced learning rate scheduling with quantum state awareness
and distributed training optimization.
"""

import logging
from dataclasses import dataclass
from typing import Dict

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class QuantumAwareLRConfig:
    """Configuration for quantum-aware learning rate optimization"""

    initial_lr: float = 0.1
    min_lr: float = 1e-5
    max_lr: float = 0.5
    warmup_epochs: int = 3
    patience: int = 5
    reduction_factor: float = 0.5
    quantum_sensitivity: float = 0.1
    measurement_frequency: int = 10
    noise_tolerance: float = 0.05


class QuantumAwareScheduler:
    def __init__(self, optimizer, config, quantum_processor=None):
        """Initialize scheduler."""
        self.optimizer = optimizer
        self.config = config
        self.quantum_processor = quantum_processor
        self.epoch = 0
        self.best_loss = float("inf")
        self.patience_counter = 0
        self.state_history = []
        self.last_lr = self.config.initial_lr

        # Set initial learning rate
        for group in optimizer.param_groups:
            group["lr"] = self.config.initial_lr

    def _handle_warmup_phase(self) -> float:
        """Handle learning rate during warmup phase."""
        return self.config.initial_lr * ((self.epoch + 1) / self.config.warmup_epochs)

    def _handle_loss_based_adjustment(self, current_lr: float) -> float:
        """Handle learning rate adjustment based on loss metrics."""
        if "loss" not in self.metrics:
            return current_lr

        loss = self.metrics["loss"]
        if loss < self.best_loss:
            self.best_loss = loss
            self.patience_counter = 0
            return current_lr
        else:
            self.patience_counter += 1

        if self.patience_counter >= self.config.patience:
            lr = max(current_lr * self.config.reduction_factor, self.config.min_lr)
            self.patience_counter = 0
            return lr
        return current_lr

    def _handle_quantum_adjustment(self, lr: float) -> float:
        """Handle quantum state-based learning rate adjustment."""
        if not (
            self.quantum_processor
            and self.epoch % self.config.measurement_frequency == 0
        ):
            return lr

        quantum_state = self.quantum_processor.get_state()
        if len(self.state_history) > 0:
            prev_state = self.state_history[-1]
            distance = np.linalg.norm(quantum_state - prev_state)
            if distance > self.config.noise_tolerance:
                lr = lr * (1 + self.config.quantum_sensitivity * distance)
        self.state_history.append(quantum_state)
        return lr

    def step(self, metrics=None):
        """Update learning rate based on metrics and quantum state."""
        self.metrics = metrics or {}
        current_lr = self.optimizer.param_groups[0]["lr"]

        # Warmup phase
        if self.epoch < self.config.warmup_epochs:
            lr = self._handle_warmup_phase()
        else:
            # Regular phase with quantum adjustment
            lr = self._handle_loss_based_adjustment(current_lr)
            lr = self._handle_quantum_adjustment(lr)

        # Apply bounds
        lr = min(max(lr, self.config.min_lr), self.config.max_lr)

        # Update optimizer
        for group in self.optimizer.param_groups:
            group["lr"] = lr

        self.last_lr = lr
        self.epoch += 1

    def state_dict(self) -> Dict:
        """Return scheduler state for checkpointing"""
        return {
            "epoch": self.epoch,
            "best_loss": self.best_loss,
            "patience_counter": self.patience_counter,
            "state_history": self.state_history,
            "config": self.config.__dict__,
        }

    def load_state_dict(self, state_dict: Dict):
        """Load scheduler state from checkpoint"""
        self.epoch = state_dict["epoch"]
        self.best_loss = state_dict["best_loss"]
        self.patience_counter = state_dict["patience_counter"]
        self.state_history = state_dict["state_history"]
        # Config is already set during initialization
