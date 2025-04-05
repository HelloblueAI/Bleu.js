import argparse
import json
import logging

import joblib  # type: ignore
import numpy as np  # type: ignore

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


def evaluate_rule(rule_id, input_data):
    try:
        logging.info(f"Evaluating rule {rule_id} with input data: {input_data}")

        model_path = f"backend/ml/models/{rule_id}.pkl"
        pipeline = joblib.load(model_path)
        logging.info(f"Loaded model from {model_path}")

        input_data = np.array(input_data).reshape(1, -1)
        prediction = pipeline.predict(input_data)
        logging.info(f"Prediction: {prediction}")

    except FileNotFoundError:
        logging.error(f"Model file not found: {model_path}")
    except ValueError as ve:
        logging.error(f"Invalid input data: {input_data} - {ve}")
    except Exception as e:
        logging.error(f"Error occurred during model evaluation: {e}", exc_info=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate Rule")
    parser.add_argument("--ruleId", type=str, required=True, help="Rule ID")
    parser.add_argument("--inputData", type=str, required=True, help="Input Data")
    args = parser.parse_args()

    rule_id = args.ruleId
    input_data = json.loads(args.inputData)
    evaluate_rule(rule_id, input_data)
