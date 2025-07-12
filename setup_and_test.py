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


def setup_environment():
    """Set up the Python environment and install dependencies."""
    # Remove old virtual environment
    run_command("rm -rf .venv")

    # Create new virtual environment
    python_version = "3.10"  # Using Python 3.10 as specified in CI
    run_command(f"python{python_version} -m venv .venv")

    # Activate virtual environment and install dependencies
    venv_python = os.path.join(".venv", "bin", "python")
    run_command(f"{venv_python} -m pip install --upgrade pip")
    run_command(f"{venv_python} -m pip install poetry==1.7.1")
    run_command(
        f"{venv_python} -m poetry install --no-interaction --no-root --with dev"
    )

    # Install quantum-specific dependencies
    run_command(
        f"{venv_python} -m pip install qiskit==1.1.0 qiskit-aer==0.13.0 cirq==1.3.0"
    )


def run_tests():
    """Run all tests and checks."""
    venv_python = os.path.join(".venv", "bin", "python")

    # Run tests with coverage
    print("\nRunning tests with coverage...")
    run_command(
        f"{venv_python} -m pytest --cov=./ --cov-report=term-missing "
        f"src/python/ml/computer_vision/test_quantum_fusion.py "
        f"src/python/ml/computer_vision/test_quantum_vision.py"
    )

    # Run linting checks
    print("\nRunning linting checks...")
    run_command(f"{venv_python} -m black . --check")
    run_command(f"{venv_python} -m isort . --check-only")
    run_command(f"{venv_python} -m flake8 .")
    run_command(f"{venv_python} -m mypy .")
    run_command(f"{venv_python} -m bandit -r .")


if __name__ == "__main__":
    print("Setting up environment...")
    setup_environment()

    print("\nRunning tests and checks...")
    run_tests()

    print("\nAll checks completed!")
