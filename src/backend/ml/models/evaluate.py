import argparse
import json
import joblib
import logging
import numpy as np
import os
from typing import List, Any

# Configure logging
def setup_logging(debug: bool = False):
    log_level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(levelname)s - %(message)s",
    )

def evaluate_rule(rule_id: str, input_data: List[Any]) -> None:
    """
    Evaluate a rule using a machine learning model.

    Args:
        rule_id (str): Identifier for the rule (model file name without extension).
        input_data (List[Any]): Input data for the model.
    """
    # Construct the absolute path for the model file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, f"{rule_id}.pkl")

    try:
        logging.info(f"Evaluating rule '{rule_id}' with input data: {input_data}")

        # Check if the model file exists
        if not os.path.exists(model_path):
            logging.error(f"Model file not found: {model_path}")
            exit(1)

        # Load the model or pipeline
        model_or_pipeline = joblib.load(model_path)
        logging.info(f"Model loaded successfully from {model_path}")

        # Prepare input data
        input_data_array = np.array(input_data).reshape(1, -1)

        # Determine expected features
        if hasattr(model_or_pipeline, "named_steps"):  # If it's a pipeline
            model = model_or_pipeline.named_steps.get("logisticregression")
        else:  # If it's a direct model
            model = model_or_pipeline

        if model is None or not hasattr(model, "coef_"):
            logging.error("The loaded model is not compatible for evaluation.")
            exit(2)

        expected_features = model.coef_.shape[1]
        if input_data_array.shape[1] != expected_features:
            logging.error(
                f"Input data has {input_data_array.shape[1]} features, "
                f"but the model expects {expected_features} features."
            )
            exit(3)

        # Make a prediction
        prediction = model_or_pipeline.predict(input_data_array)
        logging.info(f"Prediction: {prediction}")

    except ValueError as ve:
        logging.error(f"Invalid input data: {input_data} - {ve}")
        exit(4)
    except Exception as e:
        logging.error(f"An unexpected error occurred during evaluation: {e}", exc_info=True)
        exit(5)

if __name__ == "__main__":
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="Evaluate Rule using a machine learning model")
    parser.add_argument("--ruleId", type=str, required=True, help="Rule ID (e.g., model file name without extension)")
    parser.add_argument("--inputData", type=str, required=True, help="Input data as a JSON string")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode for detailed logging")
    args = parser.parse_args()

    # Setup logging
    setup_logging(debug=args.debug)

    # Parse and validate input data
    try:
        input_data = json.loads(args.inputData)
        if not isinstance(input_data, list):
            raise ValueError("Input data must be a JSON array")
    except json.JSONDecodeError:
        logging.error("Invalid JSON format for input data")
        exit(6)
    except ValueError as ve:
        logging.error(ve)
        exit(7)

    # Evaluate the rule
    evaluate_rule(args.ruleId, input_data)