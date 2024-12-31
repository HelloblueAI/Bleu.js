import argparse
import json
import os
import logging
import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def validate_data(data):
    """
    Validate and preprocess input data.

    Args:
        data (dict): Data containing features (X) and labels (y).

    Returns:
        tuple: Feature matrix (X) and label vector (y).
    """
    if "X" not in data or "y" not in data:
        raise KeyError("Both 'X' and 'y' keys must be present in the data.")
    X = np.array(data["X"])
    y = np.array(data["y"])
    if X.shape[0] != len(y):
        raise ValueError("Mismatch between number of samples in X and y.")
    return X, y

def evaluate_model(pipeline, X_val, y_val):
    """
    Evaluate the trained model on validation data.

    Args:
        pipeline (Pipeline): Trained model pipeline.
        X_val (np.ndarray): Validation feature matrix.
        y_val (np.ndarray): Validation labels.

    Returns:
        str: Classification report.
    """
    y_val_pred = pipeline.predict(X_val)
    metrics = {
        "accuracy": accuracy_score(y_val, y_val_pred),
        "precision": precision_score(y_val, y_val_pred, average='weighted'),
        "recall": recall_score(y_val, y_val_pred, average='weighted'),
        "f1_score": f1_score(y_val, y_val_pred, average='weighted')
    }
    if len(np.unique(y_val)) == 2:  # Binary classification
        metrics["roc_auc"] = roc_auc_score(y_val, pipeline.predict_proba(X_val)[:, 1])
    logging.info(f"Validation Metrics: {metrics}")
    return classification_report(y_val, y_val_pred)

def train_model(data, model_info):
    """
    Train a machine learning model based on the provided data and configuration.

    Args:
        data (dict): Training data.
        model_info (dict): Model configuration.
    """
    try:
        # Validate data
        X, y = validate_data(data)
        logging.info(f"Data loaded: {X.shape[0]} samples with {X.shape[1]} features.")

        # Train-validation split
        early_stopping_enabled = model_info.get('optimization', {}).get('early_stopping', {}).get('enabled', False)
        validation_split = model_info['optimization']['early_stopping'].get('validation_split', 0.2) if early_stopping_enabled else 0
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=validation_split, random_state=42)

        # Configure pipeline
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', LogisticRegression(
                max_iter=model_info['max_iter'],
                penalty=model_info['regularization']['penalty'],
                C=model_info['regularization']['C'],
                solver=model_info['regularization']['solver'],
                class_weight=model_info['regularization'].get('class_weight', None),
                random_state=model_info['optimization']['random_state']
            ))
        ])

        # Perform cross-validation
        if model_info['optimization'].get('cross_validation', False):
            n_splits = min(model_info['optimization']['cv_splits'], len(np.unique(y)))
            skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=model_info['optimization']['random_state'])
            cross_val_scores = cross_val_score(pipeline, X_train, y_train, cv=skf, scoring=model_info['optimization']['scoring_metric'])
            logging.info(f"Cross-validation scores: {cross_val_scores}")
            logging.info(f"Mean cross-validation score: {cross_val_scores.mean()}")

        # Train the model
        pipeline.fit(X_train, y_train)
        logging.info("Model training completed.")

        # Validate the model
        if validation_split > 0:
            val_report = evaluate_model(pipeline, X_val, y_val)
            logging.info(f"Validation report:\n{val_report}")

        # Save the model
        os.makedirs(os.path.dirname(model_info['output']['model_path']), exist_ok=True)
        joblib.dump(pipeline, model_info['output']['model_path'])
        logging.info(f"Model saved to {model_info['output']['model_path']}")

    except KeyError as ke:
        logging.error(f"Missing key in data or model_info: {ke}")
    except Exception as e:
        logging.error(f"Error occurred during model training: {e}", exc_info=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train a machine learning model.")
    parser.add_argument('--data', type=str, required=True, help="Path to the JSON file containing training data.")
    parser.add_argument('--modelInfo', type=str, required=True, help="Path to the JSON file containing model configuration.")
    parser.add_argument('--debug', action='store_true', help="Enable debug mode for detailed logging.")
    args = parser.parse_args()

    # Set logging level
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    # Load data
    try:
        with open(args.data, 'r') as f:
            data = json.load(f)
    except Exception as e:
        logging.error(f"Failed to load data from {args.data}: {e}", exc_info=True)
        exit(1)

    # Load model information
    try:
        with open(args.modelInfo, 'r') as f:
            model_info = json.load(f)
    except Exception as e:
        logging.error(f"Failed to load model information from {args.modelInfo}: {e}", exc_info=True)
        exit(1)

    # Train the model
    train_model(data, model_info)
