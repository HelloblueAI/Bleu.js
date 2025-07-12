"""
Bleu automation module.

This module provides automation capabilities for Bleu.js.
"""

__version__ = "1.1.7"

from .pipeline import AutomationPipeline, PipelineMetrics, PipelineStep

__all__ = ["AutomationPipeline", "PipelineStep", "PipelineMetrics"]
