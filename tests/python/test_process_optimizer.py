"""Tests for process_optimizer caching and recommendations."""

import importlib.util
from pathlib import Path

import pytest

_MODULE_PATH = (
    Path(__file__).resolve().parents[2] / "src/python/operations/process_optimizer.py"
)
_spec = importlib.util.spec_from_file_location("process_optimizer", _MODULE_PATH)
_po = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(_po)
ProcessOptimizer = _po.ProcessOptimizer


def _sample_workflow(resource: str = "r1") -> dict:
    return {
        "steps": [
            {"id": "a", "name": "A", "duration": 10, "resources": [resource]},
            {"id": "b", "name": "B", "duration": 5, "resources": ["r2"]},
        ],
        "dependencies": [{"from": "a", "to": "b"}],
        "quality_data": {"defect_rate": 0.5},
        "quality_score": 0.9,
        "cost_per_unit": 40,
    }


def test_workflow_caches_cleared_when_graph_rebuilds() -> None:
    opt = ProcessOptimizer("manufacturing", ["throughput"], {"max_resources": 5})
    opt.analyze_workflow(_sample_workflow("r1"))

    assert opt._cached_resource_analysis is not None
    assert opt._last_process_data is not None

    opt._build_process_graph(_sample_workflow("r9"))

    assert opt._cached_resource_analysis is None
    assert opt._cached_quality_issues is None
    assert opt._last_process_data is None
    assert opt._cached_critical_path is None


def test_recommendations_empty_until_analysis_reruns() -> None:
    opt = ProcessOptimizer("manufacturing", ["throughput"], {"max_resources": 5})
    opt.analyze_workflow(_sample_workflow("r1"))
    first_util = dict(opt._cached_resource_analysis or {})

    opt._build_process_graph(_sample_workflow("r9"))
    assert opt._get_resource_analysis() == {}

    opt.analyze_workflow(_sample_workflow("r9"))
    second_util = dict(opt._cached_resource_analysis or {})
    assert first_util != second_util
