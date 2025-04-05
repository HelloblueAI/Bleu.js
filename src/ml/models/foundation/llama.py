#  Copyright (c) 2025, Helloblue Inc.
#  Open-Source Community Edition

#  Permission is hereby granted, free of charge, to any person obtaining a copy
#  of this software and associated documentation files (the "Software"), to use,
#  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
#  the Software, subject to the following conditions:

#  1. The above copyright notice and this permission notice shall be included in
#     all copies or substantial portions of the Software.
#  2. Contributions to this project are welcome and must adhere to the project's
#     contribution guidelines.
#  3. The name "Helloblue Inc." and its contributors may not be used to endorse
#     or promote products derived from this software without prior written consent.

#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
#  THE SOFTWARE.

from dataclasses import dataclass
from typing import Tuple

import torch
import torch.nn as nn


@dataclass
class LlamaConfig:
    vocab_size: int = 32000
    hidden_size: int = 4096
    intermediate_size: int = 11008
    num_hidden_layers: int = 32
    num_attention_heads: int = 32
    max_position_embeddings: int = 4096
    rms_norm_eps: float = 1e-6
    initializer_range: float = 0.02
    use_cache: bool = True
    pad_token_id: int = 0
    bos_token_id: int = 1
    eos_token_id: int = 2
    tie_word_embeddings: bool = False


class LlamaRotaryEmbedding(nn.Module):
    def __init__(
        self, dim: int, max_position_embeddings: int = 4096, base: int = 10000
    ):
        super().__init__()
        self.dim = dim
        self.max_position_embeddings = max_position_embeddings

        inv_freq = 1.0 / (base ** (torch.arange(0, dim, 2).float() / dim))
        self.register_buffer("inv_freq", inv_freq)

    def forward(
        self, seq_len: int, device: torch.device
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        t = torch.arange(seq_len, device=device).type_as(self.inv_freq)
        freqs = torch.einsum("i,j->ij", t, self.inv_freq)
        emb = torch.cat((freqs, freqs), dim=-1).to(device)
        cos_emb, sin_emb = emb.cos(), emb.sin()

        # Ensure correct dimensions for broadcasting
        cos_emb = cos_emb.unsqueeze(0).unsqueeze(0)  # Shape: (1, 1, seq_len, dim)
        sin_emb = sin_emb.unsqueeze(0).unsqueeze(0)
        return cos_emb, sin_emb


class LlamaAttention(nn.Module):
    def __init__(self, config: LlamaConfig):
        super().__init__()
        self.num_heads = config.num_attention_heads
        self.hidden_size = config.hidden_size
        self.head_dim = self.hidden_size // self.num_heads

        self.q_proj = nn.Linear(self.hidden_size, self.hidden_size, bias=False)
        self.k_proj = nn.Linear(self.hidden_size, self.hidden_size, bias=False)
        self.v_proj = nn.Linear(self.hidden_size, self.hidden_size, bias=False)
        self.out_proj = nn.Linear(self.hidden_size, self.hidden_size, bias=False)

        self.rotary_embedding = LlamaRotaryEmbedding(
            self.head_dim, config.max_position_embeddings
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        batch_size, seq_len, _ = x.shape
        q, k, v = self.q_proj(x), self.k_proj(x), self.v_proj(x)

        q = q.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        k = k.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        v = v.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)

        cos, sin = self.rotary_embedding(seq_len, x.device)
        q, k = self.apply_rotary_embedding(q, k, cos, sin)

        attn_weights = torch.matmul(q, k.transpose(-2, -1)) / (self.head_dim**0.5)
        attn_weights = torch.nn.functional.softmax(attn_weights, dim=-1)
        attn_output = torch.matmul(attn_weights, v)
        attn_output = attn_output.transpose(1, 2).reshape(
            batch_size, seq_len, self.hidden_size
        )

        return self.out_proj(attn_output)

    @staticmethod
    def apply_rotary_embedding(q, k, cos, sin):
        q_real, q_imag = q.chunk(2, dim=-1)
        k_real, k_imag = k.chunk(2, dim=-1)

        q_rot = torch.cat(
            [
                q_real * cos[..., : q_real.shape[-1]]
                - q_imag * sin[..., : q_imag.shape[-1]],
                q_imag * cos[..., : q_imag.shape[-1]]
                + q_real * sin[..., : q_real.shape[-1]],
            ],
            dim=-1,
        )
        k_rot = torch.cat(
            [
                k_real * cos[..., : k_real.shape[-1]]
                - k_imag * sin[..., : k_imag.shape[-1]],
                k_imag * cos[..., : k_imag.shape[-1]]
                + k_real * sin[..., : k_real.shape[-1]],
            ],
            dim=-1,
        )
        return q_rot, k_rot


if __name__ == "__main__":
    config = LlamaConfig()
    model = LlamaAttention(config)
    dummy_input = torch.randn(1, 512, config.hidden_size)
    output = model(dummy_input)
    print("✅ LLaMA Attention Output Shape:", output.shape)
