#!/usr/bin/env python3
# -*- coding: utf-8 -*-

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import numpy as np
import xgboost as xgb
import joblib
import os

# Load the model safely with absolute path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "xgboost_model.pkl")

if not os.path.exists(MODEL_PATH):
    print(json.dumps({"error": "❌ Model file not found"}))
    sys.exit(1)

try:
    model = joblib.load(MODEL_PATH)
    expected_features = model.get_booster().num_features()  # ✅ Ensure expected feature size
except Exception as e:
    print(json.dumps({"error": f"❌ Failed to load model: {str(e)}"}))
    sys.exit(1)

def predict(features):
    """Perform prediction using the XGBoost model."""
    try:
        features_array = np.array(features, dtype=np.float32)

        if features_array.shape[0] != expected_features:
            return {"error": f"❌ Feature shape mismatch, expected: {expected_features}, got {features_array.shape[0]}"}

        features_array = features_array.reshape(1, -1)
        prediction = model.predict(features_array)

        return {"prediction": prediction.tolist()}
    except Exception as e:
        return {"error": f"❌ Prediction error: {str(e)}"}

if __name__ == "__main__":
    try:
        features = json.loads(sys.argv[1])
        if not isinstance(features, list):
            raise ValueError("Input must be a list of numbers.")
        result = predict(features)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"❌ Invalid input: {str(e)}"}))
        sys.exit(1)
