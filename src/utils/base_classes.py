"""
Base classes to reduce code duplication across the Bleu.js project.
"""

import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, Optional


class BaseConfig(ABC):
    """Base configuration class to reduce duplication."""

    def __init__(self, **kwargs):
        """Initialize configuration with keyword arguments."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        return {
            key: value
            for key, value in self.__dict__.items()
            if not key.startswith("_")
        }

    def from_dict(self, config_dict: Dict[str, Any]) -> None:
        """Load configuration from dictionary."""
        for key, value in config_dict.items():
            if hasattr(self, key):
                setattr(self, key, value)


class BaseProcessor(ABC):
    """Base processor class to reduce duplication."""

    def __init__(self, config: Optional[BaseConfig] = None):
        """Initialize processor with optional configuration."""
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    def process(self, data: Any) -> Any:
        """Process data - to be implemented by subclasses."""
        pass

    def validate_input(self, data: Any) -> bool:
        """Validate input data - can be overridden by subclasses."""
        return data is not None


class BaseService(ABC):
    """Base service class to reduce duplication."""

    def __init__(self, db_session=None, **kwargs):
        """Initialize service with database session."""
        self.db = db_session
        self.logger = logging.getLogger(self.__class__.__name__)
        self._setup(**kwargs)

    def _setup(self, **kwargs):
        """Setup method that can be overridden by subclasses."""
        pass

    @abstractmethod
    def execute(self, *args, **kwargs) -> Any:
        """Execute service operation - to be implemented by subclasses."""
        pass


class BaseModel(ABC):
    """Base model class to reduce duplication."""

    def __init__(self, model_path: Optional[str | Path] = None):
        """Initialize model with optional path."""
        self.model_path = Path(model_path) if model_path else None
        self.logger = logging.getLogger(self.__class__.__name__)
        self._load_model()

    def _load_model(self):
        """Load model - can be overridden by subclasses."""
        if self.model_path and self.model_path.exists():
            self.logger.info(f"Loading model from {self.model_path}")

    @abstractmethod
    def predict(self, data: Any) -> Any:
        """Make prediction - to be implemented by subclasses."""
        pass

    def save(self, path: str | Path) -> None:
        """Save model to path."""
        self.model_path = Path(path)
        self.logger.info(f"Saving model to {self.model_path}")


class BaseMiddleware(ABC):
    """Base middleware class to reduce duplication."""

    def __init__(self, app=None):
        """Initialize middleware with optional app."""
        self.app = app
        self.logger = logging.getLogger(self.__class__.__name__)

    def setup(self, app):
        """Setup middleware with app."""
        self.app = app
        return self

    @abstractmethod
    def process_request(self, request: Any) -> Any:
        """Process request - to be implemented by subclasses."""
        pass


class BaseOptimizer(ABC):
    """Base optimizer class to reduce duplication."""

    def __init__(self, config: Optional[BaseConfig] = None):
        """Initialize optimizer with optional configuration."""
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    def optimize(self, data: Any) -> Any:
        """Optimize data - to be implemented by subclasses."""
        pass

    def get_optimization_stats(self) -> Dict[str, Any]:
        """Get optimization statistics."""
        return {"optimizer_type": self.__class__.__name__}


class BaseSecurity(ABC):
    """Base security class to reduce duplication."""

    def __init__(self, config: Optional[BaseConfig] = None):
        """Initialize security with optional configuration."""
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    def encrypt(self, data: Any) -> Any:
        """Encrypt data - to be implemented by subclasses."""
        pass

    @abstractmethod
    def decrypt(self, data: Any) -> Any:
        """Decrypt data - to be implemented by subclasses."""
        pass


class BaseBenchmark(ABC):
    """Base benchmark class to reduce duplication."""

    def __init__(self, config: Optional[BaseConfig] = None):
        """Initialize benchmark with optional configuration."""
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    def run_benchmark(self, *args, **kwargs) -> Dict[str, Any]:
        """Run benchmark - to be implemented by subclasses."""
        pass

    def get_benchmark_results(self) -> Dict[str, Any]:
        """Get benchmark results."""
        return {"benchmark_type": self.__class__.__name__}
