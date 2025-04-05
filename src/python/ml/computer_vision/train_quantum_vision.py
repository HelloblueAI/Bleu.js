"""
Training script for quantum-enhanced vision model
"""

import argparse
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Tuple

import tensorflow as tf
from quantum_vision_model import QuantumVisionConfig, QuantumVisionModel


def setup_logging(log_dir: str) -> None:
    """Setup logging configuration."""
    log_dir = Path(log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)

    log_file = log_dir / f"training_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.FileHandler(log_file), logging.StreamHandler()],
    )


def load_and_preprocess_data(
    data_dir: str, batch_size: int, img_size: Tuple[int, int]
) -> Tuple[tf.data.Dataset, tf.data.Dataset]:
    """Load and preprocess training and validation data."""
    # Data augmentation for training
    train_augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.2),
            tf.keras.layers.RandomTranslation(0.1, 0.1),
            tf.keras.layers.RandomZoom(0.1),
            tf.keras.layers.RandomBrightness(0.2),
            tf.keras.layers.RandomContrast(0.2),
            tf.keras.layers.Rescaling(1.0 / 255),
        ]
    )

    # Preprocessing for validation
    val_preprocessing = tf.keras.Sequential([tf.keras.layers.Rescaling(1.0 / 255)])

    # Load training data
    train_ds = tf.keras.utils.image_dataset_from_directory(
        os.path.join(data_dir, "train"),
        validation_split=0.2,
        subset="training",
        seed=123,
        image_size=img_size,
        batch_size=batch_size,
        label_mode="categorical",
    )

    # Load validation data
    val_ds = tf.keras.utils.image_dataset_from_directory(
        os.path.join(data_dir, "train"),
        validation_split=0.2,
        subset="validation",
        seed=123,
        image_size=img_size,
        batch_size=batch_size,
        label_mode="categorical",
    )

    # Apply preprocessing
    train_ds = train_ds.map(
        lambda x, y: (train_augmentation(x), y), num_parallel_calls=tf.data.AUTOTUNE
    )

    val_ds = val_ds.map(
        lambda x, y: (val_preprocessing(x), y), num_parallel_calls=tf.data.AUTOTUNE
    )

    # Optimize performance
    train_ds = train_ds.prefetch(tf.data.AUTOTUNE)
    val_ds = val_ds.prefetch(tf.data.AUTOTUNE)

    return train_ds, val_ds


def create_model_config(args: argparse.Namespace) -> QuantumVisionConfig:
    """Create model configuration from command line arguments."""
    return QuantumVisionConfig(
        input_shape=(args.img_size, args.img_size, 3),
        num_classes=args.num_classes,
        quantum_layers=args.quantum_layers,
        quantum_qubits=args.quantum_qubits,
        feature_dim=args.feature_dim,
        dropout_rate=args.dropout_rate,
        learning_rate=args.learning_rate,
    )


def main():
    """Main training function."""
    parser = argparse.ArgumentParser(description="Train quantum-enhanced vision model")
    parser.add_argument(
        "--data_dir", type=str, required=True, help="Path to data directory"
    )
    parser.add_argument(
        "--model_dir", type=str, required=True, help="Path to save model"
    )
    parser.add_argument("--log_dir", type=str, required=True, help="Path to save logs")
    parser.add_argument("--img_size", type=int, default=1024, help="Input image size")
    parser.add_argument(
        "--batch_size", type=int, default=32, help="Training batch size"
    )
    parser.add_argument(
        "--num_classes", type=int, default=1000, help="Number of classes"
    )
    parser.add_argument(
        "--quantum_layers", type=int, default=3, help="Number of quantum layers"
    )
    parser.add_argument(
        "--quantum_qubits", type=int, default=4, help="Number of quantum qubits"
    )
    parser.add_argument(
        "--feature_dim", type=int, default=2048, help="Feature dimension"
    )
    parser.add_argument("--dropout_rate", type=float, default=0.5, help="Dropout rate")
    parser.add_argument(
        "--learning_rate", type=float, default=0.001, help="Learning rate"
    )
    parser.add_argument(
        "--epochs", type=int, default=100, help="Number of training epochs"
    )

    args = parser.parse_args()

    # Setup logging
    setup_logging(args.log_dir)
    logger = logging.getLogger(__name__)

    try:
        # Create model directory
        model_dir = Path(args.model_dir)
        model_dir.mkdir(parents=True, exist_ok=True)

        # Load and preprocess data
        logger.info("Loading and preprocessing data...")
        train_ds, val_ds = load_and_preprocess_data(
            args.data_dir, args.batch_size, (args.img_size, args.img_size)
        )

        # Create and build model
        logger.info("Creating and building model...")
        config = create_model_config(args)
        model = QuantumVisionModel(config)
        model.build()

        # Train model
        logger.info("Starting training...")
        history = model.train(train_ds, val_ds, epochs=args.epochs)

        # Save model
        model_path = model_dir / "quantum_vision_model.h5"
        model.save(str(model_path))
        logger.info(f"Model saved to {model_path}")

        # Log training metrics
        logger.info("Training completed successfully")
        logger.info(f"Final training loss: {history.history['loss'][-1]:.4f}")
        logger.info(f"Final validation loss: {history.history['val_loss'][-1]:.4f}")

    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        raise


if __name__ == "__main__":
    main()
