"""Tests for process_optimizer caching, recommendations, and advanced optimizers."""

import importlib.util
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np
import pytest

_MODULE_PATH = (
    Path(__file__).resolve().parents[2] / "src/python/operations/process_optimizer.py"
)
_spec = importlib.util.spec_from_file_location("process_optimizer", _MODULE_PATH)
_po = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(_po)
ProcessOptimizer = _po.ProcessOptimizer
AdvancedProcessOptimizer = _po.AdvancedProcessOptimizer


def _sample_workflow(
    resource: str = "r1",
    *,
    quality_score: float = 0.9,
    quality_data: dict | None = None,
) -> dict:
    return {
        "steps": [
            {"id": "a", "name": "A", "duration": 10, "resources": [resource]},
            {"id": "b", "name": "B", "duration": 5, "resources": ["r2"]},
        ],
        "dependencies": [{"from": "a", "to": "b"}],
        "quality_data": quality_data or {"defect_rate": 0.5},
        "quality_score": quality_score,
        "cost_per_unit": 40,
    }


def _imbalanced_workflow() -> dict:
    return {
        "steps": [
            {"id": "a", "name": "A", "duration": 10, "resources": ["underused"]},
            {"id": "b", "name": "B", "duration": 90, "resources": ["overused"]},
        ],
        "dependencies": [{"from": "a", "to": "b"}],
        "quality_data": {"defect_rate": 0.5},
        "quality_score": 0.9,
        "cost_per_unit": 40,
    }


def _parallel_workflow() -> dict:
    return {
        "steps": [
            {"id": "a", "name": "A", "duration": 5, "resources": ["r1"]},
            {"id": "b", "name": "B", "duration": 5, "resources": ["r2"]},
            {"id": "c", "name": "C", "duration": 3, "resources": ["r3"]},
        ],
        "dependencies": [
            {"from": "a", "to": "c"},
            {"from": "b", "to": "c"},
        ],
        "quality_score": 0.9,
        "cost_per_unit": 40,
    }


@pytest.fixture
def optimizer() -> ProcessOptimizer:
    return ProcessOptimizer("manufacturing", ["throughput"], {"max_resources": 5})


def test_workflow_caches_cleared_when_graph_rebuilds(
    optimizer: ProcessOptimizer,
) -> None:
    optimizer.analyze_workflow(_sample_workflow("r1"))

    assert optimizer._cached_resource_analysis is not None
    assert optimizer._last_process_data is not None

    optimizer._build_process_graph(_sample_workflow("r9"))

    assert optimizer._cached_resource_analysis is None
    assert optimizer._cached_quality_issues is None
    assert optimizer._last_process_data is None
    assert optimizer._cached_critical_path is None


def test_recommendations_empty_until_analysis_reruns(
    optimizer: ProcessOptimizer,
) -> None:
    optimizer.analyze_workflow(_sample_workflow("r1"))
    first_util = dict(optimizer._cached_resource_analysis or {})

    optimizer._build_process_graph(_sample_workflow("r9"))
    assert optimizer._get_resource_analysis() == {}

    optimizer.analyze_workflow(_sample_workflow("r9"))
    second_util = dict(optimizer._cached_resource_analysis or {})
    assert first_util != second_util


def test_critical_path_cache_and_empty_graph(optimizer: ProcessOptimizer) -> None:
    assert optimizer._get_critical_path() == []

    optimizer.analyze_workflow(_sample_workflow())
    first = optimizer._get_critical_path()
    second = optimizer._get_critical_path()
    assert first == second
    assert optimizer._cached_critical_path is not None


def test_critical_path_cycle_fallback(optimizer: ProcessOptimizer) -> None:
    optimizer.process_graph.add_node("a", duration=1)
    optimizer.process_graph.add_node("b", duration=2)
    optimizer.process_graph.add_node("c", duration=3)
    optimizer.process_graph.add_edge("a", "b")
    optimizer.process_graph.add_edge("b", "c")
    optimizer.process_graph.add_edge("c", "a")

    path = optimizer._get_critical_path()
    assert set(path) == {"a", "b", "c"}


def test_identify_bottlenecks_empty_graph(optimizer: ProcessOptimizer) -> None:
    assert optimizer._identify_bottlenecks() == []


def test_get_analysis_recomputes_from_last_process_data(
    optimizer: ProcessOptimizer,
) -> None:
    data = _sample_workflow()
    optimizer._last_process_data = data
    optimizer._cached_resource_analysis = None
    optimizer._cached_quality_issues = None

    resource = optimizer._get_resource_analysis()
    quality = optimizer._get_quality_issues()

    assert resource
    assert quality
    assert quality[0]["metric"] == "defect_rate"


def test_get_recommendations_all_types(optimizer: ProcessOptimizer) -> None:
    optimizer.analyze_workflow(_imbalanced_workflow())
    optimizer.process_graph.nodes["a"]["automation_potential"] = 0.9

    recs = optimizer.get_recommendations()
    types = {rec["type"] for rec in recs}

    assert "resource_reallocation" in types
    assert "quality_improvement" in types
    assert "automation" in types


def test_parallel_flow_recommendations(optimizer: ProcessOptimizer) -> None:
    optimizer.analyze_workflow(_parallel_workflow())
    groups = optimizer._find_parallelizable_groups()
    assert groups == [["a", "b"]]

    flow_recs = optimizer._generate_flow_recommendations()
    assert flow_recs
    assert flow_recs[0]["type"] == "parallel_processing"


def test_find_parallelizable_groups_empty_and_cycle(
    optimizer: ProcessOptimizer,
) -> None:
    assert optimizer._find_parallelizable_groups() == []

    optimizer.process_graph.add_node("x", duration=1)
    optimizer.process_graph.add_edge("x", "x")
    assert optimizer._find_parallelizable_groups() == []


@patch.object(_po, "differential_evolution")
def test_genetic_algorithm_optimization(mock_de: MagicMock) -> None:
    data = _sample_workflow()
    opt = AdvancedProcessOptimizer(
        "manufacturing",
        ["throughput"],
        {"max_resources": 5},
        use_ml=False,
        parallel_processing=True,
    )
    opt.analyze_workflow(data)

    solution = np.linspace(0.1, 0.9, len(opt._get_optimization_bounds(data)))
    mock_de.return_value = MagicMock(x=solution)

    result = opt.optimize_using_genetic_algorithm(
        data, population_size=2, generations=1
    )

    assert "resource_allocation" in result
    mock_de.assert_called_once()
    _, kwargs = mock_de.call_args
    assert kwargs["workers"] == opt._pool_workers
    assert kwargs["updating"] == "deferred"


@patch.object(_po, "differential_evolution")
def test_genetic_algorithm_serial_workers(mock_de: MagicMock) -> None:
    data = _sample_workflow()
    opt = AdvancedProcessOptimizer(
        "manufacturing",
        ["throughput"],
        {"max_resources": 5},
        use_ml=False,
        parallel_processing=False,
    )
    opt.analyze_workflow(data)
    mock_de.return_value = MagicMock(
        x=np.linspace(0.1, 0.9, len(opt._get_optimization_bounds(data)))
    )

    opt.optimize_using_genetic_algorithm(data, population_size=2, generations=1)

    _, kwargs = mock_de.call_args
    assert kwargs["workers"] == 1
    assert kwargs["updating"] == "immediate"


def test_rl_optimization_early_stop_and_policy_update() -> None:
    data = _sample_workflow()
    opt = AdvancedProcessOptimizer(
        "manufacturing",
        ["throughput"],
        {"max_resources": 5},
        use_ml=True,
        parallel_processing=False,
    )
    opt.rl_episodes = 4
    opt.rl_early_stop_patience = 2
    opt.rl_max_steps_per_episode = 3
    opt.analyze_workflow(data)

    result = opt.optimize_using_reinforcement_learning(data, episodes=4)

    assert isinstance(result, dict)
    assert "steps" in result


def test_rl_helpers_without_model() -> None:
    opt = AdvancedProcessOptimizer(
        "manufacturing",
        ["throughput"],
        {"max_resources": 5},
        use_ml=False,
    )
    data = _sample_workflow()
    opt.analyze_workflow(data)
    state = opt._encode_process_state(data)

    action = opt._get_rl_action(state)
    assert action.shape == state.shape

    opt._update_rl_policy(0.5, state, False)


def test_apply_rl_action_returns_config() -> None:
    opt = AdvancedProcessOptimizer(
        "manufacturing",
        ["throughput"],
        {"max_resources": 5},
        use_ml=False,
    )
    data = _sample_workflow()
    opt.analyze_workflow(data)
    state = opt._encode_process_state(data)
    action = opt._get_rl_action(state)

    next_state, reward, done, new_config = opt._apply_rl_action(state, action, data)

    assert isinstance(reward, float)
    assert bool(done) in (True, False)
    assert "steps" in new_config
    assert next_state.shape == state.shape
