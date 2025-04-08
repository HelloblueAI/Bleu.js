#!/usr/bin/env fish

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate.fish

# Install TensorFlow and dependencies
pip install tensorflow numpy

# Run test script
python test_tensorflow.py
