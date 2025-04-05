import math

import torch
import torch.nn as nn


class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int = 512, num_heads: int = 8, dropout: float = 0.1):
        super().__init__()
        assert d_model % num_heads == 0, "d_model must be divisible by num_heads"

        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

        self.dropout = nn.Dropout(dropout)
        self.scale = math.sqrt(self.d_k)

    def forward(self, query, key, value, mask=None):
        batch_size = query.size(0)

        Q = (
            self.W_q(query)
            .view(batch_size, -1, self.num_heads, self.d_k)
            .transpose(1, 2)
        )
        K = self.W_k(key).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = (
            self.W_v(value)
            .view(batch_size, -1, self.num_heads, self.d_k)
            .transpose(1, 2)
        )

        scores = torch.matmul(Q, K.transpose(-2, -1)) / self.scale

        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)

        # Apply softmax and dropout
        attention = torch.softmax(scores, dim=-1)
        attention = self.dropout(attention)
        # Normalize to ensure sum is exactly 1
        attention = attention / attention.sum(dim=-1, keepdim=True)

        context = torch.matmul(attention, V)
        context = (
            context.transpose(1, 2).contiguous().view(batch_size, -1, self.d_model)
        )

        output = self.W_o(context)
        return output, attention
