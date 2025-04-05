import numpy as np
import pytest

from quantum_py.quantum.attention import Attention

# Set random seed for reproducibility
rng = np.random.default_rng(42)


def test_attention_initialization():
    """Test attention mechanism initialization."""
    attention = Attention(d_model=64, n_heads=8)
    assert attention.d_model == 64
    assert attention.n_heads == 8
    assert attention.d_head == 8  # 64/8
    assert abs(attention.scaling - 1.0 / np.sqrt(8)) < 0.001  # 1/sqrt(d_head)
    assert attention.attention_weights is None
    assert attention.attention_output is None


def test_attention_forward():
    """Test attention forward pass."""
    attention = Attention(d_model=64, n_heads=8)
    batch_size = 2
    seq_len = 10
    x = rng.standard_normal((batch_size, seq_len, 64))

    output = attention.forward(x)
    assert output.shape == (batch_size, seq_len, 64)
    assert abs(np.mean(output)) < 0.1  # Use approximate comparison


@pytest.mark.asyncio
async def test_attention_mask():
    """Test attention with mask."""
    attention = Attention(d_model=64, n_heads=8)

    # Create sample input and mask
    batch_size = 4
    seq_len = 10
    x = rng.standard_normal((batch_size, seq_len, 64))
    mask = rng.integers(0, 2, (batch_size, seq_len))

    # Forward pass with mask
    output = attention.forward(x, mask=mask)

    assert output.shape == (batch_size, seq_len, 64)


@pytest.mark.asyncio
async def test_attention_dropout():
    """Test attention dropout."""
    attention = Attention(d_model=64, n_heads=8)

    # Create sample input
    batch_size = 4
    seq_len = 10
    x = rng.standard_normal((batch_size, seq_len, 64))

    # Forward pass with training mode
    output1 = attention.forward(x, training=True)
    output2 = attention.forward(x, training=True)

    # Outputs should be different due to dropout
    assert not np.array_equal(output1, output2)

    # Forward pass without training mode
    output3 = attention.forward(x, training=False)
    output4 = attention.forward(x, training=False)

    # Outputs should be identical without dropout
    assert np.array_equal(output3, output4)


@pytest.mark.asyncio
async def test_attention_multi_head():
    """Test multi-head attention."""
    attention = Attention(d_model=64, n_heads=8)

    # Create sample input
    batch_size = 4
    seq_len = 10
    x = rng.standard_normal((batch_size, seq_len, 64))

    # Forward pass
    output = attention.forward(x)

    # Check output shape
    assert output.shape == (batch_size, seq_len, 64)

    # Check that different heads produce different outputs
    head_outputs = []
    for head in range(8):
        head_output = attention.forward(x, head_idx=head)
        head_outputs.append(head_output)

    # All head outputs should be different
    for i in range(8):
        for j in range(i + 1, 8):
            assert not np.array_equal(head_outputs[i], head_outputs[j])
