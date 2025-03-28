"""
Training Manager Implementation
Provides distributed training capabilities for machine learning models.
"""

import logging
import numpy as np
import torch
import torch.nn as nn
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler
from typing import Dict, List, Optional, Tuple, Union
import ray
from ray import tune
from ray.tune.schedulers import ASHAScheduler
from ray.tune.search.optuna import OptunaSearch

class TrainingManager:
    def __init__(
        self,
        n_workers: int = 4,
        use_gpu: bool = True,
        batch_size: int = 32,
        learning_rate: float = 0.01,
        n_epochs: int = 10
    ):
        self.n_workers = n_workers
        self.use_gpu = use_gpu and torch.cuda.is_available()
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        self.n_epochs = n_epochs
        self.device = torch.device('cuda' if self.use_gpu else 'cpu')
        self.initialized = False

    async def initialize(self):
        """Initialize the training manager."""
        try:
            # Initialize Ray
            if not ray.is_initialized():
                ray.init(ignore_reinit_error=True)

            # Set up distributed training
            if dist.is_available():
                dist.init_process_group(backend='nccl' if self.use_gpu else 'gloo')
                self.world_size = dist.get_world_size()
                self.rank = dist.get_rank()
            else:
                self.world_size = 1
                self.rank = 0

            self.initialized = True
            logging.info("✅ Training manager initialized successfully")
        except Exception as e:
            logging.error(f"❌ Failed to initialize training manager: {str(e)}")
            raise

    async def trainDistributed(
        self,
        model: nn.Module,
        train_dataset: torch.utils.data.Dataset,
        val_dataset: Optional[torch.utils.data.Dataset] = None,
        optimizer_class: type = torch.optim.Adam,
        criterion_class: type = nn.CrossEntropyLoss
    ) -> Dict:
        """Train model using distributed training."""
        try:
            if not self.initialized:
                await self.initialize()

            # Move model to device and wrap with DDP
            model = model.to(self.device)
            if self.world_size > 1:
                model = DDP(model, device_ids=[self.rank])

            # Create data samplers
            train_sampler = DistributedSampler(train_dataset) if self.world_size > 1 else None
            val_sampler = DistributedSampler(val_dataset) if val_dataset and self.world_size > 1 else None

            # Create data loaders
            train_loader = DataLoader(
                train_dataset,
                batch_size=self.batch_size,
                sampler=train_sampler,
                num_workers=self.n_workers,
                pin_memory=self.use_gpu
            )

            val_loader = DataLoader(
                val_dataset,
                batch_size=self.batch_size,
                sampler=val_sampler,
                num_workers=self.n_workers,
                pin_memory=self.use_gpu
            ) if val_dataset else None

            # Initialize optimizer and criterion
            optimizer = optimizer_class(model.parameters(), lr=self.learning_rate)
            criterion = criterion_class()

            # Training history
            history = {
                'train_loss': [],
                'train_acc': [],
                'val_loss': [],
                'val_acc': []
            }

            # Training loop
            for epoch in range(self.n_epochs):
                if train_sampler:
                    train_sampler.set_epoch(epoch)

                # Train
                model.train()
                train_loss = 0
                train_correct = 0
                train_total = 0

                for batch_idx, (data, target) in enumerate(train_loader):
                    data, target = data.to(self.device), target.to(self.device)

                    optimizer.zero_grad()
                    output = model(data)
                    loss = criterion(output, target)
                    loss.backward()
                    optimizer.step()

                    train_loss += loss.item()
                    _, predicted = torch.max(output.data, 1)
                    train_total += target.size(0)
                    train_correct += (predicted == target).sum().item()

                    if batch_idx % 10 == 0 and self.rank == 0:
                        logging.info(
                            f"Epoch [{epoch + 1}/{self.n_epochs}], "
                            f"Batch [{batch_idx}/{len(train_loader)}], "
                            f"Loss: {loss.item():.4f}"
                        )

                # Validate
                if val_loader:
                    model.eval()
                    val_loss = 0
                    val_correct = 0
                    val_total = 0

                    with torch.no_grad():
                        for data, target in val_loader:
                            data, target = data.to(self.device), target.to(self.device)
                            output = model(data)
                            loss = criterion(output, target)

                            val_loss += loss.item()
                            _, predicted = torch.max(output.data, 1)
                            val_total += target.size(0)
                            val_correct += (predicted == target).sum().item()

                # Gather metrics across processes
                if self.world_size > 1:
                    train_loss = self._gather_metric(train_loss)
                    train_correct = self._gather_metric(train_correct)
                    train_total = self._gather_metric(train_total)
                    if val_loader:
                        val_loss = self._gather_metric(val_loss)
                        val_correct = self._gather_metric(val_correct)
                        val_total = self._gather_metric(val_total)

                # Record metrics
                history['train_loss'].append(train_loss / len(train_loader))
                history['train_acc'].append(100 * train_correct / train_total)
                if val_loader:
                    history['val_loss'].append(val_loss / len(val_loader))
                    history['val_acc'].append(100 * val_correct / val_total)

                if self.rank == 0:
                    logging.info(
                        f"Epoch [{epoch + 1}/{self.n_epochs}], "
                        f"Train Loss: {history['train_loss'][-1]:.4f}, "
                        f"Train Acc: {history['train_acc'][-1]:.2f}%"
                    )
                    if val_loader:
                        logging.info(
                            f"Val Loss: {history['val_loss'][-1]:.4f}, "
                            f"Val Acc: {history['val_acc'][-1]:.2f}%"
                        )

            return history

        except Exception as e:
            logging.error(f"❌ Distributed training failed: {str(e)}")
            raise

    async def hyperparameterTuning(
        self,
        model_class: type,
        train_dataset: torch.utils.data.Dataset,
        val_dataset: torch.utils.data.Dataset,
        config: Dict,
        n_trials: int = 10
    ) -> Dict:
        """Perform distributed hyperparameter tuning using Ray Tune."""
        try:
            if not self.initialized:
                await self.initialize()

            # Define search space
            search_space = {
                'learning_rate': tune.loguniform(1e-4, 1e-1),
                'batch_size': tune.choice([16, 32, 64, 128]),
                'n_epochs': tune.choice([5, 10, 20, 30])
            }

            # Define scheduler
            scheduler = ASHAScheduler(
                max_t=config.get('max_epochs', 30),
                grace_period=config.get('grace_period', 5),
                reduction_factor=config.get('reduction_factor', 2)
            )

            # Define search algorithm
            search_alg = OptunaSearch(
                metric='val_loss',
                mode='min',
                points_to_evaluate=config.get('points_to_evaluate', None)
            )

            # Define training function
            def train_model(config):
                model = model_class()
                train_loader = DataLoader(
                    train_dataset,
                    batch_size=config['batch_size'],
                    shuffle=True,
                    num_workers=self.n_workers
                )
                val_loader = DataLoader(
                    val_dataset,
                    batch_size=config['batch_size'],
                    shuffle=False,
                    num_workers=self.n_workers
                )

                optimizer = torch.optim.Adam(
                    model.parameters(),
                    lr=config['learning_rate']
                )
                criterion = nn.CrossEntropyLoss()

                for epoch in range(config['n_epochs']):
                    # Train
                    model.train()
                    for batch_idx, (data, target) in enumerate(train_loader):
                        data, target = data.to(self.device), target.to(self.device)
                        optimizer.zero_grad()
                        output = model(data)
                        loss = criterion(output, target)
                        loss.backward()
                        optimizer.step()

                    # Validate
                    model.eval()
                    val_loss = 0
                    with torch.no_grad():
                        for data, target in val_loader:
                            data, target = data.to(self.device), target.to(self.device)
                            output = model(data)
                            val_loss += criterion(output, target).item()

                    # Report metrics
                    tune.report(
                        val_loss=val_loss / len(val_loader),
                        epoch=epoch + 1
                    )

            # Run hyperparameter tuning
            analysis = tune.run(
                train_model,
                config=search_space,
                num_samples=n_trials,
                scheduler=scheduler,
                search_alg=search_alg,
                resources_per_trial={
                    'cpu': self.n_workers,
                    'gpu': 1 if self.use_gpu else 0
                }
            )

            return {
                'best_config': analysis.best_config,
                'best_trial': analysis.best_trial,
                'results': analysis.results
            }

        except Exception as e:
            logging.error(f"❌ Hyperparameter tuning failed: {str(e)}")
            raise

    def _gather_metric(self, metric: float) -> float:
        """Gather metric across processes."""
        if self.world_size > 1:
            tensor = torch.tensor(metric, device=self.device)
            dist.all_reduce(tensor, op=dist.ReduceOp.SUM)
            return tensor.item()
        return metric

    async def dispose(self):
        """Clean up resources."""
        try:
            if dist.is_initialized():
                dist.destroy_process_group()
            if ray.is_initialized():
                ray.shutdown()
            self.initialized = False
            logging.info("✅ Training manager resources cleaned up")
        except Exception as e:
            logging.error(f"❌ Failed to clean up training manager: {str(e)}")
            raise 