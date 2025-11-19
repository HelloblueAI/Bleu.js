"""
Model Factory for creating and managing different types of models.
"""

import logging
from typing import Dict, List, Optional, Type

from sklearn.base import BaseEstimator

from .ensemble_model import EnsembleModel
from .xgboost_model import XGBoostModel


class ModelFactory:
    """Factory class for creating and managing ML models."""

    _model_registry: Dict[str, Type[BaseEstimator]] = {
        "xgboost": XGBoostModel,
        "ensemble": EnsembleModel,
    }

    @classmethod
    def create_model(
        cls, model_type: str, config: Optional[Dict] = None
    ) -> BaseEstimator:
        """Create a model instance based on the specified type."""
        try:
            if model_type not in cls._model_registry:
                raise ValueError(f"❌ Unknown model type: {model_type}")

            model_class = cls._model_registry[model_type]
            model = model_class(**(config or {}))
            logging.info(f"✅ Created {model_type} model successfully")
            return model

        except Exception as e:
            logging.error(f"❌ Failed to create model: {str(e)}")
            raise

    @classmethod
    def register_model(cls, model_type: str, model_class: Type[BaseEstimator]):
        """Register a new model type."""
        cls._model_registry[model_type] = model_class
        logging.info(f"✅ Registered new model type: {model_type}")

    @classmethod
    def get_available_models(cls) -> List[str]:
        """Get list of available model types."""
        return list(cls._model_registry.keys())
