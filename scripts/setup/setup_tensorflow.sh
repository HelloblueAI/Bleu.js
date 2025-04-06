#!/bin/bash

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install TensorFlow and dependencies
pip install tensorflow-macos tensorflow-metal numpy

# Run test script
python test_tensorflow.py
