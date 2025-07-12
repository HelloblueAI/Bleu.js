#!/usr/bin/env python
"""
XGBoost Model Inference Script
------------------------------
Provides a robust API for making predictions using a trained XGBoost model.
Features:
- Model caching and lazy loading
- Comprehensive error handling
- Feature preprocessing and validation
- Detailed logging and monitoring
- Thread-safe prediction
- Model health checks
- Rich diagnostic information
"""

import json
import logging
import os
import sys
import threading
import time
import traceback
import warnings
from datetime import datetime
from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import numpy as np
import xgboost as xgb

# Suppress warnings for production use
warnings.filterwarnings("ignore")

# Configure logging with more detailed format
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

# Configure both file and console logging
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
LOG_FILE = os.path.join(LOG_DIR, f"inference_{TIMESTAMP}.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(filename)s:%(lineno)d | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler()],
)

logger = logging.getLogger("xgboost_inference")

# Define paths with proper fallbacks
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.environ.get("MODEL_DIR", os.path.join(BASE_DIR, "models"))
MODEL_PATH = os.environ.get(
    "MODEL_PATH", os.path.join(MODEL_DIR, "xgboost_model_latest.pkl")
)
SCALER_PATH = os.environ.get(
    "SCALER_PATH", os.path.join(MODEL_DIR, "scaler_latest.pkl")
)

# Create a lock for thread-safe model loading
MODEL_LOCK = threading.Lock()
MODEL_CACHE = {
    "model": None,
    "scaler": None,
    "feature_count": None,
    "feature_names": None,
    "metadata": None,
    "loaded_at": None,
    "prediction_count": 0,
    "last_prediction_time": None,
}


class ModelError(Exception):
    """Custom exception for model-related errors."""


class FeatureError(Exception):
    """Custom exception for feature-related errors."""


class PredictionError(Exception):
    """Custom exception for prediction-related errors."""


@lru_cache(maxsize=1)
def get_model_metadata() -> Dict[str, Any]:
    """Get metadata about the model to help with diagnostics."""
    metadata = {
        "model_path": MODEL_PATH,
        "model_dir": MODEL_DIR,
        "scaler_path": SCALER_PATH,
        "system_info": {
            "python_version": sys.version,
            "numpy_version": np.__version__,
            "xgboost_version": xgb.__version__,
        },
    }

    # Try to get the model creation timestamp from the filename
    try:
        model_filename = os.path.basename(MODEL_PATH)
        if "_" in model_filename:
            timestamp_part = model_filename.split("_")[-1].split(".")[0]
            if timestamp_part.isdigit() and len(timestamp_part) == 8:  # YYYYMMDD format
                metadata["model_date"] = timestamp_part
    except Exception:
        pass

    return metadata


def _load_model_file() -> Tuple[Optional[Any], Optional[str]]:
    """Load the model file and return model or error."""
    if not os.path.exists(MODEL_PATH):
        error_msg = f"Model file not found at {MODEL_PATH}"
        logger.error(f"❌ {error_msg}")
        return None, error_msg

    try:
        logger.info(f"🔄 Loading model from {MODEL_PATH}")
        model = joblib.load(MODEL_PATH)
        return model, None
    except Exception as e:
        error_msg = f"Failed to load model: {str(e)}"
        logger.error(f"❌ {error_msg}")
        logger.error(traceback.format_exc())
        return None, error_msg


def _extract_model_info(model: Any) -> None:
    """Extract feature count and names from the model."""
    # Try to determine feature count
    try:
        MODEL_CACHE["feature_count"] = model.n_features_in_
        logger.info(f"✅ Model expects {MODEL_CACHE['feature_count']} features")
    except AttributeError:
        try:
            MODEL_CACHE["feature_count"] = model.get_booster().num_features()
            logger.info(
                f"✅ Model expects {MODEL_CACHE['feature_count']} "
                f"features (from booster)"
            )
        except Exception:
            logger.warning("⚠️ Could not determine feature count from model")
            MODEL_CACHE["feature_count"] = None

    # Try to get feature names
    try:
        MODEL_CACHE["feature_names"] = model.feature_names_in_.tolist()
        logger.info(f"✅ Found {len(MODEL_CACHE['feature_names'])} " f"feature names")
    except AttributeError:
        MODEL_CACHE["feature_names"] = None
        logger.info("ℹ️ No feature names found in model")


def _load_scaler() -> None:
    """Load scaler if it exists."""
    if os.path.exists(SCALER_PATH):
        logger.info(f"🔄 Loading scaler from {SCALER_PATH}")
        MODEL_CACHE["scaler"] = joblib.load(SCALER_PATH)
        logger.info("✅ Scaler loaded successfully")
    else:
        logger.warning(
            f"⚠️ Scaler file not found at {SCALER_PATH}. "
            f"Will proceed without scaling."
        )
        MODEL_CACHE["scaler"] = None


def load_model(force_reload: bool = False) -> Tuple[bool, Optional[str]]:
    """
    Load the XGBoost model and scaler with robust error handling.

    Args:
        force_reload: Whether to force reload the model even if already loaded

    Returns:
        Tuple of (success, error_message)
    """
    with MODEL_LOCK:
        # Check if model is already loaded and we're not forcing reload
        if not force_reload and MODEL_CACHE["model"] is not None:
            return True, None

        # Reset the cache if we're reloading
        if force_reload:
            MODEL_CACHE["model"] = None
            MODEL_CACHE["scaler"] = None

        # Load the model file
        model, error = _load_model_file()
        if error:
            return False, error

        MODEL_CACHE["model"] = model

        # Extract model information
        _extract_model_info(model)

        # Load scaler
        _load_scaler()

        # Record loading information
        MODEL_CACHE["loaded_at"] = datetime.now().isoformat()
        MODEL_CACHE["metadata"] = get_model_metadata()

        logger.info("✅ Model and dependencies loaded successfully")
        return True, None


def preprocess_features(
    features: List[float],
) -> Tuple[Optional[np.ndarray], Optional[str]]:
    """
    Preprocess input features to match the model's expected format.

    Args:
        features: List of feature values

    Returns:
        Tuple of (processed_features, error_message)
    """
    try:
        # Convert to numpy array
        features_array = np.asarray(features, dtype=np.float32)

        # Ensure it's a 1D array first
        if features_array.ndim > 1:
            return (
                None,
                f"Input must be a one-dimensional list of numbers, "
                f"got shape {features_array.shape}",
            )

        # Handle feature count mismatch
        expected_features = MODEL_CACHE.get("feature_count")
        if expected_features is not None:
            if features_array.shape[0] < expected_features:
                # Auto-pad with zeros if needed
                features_array = np.pad(
                    features_array,
                    (0, expected_features - features_array.shape[0]),
                    "constant",
                    constant_values=0,
                )
                logger.warning(
                    f"⚠️ Input features were padded from {len(features)} "
                    f"to {expected_features} dimensions"
                )
            elif features_array.shape[0] > expected_features:
                return (
                    None,
                    f"Too many features: expected {expected_features}, "
                    f"got {features_array.shape[0]}",
                )

        # Apply scaling if available
        scaled_features = features_array
        if MODEL_CACHE["scaler"] is not None:
            try:
                # Reshape for scaler
                reshaped = features_array.reshape(1, -1)
                scaled_features = MODEL_CACHE["scaler"].transform(reshaped)
                logger.debug("✅ Features scaled successfully")
            except Exception as e:
                logger.warning(
                    f"⚠️ Failed to apply scaling: {str(e)}, "
                    f"proceeding with unscaled features"
                )
                # Continue with unscaled features rather than failing
                scaled_features = features_array.reshape(1, -1)
        else:
            # Reshape for model input
            scaled_features = features_array.reshape(1, -1)

        return scaled_features, None

    except Exception as e:
        logger.error(f"❌ Feature preprocessing error: {str(e)}")
        logger.error(traceback.format_exc())
        return None, f"Feature preprocessing error: {str(e)}"


def validate_inputs(features: List[float]) -> Optional[str]:
    """
    Validate that the input features are appropriate for the model.

    Args:
        features: List of feature values

    Returns:
        Error message if validation fails, None otherwise
    """
    # Check if features is a list or array-like
    if not isinstance(features, (list, tuple, np.ndarray)):
        return f"Input must be a list of numbers, got {type(features).__name__}"

    # Check if elements are numeric
    for i, value in enumerate(features):
        if not isinstance(value, (int, float, np.number)):
            return (
                f"All elements must be numeric, element at index {i} "
                f"is {type(value).__name__}"
            )

    # Check if any elements are NaN or infinite
    features_array = np.asarray(features)
    if np.isnan(features_array).any():
        return "Input contains NaN values"
    if np.isinf(features_array).any():
        return "Input contains infinite values"

    return None


def _create_diagnostics(features: List[float]) -> Dict[str, Any]:
    """Create diagnostic information for the prediction."""
    return {
        "request_time": datetime.now().isoformat(),
        "input_feature_count": len(features),
        "model_info": {
            "loaded_at": MODEL_CACHE.get("loaded_at"),
            "prediction_count": MODEL_CACHE.get("prediction_count", 0),
        },
    }


def _get_prediction_with_probabilities(
    processed_features: np.ndarray,
) -> Dict[str, Any]:
    """Get prediction with probabilities if available."""
    try:
        prediction = MODEL_CACHE["model"].predict(processed_features)
        prediction_prob = MODEL_CACHE["model"].predict_proba(processed_features)

        class_probs = prediction_prob[0].tolist()
        confidence = float(max(prediction_prob[0]))
        predicted_class_idx = int(prediction[0])

        logger.info(
            f"🔮 Prediction: {predicted_class_idx}, "
            f"Confidence: {confidence:.4f}, "
            f"Class probabilities: {class_probs}"
        )

        return {
            "prediction": predicted_class_idx,
            "confidence": confidence,
            "probabilities": class_probs,
        }
    except Exception as e:
        logger.warning(f"⚠️ Could not get prediction probabilities: {str(e)}")
        return {"prediction": int(prediction[0])}


def _run_prediction_with_timeout(
    processed_features: np.ndarray, timeout: float
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Run prediction in a separate thread with timeout."""
    prediction_result = {}
    prediction_error = None

    def run_prediction():
        nonlocal prediction_result, prediction_error
        try:
            prediction_result = _get_prediction_with_probabilities(processed_features)
        except Exception as e:
            logger.error(f"❌ Prediction error: {str(e)}")
            logger.error(traceback.format_exc())
            prediction_error = str(e)

    prediction_thread = threading.Thread(target=run_prediction)
    prediction_thread.daemon = True
    prediction_thread.start()
    prediction_thread.join(timeout)

    if prediction_thread.is_alive():
        return None, f"Prediction timed out after {timeout} seconds"

    return prediction_result, prediction_error


def predict(
    features: List[float], timeout: float = 10.0, return_diagnostics: bool = False
) -> Dict[str, Any]:
    """
    Perform prediction using the XGBoost model with comprehensive error handling.

    Args:
        features: List of feature values
        timeout: Timeout in seconds for prediction
        return_diagnostics: Whether to include diagnostic information in the response

    Returns:
        Dictionary with prediction results or error information
    """
    start_time = time.time()
    result = {}

    # Include basic diagnostics if requested
    if return_diagnostics:
        result["diagnostics"] = _create_diagnostics(features)

    try:
        # Load model if not already loaded
        if MODEL_CACHE["model"] is None:
            success, error = load_model()
            if not success:
                return {"error": f"Model loading failed: {error}"}

        # Validate inputs
        validation_error = validate_inputs(features)
        if validation_error:
            return {"error": validation_error}

        # Preprocess features
        processed_features, error = preprocess_features(features)
        if error:
            return {"error": error}

        # Make prediction with timeout
        prediction_result, prediction_error = _run_prediction_with_timeout(
            processed_features, timeout
        )

        if prediction_error:
            return {"error": f"Prediction error: {prediction_error}"}

        # Update prediction statistics
        with MODEL_LOCK:
            MODEL_CACHE["prediction_count"] += 1
            MODEL_CACHE["last_prediction_time"] = datetime.now().isoformat()

        # Add timing information and return results
        processing_time = time.time() - start_time
        result.update(prediction_result)

        if return_diagnostics:
            result["diagnostics"]["processing_time_ms"] = round(
                processing_time * 1000, 2
            )

        return result

    except Exception as e:
        logger.error(f"❌ Unexpected error during prediction: {str(e)}")
        logger.error(traceback.format_exc())
        return {"error": f"Unexpected error during prediction: {str(e)}"}


def get_model_health() -> Dict[str, Any]:
    """Get model health information."""
    health_info = {
        "status": "unknown",
        "model_loaded": MODEL_CACHE["model"] is not None,
        "scaler_loaded": MODEL_CACHE["scaler"] is not None,
        "prediction_count": MODEL_CACHE.get("prediction_count", 0),
        "feature_count": MODEL_CACHE.get("feature_count"),
        "loaded_at": MODEL_CACHE.get("loaded_at"),
        "last_prediction_time": MODEL_CACHE.get("last_prediction_time"),
    }

    if MODEL_CACHE["model"] is not None:
        health_info["status"] = "healthy"
    else:
        health_info["status"] = "not_loaded"

    return health_info


def handle_prediction_request(
    input_data: Union[str, List[float]], include_diagnostics: bool = False
) -> Dict[str, Any]:
    """
    Main handler for prediction requests with proper input parsing.

    Args:
        input_data: Either a JSON string or a list of features
        include_diagnostics: Whether to include diagnostics info

    Returns:
        Prediction results or error information
    """
    try:
        # Parse input if it's a string
        if isinstance(input_data, str):
            try:
                features = json.loads(input_data)
            except json.JSONDecodeError as e:
                return {"error": f"Invalid JSON input: {str(e)}"}
        else:
            features = input_data

        # Ensure features is a list
        if not isinstance(features, list):
            return {"error": "Input must be a list of numeric values"}

        # Make prediction
        return predict(features, return_diagnostics=include_diagnostics)

    except Exception as e:
        logger.error(f"❌ Unexpected error in request handler: {str(e)}")
        logger.error(traceback.format_exc())
        return {"error": f"Unexpected error: {str(e)}"}


def _initialize_model() -> None:
    """Initialize the model and exit on failure."""
    try:
        success, error = load_model()
        if not success:
            print(json.dumps({"error": f"Model loading failed: {error}"}, indent=2))
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Initialization error: {str(e)}"}, indent=2))
        sys.exit(1)


def _handle_command_flags() -> bool:
    """Handle command line flags and return True if handled."""
    if len(sys.argv) <= 1:
        return False

    command = sys.argv[1]

    if command == "--health":
        health_info = get_model_health()
        print(json.dumps(health_info, indent=2))
        sys.exit(0)
    elif command == "--info":
        metadata = get_model_metadata()
        print(json.dumps(metadata, indent=2))
        sys.exit(0)
    elif command == "--reload":
        success, error = load_model(force_reload=True)
        if success:
            print(json.dumps({"status": "Model reloaded successfully"}, indent=2))
        else:
            print(json.dumps({"error": f"Model reload failed: {error}"}, indent=2))
        sys.exit(0)
    elif command == "--help":
        _show_help()
        sys.exit(0)

    return False


def _show_help() -> None:
    """Show help message."""
    print("\nXGBoost Model Inference Script")
    print("------------------------------")
    print("Usage:")
    print("  python inference.py '[feature1, feature2, ...]'   - Make a prediction")
    print("  python inference.py --health                      - Check model health")
    print("  python inference.py --info                        - Get model metadata")
    print("  python inference.py --reload                      - Reload the model")
    print("  python inference.py --help " "- Show this help message")


def _handle_prediction_request() -> None:
    """Handle prediction request from command line."""
    if len(sys.argv) != 2:
        print(
            json.dumps(
                {"error": "Please provide a list of features as a JSON array"},
                indent=2,
            )
        )
        sys.exit(1)

    include_diagnostics = "--diagnostics" in sys.argv
    result = handle_prediction_request(sys.argv[1], include_diagnostics)
    print(json.dumps(result, indent=2))


def main():
    """Main function when the script is invoked directly."""
    # Pre-load the model
    _initialize_model()

    # Process command line arguments
    try:
        # Check for command flags
        if _handle_command_flags():
            return

        # Handle prediction request
        _handle_prediction_request()

    except Exception as e:
        print(json.dumps({"error": f"Invalid input: {str(e)}"}, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
