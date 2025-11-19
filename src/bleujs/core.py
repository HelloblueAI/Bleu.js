"""
Core BleuJS functionality
"""

import logging
from typing import Any, Dict, Optional, Union
import numpy as np

logger = logging.getLogger(__name__)


class BleuJS:
    """
    Main BleuJS class for quantum-enhanced AI processing.
    
    Args:
        quantum_mode (bool): Enable quantum computing features
        model_path (str): Path to trained model (optional)
        device (str): Computing device ('cuda' or 'cpu')
        
    Example:
        >>> bleu = BleuJS(quantum_mode=True, device='cuda')
        >>> result = bleu.process({'data': [1, 2, 3]})
    """
    
    def __init__(
        self,
        quantum_mode: bool = False,
        model_path: Optional[str] = None,
        device: str = "cpu",
        **kwargs
    ):
        """Initialize BleuJS with optional quantum features."""
        self.quantum_mode = quantum_mode
        self.model_path = model_path
        self.device = device
        self.config = kwargs
        
        logger.info(f"Initialized BleuJS v1.2.1")
        logger.info(f"Quantum mode: {quantum_mode}")
        logger.info(f"Device: {device}")
        
        if quantum_mode:
            try:
                from .quantum import QuantumFeatureExtractor
                self.quantum_extractor = QuantumFeatureExtractor()
                logger.info("✅ Quantum features enabled")
            except ImportError:
                logger.warning("⚠️ Quantum dependencies not installed. Install with: pip install 'bleu-js[quantum]'")
                self.quantum_extractor = None
        else:
            self.quantum_extractor = None
    
    def process(
        self,
        input_data: Union[Dict, np.ndarray, list],
        quantum_features: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Process input data with optional quantum enhancement.
        
        Args:
            input_data: Input data to process
            quantum_features: Enable quantum feature extraction
            **kwargs: Additional processing options
            
        Returns:
            Dict containing processed results
            
        Example:
            >>> bleu = BleuJS()
            >>> result = bleu.process({'data': [1, 2, 3]})
            >>> print(result['status'])
            'success'
        """
        logger.info("Processing input data...")
        
        try:
            # Convert input to numpy array if possible
            if isinstance(input_data, dict):
                data = input_data.get('data', input_data)
            elif isinstance(input_data, list):
                data = np.array(input_data)
            else:
                data = input_data
            
            # Apply quantum features if enabled
            if quantum_features and self.quantum_mode and self.quantum_extractor:
                logger.info("Applying quantum feature extraction...")
                quantum_output = self.quantum_extractor.extract(data)
                enhanced_data = quantum_output
            else:
                enhanced_data = data
            
            # Process data
            results = {
                'status': 'success',
                'processed_data': enhanced_data,
                'quantum_enhanced': quantum_features and self.quantum_mode,
                'device': self.device,
                'version': '1.2.1',
            }
            
            # Add metadata
            if isinstance(enhanced_data, np.ndarray):
                results['shape'] = enhanced_data.shape
                results['dtype'] = str(enhanced_data.dtype)
            
            logger.info("✅ Processing complete")
            return results
            
        except Exception as e:
            logger.error(f"❌ Error processing data: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'version': '1.2.1',
            }
    
    def __repr__(self) -> str:
        return f"BleuJS(quantum_mode={self.quantum_mode}, device='{self.device}')"

