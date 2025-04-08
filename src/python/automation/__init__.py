"""
BleuJS Automation Module
Provides workflow automation and pipeline orchestration capabilities.
"""

from .pipeline import AutomationPipeline, PipelineMetrics, PipelineStep

__all__ = ["AutomationPipeline", "PipelineStep", "PipelineMetrics"]
