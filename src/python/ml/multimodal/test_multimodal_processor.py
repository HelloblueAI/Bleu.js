"""
Tests for the MultimodalProcessor class
"""

import numpy as np
import pytest

from ..computer_vision.vision_processor import VisionConfig
from .multimodal_processor import (
    MultimodalConfig,
    MultimodalInput,
    MultimodalOutput,
    MultimodalProcessor,
)


@pytest.fixture
def sample_data():
    """Generate sample data for testing."""
    rng = np.random.default_rng(seed=42)
    return {
        "image": rng.random((224, 224, 3)),
        "text": "Sample text for testing",
        "audio": rng.random((16000,)),  # 1 second of audio at 16kHz
    }


@pytest.fixture
def config():
    """Create a test configuration."""
    vision_config = VisionConfig(
        max_image_size=224, channels=3, confidence_threshold=0.5, use_quantum=True
    )
    return MultimodalConfig(
        vision_config=vision_config,
        max_text_length=512,
        max_audio_length=30,
        batch_size=32,
        use_quantum=True,
        fusion_method="attention",
    )


@pytest.fixture
async def processor(config):
    """Create a test processor instance."""
    processor = MultimodalProcessor(config)
    await processor.initialize()
    return processor


@pytest.mark.asyncio
async def test_initialization(processor):
    """Test processor initialization."""
    assert processor.initialized
    assert processor.vision_processor is not None
    assert processor.quantum_enhancer is not None
    assert "text_encoder" in processor.models
    assert "audio_encoder" in processor.models
    assert "fusion_model" in processor.models


@pytest.mark.asyncio
async def test_vision_processing(processor, sample_data):
    """Test vision processing."""
    input_data = MultimodalInput(image=sample_data["image"])
    output = await processor.process(input_data)

    assert isinstance(output, MultimodalOutput)
    assert output.features is not None
    assert output.confidence > 0
    assert "modality_0" in output.modalities
    assert "modality_0" in output.fusion_weights


@pytest.mark.asyncio
async def test_text_processing(processor, sample_data):
    """Test text processing."""
    input_data = MultimodalInput(text=sample_data["text"])
    with pytest.raises(NotImplementedError):
        await processor.process(input_data)


@pytest.mark.asyncio
async def test_audio_processing(processor, sample_data):
    """Test audio processing."""
    input_data = MultimodalInput(audio=sample_data["audio"])
    with pytest.raises(NotImplementedError):
        await processor.process(input_data)


@pytest.mark.asyncio
async def test_multimodal_processing(processor, sample_data):
    """Test processing multiple modalities together."""
    input_data = MultimodalInput(
        image=sample_data["image"], text=sample_data["text"], audio=sample_data["audio"]
    )
    with pytest.raises(NotImplementedError):
        await processor.process(input_data)


@pytest.mark.asyncio
async def test_fusion_methods(processor, sample_data):
    """Test different fusion methods."""
    # Test concatenation fusion
    processor.config.fusion_method = "concat"
    input_data = MultimodalInput(image=sample_data["image"])
    output = await processor.process(input_data)
    assert output.features is not None

    # Test attention fusion
    processor.config.fusion_method = "attention"
    with pytest.raises(NotImplementedError):
        await processor.process(input_data)

    # Test quantum fusion
    processor.config.fusion_method = "quantum"
    with pytest.raises(NotImplementedError):
        await processor.process(input_data)


@pytest.mark.asyncio
async def test_error_handling(processor):
    """Test error handling."""
    # Test uninitialized processor
    processor.initialized = False
    with pytest.raises(RuntimeError):
        await processor.process(MultimodalInput())

    # Test invalid input
    processor.initialized = True
    with pytest.raises(ValueError):
        await processor.process(None)


@pytest.mark.asyncio
async def test_fusion_weights(processor, sample_data):
    """Test fusion weight calculation."""
    input_data = MultimodalInput(image=sample_data["image"])
    output = await processor.process(input_data)

    # Check fusion weights
    assert all(0 <= w <= 1 for w in output.fusion_weights.values())
    assert abs(sum(output.fusion_weights.values()) - 1.0) < 1e-6
