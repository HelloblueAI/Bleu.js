#  Copyright (c) 2025, Helloblue Inc.
#  Open-Source Community Edition

#  Permission is hereby granted, free of charge, to any person obtaining a copy
#  of this software and associated documentation files (the "Software"), to use,
#  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
#  the Software, subject to the following conditions:

#  1. The above copyright notice and this permission notice shall be included in
#     all copies or substantial portions of the Software.
#  2. Contributions to this project are welcome and must adhere to the project's
#     contribution guidelines.
#  3. The name "Helloblue Inc." and its contributors may not be used to endorse
#     or promote products derived from this software without prior written consent.

#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
#  THE SOFTWARE.

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import numpy as np
import xgboost as xgb
import joblib
import os
import logging
import threading
from typing import Tuple, Optional, Union, List

# Enable logging for debugging and monitoring
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Load the model safely with absolute path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "xgboost_model.pkl")

def load_model() -> Optional[xgb.XGBClassifier]:
    """Load the trained XGBoost model."""
    try:
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'xgboost_model.json')
        model = xgb.XGBClassifier()
        model.load_model(model_path)
        return model
    except Exception as e:
        logging.error(f"❌ Failed to load model: {str(e)}")
        return None

# Load the model globally
model = load_model()

if model is None:
    print(json.dumps({"error": "❌ Model loading failed. Ensure 'xgboost_model.pkl' exists."}))
    sys.exit(1)

def preprocess_features(features: Union[List[float], np.ndarray], expected_features: int = 10) -> Tuple[Optional[np.ndarray], Optional[str]]:
    """Preprocess input features for prediction."""
    try:
        # Convert input to numpy array
        features_array = np.array(features, dtype=np.float32)
        
        if features_array.ndim != 1:
            return None, "❌ Input must be a one-dimensional list of numbers."

        # Auto-adjust features to match expected size
        if features_array.shape[0] < expected_features:
            padding_size = expected_features - features_array.shape[0]
            if padding_size > 0:  # Ensure positive padding size
                features_array = np.pad(features_array, (0, padding_size), 'constant')
                logging.warning(f"⚠️ Input features padded to {expected_features} dimensions.")

        elif features_array.shape[0] > expected_features:
            return None, f"❌ Too many features: expected {expected_features}, got {features_array.shape[0]}"

        return features_array.reshape(1, -1), None
    except Exception as e:
        return None, f"❌ Feature preprocessing error: {str(e)}"

def predict(features: Union[List[float], np.ndarray]) -> Tuple[Optional[float], Optional[str]]:
    """Make predictions using the loaded model."""
    try:
        # Load model
        model = load_model()
        if model is None:
            return None, "❌ Failed to load model"

        # Preprocess features
        processed_features, error = preprocess_features(features)
        if processed_features is None:
            return None, error

        # Make prediction
        prediction = model.predict(processed_features)[0]
        return float(prediction), None

    except Exception as e:
        return None, f"❌ Prediction error: {str(e)}"

if __name__ == "__main__":
    try:
        features = json.loads(sys.argv[1])
        if not isinstance(features, list):
            raise ValueError("Input must be a list of numbers.")

        result = predict(features)
        print(json.dumps(result, indent=2))  # Pretty print for easier debugging
    except Exception as e:
        logging.error(f"❌ Invalid input: {str(e)}")
        print(json.dumps({"error": f"❌ Invalid input: {str(e)}"}))
        sys.exit(1)
