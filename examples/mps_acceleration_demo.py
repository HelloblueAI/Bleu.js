"""
Example demonstrating PyTorch with MPS (Metal Performance Shaders) acceleration on Mac.

This example shows:
1. How to check for MPS availability
2. How to move models and tensors to MPS device
3. Performance comparison between CPU and MPS
"""

import time

import torch
import torch.nn as nn
import torch.optim as optim


class SimpleNN(nn.Module):
    def __init__(self):
        super(SimpleNN, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(100, 256),
            nn.ReLU(),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 10),
        )

    def forward(self, x):
        return self.layers(x)


def train_model(model, device, num_iterations=1000):
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-5)

    start_time = time.time()

    for i in range(num_iterations):
        # Generate random data
        inputs = torch.randn(32, 100).to(device)
        targets = torch.randn(32, 10).to(device)

        # Forward pass
        outputs = model(inputs)
        loss = criterion(outputs, targets)

        # Backward pass and optimize
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        if (i + 1) % 100 == 0:
            print(f"Iteration [{i+1}/{num_iterations}], Loss: {loss.item():.4f}")

    end_time = time.time()
    return end_time - start_time


def main():
    # Check MPS availability
    print("MPS (Apple Metal) available:", torch.backends.mps.is_available())
    print("MPS built:", torch.backends.mps.is_built())

    # Set device
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print("Using device:", device)

    # Create model instances for CPU and device comparison
    model_cpu = SimpleNN()
    model_device = SimpleNN().to(device)

    print("\nTraining on CPU...")
    cpu_time = train_model(model_cpu, "cpu")

    print("\nTraining on device...")
    device_time = train_model(model_device, device)

    print("\nResults:")
    print(f"CPU Training Time: {cpu_time:.2f} seconds")
    print(f"Device Training Time: {device_time:.2f} seconds")
    print(f"Speedup: {cpu_time/device_time:.2f}x")


if __name__ == "__main__":
    main()
