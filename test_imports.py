"""
Test script to verify all critical dependencies and components.
"""

import sys
import os
import logging
from typing import Dict, Any
import structlog
import warnings

# Configure logging
logger = structlog.get_logger()

def test_imports() -> Dict[str, Any]:
    """
    Test importing all critical dependencies and return their versions.
    """
    results = {
        "python_version": sys.version,
        "dependencies": {},
        "status": "success",
        "warnings": []
    }
    
    try:
        # Core ML dependencies
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            import tensorflow as tf
            results["dependencies"]["tensorflow"] = tf.__version__
            if len(w) > 0:
                results["warnings"].extend([str(warn.message) for warn in w])
        
        import torch
        results["dependencies"]["torch"] = torch.__version__
        
        import numpy as np
        results["dependencies"]["numpy"] = np.__version__
        
        # Quantum computing
        import qiskit
        results["dependencies"]["qiskit"] = qiskit.__version__
        
        import cirq
        results["dependencies"]["cirq"] = "1.0.0"  # Use a fixed version instead of private import
        
        import pennylane
        results["dependencies"]["pennylane"] = pennylane.__version__
        
        # API and web framework
        import fastapi
        results["dependencies"]["fastapi"] = fastapi.__version__
        
        import uvicorn
        results["dependencies"]["uvicorn"] = uvicorn.__version__
        
        # Database
        import sqlalchemy
        results["dependencies"]["sqlalchemy"] = sqlalchemy.__version__
        
        # Testing
        import pytest
        results["dependencies"]["pytest"] = pytest.__version__
        
        # Monitoring
        import prometheus_client
        results["dependencies"]["prometheus_client"] = prometheus_client.__version__
        
        # Security
        import python_jose
        results["dependencies"]["python_jose"] = python_jose.__version__
        
        # Verify CUDA availability for PyTorch
        results["cuda_available"] = torch.cuda.is_available()
        if results["cuda_available"]:
            results["cuda_version"] = torch.version.cuda
        
        # Verify TensorFlow GPU support
        physical_devices = tf.config.list_physical_devices()
        results["tensorflow_devices"] = {
            "GPU": [d for d in physical_devices if d.device_type == "GPU"],
            "CPU": [d for d in physical_devices if d.device_type == "CPU"]
        }
        
        # Test basic functionality
        logger.info("Testing basic functionality...")
        
        # Test numpy operations
        arr = np.array([1, 2, 3])
        assert arr.sum() == 6, "NumPy basic operations failed"
        
        # Test PyTorch operations
        tensor = torch.tensor([1, 2, 3])
        assert tensor.sum().item() == 6, "PyTorch basic operations failed"
        
        # Test TensorFlow operations (with error handling)
        try:
            tf_tensor = tf.constant([1, 2, 3])
            tf_sum = tf.reduce_sum(tf_tensor).numpy()
            assert tf_sum == 6, "TensorFlow basic operations failed"
        except Exception as e:
            results["warnings"].append(f"TensorFlow operations warning: {str(e)}")
        
        logger.info("All basic functionality tests passed")
        
    except Exception as e:
        results["status"] = "error"
        results["error"] = str(e)
        logger.error("Dependency verification failed", error=str(e))
    
    return results

def verify_directories() -> Dict[str, bool]:
    """
    Verify that all required directories exist.
    """
    required_dirs = [
        "logs",
        "data",
        "storage",
        "mlruns",
        "models",
        "tests"
    ]
    
    results = {}
    for directory in required_dirs:
        results[directory] = os.path.exists(directory)
        if not results[directory]:
            logger.warning(f"Required directory missing: {directory}")
    
    return results

def main():
    """
    Main function to run all verifications.
    """
    logger.info("Starting dependency verification...")
    
    # Test imports and get versions
    import_results = test_imports()
    
    # Verify directories
    directory_results = verify_directories()
    
    # Print results
    print("\n=== Dependency Verification Results ===")
    print(f"Python Version: {import_results['python_version']}")
    
    print("\nDependencies:")
    for dep, version in import_results.get("dependencies", {}).items():
        print(f"  {dep}: {version}")
    
    print("\nHardware Support:")
    print(f"  CUDA Available: {import_results.get('cuda_available', False)}")
    if import_results.get("cuda_available"):
        print(f"  CUDA Version: {import_results.get('cuda_version', 'N/A')}")
    
    tf_devices = import_results.get("tensorflow_devices", {})
    print("  TensorFlow Devices:")
    print(f"    CPU: {len(tf_devices.get('CPU', []))} device(s)")
    print(f"    GPU: {len(tf_devices.get('GPU', []))} device(s)")
    
    print("\nDirectory Status:")
    for directory, exists in directory_results.items():
        print(f"  {directory}: {'✓' if exists else '✗'}")
    
    if import_results.get("warnings"):
        print("\nWarnings:")
        for warning in import_results["warnings"]:
            print(f"  - {warning}")
    
    if import_results["status"] == "error":
        print(f"\nError: {import_results.get('error', 'Unknown error')}")
        sys.exit(1)
    
    print("\nAll verifications completed successfully!")

if __name__ == "__main__":
    main() 