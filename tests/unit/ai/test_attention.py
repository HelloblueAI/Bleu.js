import pytest
import torch
from src.core.ai.transformers.attention.multi_head import MultiHeadAttention

@pytest.mark.parametrize("batch_size,seq_len,d_model,num_heads", [
    (2, 10, 512, 8),
    (4, 15, 256, 4),
    (3, 20, 768, 12),
])
def test_multi_head_attention_shape(batch_size, seq_len, d_model, num_heads):
    mha = MultiHeadAttention(d_model=d_model, num_heads=num_heads)
    x = torch.randn(batch_size, seq_len, d_model)
    
    output, attention = mha(x, x, x)
    
    assert output.shape == (batch_size, seq_len, d_model)
    assert attention.shape == (batch_size, num_heads, seq_len, seq_len)

@pytest.mark.parametrize("mask_value", [0, 1])
def test_multi_head_attention_mask(mask_value):
    batch_size, seq_len, d_model = 2, 10, 512
    mha = MultiHeadAttention(d_model=d_model)
    x = torch.randn(batch_size, seq_len, d_model)
    mask = torch.ones(batch_size, 1, seq_len, seq_len)
    mask[:, :, 0, 0] = mask_value
    
    _, attention = mha(x, x, x, mask)
    
    if mask_value == 0:
        assert torch.allclose(attention[:, :, :, 0], torch.zeros_like(attention[:, :, :, 0]))
    else:
        assert not torch.allclose(attention[:, :, :, 0], torch.zeros_like(attention[:, :, :, 0]))
