"""
Explainability Engine for Advanced Decision Tree
Copyright (c) 2024, Bleu.js
"""

import json
import logging
import os
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Union

import graphviz
import lime
import lime.lime_tabular
import matplotlib.pyplot as plt
import msgpack
import numpy as np
import plotly.graph_objects as go
import ray
import shap
import structlog
import torch
from plotly.subplots import make_subplots
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import export_graphviz
from tensorflow import keras
from torch.utils.data import DataLoader


@dataclass
class ExplainabilityConfig:
    """Configuration for model explainability."""

    methods: Optional[List[str]] = None
    enable_shap: bool = True
    enable_lime: bool = True
    enable_tree_visualization: bool = True
    enable_feature_importance: bool = True
    enable_partial_dependence: bool = True
    enable_individual_explanations: bool = True
    enable_distributed_computing: bool = True
    visualization_format: str = "interactive"  # 'static', 'interactive', 'both'

    def __post_init__(self):
        if self.methods is None:
            self.methods = [
                "shap",
                "lime",
                "tree_visualization",
                "feature_importance",
                "partial_dependence",
            ]


class ExplainabilityEngine:
    """
    Advanced explainability engine that provides comprehensive model explanation
    capabilities using multiple methods and visualization formats.
    """

    def __init__(self, config: ExplainabilityConfig = ExplainabilityConfig()):
        self.config = config
        self.logger = structlog.get_logger()
        self.explainer = None
        self.feature_names = None
        self.explanations = {}
        self.visualizations = {}

        # Initialize Ray for distributed computing if enabled
        if config.enable_distributed_computing:
            if not ray.is_initialized():
                ray.init(ignore_reinit_error=True)

    async def initialize(self) -> None:
        """Initialize the explainability engine and its components."""
        self.logger.info("initializing_explainability_engine")

        try:
            # Initialize explainers based on enabled methods
            if self.config.enable_shap:
                await self._initialize_shap()

            if self.config.enable_lime:
                await self._initialize_lime()

            self.logger.info("explainability_engine_initialized")

        except Exception as e:
            self.logger.error("initialization_failed", error=str(e))
            raise

    async def _initialize_shap(self) -> None:
        """Initialize SHAP explainer."""
        self.explainer = shap.TreeExplainer(None)  # Will be updated with model

    async def _initialize_lime(self) -> None:
        """Initialize LIME explainer."""
        self.lime_explainer = lime.lime_tabular.LimeTabularExplainer(
            None,  # Will be updated with data
            mode="classification",
            feature_names=None,  # Will be updated with feature names
        )

    async def generate_explanation(
        self,
        model: Union[RandomForestClassifier, keras.Model],
        x: np.ndarray,
        feature_names: Optional[List[str]] = None,
    ) -> Dict:
        """
        Generate comprehensive model explanations.
        """
        self.logger.info("generating_explanations", data_shape=x.shape)

        try:
            # Store feature names
            self.feature_names = feature_names or [
                f"feature_{i}" for i in range(x.shape[1])
            ]

            # Generate explanations using different methods
            explanations = {}

            if "shap" in self.config.methods and self.config.enable_shap:
                explanations["shap"] = await self._generate_shap_explanation(model, x)

            if "lime" in self.config.methods and self.config.enable_lime:
                explanations["lime"] = await self._generate_lime_explanation(model, x)

            if (
                "tree_visualization" in self.config.methods
                and self.config.enable_tree_visualization
            ):
                explanations["tree_visualization"] = (
                    await self._generate_tree_visualization(model)
                )

            if (
                "feature_importance" in self.config.methods
                and self.config.enable_feature_importance
            ):
                explanations["feature_importance"] = (
                    await self._generate_feature_importance(model, x)
                )

            if (
                "partial_dependence" in self.config.methods
                and self.config.enable_partial_dependence
            ):
                explanations["partial_dependence"] = (
                    await self._generate_partial_dependence(model, x)
                )

            # Generate visualizations
            if self.config.visualization_format in ["static", "both"]:
                await self._generate_static_visualizations(explanations)

            if self.config.visualization_format in ["interactive", "both"]:
                await self._generate_interactive_visualizations(explanations)

            self.explanations = explanations
            self.logger.info("explanations_generated")
            return explanations

        except Exception as e:
            self.logger.error("explanation_generation_failed", error=str(e))
            raise

    async def _generate_shap_explanation(
        self, model: Union[RandomForestClassifier, keras.Model], x: np.ndarray
    ) -> Dict:
        """Generate SHAP explanations."""
        # Update explainer with model
        if isinstance(model, RandomForestClassifier):
            self.explainer = shap.TreeExplainer(model)
        else:
            self.explainer = shap.DeepExplainer(model, x)

        # Calculate SHAP values
        shap_values = self.explainer.shap_values(x)

        # Generate summary plot
        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, x, feature_names=self.feature_names)
        plt.savefig("explanations/shap_summary.png")
        plt.close()

        return {
            "shap_values": shap_values,
            "feature_importance": np.abs(shap_values).mean(axis=0),
        }

    async def _generate_lime_explanation(
        self, model: Union[RandomForestClassifier, keras.Model], x: np.ndarray
    ) -> Dict:
        """Generate LIME explanations."""
        # Update explainer with data
        self.lime_explainer = lime.lime_tabular.LimeTabularExplainer(
            x, mode="classification", feature_names=self.feature_names
        )

        # Generate explanations for a few examples
        explanations = []
        for i in range(min(5, len(x))):
            exp = self.lime_explainer.explain_instance(
                x[i], lambda x: model.predict_proba(x)[:, 1]
            )
            explanations.append(exp)

        return {
            "explanations": explanations,
            "feature_importance": np.mean(
                [exp.as_list() for exp in explanations], axis=0
            ),
        }

    async def _generate_tree_visualization(
        self, model: RandomForestClassifier
    ) -> Optional[Dict]:
        """Generate tree visualization."""
        if not isinstance(model, RandomForestClassifier):
            return None

        # Generate visualization for the first tree
        dot_data = export_graphviz(
            model.estimators_[0],
            feature_names=self.feature_names,
            filled=True,
            rounded=True,
            special_characters="!",
        )

        # Create graph
        graph = graphviz.Source(dot_data)
        graph.render("explanations/tree_visualization", format="png", cleanup=True)

        return {"tree_graph": graph, "feature_importance": model.feature_importances_}

    async def _generate_feature_importance(
        self, model: Union[RandomForestClassifier, keras.Model], x: np.ndarray
    ) -> Dict:
        """Generate feature importance analysis."""
        if isinstance(model, RandomForestClassifier):
            importance = model.feature_importances_
        else:
            # For neural networks, use permutation importance
            importance = []
            baseline_score = model.evaluate(x, verbose=0)[0]

            rng = np.random.default_rng(seed=42)  # Fixed seed for reproducibility
            for i in range(x.shape[1]):
                x_permuted = x.copy()
                x_permuted[:, i] = rng.permutation(x_permuted[:, i])
                permuted_score = model.evaluate(x_permuted, verbose=0)[0]
                importance.append(baseline_score - permuted_score)

            importance = np.array(importance)

        # Normalize importance
        importance = importance / np.sum(importance)

        return {
            "importance": importance,
            "feature_importance": dict(zip(self.feature_names, importance)),
        }

    async def _generate_partial_dependence(
        self, model: Union[RandomForestClassifier, keras.Model], x: np.ndarray
    ) -> Dict:
        """Generate partial dependence plots."""
        from sklearn.inspection import partial_dependence

        if isinstance(model, RandomForestClassifier):
            pd_results = partial_dependence(model, x, features=range(x.shape[1]))
        else:
            # For neural networks, use custom implementation
            pd_results = await self._calculate_neural_network_pd(model, x)

        return {
            "pd_results": pd_results,
            "feature_importance": np.mean(np.abs(pd_results[1]), axis=0),
        }

    async def _calculate_neural_network_pd(
        self, model: keras.Model, x: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Calculate partial dependence for neural networks."""
        pd_values = []
        pd_positions = []

        for i in range(x.shape[1]):
            # Create grid of values for feature i
            feature_values = np.linspace(np.min(x[:, i]), np.max(x[:, i]), 50)

            # Calculate partial dependence
            pd_feature = []
            for value in feature_values:
                x_pd = x.copy()
                x_pd[:, i] = value
                pd_feature.append(model.predict(x_pd, verbose=0))

            pd_values.append(np.array(pd_feature))
            pd_positions.append(feature_values)

        return np.array(pd_positions), np.array(pd_values)

    async def _generate_static_visualizations(self, explanations: Dict) -> None:
        """Generate static visualizations."""
        os.makedirs("explanations", exist_ok=True)

        if "feature_importance" in explanations:
            await self._generate_feature_importance_plot(explanations)

        if "partial_dependence" in explanations:
            await self._generate_partial_dependence_plot(explanations)

    async def _generate_feature_importance_plot(self, explanations: Dict) -> None:
        """Generate feature importance plot."""
        importance = explanations["feature_importance"]["importance"]
        plt.figure(figsize=(10, 6))
        plt.bar(self.feature_names, importance)
        plt.xticks(rotation=45)
        plt.title("Feature Importance")
        plt.tight_layout()
        plt.savefig("explanations/feature_importance.png")
        plt.close()

    async def _generate_partial_dependence_plot(self, explanations: Dict) -> None:
        """Generate partial dependence plot."""
        pd_results = explanations["partial_dependence"]["pd_results"]
        if not self._is_valid_pd_data(pd_results):
            return

        positions, values = pd_results[0], pd_results[1]
        total_features = len(positions)

        fig, axes = plt.subplots(
            total_features // 2 + total_features % 2,
            2,
            figsize=(15, 5 * (total_features // 2 + total_features % 2)),
        )

        self._plot_pd_subplots(axes, positions, values, total_features)
        plt.tight_layout()
        plt.savefig("explanations/partial_dependence.png")
        plt.close()

    def _is_valid_pd_data(self, pd_results: Tuple) -> bool:
        """Check if partial dependence data is valid."""
        return (
            pd_results is not None
            and len(pd_results) >= 2
            and pd_results[0] is not None
            and pd_results[1] is not None
        )

    def _plot_pd_subplots(
        self, axes: np.ndarray, positions: List, values: List, total_features: int
    ) -> None:
        """Plot partial dependence subplots."""
        for i, (ax, pos, val) in enumerate(zip(axes.ravel(), positions, values)):
            if pos is None or val is None:
                continue

            ax.plot(pos, val.mean(axis=1))
            feature_name = self._get_feature_name(i)
            ax.set_title(f"Partial Dependence: {feature_name}")
            ax.set_xlabel("Feature Value")
            ax.set_ylabel("Prediction")

    def _get_feature_name(self, index: int) -> str:
        """Get feature name for given index."""
        return (
            self.feature_names[index]
            if self.feature_names and index < len(self.feature_names)
            else f"feature_{index}"
        )

    async def _generate_interactive_visualizations(self, explanations: Dict) -> None:
        """Generate interactive visualizations using Plotly."""
        await self._create_output_directory()

        if self._has_valid_feature_importance(explanations):
            await self._generate_interactive_feature_importance(explanations)

        if self._has_valid_partial_dependence(explanations):
            await self._generate_interactive_partial_dependence(explanations)

    async def _generate_interactive_feature_importance(
        self, explanations: Dict
    ) -> None:
        """Generate interactive feature importance visualization."""
        importance = explanations["feature_importance"].get("importance")
        fig = self._create_importance_figure(importance)
        fig.write_html("explanations/feature_importance.html")

    async def _generate_interactive_partial_dependence(
        self, explanations: Dict
    ) -> None:
        """Generate interactive partial dependence visualization."""
        pd_results = self._get_pd_results(explanations)
        if not pd_results:
            return

        positions, values = pd_results[0], pd_results[1]
        total_features = len(positions)

        if not self._has_valid_feature_count(total_features):
            return

        fig = self._create_pd_subplots(total_features)
        self._add_pd_traces(fig, positions, values)
        self._update_pd_layout(fig, total_features)
        fig.write_html("explanations/partial_dependence.html")

    def _has_valid_feature_importance(self, explanations: Dict) -> bool:
        """Check if feature importance data is valid."""
        return (
            "feature_importance" in explanations
            and explanations["feature_importance"]
            and "importance" in explanations["feature_importance"]
        )

    def _create_importance_figure(self, importance: np.ndarray) -> go.Figure:
        """Create feature importance figure."""
        return go.Figure(
            data=[
                go.Bar(
                    x=self.feature_names,
                    y=importance,
                    text=importance.round(3),
                    textposition="auto",
                )
            ]
        ).update_layout(
            title="Feature Importance",
            xaxis_title="Features",
            yaxis_title="Importance Score",
            showlegend=False,
        )

    def _get_pd_results(self, explanations: Dict) -> Optional[Tuple]:
        """Get partial dependence results from explanations."""
        if not (
            "partial_dependence" in explanations
            and explanations["partial_dependence"]
            and "pd_results" in explanations["partial_dependence"]
        ):
            return None
        return explanations["partial_dependence"]["pd_results"]

    def _has_valid_pd_data(self, pd_results: Tuple) -> bool:
        """Check if partial dependence data is valid."""
        return (
            len(pd_results) >= 2
            and pd_results[0] is not None
            and pd_results[1] is not None
            and pd_results[0]
            and pd_results[1]
        )

    def _has_valid_feature_count(self, total_features: int) -> bool:
        """Check if feature count is valid."""
        return total_features > 0

    def _create_pd_subplots(self, total_features: int) -> go.Figure:
        """Create partial dependence subplots."""
        if not self.feature_names:
            self.feature_names = [f"feature_{i}" for i in range(total_features)]

        subplot_titles = self._get_pd_subplot_titles(total_features)
        return make_subplots(
            rows=total_features // 2 + total_features % 2,
            cols=2,
            subplot_titles=subplot_titles,
        )

    def _get_pd_subplot_titles(self, total_features: int) -> List[str]:
        """Get titles for partial dependence subplots."""
        feature_names = (
            self.feature_names[:total_features]
            if self.feature_names
            else [f"feature_{i}" for i in range(total_features)]
        )
        return [f"PD: {name}" for name in feature_names]

    def _add_pd_traces(self, fig: go.Figure, positions: List, values: List) -> None:
        """Add traces to partial dependence plots."""
        for i, (pos, val) in enumerate(zip(positions, values)):
            if not pos or not val:
                continue
            row = i // 2 + 1
            col = i % 2 + 1

            try:
                mean_val = val.mean(axis=1)
                feature_name = self._get_feature_name(i)
                fig.add_trace(
                    go.Scatter(x=pos, y=mean_val, name=feature_name, showlegend=False),
                    row=row,
                    col=col,
                )
            except (AttributeError, IndexError):
                continue

    def _update_pd_layout(self, fig: go.Figure, total_features: int) -> None:
        """Update layout of partial dependence plots."""
        fig.update_layout(
            height=300 * (total_features // 2 + total_features % 2),
            title_text="Partial Dependence Plots",
            showlegend=False,
        )

    async def explain_instance(
        self,
        model: Union[RandomForestClassifier, keras.Model],
        instance: np.ndarray,
        method: str = "shap",
    ) -> Dict:
        """
        Generate explanation for a single instance.
        """
        if method == "shap":
            # Generate SHAP explanation
            if not self.explainer:
                raise ValueError("SHAP explainer not initialized")
            shap_values = self.explainer.shap_values(instance.reshape(1, -1))

            # Create force plot
            plt.figure(figsize=(10, 6))
            if not self.explainer.expected_value:
                raise ValueError("SHAP explainer expected_value not initialized")
            shap.force_plot(
                self.explainer.expected_value,
                shap_values[0],
                instance,
                feature_names=self.feature_names,
            )
            plt.savefig("explanations/instance_shap.png")
            plt.close()

            return {
                "shap_values": shap_values[0],
                "feature_contributions": dict(zip(self.feature_names, shap_values[0])),
            }

        elif method == "lime":
            # Generate LIME explanation
            exp = self.lime_explainer.explain_instance(
                instance, lambda x: model.predict_proba(x)[:, 1]
            )

            # Create explanation plot
            plt.figure(figsize=(10, 6))
            exp.as_pyplot_figure()
            plt.tight_layout()
            plt.savefig("explanations/instance_lime.png")
            plt.close()

            return {
                "explanation": exp.as_list(),
                "feature_contributions": dict(exp.as_list()),
            }

        else:
            raise ValueError(f"Unsupported explanation method: {method}")

    async def save_state(self, path: str) -> None:
        """Save the current state of the explainability engine."""
        state = {
            "config": (
                self.config.dict()
                if hasattr(self.config, "dict")
                else vars(self.config)
            ),
            "explainer": self._serialize_explainer(),
            "feature_names": self.feature_names,
            "explanations": self._serialize_explanations(),
            "visualizations": self.visualizations,
        }

        # Save as msgpack for efficient binary serialization
        with open(path, "wb") as f:
            f.write(msgpack.packb(state))
        self.logger.info("explainability_engine_state_saved", path=path)

    def _serialize_explainer(self) -> Optional[Dict]:
        """Serialize the explainer object."""
        if not self.explainer:
            return None

        return {
            "feature_names": self.explainer.feature_names,
            "class_names": self.explainer.class_names,
            "training_data": (
                self.explainer.training_data.tobytes()
                if hasattr(self.explainer.training_data, "tobytes")
                else None
            ),
            "kernel_width": self.explainer.kernel_width,
            "random_state": self.explainer.random_state,
        }

    def _serialize_explanations(self) -> Dict:
        """Serialize the explanations dictionary."""
        if not self.explanations:
            return {}

        return {
            key: {
                "local_importance": (
                    exp.local_importance.tobytes()
                    if hasattr(exp.local_importance, "tobytes")
                    else None
                ),
                "global_importance": (
                    exp.global_importance.tobytes()
                    if hasattr(exp.global_importance, "tobytes")
                    else None
                ),
                "feature_interactions": (
                    exp.feature_interactions.tobytes()
                    if hasattr(exp.feature_interactions, "tobytes")
                    else None
                ),
            }
            for key, exp in self.explanations.items()
        }

    async def load_state(self, path: str) -> None:
        """Load a saved state of the explainability engine."""
        with open(path, "rb") as f:
            state = msgpack.unpackb(f.read())

        self.config = state["config"]

        if state["explainer"]:
            from lime import lime_tabular

            self.explainer = lime_tabular.LimeTabularExplainer(
                training_data=(
                    np.frombuffer(state["explainer"]["training_data"])
                    if state["explainer"]["training_data"]
                    else None
                ),
                feature_names=state["explainer"]["feature_names"],
                class_names=state["explainer"]["class_names"],
                kernel_width=state["explainer"]["kernel_width"],
                random_state=state["explainer"]["random_state"],
            )
        else:
            self.explainer = None

        self.feature_names = state["feature_names"]

        if state["explanations"]:
            from dataclasses import dataclass

            @dataclass
            class Explanation:
                local_importance: np.ndarray
                global_importance: np.ndarray
                feature_interactions: np.ndarray

            self.explanations = {
                key: Explanation(
                    local_importance=(
                        np.frombuffer(exp["local_importance"])
                        if exp["local_importance"]
                        else None
                    ),
                    global_importance=(
                        np.frombuffer(exp["global_importance"])
                        if exp["global_importance"]
                        else None
                    ),
                    feature_interactions=(
                        np.frombuffer(exp["feature_interactions"])
                        if exp["feature_interactions"]
                        else None
                    ),
                )
                for key, exp in state["explanations"].items()
            }
        else:
            self.explanations = {}

        self.visualizations = state["visualizations"]

        self.logger.info("explainability_engine_state_loaded", path=path)

    def _create_visualization_components(self, data: Dict) -> Dict:
        """Create individual visualization components."""
        components = {}

        if "feature_importance" in data:
            components["feature_importance"] = self._create_feature_importance_plot(
                data
            )

        if "attention_weights" in data:
            components["attention"] = self._create_attention_visualization(data)

        if "layer_activations" in data:
            components["activations"] = self._create_activation_maps(data)

        return components
