import pytest
import numpy as np
from unittest.mock import Mock, patch
from .xgboost_quantum_hybrid import XGBoostQuantumHybrid, HybridConfig
from ..processor import QuantumProcessor

@pytest.fixture
def sample_data():
    """Generate sample data for testing"""
    np.random.seed(42)
    X = np.random.randn(100, 10)  # 100 samples, 10 features
    y = np.random.randint(0, 2, 100)  # Binary classification
    return X, y

@pytest.fixture
def mock_quantum_processor():
    """Create a mock quantum processor"""
    processor = Mock(spec=QuantumProcessor)
    processor.process_features = Mock(return_value=np.random.randn(100, 3))
    return processor

@pytest.fixture
def hybrid_model(mock_quantum_processor):
    """Create a hybrid model instance with mock quantum processor"""
    config = HybridConfig(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=3,
        quantum_feature_ratio=0.3,
        n_qubits=2,
        n_layers=1
    )
    return XGBoostQuantumHybrid(config=config, quantum_processor=mock_quantum_processor)

@pytest.mark.asyncio
async def test_initialization(hybrid_model):
    """Test model initialization"""
    assert hybrid_model.config is not None
    assert hybrid_model.quantum_processor is not None
    assert hybrid_model.xgb_trainer is not None
    assert hybrid_model.enhanced_xgb is not None
    assert hybrid_model.quantum_circuit is not None
    assert hybrid_model.scaler is not None

@pytest.mark.asyncio
async def test_preprocess_features(hybrid_model, sample_data):
    """Test feature preprocessing"""
    X, y = sample_data
    
    # Test without feature importance
    X_processed, y_processed = await hybrid_model.preprocess_features(X, y)
    assert X_processed.shape[0] == X.shape[0]
    assert y_processed is not None
    
    # Test with feature importance
    hybrid_model.feature_importance = np.random.rand(X.shape[1])
    X_processed, y_processed = await hybrid_model.preprocess_features(X, y)
    assert X_processed.shape[0] == X.shape[0]
    assert y_processed is not None

@pytest.mark.asyncio
async def test_train(hybrid_model, sample_data):
    """Test model training"""
    X, y = sample_data
    
    # Mock enhanced XGBoost fit method
    async def mock_fit(*args, **kwargs):
        return {'accuracy': 0.85, 'roc_auc': 0.9}
    hybrid_model.enhanced_xgb.fit = mock_fit
    
    # Train model
    metrics = await hybrid_model.train(X, y, validation_split=0.2)
    
    assert isinstance(metrics, dict)
    assert 'accuracy' in metrics
    assert 'roc_auc' in metrics

@pytest.mark.asyncio
async def test_predict(hybrid_model, sample_data):
    """Test model prediction"""
    X, _ = sample_data
    
    # Mock enhanced XGBoost predict methods
    hybrid_model.enhanced_xgb.predict = Mock(return_value=np.random.randint(0, 2, X.shape[0]))
    hybrid_model.enhanced_xgb.predict_proba = Mock(return_value=np.random.rand(X.shape[0], 2))
    
    # Test regular predictions
    predictions = await hybrid_model.predict(X, return_proba=False)
    assert predictions.shape[0] == X.shape[0]
    assert np.all((predictions == 0) | (predictions == 1))
    
    # Test probability predictions
    predictions_proba = await hybrid_model.predict(X, return_proba=True)
    assert predictions_proba.shape[0] == X.shape[0]
    assert np.all((predictions_proba >= 0) & (predictions_proba <= 1))

@pytest.mark.asyncio
async def test_optimize_hyperparameters(hybrid_model, sample_data):
    """Test hyperparameter optimization"""
    X, y = sample_data
    
    # Mock enhanced XGBoost optimize_hyperparameters method
    async def mock_optimize(*args, **kwargs):
        return {
            'n_estimators': 100,
            'learning_rate': 0.1,
            'max_depth': 3
        }
    hybrid_model.enhanced_xgb.optimize_hyperparameters = mock_optimize
    
    # Optimize hyperparameters
    best_params = await hybrid_model.optimize_hyperparameters(X, y, n_trials=10)
    
    assert isinstance(best_params, dict)
    assert 'n_estimators' in best_params
    assert 'learning_rate' in best_params
    assert 'max_depth' in best_params

def test_get_feature_importance(hybrid_model):
    """Test feature importance retrieval"""
    # Test without feature importance
    with pytest.raises(ValueError):
        hybrid_model.get_feature_importance()
    
    # Test with feature importance
    hybrid_model.feature_importance = {'feature_1': 0.5, 'feature_2': 0.3}
    importance = hybrid_model.get_feature_importance()
    assert isinstance(importance, dict)
    assert len(importance) == 2
    assert importance['feature_1'] == 0.5

@pytest.mark.asyncio
async def test_error_handling(hybrid_model, sample_data):
    """Test error handling in various methods"""
    X, y = sample_data
    
    # Test training error
    hybrid_model.enhanced_xgb.fit = Mock(side_effect=Exception("Training error"))
    with pytest.raises(Exception):
        await hybrid_model.train(X, y)
    
    # Test prediction error
    hybrid_model.enhanced_xgb.predict = Mock(side_effect=Exception("Prediction error"))
    with pytest.raises(Exception):
        await hybrid_model.predict(X)
    
    # Test optimization error
    hybrid_model.enhanced_xgb.optimize_hyperparameters = Mock(side_effect=Exception("Optimization error"))
    with pytest.raises(Exception):
        await hybrid_model.optimize_hyperparameters(X, y) 