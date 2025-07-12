"""
Automation Pipeline Module for BleuJS
Provides workflow automation and orchestration capabilities.
"""

import asyncio
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Set

import numpy as np
import pandas as pd
from prometheus_client import Counter, Gauge, Histogram


@dataclass
class PipelineStep:
    """Pipeline step configuration."""

    name: str
    function: Callable
    retry_count: int = 3
    timeout: int = 300  # seconds
    required: bool = True
    error_handler: Optional[Callable] = None
    dependencies: List[str] = None

    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []


@dataclass
class PipelineMetrics:
    """Pipeline execution metrics."""

    total_execution_time: float
    step_execution_times: Dict[str, float]
    success_rate: float
    error_count: int
    retry_count: int


class PipelineAnalytics:
    """Pipeline analytics and monitoring."""

    def __init__(self):
        # Prometheus metrics
        self.step_execution_time = Histogram(
            "pipeline_step_execution_seconds",
            "Step execution time in seconds",
            ["pipeline_name", "step_name"],
        )
        self.step_success_counter = Counter(
            "pipeline_step_success_total",
            "Number of successful step executions",
            ["pipeline_name", "step_name"],
        )
        self.step_failure_counter = Counter(
            "pipeline_step_failure_total",
            "Number of failed step executions",
            ["pipeline_name", "step_name"],
        )
        self.pipeline_active_steps = Gauge(
            "pipeline_active_steps",
            "Number of currently active steps",
            ["pipeline_name"],
        )

        # Analytics storage
        self.execution_history: List[Dict] = []
        self.performance_metrics: Dict[str, List[float]] = {
            "execution_times": [],
            "success_rates": [],
            "error_rates": [],
            "throughput": [],
        }


class EventTrigger:
    """Event-based pipeline trigger."""

    def __init__(
        self, event_type: str, condition: Optional[Callable] = None, cooldown: int = 0
    ):
        self.event_type = event_type
        self.condition = condition
        self.cooldown = cooldown
        self.last_triggered: Optional[datetime] = None
        self.handler: Optional[Callable] = None

    async def check_trigger(self, event_data: Dict) -> bool:
        """Check if trigger should fire."""
        if (
            self.last_triggered
            and (datetime.now() - self.last_triggered).total_seconds() < self.cooldown
        ):
            return False

        if self.condition and not await self.condition(event_data):
            return False

        self.last_triggered = datetime.now()
        return True

    async def handle_event(self, event_data: Dict) -> None:
        """Handle triggered event."""
        if self.handler:
            await self.handler(event_data)


class AutomationPipeline:
    """Intelligent workflow automation pipeline."""

    def __init__(
        self,
        name: str,
        triggers: List[str],
        error_handling: str = "retry",
        max_concurrent_steps: int = 4,
        monitoring_enabled: bool = True,
    ):
        """
        Initialize automation pipeline.

        Args:
            name: Pipeline name
            triggers: List of trigger events
            error_handling: Error handling strategy ('retry', 'skip', 'fail')
            max_concurrent_steps: Maximum number of concurrent steps
            monitoring_enabled: Whether to enable pipeline monitoring
        """
        self.name = name
        self.triggers = triggers
        self.error_handling = error_handling
        self.max_concurrent_steps = max_concurrent_steps
        self.monitoring_enabled = monitoring_enabled

        self.steps: Dict[str, PipelineStep] = {}
        self.step_results: Dict[str, Any] = {}
        self.metrics: List[PipelineMetrics] = []
        self.logger = logging.getLogger(__name__)
        self.executor = ThreadPoolExecutor(max_workers=max_concurrent_steps)

        # Initialize monitoring
        if monitoring_enabled:
            self._initialize_monitoring()

    def add_step(
        self,
        name: str,
        function: Callable,
        dependencies: List[str] = None,
        retry_count: int = 3,
        timeout: int = 300,
        required: bool = True,
        error_handler: Optional[Callable] = None,
    ) -> None:
        if dependencies is None:
            dependencies = []
        """
        Add a step to the pipeline.

        Args:
            name: Step name
            function: Step function to execute
            dependencies: List of dependent step names
            retry_count: Number of retry attempts
            timeout: Step timeout in seconds
            required: Whether step is required
            error_handler: Custom error handler function
        """
        try:
            step = PipelineStep(
                name=name,
                function=function,
                retry_count=retry_count,
                timeout=timeout,
                required=required,
                error_handler=error_handler,
                dependencies=dependencies or [],
            )

            self._validate_step(step)
            self.steps[name] = step
            self.logger.info(f"Added step '{name}' to pipeline '{self.name}'")

        except Exception as e:
            self.logger.error(f"Error adding step '{name}': {str(e)}")
            raise

    def deploy(self) -> None:
        """Deploy and start the automation pipeline."""
        try:
            self._validate_pipeline()
            self._setup_triggers()
            self.logger.info(f"Deployed pipeline '{self.name}'")

        except Exception as e:
            self.logger.error(f"Error deploying pipeline: {str(e)}")
            raise

    async def execute(self, input_data: Dict = None) -> Dict[str, Any]:
        if input_data is None:
            input_data = {}
        """
        Execute the pipeline with given input data.

        Args:
            input_data: Input data for pipeline execution

        Returns:
            Dictionary containing step results
        """
        start_time = datetime.now()
        self.step_results.clear()
        error_count = 0
        retry_count = 0

        try:
            # Get execution order
            execution_order = self._get_execution_order()

            # Execute steps in order
            for step_batch in execution_order:
                # Execute steps in batch concurrently
                tasks = []
                for step_name in step_batch:
                    step = self.steps[step_name]
                    task = self._execute_step(
                        step, input_data, error_count, retry_count
                    )
                    tasks.append(task)

                # Wait for batch completion
                results = await asyncio.gather(*tasks, return_exceptions=True)

                # Process results
                for step_name, result in zip(step_batch, results):
                    if isinstance(result, Exception):
                        self.logger.error(f"Step '{step_name}' failed: {str(result)}")
                        error_count += 1
                        if self.steps[step_name].required:
                            raise result
                    else:
                        self.step_results[step_name] = result

            # Calculate metrics
            execution_time = (datetime.now() - start_time).total_seconds()
            self._update_metrics(execution_time, error_count, retry_count)

            return self.step_results

        except Exception as e:
            self.logger.error(f"Pipeline execution failed: {str(e)}")
            raise

    def get_metrics(self) -> List[PipelineMetrics]:
        """Get pipeline execution metrics."""
        return self.metrics

    def _validate_step(self, step: PipelineStep) -> None:
        """Validate step configuration."""
        if not step.name:
            raise ValueError("Step name is required")

        if not callable(step.function):
            raise ValueError(f"Step '{step.name}' function must be callable")

        for dep in step.dependencies:
            if dep not in self.steps:
                raise ValueError(
                    f"Step '{step.name}' depends on undefined step '{dep}'"
                )

    def _validate_pipeline(self) -> None:
        """Validate pipeline configuration."""
        if not self.steps:
            raise ValueError("Pipeline must contain at least one step")

        # Check for circular dependencies
        self._check_circular_dependencies()

    def _check_circular_dependencies(self) -> None:
        """Check for circular dependencies in pipeline steps."""
        visited = set()
        path = set()

        def visit(step_name: str) -> None:
            if step_name in path:
                raise ValueError(f"Circular dependency detected at step '{step_name}'")

            if step_name in visited:
                return

            visited.add(step_name)
            path.add(step_name)

            for dep in self.steps[step_name].dependencies:
                visit(dep)

            path.remove(step_name)

        for step_name in self.steps:
            visit(step_name)

    def _get_execution_order(self) -> List[List[str]]:
        """Determine optimal execution order of steps."""
        # Build dependency graph
        graph = {name: step.dependencies for name, step in self.steps.items()}

        # Topological sort with parallelization
        execution_order = []
        visited = set()

        while len(visited) < len(self.steps):
            # Find steps with satisfied dependencies
            ready_steps = [
                name
                for name, deps in graph.items()
                if name not in visited and all(d in visited for d in deps)
            ]

            if not ready_steps:
                raise ValueError("Invalid dependency graph")

            execution_order.append(ready_steps)
            visited.update(ready_steps)

        return execution_order

    async def _execute_step(
        self, step: PipelineStep, input_data: Dict, error_count: int, retry_count: int
    ) -> Any:
        """Execute a single pipeline step."""
        start_time = datetime.now()

        for attempt in range(step.retry_count + 1):
            try:
                # Get dependent step results
                step_input = {
                    "input": input_data,
                    "dependencies": {
                        dep: self.step_results[dep] for dep in step.dependencies
                    },
                }

                # Execute step with timeout
                result = await asyncio.wait_for(
                    self._run_step_function(step.function, step_input),
                    timeout=step.timeout,
                )

                # Record execution time
                execution_time = (datetime.now() - start_time).total_seconds()
                self._record_step_metrics(execution_time)

                return result

            except asyncio.TimeoutError:
                self.logger.warning(
                    f"Step '{step.name}' timed out after {step.timeout} seconds"
                )
                if attempt < step.retry_count:
                    continue
                raise

            except Exception as e:
                self.logger.error(
                    f"Step '{step.name}' failed on attempt {attempt + 1}: {str(e)}"
                )
                if attempt < step.retry_count:
                    continue
                if step.error_handler:
                    return step.error_handler(e)
                raise

    async def _run_step_function(self, function: Callable, input_data: Dict) -> Any:
        """Run step function in thread pool."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, function, input_data)

    def _setup_triggers(self) -> None:
        """Setup pipeline trigger handlers."""
        for trigger in self.triggers:
            self._register_trigger(trigger)

    def _register_trigger(self, trigger: str) -> None:
        """Register a pipeline trigger."""
        # Implementation depends on trigger type

    def _initialize_monitoring(self) -> None:
        """Initialize pipeline monitoring."""
        # Setup monitoring infrastructure

    def _record_step_metrics(self, execution_time: float) -> None:
        """Record step execution metrics."""
        if self.monitoring_enabled:
            self.analytics.step_execution_time.labels(
                pipeline_name=self.name, step_name=self.current_step
            ).observe(execution_time)

    def _update_metrics(
        self, execution_time: float, error_count: int, retry_count: int
    ) -> None:
        """Update pipeline metrics."""
        if self.monitoring_enabled:
            metrics = PipelineMetrics(
                total_execution_time=execution_time,
                step_execution_times={
                    name: 0.0 for name in self.steps
                },  # Updated during execution
                success_rate=(
                    (len(self.steps) - error_count) / len(self.steps)
                    if self.steps
                    else 0.0
                ),
                error_count=error_count,
                retry_count=retry_count,
            )
            self.metrics.append(metrics)


class EnhancedAutomationPipeline(AutomationPipeline):
    """Enhanced automation pipeline with advanced features."""

    def __init__(
        self,
        name: str,
        triggers: List[str],
        error_handling: str = "retry",
        max_concurrent_steps: int = 4,
        monitoring_enabled: bool = True,
        analytics_enabled: bool = True,
        event_driven: bool = True,
    ):
        """Initialize enhanced automation pipeline."""
        super().__init__(
            name, triggers, error_handling, max_concurrent_steps, monitoring_enabled
        )

        self.analytics_enabled = analytics_enabled
        self.event_driven = event_driven

        # Enhanced components
        self.analytics = PipelineAnalytics() if analytics_enabled else None
        self.event_triggers: Dict[str, EventTrigger] = {}
        self.active_steps: Set[str] = set()
        self.step_dependencies: Dict[str, Set[str]] = {}

        # Initialize monitoring
        if monitoring_enabled and analytics_enabled and self.analytics:
            self._initialize_enhanced_monitoring()

    def add_event_trigger(
        self,
        event_type: str,
        handler: Callable,
        condition: Optional[Callable] = None,
        cooldown: int = 0,
    ) -> None:
        """Add event-based trigger."""
        trigger = EventTrigger(event_type, condition, cooldown)
        trigger.handler = handler
        self.event_triggers[event_type] = trigger

    async def handle_event(self, event_type: str, event_data: Dict) -> None:
        """Handle incoming event."""
        if event_type in self.event_triggers:
            trigger = self.event_triggers[event_type]
            if await trigger.check_trigger(event_data):
                await trigger.handle_event(event_data)

    async def execute(self, input_data: Dict = None) -> Dict[str, Any]:
        """Enhanced pipeline execution with analytics."""
        if input_data is None:
            input_data = {}
        start_time = datetime.now()

        try:
            # Update active steps gauge
            if self.analytics_enabled and self.analytics:
                self.analytics.pipeline_active_steps.labels(
                    pipeline_name=self.name
                ).set(len(self.steps))

            # Execute pipeline
            results = await super().execute(input_data)

            # Record analytics
            if self.analytics_enabled and self.analytics:
                execution_time = (datetime.now() - start_time).total_seconds()
                self._record_execution_analytics(
                    execution_time, len(results), self.error_count, self.retry_count
                )

            return results

        except Exception as e:
            if self.analytics_enabled and self.analytics:
                self._record_execution_failure(str(e))
            raise
        finally:
            if self.analytics_enabled and self.analytics:
                self.analytics.pipeline_active_steps.labels(
                    pipeline_name=self.name
                ).set(0)

    async def _execute_step(
        self, step: PipelineStep, input_data: Dict, error_count: int, retry_count: int
    ) -> Any:
        """Enhanced step execution with monitoring."""
        start_time = datetime.now()
        self.active_steps.add(step.name)

        try:
            result = await super()._execute_step(
                step, input_data, error_count, retry_count
            )

            if self.analytics_enabled and self.analytics:
                # Record success metrics
                execution_time = (datetime.now() - start_time).total_seconds()
                self.analytics.step_execution_time.labels(
                    pipeline_name=self.name, step_name=step.name
                ).observe(execution_time)
                self.analytics.step_success_counter.labels(
                    pipeline_name=self.name, step_name=step.name
                ).inc()

            return result

        except Exception:
            if self.analytics_enabled and self.analytics:
                self.analytics.step_failure_counter.labels(
                    pipeline_name=self.name, step_name=step.name
                ).inc()
            raise
        finally:
            self.active_steps.remove(step.name)

    def _initialize_enhanced_monitoring(self) -> None:
        """Initialize enhanced monitoring components."""
        super()._initialize_monitoring()

        # Setup additional monitoring
        if self.analytics_enabled and self.analytics:
            # Initialize prometheus metrics
            self.analytics.pipeline_active_steps.labels(pipeline_name=self.name).set(0)

    def _record_execution_analytics(
        self,
        execution_time: float,
        success_count: int,
        error_count: int,
        retry_count: int,
    ) -> None:
        """Record execution analytics."""
        if not self.analytics_enabled or not self.analytics:
            return

        total_steps = len(self.steps)
        success_rate = success_count / total_steps if total_steps > 0 else 0
        error_rate = error_count / total_steps if total_steps > 0 else 0

        # Update metrics
        self.analytics.performance_metrics["execution_times"].append(execution_time)
        self.analytics.performance_metrics["success_rates"].append(success_rate)
        self.analytics.performance_metrics["error_rates"].append(error_rate)
        self.analytics.performance_metrics["throughput"].append(
            success_count / execution_time if execution_time > 0 else 0
        )

        # Record execution details
        self.analytics.execution_history.append(
            {
                "timestamp": datetime.now().isoformat(),
                "execution_time": execution_time,
                "success_count": success_count,
                "error_count": error_count,
                "retry_count": retry_count,
                "success_rate": success_rate,
                "error_rate": error_rate,
            }
        )

    def _record_execution_failure(self, error_message: str) -> None:
        """Record execution failure."""
        if not self.analytics_enabled or not self.analytics:
            return

        self.analytics.execution_history.append(
            {
                "timestamp": datetime.now().isoformat(),
                "status": "failed",
                "error": error_message,
            }
        )

    def get_analytics_report(self) -> Dict[str, Any]:
        """Generate analytics report."""
        if not self.analytics_enabled or not self.analytics:
            return {}

        metrics = self.analytics.performance_metrics
        recent_executions = self.analytics.execution_history[-100:]

        return {
            "summary": {
                "avg_execution_time": np.mean(metrics["execution_times"]),
                "avg_success_rate": np.mean(metrics["success_rates"]),
                "avg_error_rate": np.mean(metrics["error_rates"]),
                "avg_throughput": np.mean(metrics["throughput"]),
            },
            "trends": {
                "execution_times": metrics["execution_times"][-100:],
                "success_rates": metrics["success_rates"][-100:],
                "error_rates": metrics["error_rates"][-100:],
                "throughput": metrics["throughput"][-100:],
            },
            "recent_executions": recent_executions,
        }

    def export_analytics(self, format: str = "json") -> str:
        """Export analytics data."""
        if not self.analytics_enabled or not self.analytics:
            return ""

        data = {
            "pipeline_name": self.name,
            "metrics": self.analytics.performance_metrics,
            "execution_history": self.analytics.execution_history,
        }

        if format.lower() == "json":
            return json.dumps(data, indent=2)
        elif format.lower() == "csv":
            df = pd.DataFrame(self.analytics.execution_history)
            return df.to_csv(index=False)
        else:
            raise ValueError(f"Unsupported format: {format}")
