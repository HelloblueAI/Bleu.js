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

import argparse
import json
import logging
import os

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


def train_model(model_info):
    """
    Trains a logistic regression model using a sample dataset and saves the model.

    Parameters:
        model_info (dict): Dictionary containing model hyperparameters.
    """
    try:
        # Validate input parameters
        if "max_iter" not in model_info or "model_name" not in model_info:
            raise ValueError("Missing required parameters: 'max_iter' and 'model_name'")

        logging.info(f"Training model with config: {model_info}")

        # Example dataset with 2 features per sample
        X = np.array([[0, 0], [1, 1], [1, 0], [0, 1]])
        y = np.array([0, 1, 1, 0])

        # Split dataset using stratified k-fold to ensure balanced classes
        skf = StratifiedKFold(n_splits=2, shuffle=True, random_state=42)
        for train_index, test_index in skf.split(X, y):
            x_train, x_test = X[train_index], X[test_index]
            y_train, y_test = y[train_index], y[test_index]

        # Create pipeline with caching for optimization
        pipeline = Pipeline(
            [
                ("scaler", StandardScaler()),
                (
                    "classifier",
                    LogisticRegression(
                        max_iter=model_info["max_iter"], random_state=42
                    ),
                ),
            ],
            memory="cache_dir",
        )  # Enable caching

        # Perform cross-validation if dataset size is sufficient
        if len(X) > 4:
            cross_val_scores = cross_val_score(pipeline, x_train, y_train, cv=2)
            logging.info(f"Cross-validation scores: {cross_val_scores}")
            logging.info(f"Mean cross-validation score: {cross_val_scores.mean():.4f}")

        # Train the model
        pipeline.fit(x_train, y_train)
        train_score = pipeline.score(x_train, y_train)
        test_score = pipeline.score(x_test, y_test)

        logging.info(f"Training accuracy: {train_score:.4f}")
        logging.info(f"Test accuracy: {test_score:.4f}")

        # Save the trained model
        os.makedirs("models", exist_ok=True)
        model_path = f"models/{model_info['model_name']}.pkl"
        joblib.dump(pipeline, model_path)
        logging.info(f"Model successfully saved at {model_path}")

    except Exception as e:
        logging.error(f"Error occurred during model training: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train a logistic regression model.")
    parser.add_argument(
        "--modelInfo",
        type=str,
        required=True,
        help="JSON string containing model configuration.",
    )

    args = parser.parse_args()

    # Validate and parse JSON input
    try:
        model_info = json.loads(args.modelInfo)
        train_model(model_info)
    except json.JSONDecodeError:
        logging.error(
            "Invalid JSON input. Please provide a properly formatted JSON string."
        )
    except ValueError as ve:
        logging.error(f"Configuration error: {ve}")
