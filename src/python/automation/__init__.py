"""
BleuJS Automation Module
Provides workflow automation and pipeline orchestration capabilities.
"""

from .pipeline import AutomationPipeline, PipelineStep, PipelineMetrics

__all__ = [
    'AutomationPipeline',
    'PipelineStep',
    'PipelineMetrics'
] 