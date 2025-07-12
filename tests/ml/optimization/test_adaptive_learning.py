"""Tests for quantum-aware adaptive learning rate scheduler."""

import numpy as np
import pytest
import torch.nn as nn
from torch.optim import Adam

from src.ml.optimization.adaptive_learning import (
    QuantumAwareLRConfig,
    QuantumAwareScheduler,
)


class SimpleModel(nn.Module):
    """Simple model for testing."""

    def __init__(self):
        super().__init__()
        self.linear = nn.Linear(10, 1)

    def forward(self, x):
        return self.linear(x)


@pytest.fixture
def model():
    """Create a simple model."""
    return SimpleModel()


@pytest.fixture
def optimizer(model):
    """Create an optimizer."""
    return Adam(model.parameters(), lr=0.1, weight_decay=1e-4)


@pytest.fixture
def config():
    """Create scheduler config."""
    return QuantumAwareLRConfig(
        initial_lr=0.1,
        min_lr=1e-5,
        max_lr=0.5,
        warmup_epochs=3,
        patience=2,
        reduction_factor=0.5,
        quantum_sensitivity=0.1,
        measurement_frequency=2,
        noise_tolerance=0.05,
    )


def test_scheduler_initialization(optimizer, config):
    """Test scheduler initialization."""
    scheduler = QuantumAwareScheduler(optimizer, config)
    assert scheduler.config == config
    assert scheduler.quantum_processor is None
    assert scheduler.epoch == 0
    assert scheduler.best_loss == float("inf")
    assert scheduler.patience_counter == 0
    assert len(scheduler.state_history) == 0
    assert len(scheduler.quantum_measurements) == 0


def test_warmup_phase(optimizer, config):
    """Test warmup phase behavior."""
    scheduler = QuantumAwareScheduler(optimizer, config)

    # Check initial learning rate
    assert optimizer.param_groups[0]["lr"] == config.initial_lr

    # Test warmup steps
    for epoch in range(config.warmup_epochs):
        scheduler.step()
        expected_lr = config.initial_lr * ((epoch + 1) / config.warmup_epochs)
        assert abs(optimizer.param_groups[0]["lr"] - expected_lr) < 1e-6


def test_quantum_impact_adjustment(optimizer, config):
    """Test learning rate adjustment based on quantum impact."""

    class MockQuantumProcessor:
        def __init__(self):
            self.state = np.array([0.1, 0.2, 0.3])

        def get_state(self):
            self.state += 0.1
            return self.state

    quantum_processor = MockQuantumProcessor()
    scheduler = QuantumAwareScheduler(optimizer, config, quantum_processor)

    # Skip warmup
    scheduler.epoch = config.warmup_epochs

    # Test quantum impact adjustment
    initial_lr = optimizer.param_groups[0]["lr"]

    # Add quantum measurements
    scheduler.quantum_measurements = [
        np.array([0.1, 0.2, 0.3]),
        np.array([0.4, 0.5, 0.6]),
    ]

    # Step with high quantum impact
    scheduler.step()

    # Learning rate should be reduced due to quantum impact
    assert optimizer.param_groups[0]["lr"] < initial_lr


def test_adaptive_adjustment(optimizer, config):
    """Test adaptive learning rate adjustment based on loss."""
    scheduler = QuantumAwareScheduler(optimizer, config)

    # Skip warmup
    scheduler.epoch = config.warmup_epochs
    initial_lr = optimizer.param_groups[0]["lr"]

    # Test improvement in loss
    scheduler.step({"loss": 0.5})
    assert abs(scheduler.best_loss - 0.5) < 1e-6
    assert scheduler.patience_counter == 0
    assert optimizer.param_groups[0]["lr"] == initial_lr

    # Test degradation in loss
    for _ in range(config.patience):
        scheduler.step({"loss": 0.6})

    # Learning rate should be reduced
    assert optimizer.param_groups[0]["lr"] == initial_lr * config.reduction_factor


def test_state_dict(optimizer, config):
    """Test state dict serialization."""
    scheduler = QuantumAwareScheduler(optimizer, config)

    # Add some history
    scheduler.step({"loss": 0.5})
    scheduler.step({"loss": 0.4})

    state = scheduler.state_dict()

    # Create new scheduler and load state
    new_scheduler = QuantumAwareScheduler(optimizer, config)
    new_scheduler.load_state_dict(state)

    assert new_scheduler.epoch == scheduler.epoch
    assert new_scheduler.best_loss == scheduler.best_loss
    assert new_scheduler.patience_counter == scheduler.patience_counter
    assert new_scheduler.state_history == scheduler.state_history


def test_min_lr_constraint(optimizer, config):
    """Test minimum learning rate constraint."""
    scheduler = QuantumAwareScheduler(optimizer, config)

    # Skip warmup
    scheduler.epoch = config.warmup_epochs

    # Force multiple reductions
    for _ in range(10):
        scheduler.step({"loss": 1.0})

    # Learning rate should not go below min_lr
    assert optimizer.param_groups[0]["lr"] >= config.min_lr


def test_quantum_state_distance(optimizer, config):
    """Test quantum state distance calculation."""
    scheduler = QuantumAwareScheduler(optimizer, config)

    state1 = np.array([0.1, 0.2, 0.3])
    state2 = np.array([0.4, 0.5, 0.6])

    distance = scheduler.quantum_state_distance(state1, state2)
    assert distance > 0

    # Test with same state
    distance = scheduler.quantum_state_distance(state1, state1)
    assert distance == 0


def test_invalid_metrics(optimizer, config):
    """Test handling of invalid metrics."""
    scheduler = QuantumAwareScheduler(optimizer, config)

    # Test with None metrics
    scheduler.step(None)

    # Test with empty metrics
    scheduler.step({})

    # Test with metrics missing loss
    scheduler.step({"accuracy": 0.9})

    # Learning rate should remain unchanged
    assert optimizer.param_groups[0]["lr"] == config.initial_lr
