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
        self.quantum_measurements = []
        self.last_lr = self.config.initial_lr

        # Set initial learning rate
        for group in optimizer.param_groups:
            group["lr"] = self.config.initial_lr

    def quantum_state_distance(self, state1: np.ndarray, state2: np.ndarray) -> float:
        """Calculate distance between quantum states."""
        return np.linalg.norm(state1 - state2)

    def step(self, metrics=None):
        """Update learning rate based on metrics and quantum state."""
        if metrics is None:
            metrics = {}

        current_lr = self.optimizer.param_groups[0]["lr"]
        lr = self._calculate_learning_rate(current_lr, metrics)
        lr = self._apply_bounds(lr)
        self._update_optimizer(lr)
        self.last_lr = lr
        self.epoch += 1

    def _calculate_learning_rate(self, current_lr: float, metrics: Dict) -> float:
        """Calculate the new learning rate based on current state and metrics."""
        if self.epoch < self.config.warmup_epochs:
            return self._calculate_warmup_lr()

        lr = self._calculate_regular_lr(current_lr, metrics)
        lr = self._apply_quantum_adjustment(lr)
        return lr

    def _calculate_warmup_lr(self) -> float:
        """Calculate learning rate during warmup phase."""
        return self.config.initial_lr * ((self.epoch + 1) / self.config.warmup_epochs)

    def _calculate_regular_lr(self, current_lr: float, metrics: Dict) -> float:
        """Calculate learning rate during regular training phase."""
        if "loss" not in metrics:
            return current_lr

        loss = metrics["loss"]
        if loss < self.best_loss:
            self.best_loss = loss
            self.patience_counter = 0
            return current_lr
        else:
            self.patience_counter += 1
            if self.patience_counter >= self.config.patience:
                self.patience_counter = 0
                return max(
                    current_lr * self.config.reduction_factor, self.config.min_lr
                )
            return current_lr

    def _apply_quantum_adjustment(self, lr: float) -> float:
        """Apply quantum state-based adjustment to learning rate."""
        if not self._should_apply_quantum_adjustment():
            return lr

        quantum_state = self.quantum_processor.get_state()
        self.quantum_measurements.append(quantum_state)

        if len(self.quantum_measurements) <= 1:
            return lr

        prev_state = self.quantum_measurements[-2]
        distance = self.quantum_state_distance(quantum_state, prev_state)

        if distance > self.config.noise_tolerance:
            return lr * (1 - self.config.quantum_sensitivity * distance)

        return lr

    def _should_apply_quantum_adjustment(self) -> bool:
        """Check if quantum adjustment should be applied."""
        return (
            self.quantum_processor is not None
            and self.epoch % self.config.measurement_frequency == 0
        )

    def _apply_bounds(self, lr: float) -> float:
        """Apply min/max bounds to learning rate."""
        return min(max(lr, self.config.min_lr), self.config.max_lr)

    def _update_optimizer(self, lr: float) -> None:
        """Update optimizer with new learning rate."""
        for group in self.optimizer.param_groups:
            group["lr"] = lr

    def state_dict(self) -> Dict:
        """Return scheduler state for checkpointing"""
        return {
            "epoch": self.epoch,
            "best_loss": self.best_loss,
            "patience_counter": self.patience_counter,
            "state_history": self.state_history,
            "quantum_measurements": self.quantum_measurements,
            "config": self.config.__dict__,
        }

    def load_state_dict(self, state_dict: Dict):
        """Load scheduler state from checkpoint"""
        self.epoch = state_dict["epoch"]
        self.best_loss = state_dict["best_loss"]
        self.patience_counter = state_dict["patience_counter"]
        self.state_history = state_dict["state_history"]
        self.quantum_measurements = state_dict["quantum_measurements"]
        # Config is already set during initialization
