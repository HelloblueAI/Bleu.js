"""
Performance Tracker Implementation
Provides comprehensive performance monitoring and tracking capabilities.
"""

import json
import logging
import time
from pathlib import Path
from typing import Dict, Optional

import matplotlib.pyplot as plt
import numpy as np
import psutil
import torch
import torch.nn as nn

logger = logging.getLogger(__name__)


class PerformanceTracker:
    """Advanced performance tracking and monitoring system."""

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

    def initialize(self):
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

    def start_tracking(self):
        """Start tracking system resources."""
        try:
            if not self.initialized:
                self.initialize()

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

                time.sleep(1)  # Update every second

        except Exception as e:
            logging.error(f"❌ Performance tracking failed: {str(e)}")
            raise

    def _log_epoch_metrics(self, epoch, val_loader):
        if self.metrics is not None and "model_metrics" in self.metrics:
            logging.info(
                f"Epoch [{epoch + 1}/{self.n_epochs}], "
                f"Train Loss: "
                f"{self.metrics['model_metrics']['train_loss'][-1]:.4f}, "
                f"Train Acc: "
                f"{self.metrics['model_metrics']['train_acc'][-1]:.2f}%"
            )
            if val_loader:
                logging.info(
                    f"Val Loss: "
                    f"{self.metrics['model_metrics']['val_loss'][-1]:.4f}, "
                    f"Val Acc: "
                    f"{self.metrics['model_metrics']['val_acc'][-1]:.2f}%"
                )

    def track_model_performance(
        self,
        model: nn.Module,
    ) -> Dict:
        """Track model performance during training."""
        try:
            for epoch in range(self.n_epochs):
                # Training logic ...
                self._log_epoch_metrics(epoch, None)
            return self.metrics.get("model_metrics", {})
        except Exception as e:
            logging.error(f"❌ Model performance tracking failed: {str(e)}")
            raise

    def analyze_performance(self) -> Dict:
        """Analyze collected performance metrics."""
        try:
            if not self.initialized or self.metrics is None:
                self.initialize()

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

    def plot_performance_metrics(self):
        """Plot performance metrics."""
        try:
            if not self.initialized or self.metrics is None:
                return

            # Create subplots
            fig, axes = plt.subplots(2, 2, figsize=(15, 10))
            fig.suptitle("Performance Metrics", fontsize=16)

            # Memory usage
            if self.metrics.get("memory_usage"):
                memory_times = [m["timestamp"] for m in self.metrics["memory_usage"]]
                memory_values = [m["value"] for m in self.metrics["memory_usage"]]
                axes[0, 0].plot(memory_times, memory_values)
                axes[0, 0].set_title("Memory Usage")
                axes[0, 0].set_xlabel(self.TIME_LABEL)
                axes[0, 0].set_ylabel("Memory (MB)")

            # GPU usage
            if self.metrics.get("gpu_usage"):
                gpu_times = [m["timestamp"] for m in self.metrics["gpu_usage"]]
                gpu_values = [m["value"] for m in self.metrics["gpu_usage"]]
                axes[0, 1].plot(gpu_times, gpu_values)
                axes[0, 1].set_title("GPU Usage")
                axes[0, 1].set_xlabel(self.TIME_LABEL)
                axes[0, 1].set_ylabel("GPU Memory (MB)")

            # CPU usage
            if self.metrics.get("cpu_usage"):
                cpu_times = [m["timestamp"] for m in self.metrics["cpu_usage"]]
                cpu_values = [m["value"] for m in self.metrics["cpu_usage"]]
                axes[1, 0].plot(cpu_times, cpu_values)
                axes[1, 0].set_title("CPU Usage")
                axes[1, 0].set_xlabel(self.TIME_LABEL)
                axes[1, 0].set_ylabel("CPU (%)")

            # Network usage
            if self.metrics.get("network_usage"):
                net_times = [m["timestamp"] for m in self.metrics["network_usage"]]
                net_sent = [m["bytes_sent"] for m in self.metrics["network_usage"]]
                net_recv = [m["bytes_recv"] for m in self.metrics["network_usage"]]
                axes[1, 1].plot(net_times, net_sent, label="Sent")
                axes[1, 1].plot(net_times, net_recv, label="Received")
                axes[1, 1].set_title("Network Usage")
                axes[1, 1].set_xlabel(self.TIME_LABEL)
                axes[1, 1].set_ylabel("Bytes")
                axes[1, 1].legend()

            plt.tight_layout()
            plt.savefig(self.save_dir / "performance_metrics.png")
            plt.close()

            logging.info("✅ Performance metrics plotted successfully")

        except Exception as e:
            logging.error(f"❌ Failed to plot performance metrics: {str(e)}")
            raise

    def save_metrics(self):
        """Save metrics to file."""
        try:
            if not self.initialized or self.metrics is None:
                return

            # Save metrics to JSON
            metrics_file = self.save_dir / "performance_metrics.json"
            with open(metrics_file, "w") as f:
                json.dump(self.metrics, f, indent=2, default=str)

            # Save analysis
            analysis = self.analyze_performance()
            analysis_file = self.save_dir / "performance_analysis.json"
            with open(analysis_file, "w") as f:
                json.dump(analysis, f, indent=2, default=str)

            logging.info("✅ Performance metrics saved successfully")

        except Exception as e:
            logging.error(f"❌ Failed to save metrics: {str(e)}")
            raise

    def dispose(self):
        """Clean up resources."""
        try:
            # Save final metrics
            self.save_metrics()

            # Plot final metrics
            self.plot_performance_metrics()

            # Clear metrics
            self.metrics = {}
            self.initialized = False

            logging.info("✅ Performance tracker disposed successfully")

        except Exception as e:
            logging.error(f"❌ Failed to dispose performance tracker: {str(e)}")
            raise
