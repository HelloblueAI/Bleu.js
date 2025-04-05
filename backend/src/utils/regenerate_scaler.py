"""Script to regenerate scaler from training data."""

import os
import pickle
from typing import Any, Dict, List

import numpy as np
from sklearn.preprocessing import StandardScaler


def load_training_data(data_dir: str) -> List[Dict[str, Any]]:
    """Load training data from directory.

    Args:
        data_dir: Directory containing training data files

    Returns:
        List of training data dictionaries
    """
    training_data = []
    for filename in os.listdir(data_dir):
        if filename.endswith(".pkl"):
            with open(os.path.join(data_dir, filename), "rb") as f:
                training_data.extend(pickle.load(f))
    return training_data


def extract_features(data: List[Dict[str, Any]]) -> np.ndarray:
    """Extract features from training data.

    Args:
        data: List of training data dictionaries

    Returns:
        Numpy array of features
    """
    features = []
    for sample in data:
        features.append([sample["feature1"], sample["feature2"], sample["feature3"]])
    return np.array(features)


def main() -> None:
    """Main function."""
    # Load training data
    data_dir = "data/training"
    training_data = load_training_data(data_dir)

    # Extract features
    features = extract_features(training_data)

    # Fit scaler
    scaler = StandardScaler()
    scaler.fit(features)

    # Save scaler
    with open("models/scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)

    print("✅ Scaler regenerated successfully!")


if __name__ == "__main__":
    main()
