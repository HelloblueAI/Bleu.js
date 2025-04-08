"""Utility functions for regenerating scalers."""

import json
import os
import tempfile
from typing import Any, Dict, List

import numpy as np
from sklearn.preprocessing import StandardScaler


def load_training_data(data_dir: str) -> List[Dict[str, Any]]:
    """
    Load training data from JSON files in the specified directory.

    Args:
        data_dir: Directory containing training data files

    Returns:
        List of training data dictionaries
    """
    training_data = []
    for filename in os.listdir(data_dir):
        if filename.endswith(".json"):
            with open(os.path.join(data_dir, filename), "r") as f:
                training_data.extend(json.load(f))
    return training_data


def save_training_data(data: List[Dict[str, Any]], output_dir: str = None) -> str:
    """
    Save training data to a temporary directory.

    Args:
        data: Training data to save
        output_dir: Optional output directory. If None, a secure temporary directory is used.

    Returns:
        Path to the directory containing saved data
    """
    if output_dir is None:
        output_dir = tempfile.mkdtemp()

    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "training_data.json")

    with open(output_file, "w") as f:
        json.dump(data, f)

    return output_dir
