import pickle

import numpy as np

with open("xgboost_model.pkl", "rb") as model_file:
    model = pickle.load(model_file)

with open("scaler.pkl", "rb") as scaler_file:
    scaler = pickle.load(scaler_file)

rng = np.random.default_rng(seed=42)
test_sample = rng.random((1, 10))
scaled_sample = scaler.transform(test_sample)

prediction = model.predict(scaled_sample)
print("🧠 Model Prediction:", prediction)
