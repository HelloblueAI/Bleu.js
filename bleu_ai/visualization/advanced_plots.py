"""
Advanced Plots Implementation
Provides sophisticated visualization capabilities for model analysis
and performance tracking.
"""

import logging
from typing import List, Optional, Tuple

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from sklearn.metrics import auc, confusion_matrix, roc_curve
from sklearn.preprocessing import StandardScaler


class AdvancedPlots:
    def __init__(
        self,
        style: str = "seaborn",
        color_palette: Optional[List[str]] = None,
        figsize: Tuple[int, int] = (12, 8),
    ):
        self.style = style
        self.color_palette = color_palette or sns.color_palette("husl", 10)
        self.figsize = figsize
        self.scaler = StandardScaler()
        self.initialized = False

    def initialize(self):
        """Initialize the advanced plots module."""
        try:
            plt.style.use(self.style)
            self.initialized = True
            logging.info("✅ Advanced plots module initialized successfully")
        except Exception as e:
            logging.error(f"❌ Failed to initialize advanced plots module: {str(e)}")
            raise

    def plot_feature_importance(
        self,
        feature_importance: np.ndarray,
        feature_names: List[str],
        title: str = "Feature Importance",
        save_path: Optional[str] = None,
    ) -> None:
        """Plot feature importance with advanced styling."""
        try:
            if not self.initialized:
                self.initialize()

            # Create figure
            plt.figure(figsize=self.figsize)

            # Sort features by importance
            sorted_idx = np.argsort(feature_importance)
            pos = np.arange(sorted_idx.shape[0]) + 0.5

            # Create bar plot
            plt.barh(pos, feature_importance[sorted_idx], align="center")
            plt.yticks(pos, np.array(feature_names)[sorted_idx])

            # Add value labels
            for i, v in enumerate(feature_importance[sorted_idx]):
                plt.text(v, i, f"{v:.3f}", va="center")

            # Customize plot
            plt.title(title, pad=20)
            plt.xlabel("Importance Score")
            plt.tight_layout()

            # Save plot if path provided
            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches="tight")
                logging.info(f"✅ Feature importance plot saved to {save_path}")

            plt.close()

        except Exception as e:
            logging.error(f"❌ Failed to create feature importance plot: {str(e)}")
            raise

    def plot_learning_curves(
        self,
        train_scores: np.ndarray,
        val_scores: np.ndarray,
        train_sizes: np.ndarray,
        title: str = "Learning Curves",
        save_path: Optional[str] = None,
    ) -> None:
        """Plot learning curves with confidence intervals."""
        try:
            if not self.initialized:
                self.initialize()

            # Calculate mean and std
            train_mean = np.mean(train_scores, axis=1)
            train_std = np.std(train_scores, axis=1)
            val_mean = np.mean(val_scores, axis=1)
            val_std = np.std(val_scores, axis=1)

            # Create figure
            plt.figure(figsize=self.figsize)

            # Plot learning curves
            plt.plot(
                train_sizes,
                train_mean,
                label="Training score",
                color=self.color_palette[0],
            )
            plt.fill_between(
                train_sizes,
                train_mean - train_std,
                train_mean + train_std,
                alpha=0.1,
                color=self.color_palette[0],
            )

            plt.plot(
                train_sizes,
                val_mean,
                label="Cross-validation score",
                color=self.color_palette[1],
            )
            plt.fill_between(
                train_sizes,
                val_mean - val_std,
                val_mean + val_std,
                alpha=0.1,
                color=self.color_palette[1],
            )

            # Customize plot
            plt.title(title, pad=20)
            plt.xlabel("Training Examples")
            plt.ylabel("Score")
            plt.grid(True)
            plt.legend(loc="best")
            plt.tight_layout()

            # Save plot if path provided
            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches="tight")
                logging.info(f"✅ Learning curves plot saved to {save_path}")

            plt.close()

        except Exception as e:
            logging.error(f"❌ Failed to create learning curves plot: {str(e)}")
            raise

    def plot_confusion_matrix(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        classes: Optional[List[str]] = None,
        title: str = "Confusion Matrix",
        save_path: Optional[str] = None,
    ) -> None:
        """Plot confusion matrix with advanced styling."""
        try:
            if not self.initialized:
                self.initialize()

            # Calculate confusion matrix
            cm = confusion_matrix(y_true, y_pred)

            # Create figure
            plt.figure(figsize=self.figsize)

            # Create heatmap
            sns.heatmap(
                cm,
                annot=True,
                fmt="d",
                cmap="Blues",
                xticklabels=classes or [str(i) for i in range(cm.shape[1])],
                yticklabels=classes or [str(i) for i in range(cm.shape[0])],
            )

            # Customize plot
            plt.title(title, pad=20)
            plt.xlabel("Predicted")
            plt.ylabel("True")
            plt.tight_layout()

            # Save plot if path provided
            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches="tight")
                logging.info(f"✅ Confusion matrix plot saved to {save_path}")

            plt.close()

        except Exception as e:
            logging.error(f"❌ Failed to create confusion matrix plot: {str(e)}")
            raise

    def plot_roc_curve(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray,
        title: str = "ROC Curve",
        save_path: Optional[str] = None,
    ) -> None:
        """Plot ROC curve with AUC score."""
        try:
            if not self.initialized:
                self.initialize()

            # Calculate ROC curve
            fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
            roc_auc = auc(fpr, tpr)

            # Create figure
            plt.figure(figsize=self.figsize)

            # Plot ROC curve
            plt.plot(
                fpr,
                tpr,
                color=self.color_palette[0],
                lw=2,
                label=f"ROC curve (AUC = {roc_auc:.2f})",
            )

            # Plot diagonal line
            plt.plot([0, 1], [0, 1], color="gray", lw=1, linestyle="--")

            # Customize plot
            plt.title(title, pad=20)
            plt.xlabel("False Positive Rate")
            plt.ylabel("True Positive Rate")
            plt.legend(loc="lower right")
            plt.grid(True)
            plt.tight_layout()

            # Save plot if path provided
            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches="tight")
                logging.info(f"✅ ROC curve plot saved to {save_path}")

            plt.close()

        except Exception as e:
            logging.error(f"❌ Failed to create ROC curve plot: {str(e)}")
            raise

    def plot_feature_correlations(
        self,
        features: np.ndarray,
        feature_names: List[str],
        title: str = "Feature Correlations",
        save_path: Optional[str] = None,
    ) -> None:
        """Plot feature correlation matrix."""
        try:
            if not self.initialized:
                self.initialize()

            # Calculate correlation matrix
            corr_matrix = np.corrcoef(features.T)

            # Create figure
            plt.figure(figsize=self.figsize)

            # Create heatmap
            sns.heatmap(
                corr_matrix,
                annot=True,
                cmap="coolwarm",
                center=0,
                xticklabels=feature_names,
                yticklabels=feature_names,
                square=True,
            )

            # Customize plot
            plt.title(title, pad=20)
            plt.tight_layout()

            # Save plot if path provided
            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches="tight")
                logging.info(f"✅ Feature correlations plot saved to {save_path}")

            plt.close()

        except Exception as e:
            logging.error(f"❌ Failed to create feature correlations plot: {str(e)}")
            raise

    def plot_distribution(
        self,
        data: np.ndarray,
        feature_names: List[str],
        title: str = "Feature Distributions",
        save_path: Optional[str] = None,
    ) -> None:
        """Plot feature distributions."""
        try:
            if not self.initialized:
                self.initialize()

            # Create subplots
            n_features = data.shape[1]
            n_cols = min(3, n_features)
            n_rows = (n_features + n_cols - 1) // n_cols

            _, axes = plt.subplots(n_rows, n_cols, figsize=(15, 5 * n_rows))
            if n_features == 1:
                axes = [axes]
            elif n_rows == 1:
                axes = axes.reshape(1, -1)
            else:
                axes = axes.flatten()

            # Plot distributions
            for i in range(n_features):
                ax = axes[i]
                ax.hist(
                    data[:, i],
                    bins=30,
                    alpha=0.7,
                    color=self.color_palette[i % len(self.color_palette)],
                )
                ax.set_title(f"{feature_names[i]} Distribution")
                ax.set_xlabel("Value")
                ax.set_ylabel("Frequency")

            # Hide unused subplots
            for i in range(n_features, len(axes)):
                axes[i].set_visible(False)

            # Customize plot
            plt.suptitle(title, fontsize=16)
            plt.tight_layout()

            # Save plot if path provided
            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches="tight")
                logging.info(f"✅ Feature distributions plot saved to {save_path}")

            plt.close()

        except Exception as e:
            logging.error(f"❌ Failed to create feature distributions plot: {str(e)}")
            raise

    def dispose(self):
        """Clean up resources."""
        try:
            self.initialized = False
            logging.info("✅ Advanced plots module disposed successfully")
        except Exception as e:
            logging.error(f"❌ Failed to dispose advanced plots module: {str(e)}")
            raise
