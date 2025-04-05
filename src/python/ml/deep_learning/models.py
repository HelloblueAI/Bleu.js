"""
Enhanced Deep Learning Models with advanced features and optimizations.
"""

import logging
from dataclasses import dataclass
from typing import List, Optional

import optuna
import torch
import torch.nn as nn
from torch.cuda.amp import GradScaler, autocast


@dataclass
class ModelConfig:
    """Configuration for deep learning models."""

    model_type: str
    hidden_sizes: List[int]
    dropout_rate: float
    learning_rate: float
    use_mixed_precision: bool = True
    use_quantization: bool = False
    use_pruning: bool = False
    pruning_rate: float = 0.3
    use_knowledge_distillation: bool = False
    teacher_model_path: Optional[str] = None


class EnhancedBaseModel(nn.Module):
    """Base class for enhanced deep learning models."""

    def __init__(self, config: ModelConfig):
        super().__init__()
        self.config = config
        self.scaler = GradScaler() if config.use_mixed_precision else None
        self.logger = logging.getLogger(__name__)

        # Dynamic architecture building
        self.layers = self._build_layers()

        if config.use_quantization:
            self.quantize_model()

        if config.use_pruning:
            self.apply_pruning()

    def _build_layers(self) -> nn.ModuleList:
        """Dynamically build network layers based on config."""
        layers = []
        prev_size = self.config.hidden_sizes[0]

        for size in self.config.hidden_sizes[1:]:
            layers.extend(
                [
                    nn.Linear(prev_size, size),
                    nn.BatchNorm1d(size),
                    nn.ReLU(),
                    nn.Dropout(self.config.dropout_rate),
                ]
            )
            prev_size = size

        return nn.ModuleList(layers)

    def quantize_model(self):
        """Apply quantization-aware training."""
        self.qconfig = torch.quantization.get_default_qconfig("fbgemm")
        torch.quantization.prepare_qat(self, inplace=True)

    def apply_pruning(self):
        """Apply gradual pruning to model weights."""
        parameters_to_prune = []
        for module in self.modules():
            if isinstance(module, nn.Linear):
                parameters_to_prune.append((module, "weight"))

        torch.nn.utils.prune.global_unstructured(
            parameters_to_prune,
            pruning_method=torch.nn.utils.prune.L1Unstructured,
            amount=self.config.pruning_rate,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass with mixed precision support."""
        with autocast(enabled=self.config.use_mixed_precision):
            for layer in self.layers:
                x = layer(x)
        return x

    def optimize_hyperparameters(self, train_data, val_data, n_trials=100):
        """Optimize hyperparameters using Optuna."""

        def objective(trial):
            # Dynamic hyperparameter search space
            lr = trial.suggest_loguniform("lr", 1e-5, 1e-1)
            dropout = trial.suggest_uniform("dropout", 0.1, 0.5)
            n_layers = trial.suggest_int("n_layers", 2, 5)

            # Update model configuration
            self.config.learning_rate = lr
            self.config.dropout_rate = dropout
            self._rebuild_model(n_layers)

            # Train and evaluate
            val_loss = self._train_evaluation_loop(train_data, val_data)
            return val_loss

        study = optuna.create_study(direction="minimize")
        study.optimize(objective, n_trials=n_trials)

        # Apply best parameters
        best_params = study.best_params
        self.logger.info(f"Best hyperparameters: {best_params}")
        self._rebuild_model(**best_params)

    def _rebuild_model(self, n_layers: int):
        """Rebuild model architecture with new parameters."""
        hidden_sizes = [self.config.hidden_sizes[0]]
        for _ in range(n_layers):
            hidden_sizes.append(hidden_sizes[-1] // 2)
        self.config.hidden_sizes = hidden_sizes
        self.layers = self._build_layers()

    def export_onnx(self, sample_input: torch.Tensor, path: str):
        """Export model to ONNX format."""
        torch.onnx.export(
            self,
            sample_input,
            path,
            input_names=["input"],
            output_names=["output"],
            dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
        )

    def apply_knowledge_distillation(
        self, teacher_model: "EnhancedBaseModel", temperature: float = 2.0
    ):
        """Apply knowledge distillation from teacher model."""
        if not self.config.use_knowledge_distillation:
            return

        def distillation_loss(student_logits, teacher_logits, labels, alpha=0.1):
            """Compute distillation loss."""
            soft_targets = nn.functional.softmax(teacher_logits / temperature, dim=-1)
            student_log_probs = nn.functional.log_softmax(
                student_logits / temperature, dim=-1
            )
            distillation = nn.KLDivLoss(reduction="batchmean")(
                student_log_probs, soft_targets
            )

            student_loss = nn.CrossEntropyLoss()(student_logits, labels)
            return alpha * student_loss + (1 - alpha) * distillation
