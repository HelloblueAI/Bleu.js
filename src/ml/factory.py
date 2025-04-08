"""Model factory module."""

from typing import Any, Dict, Optional, Type, Union

from sklearn.base import BaseEstimator
from sklearn.ensemble import (
    GradientBoostingClassifier,
    GradientBoostingRegressor,
    RandomForestClassifier,
    RandomForestRegressor,
)
from sklearn.linear_model import Lasso, LinearRegression, LogisticRegression, Ridge
from sklearn.svm import SVC, SVR
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

from src.services.model_service import ModelService


class ModelFactory:
    """Factory class for creating machine learning models."""

    # Default model configurations
    DEFAULT_CONFIGS = {
        # Classification models
        "random_forest_classifier": {
            "n_estimators": 100,
            "max_depth": None,
            "random_state": 42,
        },
        "gradient_boosting_classifier": {
            "n_estimators": 100,
            "learning_rate": 0.1,
            "max_depth": 3,
            "random_state": 42,
        },
        "logistic_regression": {
            "max_iter": 1000,
            "random_state": 42,
        },
        "svc": {
            "kernel": "rbf",
            "random_state": 42,
        },
        "decision_tree_classifier": {
            "max_depth": None,
            "random_state": 42,
        },
        # Regression models
        "random_forest_regressor": {
            "n_estimators": 100,
            "max_depth": None,
            "random_state": 42,
        },
        "gradient_boosting_regressor": {
            "n_estimators": 100,
            "learning_rate": 0.1,
            "max_depth": 3,
            "random_state": 42,
        },
        "linear_regression": {},
        "ridge": {
            "alpha": 1.0,
            "random_state": 42,
        },
        "lasso": {
            "alpha": 1.0,
            "random_state": 42,
        },
        "svr": {
            "kernel": "rbf",
        },
        "decision_tree_regressor": {
            "max_depth": None,
            "random_state": 42,
        },
    }

    # Model class mappings
    MODEL_CLASSES = {
        # Classification models
        "random_forest_classifier": RandomForestClassifier,
        "gradient_boosting_classifier": GradientBoostingClassifier,
        "logistic_regression": LogisticRegression,
        "svc": SVC,
        "decision_tree_classifier": DecisionTreeClassifier,
        # Regression models
        "random_forest_regressor": RandomForestRegressor,
        "gradient_boosting_regressor": GradientBoostingRegressor,
        "linear_regression": LinearRegression,
        "ridge": Ridge,
        "lasso": Lasso,
        "svr": SVR,
        "decision_tree_regressor": DecisionTreeRegressor,
    }

    @classmethod
    def create_model(
        cls,
        model_type: str,
        model_config: Optional[Dict[str, Any]] = None,
        return_service: bool = True,
    ) -> Union[BaseEstimator, ModelService]:
        """Create a new model instance.

        Args:
            model_type: Type of model to create
            model_config: Model configuration parameters (optional)
            return_service: Whether to return a ModelService instance

        Returns:
            Union[BaseEstimator, ModelService]: Model instance or service
        """
        # Validate model type
        if model_type not in cls.MODEL_CLASSES:
            raise ValueError(
                f"Invalid model type: {model_type}. "
                f"Must be one of {list(cls.MODEL_CLASSES.keys())}"
            )

        # Get model class and default config
        model_class = cls.MODEL_CLASSES[model_type]
        default_config = cls.DEFAULT_CONFIGS.get(model_type, {})

        # Merge default config with provided config
        config = default_config.copy()
        if model_config:
            config.update(model_config)

        # Create model instance
        model = model_class(**config)

        # Return model or service
        if return_service:
            return ModelService(model)
        return model

    @classmethod
    def get_model_class(cls, model_type: str) -> Type[BaseEstimator]:
        """Get model class.

        Args:
            model_type: Type of model

        Returns:
            Type[BaseEstimator]: Model class
        """
        if model_type not in cls.MODEL_CLASSES:
            raise ValueError(
                f"Invalid model type: {model_type}. "
                f"Must be one of {list(cls.MODEL_CLASSES.keys())}"
            )
        return cls.MODEL_CLASSES[model_type]

    @classmethod
    def get_default_config(cls, model_type: str) -> Dict[str, Any]:
        """Get default model configuration.

        Args:
            model_type: Type of model

        Returns:
            Dict[str, Any]: Default configuration
        """
        if model_type not in cls.DEFAULT_CONFIGS:
            raise ValueError(
                f"Invalid model type: {model_type}. "
                f"Must be one of {list(cls.DEFAULT_CONFIGS.keys())}"
            )
        return cls.DEFAULT_CONFIGS[model_type].copy()

    @classmethod
    def list_available_models(cls) -> Dict[str, Dict[str, Any]]:
        """List all available models and their default configurations.

        Returns:
            Dict[str, Dict[str, Any]]: Dictionary of model types and configurations
        """
        return {
            model_type: {
                "class": model_class.__name__,
                "config": cls.DEFAULT_CONFIGS.get(model_type, {}),
            }
            for model_type, model_class in cls.MODEL_CLASSES.items()
        }
