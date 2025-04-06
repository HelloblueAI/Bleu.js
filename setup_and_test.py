import os
import subprocess


def run_command(command):
    """Run a shell command and return its output."""
    print(f"Running: {command}")
    result = subprocess.run(command.split(), capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    print(result.stdout)
    return True


# Remove old virtual environment
run_command("rm -rf .venv")

# Create new virtual environment with Python 3.9
run_command("/opt/homebrew/opt/python@3.9/bin/python3.9 -m venv .venv")

# Activate virtual environment and install TensorFlow
venv_python = os.path.join(".venv", "bin", "python")
run_command(f"{venv_python} -m pip install tensorflow-macos tensorflow-metal")

# Run test script
run_command(f"{venv_python} test_tensorflow.py")
