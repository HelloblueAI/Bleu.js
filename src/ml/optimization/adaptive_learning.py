"""
Quantum-Aware Adaptive Learning Rate Optimization
Implements advanced learning rate scheduling with quantum state awareness
and distributed training optimization.
"""

import logging
from dataclasses import dataclass
from typing import Dict, Optional, List, Tuple

import numpy as np
from scipy.stats import wasserstein_distance
import torch
from torch.optim.lr_scheduler import _LRScheduler

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
        self.best_loss = float('inf')
        self.patience_counter = 0
        self.state_history = []
        self.quantum_measurements = []
        self.last_lr = self.config.initial_lr

        # Set initial learning rate
        for group in optimizer.param_groups:
            group['lr'] = self.config.initial_lr

    def quantum_state_distance(self, state1: np.ndarray, state2: np.ndarray) -> float:
        """Calculate distance between quantum states."""
        return np.linalg.norm(state1 - state2)

    def step(self, metrics=None):
        """Update learning rate based on metrics and quantum state."""
        if metrics is None:
            metrics = {}

        current_lr = self.optimizer.param_groups[0]['lr']
        
        # Warmup phase
        if self.epoch < self.config.warmup_epochs:
            lr = self.config.initial_lr * ((self.epoch + 1) / self.config.warmup_epochs)
        else:
            # Regular phase with quantum adjustment
            if 'loss' in metrics:
                loss = metrics['loss']
                if loss < self.best_loss:
                    self.best_loss = loss
                    self.patience_counter = 0
                else:
                    self.patience_counter += 1

                if self.patience_counter >= self.config.patience:
                    lr = max(current_lr * self.config.reduction_factor, self.config.min_lr)
                    self.patience_counter = 0
                else:
                    lr = current_lr
            else:
                lr = current_lr

            # Apply quantum adjustment if processor available
            if self.quantum_processor and self.epoch % self.config.measurement_frequency == 0:
                quantum_state = self.quantum_processor.get_state()
                self.quantum_measurements.append(quantum_state)
                
                if len(self.quantum_measurements) > 1:
                    prev_state = self.quantum_measurements[-2]
                    distance = self.quantum_state_distance(quantum_state, prev_state)
                    if distance > self.config.noise_tolerance:
                        lr = lr * (1 - self.config.quantum_sensitivity * distance)  # Reduce LR when quantum state changes significantly

        # Apply bounds
        lr = min(max(lr, self.config.min_lr), self.config.max_lr)
        
        # Update optimizer
        for group in self.optimizer.param_groups:
            group['lr'] = lr
            
        self.last_lr = lr
        self.epoch += 1

    def state_dict(self) -> Dict:
        """Return scheduler state for checkpointing"""
        return {
            'epoch': self.epoch,
            'best_loss': self.best_loss,
            'patience_counter': self.patience_counter,
            'state_history': self.state_history,
            'quantum_measurements': self.quantum_measurements,
            'config': self.config.__dict__
        }

    def load_state_dict(self, state_dict: Dict):
        """Load scheduler state from checkpoint"""
        self.epoch = state_dict['epoch']
        self.best_loss = state_dict['best_loss']
        self.patience_counter = state_dict['patience_counter']
        self.state_history = state_dict['state_history']
        self.quantum_measurements = state_dict['quantum_measurements']
        # Config is already set during initialization 