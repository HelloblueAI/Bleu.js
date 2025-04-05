"""
Test script for quantum-enhanced vision model
"""

import argparse
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import List, Tuple

import cv2
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import tensorflow as tf
from quantum_vision_model import QuantumVisionModel
from sklearn.metrics import classification_report, confusion_matrix


def setup_logging(log_dir: str) -> None:
    """Setup logging configuration."""
    log_dir = Path(log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)

    log_file = log_dir / f"testing_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.FileHandler(log_file), logging.StreamHandler()],
    )


def load_test_data(
    data_dir: str, batch_size: int, img_size: Tuple[int, int]
) -> tf.data.Dataset:
    """Load and preprocess test data."""
    # Preprocessing
    preprocessing = tf.keras.Sequential([tf.keras.layers.Rescaling(1.0 / 255)])

    # Load test data
    test_ds = tf.keras.utils.image_dataset_from_directory(
        os.path.join(data_dir, "test"),
        image_size=img_size,
        batch_size=batch_size,
        label_mode="categorical",
    )

    # Apply preprocessing
    test_ds = test_ds.map(
        lambda x, y: (preprocessing(x), y), num_parallel_calls=tf.data.AUTOTUNE
    )

    # Optimize performance
    test_ds = test_ds.prefetch(tf.data.AUTOTUNE)

    return test_ds


def plot_confusion_matrix(
    y_true: np.ndarray, y_pred: np.ndarray, class_names: List[str], save_path: str
) -> None:
    """Plot and save confusion matrix."""
    cm = confusion_matrix(y_true, y_pred)

    plt.figure(figsize=(15, 15))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=class_names,
        yticklabels=class_names,
    )
    plt.title("Confusion Matrix")
    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()


def plot_roc_curves(
    y_true: np.ndarray, y_pred_proba: np.ndarray, class_names: List[str], save_path: str
) -> None:
    """Plot and save ROC curves."""
    from sklearn.metrics import auc, roc_curve

    plt.figure(figsize=(10, 8))

    for i in range(len(class_names)):
        fpr, tpr, _ = roc_curve(y_true[:, i], y_pred_proba[:, i])
        roc_auc = auc(fpr, tpr)
        plt.plot(fpr, tpr, label=f"{class_names[i]} (AUC = {roc_auc:.2f})")

    plt.plot([0, 1], [0, 1], "k--")
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curves")
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()


def visualize_predictions(
    model: QuantumVisionModel,
    test_ds: tf.data.Dataset,
    class_names: List[str],
    save_dir: str,
    num_samples: int = 10,
) -> None:
    """Visualize model predictions on test samples."""
    save_dir = Path(save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)

    for images, labels in test_ds.take(num_samples):
        predictions = model.predict(images.numpy())

        for i, (image, label, pred) in enumerate(zip(images, labels, predictions)):
            # Convert image to uint8
            image = (image.numpy() * 255).astype(np.uint8)

            # Get true and predicted class
            true_class = class_names[np.argmax(label)]
            pred_class = class_names[np.argmax(pred)]

            # Add text to image
            cv2.putText(
                image,
                f"True: {true_class}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2,
            )
            cv2.putText(
                image,
                f"Pred: {pred_class}",
                (10, 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                2,
            )

            # Save image
            cv2.imwrite(str(save_dir / f"prediction_{i}.jpg"), image)


def main():
    """Main testing function."""
    parser = argparse.ArgumentParser(description="Test quantum-enhanced vision model")
    parser.add_argument(
        "--model_path", type=str, required=True, help="Path to saved model"
    )
    parser.add_argument(
        "--data_dir", type=str, required=True, help="Path to data directory"
    )
    parser.add_argument(
        "--output_dir", type=str, required=True, help="Path to save results"
    )
    parser.add_argument(
        "--batch_size", type=int, default=32, help="Batch size for testing"
    )
    parser.add_argument("--img_size", type=int, default=1024, help="Input image size")
    parser.add_argument(
        "--num_samples", type=int, default=10, help="Number of samples to visualize"
    )

    args = parser.parse_args()

    # Setup logging
    setup_logging(args.output_dir)
    logger = logging.getLogger(__name__)

    try:
        # Create output directory
        output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Load test data
        logger.info("Loading test data...")
        test_ds = load_test_data(
            args.data_dir, args.batch_size, (args.img_size, args.img_size)
        )

        # Load model
        logger.info("Loading model...")
        model = QuantumVisionModel()
        model.load(args.model_path)

        # Get class names
        class_names = test_ds.class_names

        # Evaluate model
        logger.info("Evaluating model...")
        if model and model.model:
            results = model.model.evaluate(test_ds)
        else:
            raise ValueError("Model or model.model is None")

        # Get predictions
        predictions = model.predict(test_ds)
        y_true = np.concatenate([y for x, y in test_ds], axis=0)
        y_pred = np.argmax(predictions, axis=1)
        y_true = np.argmax(y_true, axis=1)

        # Generate classification report
        report = classification_report(y_true, y_pred, target_names=class_names)
        with open(output_dir / "classification_report.txt", "w") as f:
            f.write(report)

        # Plot confusion matrix
        plot_confusion_matrix(
            y_true, y_pred, class_names, str(output_dir / "confusion_matrix.png")
        )

        # Plot ROC curves
        plot_roc_curves(
            y_true, predictions, class_names, str(output_dir / "roc_curves.png")
        )

        # Visualize predictions
        visualize_predictions(
            model,
            test_ds,
            class_names,
            str(output_dir / "predictions"),
            args.num_samples,
        )

        # Save results
        results_dict = {
            "loss": float(results[0]),
            "accuracy": float(results[1]),
            "classification_report": report,
        }

        with open(output_dir / "results.json", "w") as f:
            json.dump(results_dict, f, indent=4)

        # Log results
        logger.info("Testing completed successfully")
        logger.info(f"Test loss: {results[0]:.4f}")
        logger.info(f"Test accuracy: {results[1]:.4f}")

    except Exception as e:
        logger.error(f"Testing failed: {str(e)}")
        raise


if __name__ == "__main__":
    main()
