import os
import subprocess
import sys

import tensorflow as tf


def setup_environment():
    # Remove old virtual environment
    if os.path.exists(".venv"):
        subprocess.run(["rm", "-rf", ".venv"])

    # Create new virtual environment with Python 3.9
    subprocess.run(
        ["/opt/homebrew/opt/python@3.9/bin/python3.9", "-m", "venv", ".venv"]
    )

    # Get the path to the virtual environment's Python
    venv_python = os.path.join(".venv", "bin", "python")

    # Install TensorFlow
    subprocess.run(
        [venv_python, "-m", "pip", "install", "tensorflow-macos", "tensorflow-metal"]
    )

    return venv_python


def test_tensorflow():
    print(f"TensorFlow version: {tf.__version__}")
    print(f"Python executable: {os.path.realpath(sys.executable)}")
    print("Num GPUs Available: ", len(tf.config.list_physical_devices("GPU")))


if __name__ == "__main__":
    # Setup environment
    venv_python = setup_environment()

    # Run the test in the virtual environment
    subprocess.run(
        [
            venv_python,
            "-c",
            """
import tensorflow as tf
print(f"TensorFlow version: {tf.__version__}")
print(f"Python executable: {os.path.realpath(sys.executable)}")
print("Num GPUs Available: ", len(tf.config.list_physical_devices("GPU")))
""",
        ]
    )
