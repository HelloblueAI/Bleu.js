"""
Enhanced training module with advanced features for deep learning models.
"""

import logging
from dataclasses import dataclass
from typing import Callable, Dict, Optional

import horovod.torch as hvd
import mlflow
import torch
import torch.distributed as dist
import torch.nn as nn
import wandb
from torch.cuda.amp import GradScaler, autocast
from torch.nn.parallel import DistributedDataParallel
from torch.optim.lr_scheduler import OneCycleLR
from tqdm import tqdm


@dataclass
class TrainingConfig:
    """Configuration for training process."""

    batch_size: int
    num_epochs: int
    learning_rate: float
    use_mixed_precision: bool = True
    use_distributed: bool = False
    use_horovod: bool = False
    gradient_accumulation_steps: int = 1
    warmup_steps: int = 0
    max_grad_norm: float = 1.0
    use_wandb: bool = False
    use_mlflow: bool = False
    checkpoint_dir: str = "./checkpoints"
    early_stopping_patience: int = 5
    scheduler_type: str = "onecycle"


class EnhancedTrainer:
    """Enhanced trainer with advanced features."""

    def __init__(
        self,
        model: nn.Module,
        config: TrainingConfig,
        optimizer_class: torch.optim.Optimizer = torch.optim.AdamW,
        loss_fn: Optional[Callable] = None,
    ):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Initialize distributed training
        if config.use_distributed:
            self._setup_distributed()
        elif config.use_horovod:
            self._setup_horovod()

        self.model = self._prepare_model(model)
        self.optimizer = self._setup_optimizer(optimizer_class)
        self.scheduler = self._setup_scheduler()
        self.scaler = GradScaler() if config.use_mixed_precision else None
        self.loss_fn = loss_fn or nn.CrossEntropyLoss()

        # Initialize tracking
        if config.use_wandb:
            wandb.init(project="enhanced-training")
        if config.use_mlflow:
            mlflow.start_run()

    def _setup_distributed(self):
        """Setup distributed training environment."""
        dist.init_process_group(backend="nccl")
        torch.cuda.set_device(dist.get_rank())

    def _setup_horovod(self):
        """Setup Horovod for distributed training."""
        hvd.init()
        torch.cuda.set_device(hvd.local_rank())

    def _prepare_model(self, model: nn.Module) -> nn.Module:
        """Prepare model for training."""
        model = model.to(self.device)
        if self.config.use_distributed:
            model = DistributedDataParallel(model)
        elif self.config.use_horovod:
            model = hvd.DistributedOptimizer(model)
        return model

    def _setup_optimizer(self, optimizer_class) -> torch.optim.Optimizer:
        """Setup optimizer with learning rate scaling."""
        optimizer = optimizer_class(
            self.model.parameters(), lr=self.config.learning_rate, weight_decay=0.01
        )

        if self.config.use_horovod:
            optimizer = hvd.DistributedOptimizer(
                optimizer, named_parameters=self.model.named_parameters()
            )

        return optimizer

    def _setup_scheduler(self):
        """Setup learning rate scheduler."""
        if self.config.scheduler_type == "onecycle":
            return OneCycleLR(
                self.optimizer,
                max_lr=self.config.learning_rate,
                epochs=self.config.num_epochs,
                steps_per_epoch=self.steps_per_epoch,
                pct_start=0.3,
            )
        return None

    def train(self, train_loader, val_loader):
        """Enhanced training loop with advanced features."""
        best_val_loss = float("inf")
        patience_counter = 0

        for epoch in range(self.config.num_epochs):
            self.model.train()
            train_loss = self._train_epoch(train_loader)

            self.model.eval()
            val_loss = self._validate(val_loader)

            # Logging
            metrics = {
                "train_loss": train_loss,
                "val_loss": val_loss,
                "learning_rate": self.optimizer.param_groups[0]["lr"],
            }

            self._log_metrics(metrics, epoch)

            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                self._save_checkpoint(epoch, val_loss)
                patience_counter = 0
            else:
                patience_counter += 1

            if patience_counter >= self.config.early_stopping_patience:
                self.logger.info("Early stopping triggered")
                break

    def _train_epoch(self, train_loader) -> float:
        """Train for one epoch."""
        total_loss = 0
        self.model.train()

        with tqdm(train_loader, desc="Training") as pbar:
            for i, (inputs, targets) in enumerate(pbar):
                inputs = inputs.to(self.device)
                targets = targets.to(self.device)

                # Mixed precision training
                with autocast(enabled=self.config.use_mixed_precision):
                    outputs = self.model(inputs)
                    loss = self.loss_fn(outputs, targets)
                    loss = loss / self.config.gradient_accumulation_steps

                if self.scaler is not None:
                    self.scaler.scale(loss).backward()
                else:
                    loss.backward()

                if (i + 1) % self.config.gradient_accumulation_steps == 0:
                    if self.config.max_grad_norm > 0:
                        if self.scaler is not None:
                            self.scaler.unscale_(self.optimizer)
                        torch.nn.utils.clip_grad_norm_(
                            self.model.parameters(), self.config.max_grad_norm
                        )

                    if self.scaler is not None:
                        self.scaler.step(self.optimizer)
                        self.scaler.update()
                    else:
                        self.optimizer.step()

                    if self.scheduler is not None:
                        self.scheduler.step()

                    self.optimizer.zero_grad()

                total_loss += loss.item()
                pbar.set_postfix({"loss": loss.item()})

        return total_loss / len(train_loader)

    def _validate(self, val_loader) -> float:
        """Validate the model."""
        total_loss = 0
        self.model.eval()

        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs = inputs.to(self.device)
                targets = targets.to(self.device)

                with autocast(enabled=self.config.use_mixed_precision):
                    outputs = self.model(inputs)
                    loss = self.loss_fn(outputs, targets)

                total_loss += loss.item()

        return total_loss / len(val_loader)

    def _log_metrics(self, metrics: Dict[str, float], epoch: int):
        """Log metrics to various tracking systems."""
        if self.config.use_wandb:
            wandb.log(metrics, step=epoch)

        if self.config.use_mlflow:
            for name, value in metrics.items():
                mlflow.log_metric(name, value, step=epoch)

        self.logger.info(f"Epoch {epoch} metrics: {metrics}")

    def _save_checkpoint(self, epoch: int, val_loss: float):
        """Save model checkpoint."""
        checkpoint = {
            "epoch": epoch,
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "val_loss": val_loss,
            "config": self.config,
        }

        if self.scheduler is not None:
            checkpoint["scheduler_state_dict"] = self.scheduler.state_dict()

        torch.save(
            checkpoint,
            f"{self.config.checkpoint_dir}/model_epoch_{epoch}_loss_{val_loss:.4f}.pt",
        )
