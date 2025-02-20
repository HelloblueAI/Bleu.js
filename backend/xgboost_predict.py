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
