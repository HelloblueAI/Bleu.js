"""
Performance monitoring and tracking for Bleu.js
"""

import logging
import time
from typing import Any, Dict, List, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class PerformanceTracker:
    """
    Track and monitor performance metrics in real-time.
    
    Args:
        metrics (list): List of metrics to track
        real_time (bool): Enable real-time monitoring
        
    Example:
        >>> tracker = PerformanceTracker(
        ...     metrics=['accuracy', 'speed', 'memory'],
        ...     real_time=True
        ... )
        >>> tracker.start()
        >>> # ... do work ...
        >>> metrics = tracker.get_metrics()
    """
    
    def __init__(
        self,
        metrics: Optional[List[str]] = None,
        real_time: bool = False,
        **kwargs
    ):
        """Initialize performance tracker."""
        self.metrics_to_track = metrics or [
            'accuracy',
            'speed',
            'memory',
            'quantum_advantage'
        ]
        self.real_time = real_time
        self.config = kwargs
        
        # Storage for metrics
        self.metrics_data: Dict[str, List[float]] = {
            metric: [] for metric in self.metrics_to_track
        }
        self.timestamps: List[float] = []
        self.start_time: Optional[float] = None
        self.running = False
        
        logger.info(f"Initialized PerformanceTracker")
        logger.info(f"Tracking metrics: {', '.join(self.metrics_to_track)}")
        logger.info(f"Real-time mode: {real_time}")
    
    def start(self) -> None:
        """Start performance tracking."""
        self.start_time = time.time()
        self.running = True
        logger.info("✅ Performance tracking started")
    
    def stop(self) -> None:
        """Stop performance tracking."""
        self.running = False
        logger.info("⏹️  Performance tracking stopped")
    
    def record(self, metric: str, value: float) -> None:
        """
        Record a metric value.
        
        Args:
            metric: Name of the metric
            value: Value to record
        """
        if metric in self.metrics_data:
            self.metrics_data[metric].append(value)
            self.timestamps.append(time.time())
            
            if self.real_time:
                logger.debug(f"📊 {metric}: {value:.4f}")
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get current metrics.
        
        Returns:
            Dictionary of current metrics
        """
        if not self.running and self.start_time is None:
            logger.warning("Tracker not started yet")
            return {}
        
        metrics = {
            'start_time': self.start_time,
            'current_time': time.time(),
            'elapsed_time': time.time() - (self.start_time or time.time()),
            'metrics': {},
        }
        
        # Calculate statistics for each metric
        for metric, values in self.metrics_data.items():
            if values:
                metrics['metrics'][metric] = {
                    'count': len(values),
                    'latest': values[-1],
                    'mean': sum(values) / len(values),
                    'min': min(values),
                    'max': max(values),
                }
        
        return metrics
    
    async def generate_report(
        self,
        metrics: Optional[Dict] = None,
        include_quantum_advantage: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate comprehensive performance report.
        
        Args:
            metrics: Metrics to include (uses current if None)
            include_quantum_advantage: Include quantum metrics
            **kwargs: Additional options
            
        Returns:
            Performance report dictionary
        """
        if metrics is None:
            metrics = self.get_metrics()
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'tracker_info': {
                'metrics_tracked': self.metrics_to_track,
                'real_time': self.real_time,
                'running': self.running,
            },
            'performance': metrics,
        }
        
        if include_quantum_advantage:
            report['quantum_metrics'] = {
                'quantum_speedup': self._calculate_quantum_advantage(),
                'qubit_utilization': 0.95,  # Simulated
                'gate_fidelity': 0.99,  # Simulated
            }
        
        logger.info("✅ Performance report generated")
        return report
    
    async def save_metrics(
        self,
        metrics: Dict,
        filepath: str,
        **kwargs
    ) -> None:
        """
        Save metrics to file.
        
        Args:
            metrics: Metrics to save
            filepath: Path to save file
            **kwargs: Additional options
        """
        try:
            with open(filepath, 'w') as f:
                json.dump(metrics, f, indent=2, default=str)
            logger.info(f"✅ Metrics saved to {filepath}")
        except Exception as e:
            logger.error(f"❌ Failed to save metrics: {e}")
    
    def _calculate_quantum_advantage(self) -> float:
        """Calculate quantum advantage metric."""
        # Simulated quantum advantage calculation
        if 'quantum_advantage' in self.metrics_data:
            values = self.metrics_data['quantum_advantage']
            if values:
                return sum(values) / len(values)
        return 1.95  # Default simulated value
    
    def reset(self) -> None:
        """Reset all metrics."""
        self.metrics_data = {metric: [] for metric in self.metrics_to_track}
        self.timestamps = []
        self.start_time = None
        self.running = False
        logger.info("🔄 Metrics reset")
    
    def __repr__(self) -> str:
        status = "running" if self.running else "stopped"
        return f"PerformanceTracker(metrics={len(self.metrics_to_track)}, status={status})"


# Convenience exports
__all__ = [
    'PerformanceTracker',
]

