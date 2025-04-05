import os
import sys
import unittest

import numpy as np
import tensorflow as tf

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from src.python.ml.computer_vision.quantum_attention import (
    QuantumAttention,
    QuantumAttentionConfig,
)
from src.python.ml.computer_vision.quantum_fusion import (
    QuantumFusion,
    QuantumFusionConfig,
)
from src.python.ml.computer_vision.quantum_loss import QuantumLoss, QuantumLossConfig
from src.python.ml.computer_vision.quantum_vision_model import (
    QuantumVisionConfig,
    QuantumVisionModel,
)


class TestQuantumVision(unittest.TestCase):
    def setUp(self):
        # Initialize model with test configuration
        self.config = QuantumVisionConfig(
            input_shape=(224, 224, 3),
            num_classes=10,
            quantum_qubits=2,
            feature_dim=512,
            use_attention=True,
            use_fusion=True,
            use_quantum_loss=True,
        )
        self.model = QuantumVisionModel(self.config)

        # Create dummy data for testing
        self.batch_size = 4
        self.test_images = np.random.rand(self.batch_size, 224, 224, 3)
        self.test_labels = np.random.randint(0, 10, (self.batch_size,))

    def test_model_initialization(self):
        """Test if model initializes correctly"""
        self.assertIsNotNone(self.model)
        self.model.build()
        self.assertTrue(self.model.built)

    def test_model_prediction(self):
        """Test if model can make predictions"""
        self.model.build()
        predictions = self.model.predict(self.test_images)
        self.assertEqual(predictions.shape[0], self.batch_size)
        self.assertEqual(predictions.shape[1], 10)  # num_classes

    def test_quantum_attention(self):
        """Test quantum attention mechanism"""
        attention_config = QuantumAttentionConfig(
            num_qubits=2, feature_dim=512, num_heads=4
        )
        attention = QuantumAttention(attention_config)

        # Create dummy query, key, value tensors
        query = tf.random.normal((self.batch_size, 10, 512))
        key = tf.random.normal((self.batch_size, 10, 512))
        value = tf.random.normal((self.batch_size, 10, 512))

        output = attention.compute_attention(query, key, value)
        self.assertEqual(output.shape, (self.batch_size, 10, 512))

    def test_quantum_fusion(self):
        """Test quantum feature fusion"""
        fusion_config = QuantumFusionConfig(
            num_qubits=2, feature_dims=[512, 256, 128], fusion_dim=512
        )
        fusion = QuantumFusion(fusion_config)

        # Create dummy feature list
        features = [
            tf.random.normal((self.batch_size, 512)),
            tf.random.normal((self.batch_size, 256)),
            tf.random.normal((self.batch_size, 128)),
        ]

        fused_features = fusion.fuse_features(features)
        self.assertEqual(fused_features.shape, (self.batch_size, 512))

    def test_quantum_loss(self):
        """Test quantum loss functions"""
        loss_config = QuantumLossConfig(num_qubits=2, feature_dim=512, temperature=0.1)
        loss = QuantumLoss(loss_config)

        # Create dummy predictions and labels
        y_true = tf.random.uniform((self.batch_size, 10))
        y_pred = tf.random.uniform((self.batch_size, 10))

        # Test different loss functions
        cross_entropy = loss.quantum_cross_entropy(y_true, y_pred)
        self.assertIsInstance(cross_entropy, tf.Tensor)

        focal_loss = loss.quantum_focal_loss(y_true, y_pred)
        self.assertIsInstance(focal_loss, tf.Tensor)

        triplet_loss = loss.quantum_triplet_loss(y_true, y_pred)
        self.assertIsInstance(triplet_loss, tf.Tensor)

    def test_model_training(self):
        """Test if model can be trained"""
        self.model.build()

        # Create a small dataset
        train_data = tf.data.Dataset.from_tensor_slices(
            (self.test_images, self.test_labels)
        )
        train_data = train_data.batch(2)

        # Train for one epoch
        history = self.model.train(train_data=train_data, epochs=1)

        self.assertIsNotNone(history)
        self.assertIn("loss", history.history)
        self.assertIn("accuracy", history.history)


if __name__ == "__main__":
    unittest.main()
