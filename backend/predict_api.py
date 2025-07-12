import logging
import os
from typing import List

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Logging setup
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Initialize FastAPI app
app = FastAPI(title="Bleu.js AI Prediction API", version="1.0")

# Load the model safely
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "xgboost_model.pkl")

if not os.path.exists(MODEL_PATH):
    logging.error("❌ Model file not found!")
    raise FileNotFoundError("❌ Model file not found!")

try:
    model = joblib.load(MODEL_PATH)
    expected_features = model.get_booster().num_features()
    logging.info(
        f"✅ Model loaded successfully! Expected features: {expected_features}"
    )
except Exception as e:
    logging.error(f"❌ Failed to load model: {str(e)}")
    raise RuntimeError(f"❌ Failed to load model: {str(e)}")


# Define input schema for FastAPI
class PredictionInput(BaseModel):
    features: List[float]


@app.post("/predict")
async def predict(input_data: PredictionInput):
    """Make predictions using the XGBoost model."""
    try:
        features_array = np.array(input_data.features, dtype=np.float32)

        # Validate feature shape
        if features_array.shape[0] < expected_features:
            return {
                "error": f"❌ Too few features: expected {expected_features}, got {features_array.shape[0]}"}

        elif features_array.shape[0] > expected_features:
            return {
                "error": f"❌ Too many features: expected {expected_features}, got {features_array.shape[0]}"}

        features_array = features_array.reshape(1, -1)

        # Make prediction
        prediction = model.predict(features_array)
        prediction_prob = model.predict_proba(features_array)

        logging.info(
            f"🔮 Prediction: {prediction.tolist()}, Confidence: {prediction_prob.tolist()}"
        )

        return {
            "prediction": int(prediction[0]),
            "confidence": float(max(prediction_prob[0])),
        }
    except Exception as e:
        logging.error(f"❌ Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "🚀 Bleu.js AI Prediction API is running!"}
