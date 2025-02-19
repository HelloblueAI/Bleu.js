import xgboost as xgb
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# ✅ Generate synthetic data (replace this with real dataset)
rng = np.random.default_rng(42)
X = rng.random((1000, 10))  # 1000 samples, 10 features
y = (X.sum(axis=1) > 5).astype(int)  # Example target variable

# ✅ Split into training & testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ✅ Initialize the most intelligent XGBoost model
model = xgb.XGBClassifier(
    n_estimators=200,    # Number of trees
    max_depth=6,         # Maximum depth of each tree
    learning_rate=0.05,  # Step size shrinkage
    subsample=0.8,       # Randomly sample training data
    colsample_bytree=0.8,# Subsample ratio of columns
    objective="binary:logistic",  # Binary classification
    eval_metric="logloss",
    use_label_encoder=False
)

# ✅ Train the model
model.fit(X_train, y_train)

# ✅ Evaluate model performance
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"🔥 Training complete! Model accuracy: {accuracy:.4f}")

# ✅ Save the model
model_path = "xgboost_model.pkl"
joblib.dump(model, model_path)
print(f"✅ Model saved as {model_path}")
