import argparse
import json
import joblib
import os
import logging
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def train_model(model_info):
    try:
        logging.info(f"Training model with info: {model_info}")
        
        # Example training data with 2 features per sample
        X = np.array([[0, 0], [1, 1], [1, 0], [0, 1]])
        y = np.array([0, 1, 1, 0])
        
        # Ensure the test set has at least one sample from each class
        skf = StratifiedKFold(n_splits=2, shuffle=True, random_state=42)
        for train_index, test_index in skf.split(X, y):
            X_train, X_test = X[train_index], X[test_index]
            y_train, y_test = y[train_index], y[test_index]
        
        # Create a pipeline with scaling and logistic regression
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', LogisticRegression(max_iter=model_info['max_iter']))
        ])
        
        # Train the model with cross-validation if dataset is larger
        if len(X) > 4:  # Cross-validation only if more than 4 samples
            cross_val_scores = cross_val_score(pipeline, X_train, y_train, cv=2)
            logging.info(f"Cross-validation scores: {cross_val_scores}")
            logging.info(f"Mean cross-validation score: {cross_val_scores.mean()}")
        
        # Train the model
        pipeline.fit(X_train, y_train)
        train_score = pipeline.score(X_train, y_train)
        test_score = pipeline.score(X_test, y_test)
        logging.info(f"Model trained with training score: {train_score}")
        logging.info(f"Model trained with test score: {test_score}")
        
        # Save the model
        os.makedirs('models', exist_ok=True)
        joblib.dump(pipeline, f"models/{model_info['model_name']}.pkl")
        logging.info(f"Model saved as models/{model_info['model_name']}.pkl")
    
    except Exception as e:
        logging.error(f"Error occurred during model training: {e}", exc_info=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train Model')
    parser.add_argument('--modelInfo', type=str, required=True, help='Model Info')
    args = parser.parse_args()
    
    model_info = json.loads(args.modelInfo)
    train_model(model_info)
