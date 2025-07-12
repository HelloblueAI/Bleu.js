"""Advanced quantum-enhanced scene and object detection system."""

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
import torch
import torch.nn as nn

from ..quantum.processor import QuantumProcessor
from .quantum.self_learning import QuantumSelfLearning
from .scene import SceneAnalyzer
from .temporal import TemporalAnalyzer

logger = logging.getLogger(__name__)


@dataclass
class DetectionResult:
    """Result of quantum-enhanced object detection"""

    class_id: int
    class_name: str
    confidence: float
    bbox: Tuple[float, float, float, float]  # x, y, width, height
    quantum_features: np.ndarray
    scene_context: Dict
    temporal_context: Optional[Dict] = None


class QuantumDetector:
    """Advanced quantum-enhanced scene and object detection system"""

    def __init__(
        self,
        model_path: str = "models",
        confidence_threshold: float = 0.5,
        use_temporal_context: bool = True,
    ):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.use_temporal_context = use_temporal_context

        # Initialize components
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model: Optional[nn.Module] = None
        self.quantum_processor: Optional[QuantumProcessor] = None
        self.scene_analyzer: Optional[SceneAnalyzer] = None
        self.temporal_analyzer: Optional[TemporalAnalyzer] = None
        self.self_learning: Optional[QuantumSelfLearning] = None

        # Performance tracking
        self.performance_metrics = {
            "total_detections": 0,
            "successful_detections": 0,
            "average_confidence": 0.0,
            "quantum_speedup": 1.0,
            "scene_accuracy": 0.0,
            "temporal_accuracy": 0.0,
        }

        # Initialize components
        try:
            # Initialize detection model
            self.model = self._initialize_detection_model()

            # Initialize quantum processor
            self.quantum_processor = QuantumProcessor(
                n_qubits=8, n_layers=3, error_correction=True
            )

            # Initialize scene analyzer
            self.scene_analyzer = SceneAnalyzer()

            # Initialize temporal analyzer
            self.temporal_analyzer = TemporalAnalyzer()

            # Initialize self-learning system
            self.self_learning = QuantumSelfLearning(
                learning_rate=0.01, adaptation_speed=0.1, complexity_factor=1.0
            )

            logger.info("Quantum-enhanced detector initialized successfully")

        except Exception as e:
            logger.error(f"Error initializing detector: {str(e)}")
            raise

    def _initialize_detection_model(self) -> nn.Module:
        """Initialize the detection model"""
        # Load YOLOv5 with quantum enhancements
        model = torch.hub.load("ultralytics/yolov5", "yolov5s")
        model.to(self.device)
        return model

    def _perform_detection(
        self,
        image: torch.Tensor,
        quantum_features: np.ndarray,
        scene_context: Dict,
        temporal_context: Dict,
    ) -> List[DetectionResult]:
        """Perform object detection"""
        if self.model is None:
            raise RuntimeError("Detection model not initialized")

        # Run detection model
        try:
            with torch.no_grad():
                results = self.model(image)
                predictions = results.xyxy[0]  # Get predictions from YOLOv5 output
        except Exception as e:
            logger.error(f"Error running detection model: {e}")
            return []

        # Process results
        detections = []
        for pred in predictions:
            x1, y1, x2, y2, conf, cls = pred.cpu().numpy()

            if conf >= self.confidence_threshold:
                class_id = int(cls)
                # Get class name from model names if available, otherwise use class ID
                class_name = f"class_{class_id}"
                if hasattr(self.model, "names") and isinstance(self.model.names, dict):
                    class_name = self.model.names.get(class_id, class_name)

                detection = DetectionResult(
                    class_id=class_id,
                    class_name=class_name,
                    confidence=float(conf),
                    bbox=(float(x1), float(y1), float(x2 - x1), float(y2 - y1)),
                    quantum_features=quantum_features,
                    scene_context=scene_context,
                    temporal_context=(
                        temporal_context if self.use_temporal_context else None
                    ),
                )
                detections.append(detection)

        return detections

    def get_metrics(self) -> Dict:
        """Get current performance metrics"""
        return self.performance_metrics

    async def cleanup(self):
        """Clean up resources"""
        try:
            if self.quantum_processor:
                await self.quantum_processor.cleanup()

            if self.self_learning:
                # Save learning history
                await self.self_learning._save_learning_history()

            logger.info("Detector cleaned up successfully")

        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
            raise

    def _update_detections_with_context(
        self, detections, quantum_features, scene_context, temporal_context_data
    ):
        for i, detection in enumerate(detections):
            detection.quantum_features = quantum_features[i]
            detection.scene_context = scene_context
            detection.temporal_context = (
                temporal_context_data if self.use_temporal_context else None
            )

    async def detect(
        self, image: np.ndarray, temporal_context: Optional[np.ndarray] = None
    ) -> List[DetectionResult]:
        """Perform quantum-enhanced object detection"""
        try:
            if self.model is None:
                raise RuntimeError("Detection model not initialized")

            # Preprocess image
            processed_image = self._preprocess_image(image)

            # Extract base features and perform detection
            detections = self._perform_detection(
                processed_image,
                np.array([]),  # Empty quantum features for now
                {},  # Empty scene context for now
                {},  # Empty temporal context for now
            )

            # If we have detections, enhance them with quantum features
            if detections:
                detection_features = self._extract_detection_features(
                    detections, processed_image
                )
                if detection_features:
                    detection_features = np.array(detection_features)
                    quantum_features = await self._apply_quantum_enhancement(
                        detection_features
                    )
                    scene_context = {}
                    if self.scene_analyzer is not None:
                        scene_context = await self._analyze_scene_context(
                            processed_image
                        )
                    temporal_context_data = {}
                    if (
                        self.temporal_analyzer is not None
                        and temporal_context is not None
                    ):
                        temporal_context_data = await self._analyze_temporal_context(
                            temporal_context
                        )
                    self._update_detections_with_context(
                        detections,
                        quantum_features,
                        scene_context,
                        temporal_context_data,
                    )
                    if self.self_learning is not None:
                        await self._apply_self_learning(detections)
                    self._update_metrics(detections)
            return detections
        except Exception as e:
            logger.error(f"Error during detection: {str(e)}")
            raise

    def _preprocess_image(self, image: np.ndarray) -> torch.Tensor:
        """Preprocess image for detection"""
        # Convert to RGB
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)

        # Resize and normalize
        image = cv2.resize(image, (640, 640))
        image = torch.from_numpy(image).float().permute(2, 0, 1) / 255.0
        image = image.unsqueeze(0).to(self.device)

        return image

    def _extract_base_features(self, image: torch.Tensor) -> torch.Tensor:
        """Extract base features using feature extractor"""
        if self.model is None:
            raise RuntimeError("Detection model not initialized")

        with torch.no_grad():
            results = self.model(image)
            features = results.xyxy[0]  # Get features from YOLOv5 output
        return features

    async def _apply_quantum_enhancement(self, features: torch.Tensor) -> np.ndarray:
        """Apply quantum enhancement to features"""
        if self.quantum_processor is None:
            raise RuntimeError("Quantum processor not initialized")

        # Convert features to numpy array
        features_np = features.cpu().numpy()

        # Apply quantum processing
        enhanced_features = await self.quantum_processor.process_features(features_np)

        if enhanced_features is None:
            logger.warning("Quantum enhancement failed, using original features")
            return features_np

        return enhanced_features

    async def _analyze_scene_context(self, image: torch.Tensor) -> Dict:
        """Analyze scene context"""
        if self.scene_analyzer is None:
            raise RuntimeError("Scene analyzer not initialized")

        # Process image through scene analyzer
        scene_features = await self.scene_analyzer.analyze(image)

        return {
            "scene_classes": scene_features.get("classes", []),
            "scene_confidences": scene_features.get("confidences", []),
        }

    async def _analyze_temporal_context(self, temporal_data: np.ndarray) -> Dict:
        """Analyze temporal context"""
        if self.temporal_analyzer is None:
            raise RuntimeError("Temporal analyzer not initialized")

        # Process through temporal analyzer
        temporal_features = await self.temporal_analyzer.analyze(temporal_data)

        return {
            "temporal_classes": temporal_features.get("classes", []),
            "temporal_confidences": temporal_features.get("confidences", []),
        }

    async def _apply_self_learning(self, detections: List[DetectionResult]):
        """Apply self-learning to improve detection"""
        if self.self_learning is None:
            raise RuntimeError("Self-learning system not initialized")

        # Extract features and labels
        features = []
        labels = []
        for detection in detections:
            features.append(detection.quantum_features)
            labels.append(detection.class_id)

        # Convert to numpy arrays
        features = np.array(features)
        labels = np.array(labels)

        # Apply self-learning
        await self.self_learning.learn(features, labels)

        # Update metrics
        self._update_metrics(detections)

    def _update_metrics(self, detections: List[DetectionResult]):
        """Update detection metrics"""
        if not detections:
            return

        # Update basic metrics
        self.performance_metrics["total_detections"] += len(detections)
        self.performance_metrics["successful_detections"] += len(detections)
        self.performance_metrics["average_confidence"] = np.mean(
            [d.confidence for d in detections]
        )

        # Update quantum metrics if quantum processor is available
        if self.quantum_processor is not None:
            quantum_metrics = self.quantum_processor.get_metrics()
            self.performance_metrics["quantum_speedup"] = quantum_metrics.get(
                "quantum_speedup", 1.0
            )

        # Update scene accuracy if scene analyzer is available
        if self.scene_analyzer is not None:
            scene_confidences = [
                d.scene_context.get("scene_confidences", [0.0])[0] for d in detections
            ]
            self.performance_metrics["scene_accuracy"] = np.mean(scene_confidences)

        # Update temporal accuracy if temporal analyzer is available
        if self.temporal_analyzer is not None:
            temporal_confidences = [
                d.temporal_context.get("temporal_confidences", [0.0])[0]
                for d in detections
                if d.temporal_context
            ]
            if temporal_confidences:
                self.performance_metrics["temporal_accuracy"] = np.mean(
                    temporal_confidences
                )

    def _extract_detection_features(self, detections, processed_image):
        detection_features = []
        for detection in detections:
            bbox = detection.bbox
            x1, y1, w, h = bbox
            region = processed_image[:, :, int(y1) : int(y1 + h), int(x1) : int(x1 + w)]
            try:
                with torch.no_grad():
                    results = self.model(region)
                    region_features = results.xyxy[0].cpu().numpy()
                detection_features.append(region_features)
            except Exception as e:
                logger.error(f"Error extracting region features: {e}")
                continue
        return detection_features
