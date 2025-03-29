"""
Performance Tracker Implementation
Provides comprehensive performance monitoring and analysis capabilities.
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import psutil
import seaborn as sns
import torch
import torch.nn as nn


class PerformanceTracker:
    def __init__(
        self,
        save_dir: Optional[str] = None,
        track_memory: bool = True,
        track_gpu: bool = True,
        track_network: bool = True,
    ):
        self.save_dir = Path(save_dir) if save_dir else Path("performance_logs")
        self.track_memory = track_memory
        self.track_gpu = track_gpu and torch.cuda.is_available()
        self.track_network = track_network
        self.metrics = {}
        self.initialized = False

    async def initialize(self):
        """Initialize the performance tracker."""
        try:
            # Create save directory
            self.save_dir.mkdir(parents=True, exist_ok=True)

            # Initialize metrics
            self.metrics = {
                "memory_usage": [],
                "gpu_usage": [],
                "network_usage": [],
                "cpu_usage": [],
                "timing": {},
                "model_metrics": {},
            }

            self.initialized = True
            logging.info("✅ Performance tracker initialized successfully")
        except Exception as e:
            logging.error(f"❌ Failed to initialize performance tracker: {str(e)}")
            raise

    async def startTracking(self):
        """Start tracking system resources."""
        try:
            if not self.initialized:
                await self.initialize()

            # Start tracking loop
            while True:
                # Track memory usage
                if self.track_memory:
                    memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
                    self.metrics["memory_usage"].append(
                        {"timestamp": time.time(), "value": memory}
                    )

                # Track GPU usage
                if self.track_gpu:
                    gpu_usage = torch.cuda.memory_allocated() / 1024 / 1024  # MB
                    self.metrics["gpu_usage"].append(
                        {"timestamp": time.time(), "value": gpu_usage}
                    )

                # Track network usage
                if self.track_network:
                    net_io = psutil.net_io_counters()
                    self.metrics["network_usage"].append(
                        {
                            "timestamp": time.time(),
                            "bytes_sent": net_io.bytes_sent,
                            "bytes_recv": net_io.bytes_recv,
                        }
                    )

                # Track CPU usage
                cpu_percent = psutil.cpu_percent()
                self.metrics["cpu_usage"].append(
                    {"timestamp": time.time(), "value": cpu_percent}
                )

                await asyncio.sleep(1)  # Update every second

        except Exception as e:
            logging.error(f"❌ Performance tracking failed: {str(e)}")
            raise

    async def trackModelPerformance(
        self,
        model: nn.Module,
        train_loader: torch.utils.data.DataLoader,
        val_loader: Optional[torch.utils.data.DataLoader] = None,
        criterion: nn.Module = nn.CrossEntropyLoss(),
        optimizer: torch.optim.Optimizer = None,
    ) -> Dict:
        """Track model training performance."""
        try:
            if not self.initialized or self.metrics is None or self.device is None:
                await self.initialize()

            # Initialize metrics
            if self.metrics is None:
                self.metrics = {}
            self.metrics["model_metrics"] = {
                "train_loss": [],
                "train_acc": [],
                "val_loss": [],
                "val_acc": [],
                "learning_rate": [],
                "batch_times": [],
            }

            # Training loop
            for epoch in range(self.n_epochs):
                # Train
                model.train()
                train_loss = 0
                train_correct = 0
                train_total = 0
                epoch_start = time.time()

                for batch_idx, (data, target) in enumerate(train_loader):
                    batch_start = time.time()
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

                    # Record batch time
                    if self.metrics is not None and "model_metrics" in self.metrics:
                        self.metrics["model_metrics"]["batch_times"].append(
                            time.time() - batch_start
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
                            val_loss += criterion(output, target).item()
                            _, predicted = torch.max(output.data, 1)
                            val_total += target.size(0)
                            val_correct += (predicted == target).sum().item()

                # Record metrics
                if self.metrics is not None and "model_metrics" in self.metrics:
                    self.metrics["model_metrics"]["train_loss"].append(
                        train_loss / len(train_loader)
                    )
                    self.metrics["model_metrics"]["train_acc"].append(
                        100 * train_correct / train_total
                    )
                    if val_loader:
                        self.metrics["model_metrics"]["val_loss"].append(
                            val_loss / len(val_loader)
                        )
                        self.metrics["model_metrics"]["val_acc"].append(
                            100 * val_correct / val_total
                        )
                    self.metrics["model_metrics"]["learning_rate"].append(
                        optimizer.param_groups[0]["lr"]
                    )

                # Log epoch metrics
                if self.metrics is not None and "model_metrics" in self.metrics:
                    logging.info(
                        f"Epoch [{epoch + 1}/{self.n_epochs}], "
                        f"Train Loss: {self.metrics['model_metrics']['train_loss'][-1]:.4f}, "
                        f"Train Acc: {self.metrics['model_metrics']['train_acc'][-1]:.2f}%"
                    )
                    if val_loader:
                        logging.info(
                            f"Val Loss: {self.metrics['model_metrics']['val_loss'][-1]:.4f}, "
                            f"Val Acc: {self.metrics['model_metrics']['val_acc'][-1]:.2f}%"
                        )

            return self.metrics.get("model_metrics", {})

        except Exception as e:
            logging.error(f"❌ Model performance tracking failed: {str(e)}")
            raise

    async def analyzePerformance(self) -> Dict:
        """Analyze collected performance metrics."""
        try:
            if not self.initialized or self.metrics is None:
                await self.initialize()

            if self.metrics is None:
                return {}

            analysis = {
                "memory": {
                    "mean": np.mean(
                        [m["value"] for m in self.metrics.get("memory_usage", [])]
                    ),
                    "max": np.max(
                        [m["value"] for m in self.metrics.get("memory_usage", [])]
                    ),
                    "min": np.min(
                        [m["value"] for m in self.metrics.get("memory_usage", [])]
                    ),
                },
                "gpu": {
                    "mean": np.mean(
                        [m["value"] for m in self.metrics.get("gpu_usage", [])]
                    ),
                    "max": np.max(
                        [m["value"] for m in self.metrics.get("gpu_usage", [])]
                    ),
                    "min": np.min(
                        [m["value"] for m in self.metrics.get("gpu_usage", [])]
                    ),
                },
                "cpu": {
                    "mean": np.mean(
                        [m["value"] for m in self.metrics.get("cpu_usage", [])]
                    ),
                    "max": np.max(
                        [m["value"] for m in self.metrics.get("cpu_usage", [])]
                    ),
                    "min": np.min(
                        [m["value"] for m in self.metrics.get("cpu_usage", [])]
                    ),
                },
                "network": {
                    "total_sent": sum(
                        m["bytes_sent"] for m in self.metrics.get("network_usage", [])
                    ),
                    "total_recv": sum(
                        m["bytes_recv"] for m in self.metrics.get("network_usage", [])
                    ),
                    "mean_sent": np.mean(
                        [m["bytes_sent"] for m in self.metrics.get("network_usage", [])]
                    ),
                    "mean_recv": np.mean(
                        [m["bytes_recv"] for m in self.metrics.get("network_usage", [])]
                    ),
                },
            }

            # Add model metrics analysis if available
            if self.metrics.get("model_metrics"):
                analysis["model"] = {
                    "train_loss": {
                        "mean": np.mean(self.metrics["model_metrics"]["train_loss"]),
                        "min": np.min(self.metrics["model_metrics"]["train_loss"]),
                        "max": np.max(self.metrics["model_metrics"]["train_loss"]),
                    },
                    "train_acc": {
                        "mean": np.mean(self.metrics["model_metrics"]["train_acc"]),
                        "min": np.min(self.metrics["model_metrics"]["train_acc"]),
                        "max": np.max(self.metrics["model_metrics"]["train_acc"]),
                    },
                    "val_loss": {
                        "mean": np.mean(self.metrics["model_metrics"]["val_loss"]),
                        "min": np.min(self.metrics["model_metrics"]["val_loss"]),
                        "max": np.max(self.metrics["model_metrics"]["val_loss"]),
                    },
                    "val_acc": {
                        "mean": np.mean(self.metrics["model_metrics"]["val_acc"]),
                        "min": np.min(self.metrics["model_metrics"]["val_acc"]),
                        "max": np.max(self.metrics["model_metrics"]["val_acc"]),
                    },
                    "learning_rate": {
                        "mean": np.mean(self.metrics["model_metrics"]["learning_rate"]),
                        "min": np.min(self.metrics["model_metrics"]["learning_rate"]),
                        "max": np.max(self.metrics["model_metrics"]["learning_rate"]),
                    },
                    "batch_times": {
                        "mean": np.mean(self.metrics["model_metrics"]["batch_times"]),
                        "min": np.min(self.metrics["model_metrics"]["batch_times"]),
                        "max": np.max(self.metrics["model_metrics"]["batch_times"]),
                    },
                }

            return analysis

        except Exception as e:
            logging.error(f"❌ Performance analysis failed: {str(e)}")
            raise

    async def plotPerformanceMetrics(self):
        """Create visualizations of performance metrics."""
        try:
            if not self.initialized:
                await self.initialize()

            # Create plots directory
            plots_dir = self.save_dir / "plots"
            plots_dir.mkdir(exist_ok=True)

            # Plot memory usage
            if self.track_memory:
                plt.figure(figsize=(10, 6))
                memory_data = pd.DataFrame(self.metrics["memory_usage"])
                sns.lineplot(data=memory_data, x="timestamp", y="value")
                plt.title("Memory Usage Over Time")
                plt.xlabel("Time (s)")
                plt.ylabel("Memory Usage (MB)")
                plt.savefig(plots_dir / "memory_usage.png")
                plt.close()

            # Plot GPU usage
            if self.track_gpu:
                plt.figure(figsize=(10, 6))
                gpu_data = pd.DataFrame(self.metrics["gpu_usage"])
                sns.lineplot(data=gpu_data, x="timestamp", y="value")
                plt.title("GPU Usage Over Time")
                plt.xlabel("Time (s)")
                plt.ylabel("GPU Memory Usage (MB)")
                plt.savefig(plots_dir / "gpu_usage.png")
                plt.close()

            # Plot CPU usage
            plt.figure(figsize=(10, 6))
            cpu_data = pd.DataFrame(self.metrics["cpu_usage"])
            sns.lineplot(data=cpu_data, x="timestamp", y="value")
            plt.title("CPU Usage Over Time")
            plt.xlabel("Time (s)")
            plt.ylabel("CPU Usage (%)")
            plt.savefig(plots_dir / "cpu_usage.png")
            plt.close()

            # Plot model metrics if available
            if self.metrics["model_metrics"]:
                plt.figure(figsize=(10, 6))
                plt.plot(
                    self.metrics["model_metrics"]["train_loss"], label="Train Loss"
                )
                if "val_loss" in self.metrics["model_metrics"]:
                    plt.plot(
                        self.metrics["model_metrics"]["val_loss"], label="Val Loss"
                    )
                plt.title("Model Loss Over Time")
                plt.xlabel("Epoch")
                plt.ylabel("Loss")
                plt.legend()
                plt.savefig(plots_dir / "model_loss.png")
                plt.close()

                plt.figure(figsize=(10, 6))
                plt.plot(self.metrics["model_metrics"]["train_acc"], label="Train Acc")
                if "val_acc" in self.metrics["model_metrics"]:
                    plt.plot(self.metrics["model_metrics"]["val_acc"], label="Val Acc")
                plt.title("Model Accuracy Over Time")
                plt.xlabel("Epoch")
                plt.ylabel("Accuracy (%)")
                plt.legend()
                plt.savefig(plots_dir / "model_accuracy.png")
                plt.close()

            logging.info(f"✅ Performance plots saved to {plots_dir}")

        except Exception as e:
            logging.error(f"❌ Performance plotting failed: {str(e)}")
            raise

    async def saveMetrics(self):
        """Save collected metrics to file."""
        try:
            if not self.initialized:
                await self.initialize()

            # Save metrics to JSON
            metrics_file = (
                self.save_dir
                / f'metrics_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            )
            with open(metrics_file, "w") as f:
                json.dump(self.metrics, f, indent=4)

            logging.info(f"✅ Performance metrics saved to {metrics_file}")

        except Exception as e:
            logging.error(f"❌ Failed to save performance metrics: {str(e)}")
            raise

    async def dispose(self):
        """Clean up resources."""
        try:
            # Save final metrics
            await self.saveMetrics()

            # Clear metrics
            self.metrics = {}
            self.initialized = False
            logging.info("✅ Performance tracker resources cleaned up")
        except Exception as e:
            logging.error(f"❌ Failed to clean up performance tracker: {str(e)}")
            raise
