"""
Analytics visualization utilities for the automation pipeline.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Union

import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import seaborn as sns
from plotly.subplots import make_subplots


class PipelineVisualizer:
    """Pipeline analytics visualization utilities."""

    def __init__(self, theme: str = "plotly_dark"):
        """
        Initialize visualizer.

        Args:
            theme: Plotting theme ('plotly_dark', 'plotly_white', etc.)
        """
        self.theme = theme

    def create_performance_dashboard(
        self,
        metrics: Dict[str, List[float]],
        history: List[Dict],
        timeframe: str = "1d",
    ) -> go.Figure:
        """
        Create comprehensive performance dashboard.

        Args:
            metrics: Performance metrics dictionary
            history: Execution history list
            timeframe: Time range to display ('1h', '1d', '7d', '30d')

        Returns:
            Plotly figure object
        """
        # Create subplot figure
        fig = make_subplots(
            rows=3,
            cols=2,
            subplot_titles=(
                "Execution Times",
                "Success/Error Rates",
                "Throughput",
                "Resource Usage",
                "Step Performance",
                "Error Distribution",
            ),
        )

        # Filter data by timeframe
        filtered_data = self._filter_by_timeframe(history, timeframe)

        # Add execution times plot
        self._add_execution_times_plot(fig, filtered_data, row=1, col=1)

        # Add success/error rates plot
        self._add_rates_plot(fig, filtered_data, row=1, col=2)

        # Add throughput plot
        self._add_throughput_plot(fig, filtered_data, row=2, col=1)

        # Add resource usage plot
        self._add_resource_plot(fig, filtered_data, row=2, col=2)

        # Add step performance plot
        self._add_step_performance_plot(fig, filtered_data, row=3, col=1)

        # Add error distribution plot
        self._add_error_distribution_plot(fig, filtered_data, row=3, col=2)

        # Update layout
        fig.update_layout(
            height=1200,
            width=1600,
            showlegend=True,
            template=self.theme,
            title_text="Pipeline Performance Dashboard",
            title_x=0.5,
        )

        return fig

    def create_trend_analysis(
        self, metrics: Dict[str, List[float]], window: int = 10
    ) -> go.Figure:
        """
        Create trend analysis visualization.

        Args:
            metrics: Performance metrics dictionary
            window: Moving average window size

        Returns:
            Plotly figure object
        """
        fig = go.Figure()

        # Calculate moving averages
        for metric_name, values in metrics.items():
            if len(values) > window:
                ma = pd.Series(values).rolling(window=window).mean()

                fig.add_trace(
                    go.Scatter(
                        y=values,
                        name=metric_name,
                        mode="lines",
                        line=dict(width=1, dash="dot"),
                        showlegend=True,
                    )
                )

                fig.add_trace(
                    go.Scatter(
                        y=ma,
                        name=f"{metric_name} (MA{window})",
                        mode="lines",
                        line=dict(width=2),
                        showlegend=True,
                    )
                )

        fig.update_layout(
            height=600,
            template=self.theme,
            title_text="Performance Metrics Trends",
            title_x=0.5,
            xaxis_title="Time",
            yaxis_title="Value",
        )

        return fig

    def create_step_analysis(self, history: List[Dict]) -> go.Figure:
        """
        Create step-level performance analysis.

        Args:
            history: Execution history list

        Returns:
            Plotly figure object
        """
        # Create subplot figure
        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Step Execution Times",
                "Step Success Rates",
                "Step Dependencies",
                "Step Resource Usage",
            ),
        )

        # Process step data
        step_data = self._process_step_data(history)

        # Add step execution times box plot
        fig.add_trace(
            go.Box(
                y=step_data["execution_times"],
                x=step_data["step_names"],
                name="Execution Times",
            ),
            row=1,
            col=1,
        )

        # Add step success rates bar plot
        fig.add_trace(
            go.Bar(
                y=step_data["success_rates"],
                x=step_data["step_names"],
                name="Success Rates",
            ),
            row=1,
            col=2,
        )

        # Add step dependencies network
        self._add_dependency_network(fig, step_data, row=2, col=1)

        # Add step resource usage heatmap
        self._add_resource_heatmap(fig, step_data, row=2, col=2)

        # Update layout
        fig.update_layout(
            height=1000,
            showlegend=True,
            template=self.theme,
            title_text="Step Performance Analysis",
            title_x=0.5,
        )

        return fig

    def create_error_analysis(self, history: List[Dict]) -> go.Figure:
        """
        Create error analysis visualization.

        Args:
            history: Execution history list

        Returns:
            Plotly figure object
        """
        # Create subplot figure
        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Error Frequency",
                "Error Types",
                "Error Timeline",
                "Error Impact",
            ),
        )

        # Process error data
        error_data = self._process_error_data(history)

        # Add error frequency plot
        fig.add_trace(
            go.Bar(
                x=error_data["timestamps"],
                y=error_data["frequencies"],
                name="Error Frequency",
            ),
            row=1,
            col=1,
        )

        # Add error types pie chart
        fig.add_trace(
            go.Pie(
                labels=error_data["types"],
                values=error_data["type_counts"],
                name="Error Types",
            ),
            row=1,
            col=2,
        )

        # Add error timeline
        fig.add_trace(
            go.Scatter(
                x=error_data["timestamps"],
                y=error_data["counts"],
                mode="lines+markers",
                name="Error Timeline",
            ),
            row=2,
            col=1,
        )

        # Add error impact heatmap
        fig.add_trace(
            go.Heatmap(
                z=error_data["impact_matrix"],
                x=error_data["steps"],
                y=error_data["error_types"],
                name="Error Impact",
            ),
            row=2,
            col=2,
        )

        # Update layout
        fig.update_layout(
            height=1000,
            showlegend=True,
            template=self.theme,
            title_text="Error Analysis Dashboard",
            title_x=0.5,
        )

        return fig

    def _filter_by_timeframe(self, history: List[Dict], timeframe: str) -> List[Dict]:
        """Filter history data by timeframe."""
        now = datetime.now()

        if timeframe == "1h":
            cutoff = now - timedelta(hours=1)
        elif timeframe == "1d":
            cutoff = now - timedelta(days=1)
        elif timeframe == "7d":
            cutoff = now - timedelta(days=7)
        elif timeframe == "30d":
            cutoff = now - timedelta(days=30)
        else:
            return history

        return [
            entry
            for entry in history
            if datetime.fromisoformat(entry["timestamp"]) > cutoff
        ]

    def _init_step_data(self) -> Dict:
        """Initialize the step data structure."""
        return {
            "step_names": [],
            "execution_times": [],
            "success_rates": [],
            "dependencies": {},
            "resource_usage": {},
        }

    def _update_step_metrics(self, step_data: Dict, step: Dict) -> None:
        """Update basic step metrics."""
        if step["name"] not in step_data["step_names"]:
            step_data["step_names"].append(step["name"])

        step_data["execution_times"].append(step["execution_time"])
        step_data["success_rates"].append(1 if step["status"] == "success" else 0)

    def _update_step_dependencies(self, step_data: Dict, step: Dict) -> None:
        """Update step dependencies."""
        if "dependencies" in step:
            step_data["dependencies"][step["name"]] = step["dependencies"]

    def _update_resource_usage(self, step_data: Dict, step: Dict) -> None:
        """Update resource usage data."""
        if "resources" in step:
            if step["name"] not in step_data["resource_usage"]:
                step_data["resource_usage"][step["name"]] = []
            step_data["resource_usage"][step["name"]].append(step["resources"])

    def _process_step_data(self, history: List[Dict]) -> Dict:
        """Process step-level performance data."""
        step_data = self._init_step_data()

        for entry in history:
            if "steps" in entry:
                for step in entry["steps"]:
                    self._update_step_metrics(step_data, step)
                    self._update_step_dependencies(step_data, step)
                    self._update_resource_usage(step_data, step)

        return step_data

    def _process_error_data(self, history: List[Dict]) -> Dict:
        """Process error-related data."""
        error_data = {
            "timestamps": [],
            "frequencies": [],
            "types": [],
            "type_counts": [],
            "counts": [],
            "steps": [],
            "error_types": [],
            "impact_matrix": [],
        }

        # Process history entries
        for entry in history:
            if entry.get("status") == "failed":
                error_data["timestamps"].append(entry["timestamp"])
                error_data["frequencies"].append(1)

                if "error" in entry:
                    error_type = entry["error"].split(":")[0]
                    if error_type not in error_data["types"]:
                        error_data["types"].append(error_type)
                        error_data["type_counts"].append(1)
                    else:
                        idx = error_data["types"].index(error_type)
                        error_data["type_counts"][idx] += 1

        return error_data

    def _add_execution_times_plot(
        self, fig: go.Figure, data: List[Dict], row: int, col: int
    ) -> None:
        """Add execution times plot to dashboard."""
        times = [entry["execution_time"] for entry in data]
        timestamps = [entry["timestamp"] for entry in data]

        fig.add_trace(
            go.Scatter(
                x=timestamps, y=times, mode="lines+markers", name="Execution Time"
            ),
            row=row,
            col=col,
        )

    def _add_rates_plot(
        self, fig: go.Figure, data: List[Dict], row: int, col: int
    ) -> None:
        """Add success/error rates plot to dashboard."""
        success_rates = [entry["success_rate"] for entry in data]
        error_rates = [entry["error_rate"] for entry in data]
        timestamps = [entry["timestamp"] for entry in data]

        fig.add_trace(
            go.Scatter(
                x=timestamps,
                y=success_rates,
                mode="lines",
                name="Success Rate",
                line=dict(color="green"),
            ),
            row=row,
            col=col,
        )

        fig.add_trace(
            go.Scatter(
                x=timestamps,
                y=error_rates,
                mode="lines",
                name="Error Rate",
                line=dict(color="red"),
            ),
            row=row,
            col=col,
        )

    def _add_throughput_plot(
        self, fig: go.Figure, data: List[Dict], row: int, col: int
    ) -> None:
        """Add throughput plot to dashboard."""
        throughput = [
            (
                entry["success_count"] / entry["execution_time"]
                if entry["execution_time"] > 0
                else 0
            )
            for entry in data
        ]
        timestamps = [entry["timestamp"] for entry in data]

        fig.add_trace(
            go.Scatter(x=timestamps, y=throughput, mode="lines", name="Throughput"),
            row=row,
            col=col,
        )

    def _add_resource_plot(
        self, fig: go.Figure, data: List[Dict], row: int, col: int
    ) -> None:
        """Add resource usage plot to dashboard."""
        if not data or "resources" not in data[0]:
            return

        for resource in data[0]["resources"]:
            usage = [entry["resources"][resource] for entry in data]
            timestamps = [entry["timestamp"] for entry in data]

            fig.add_trace(
                go.Scatter(
                    x=timestamps, y=usage, mode="lines", name=f"{resource} Usage"
                ),
                row=row,
                col=col,
            )

    def _add_step_performance_plot(
        self, fig: go.Figure, data: List[Dict], row: int, col: int
    ) -> None:
        """Add step performance plot to dashboard."""
        if not data or "steps" not in data[0]:
            return

        step_times = {}
        for entry in data:
            for step in entry["steps"]:
                if step["name"] not in step_times:
                    step_times[step["name"]] = []
                step_times[step["name"]].append(step["execution_time"])

        fig.add_trace(
            go.Box(
                y=list(step_times.values()),
                x=list(step_times.keys()),
                name="Step Times",
            ),
            row=row,
            col=col,
        )

    def _add_error_distribution_plot(
        self, fig: go.Figure, data: List[Dict], row: int, col: int
    ) -> None:
        """Add error distribution plot to dashboard."""
        error_counts = {}
        for entry in data:
            if entry.get("status") == "failed":
                error_type = entry.get("error", "Unknown").split(":")[0]
                error_counts[error_type] = error_counts.get(error_type, 0) + 1

        fig.add_trace(
            go.Pie(
                labels=list(error_counts.keys()),
                values=list(error_counts.values()),
                name="Error Distribution",
            ),
            row=row,
            col=col,
        )

    def _add_dependency_network(
        self, fig: go.Figure, data: Dict, row: int, col: int
    ) -> None:
        """Add step dependency network plot."""
        if not data["dependencies"]:
            return

        G = nx.DiGraph(data["dependencies"])
        pos = nx.spring_layout(G)

        edge_x = []
        edge_y = []
        for edge in G.edges():
            x0, y0 = pos[edge[0]]
            x1, y1 = pos[edge[1]]
            edge_x.extend([x0, x1, None])
            edge_y.extend([y0, y1, None])

        fig.add_trace(
            go.Scatter(
                x=edge_x,
                y=edge_y,
                mode="lines",
                line=dict(width=1, color="gray"),
                hoverinfo="none",
                name="Dependencies",
            ),
            row=row,
            col=col,
        )

        node_x = [pos[node][0] for node in G.nodes()]
        node_y = [pos[node][1] for node in G.nodes()]

        fig.add_trace(
            go.Scatter(
                x=node_x,
                y=node_y,
                mode="markers+text",
                text=list(G.nodes()),
                textposition="bottom center",
                marker=dict(size=20),
                name="Steps",
            ),
            row=row,
            col=col,
        )

    def _add_resource_heatmap(
        self, fig: go.Figure, data: Dict, row: int, col: int
    ) -> None:
        """Add resource usage heatmap."""
        if not data["resource_usage"]:
            return

        steps = list(data["resource_usage"].keys())
        resources = list(
            set(
                resource
                for step_resources in data["resource_usage"].values()
                for resources_dict in step_resources
                for resource in resources_dict.keys()
            )
        )

        matrix = np.zeros((len(steps), len(resources)))
        for i, step in enumerate(steps):
            for j, resource in enumerate(resources):
                matrix[i, j] = np.mean(
                    [
                        resources_dict.get(resource, 0)
                        for resources_dict in data["resource_usage"][step]
                    ]
                )

        fig.add_trace(
            go.Heatmap(z=matrix, x=resources, y=steps, name="Resource Usage"),
            row=row,
            col=col,
        )
