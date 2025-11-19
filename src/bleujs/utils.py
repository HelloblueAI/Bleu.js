"""
Utility functions for Bleu.js
"""

import logging
import sys
from typing import Optional


def setup_logging(level: int = logging.INFO) -> None:
    """
    Setup logging configuration.
    
    Args:
        level: Logging level (default: INFO)
    """
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )


def get_device() -> str:
    """
    Detect and return the best available computing device.
    
    Returns:
        str: 'cuda' if CUDA-capable GPU is available, otherwise 'cpu'
        
    Example:
        >>> device = get_device()
        >>> print(f"Using device: {device}")
    """
    try:
        import torch
        if torch.cuda.is_available():
            return 'cuda'
    except ImportError:
        pass
    
    return 'cpu'


def check_dependencies(group: str = 'core') -> dict:
    """
    Check if required dependencies are installed.
    
    Args:
        group: Dependency group to check ('core', 'quantum', 'ml', 'all')
        
    Returns:
        dict: Status of each dependency
        
    Example:
        >>> status = check_dependencies('quantum')
        >>> print(status)
    """
    dependencies = {
        'core': ['numpy', 'pandas'],
        'quantum': ['qiskit', 'pennylane'],
        'ml': ['torch', 'tensorflow', 'xgboost'],
    }
    
    if group == 'all':
        check_list = [dep for deps in dependencies.values() for dep in deps]
    else:
        check_list = dependencies.get(group, [])
    
    status = {}
    for dep in check_list:
        try:
            __import__(dep)
            status[dep] = 'installed'
        except ImportError:
            status[dep] = 'missing'
    
    return status


def format_results(results: dict, pretty: bool = True) -> str:
    """
    Format processing results for display.
    
    Args:
        results: Results dictionary
        pretty: Use pretty formatting
        
    Returns:
        str: Formatted results
    """
    if pretty:
        import json
        return json.dumps(results, indent=2, default=str)
    return str(results)
