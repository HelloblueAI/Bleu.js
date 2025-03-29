"""
Simple test script to verify Python version and package installations.
"""

import sys
print(f"Python version: {sys.version}")

try:
    import tensorflow as tf
    print(f"TensorFlow version: {tf.__version__}")
except ImportError as e:
    print(f"TensorFlow error: {e}")

try:
    import torch
    print(f"PyTorch version: {torch.__version__}")
except ImportError as e:
    print(f"PyTorch error: {e}")

try:
    import fastapi
    print(f"FastAPI version: {fastapi.__version__}")
except ImportError as e:
    print(f"FastAPI error: {e}") 