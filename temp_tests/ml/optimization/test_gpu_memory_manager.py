"""Tests for quantum-aware GPU memory manager."""

import pytest
import torch
from unittest.mock import MagicMock, patch

from src.ml.optimization.gpu_memory_manager import (
    MemoryBlock,
    QuantumGPUManager
)

@pytest.fixture
def mock_gpu_utils():
    """Mock GPU utilities."""
    with patch('GPUtil.getAvailable') as mock_available:
        mock_available.return_value = [0, 1]  # Mock two available GPUs
        yield mock_available

@pytest.fixture
def mock_torch_cuda():
    """Mock torch.cuda functionality."""
    with patch('torch.cuda') as mock_cuda:
        # Mock device properties
        mock_props = MagicMock()
        mock_props.total_memory = 1024 * 1024 * 1024  # 1GB
        mock_cuda.get_device_properties.return_value = mock_props
        
        # Mock memory functions
        mock_cuda.memory.memory_allocated.return_value = 0
        mock_cuda.memory.memory_reserved.return_value = 0
        
        yield mock_cuda

@pytest.fixture
def manager(mock_gpu_utils, mock_torch_cuda):
    """Create GPU manager instance."""
    return QuantumGPUManager(
        devices=[0, 1],
        quantum_reserve=0.2,
        cache_size=1024 * 1024 * 1024
    )

def test_initialization(manager):
    """Test manager initialization."""
    assert len(manager.devices) == 2
    assert manager.quantum_reserve == 0.2
    assert manager.cache_size == 1024 * 1024 * 1024
    assert len(manager.memory_blocks) == 0
    assert len(manager.device_stats) == 2
    assert len(manager.quantum_allocations) == 0

def test_device_initialization(manager):
    """Test device statistics initialization."""
    for device in manager.devices:
        stats = manager.device_stats[device]
        assert 'total_memory' in stats
        assert 'reserved_quantum' in stats
        assert 'allocated' in stats
        assert 'cached' in stats
        assert 'fragmentation' in stats
        assert stats['reserved_quantum'] == int(stats['total_memory'] * 0.2)

def test_memory_allocation(manager):
    """Test memory allocation."""
    # Regular allocation
    handle = manager.allocate(1024 * 1024)  # 1MB
    assert handle is not None
    assert handle in manager.memory_blocks
    assert manager.memory_blocks[handle].size == 1024 * 1024
    assert not manager.memory_blocks[handle].is_quantum
    
    # Quantum allocation
    quantum_handle = manager.allocate(1024 * 1024, is_quantum=True)
    assert quantum_handle is not None
    assert quantum_handle in manager.quantum_allocations
    assert manager.memory_blocks[quantum_handle].is_quantum

def test_memory_free(manager):
    """Test memory freeing."""
    handle = manager.allocate(1024 * 1024)
    initial_allocated = manager.device_stats[0]['allocated']
    
    manager.free(handle)
    assert handle not in manager.memory_blocks
    assert manager.device_stats[0]['allocated'] < initial_allocated

def test_best_device_selection(manager):
    """Test device selection logic."""
    # Allocate memory on device 0
    manager.device_stats[0]['allocated'] = 800 * 1024 * 1024  # 800MB
    
    # Regular allocation should prefer device 1
    handle = manager.allocate(100 * 1024 * 1024)  # 100MB
    assert manager.memory_blocks[handle].device == 1
    
    # Quantum allocation with high memory on device 1
    manager.device_stats[1]['allocated'] = 900 * 1024 * 1024  # 900MB
    quantum_handle = manager.allocate(50 * 1024 * 1024, is_quantum=True)
    assert quantum_handle is not None
    assert manager.memory_blocks[quantum_handle].device == 0

def test_memory_compaction(manager):
    """Test memory compaction."""
    # Create fragmented memory
    handles = []
    for _ in range(10):
        handle = manager.allocate(1024 * 1024)  # 1MB each
        handles.append(handle)
    
    # Free every other block to create fragmentation
    for i in range(0, len(handles), 2):
        manager.free(handles[i])
    
    # Check fragmentation and trigger compaction
    device = manager.devices[0]
    initial_fragmentation = manager.device_stats[device]['fragmentation']
    manager._compact_memory(device)
    assert manager.device_stats[device]['fragmentation'] <= initial_fragmentation

def test_quantum_reservation(manager):
    """Test quantum memory reservation."""
    device = manager.devices[0]
    quantum_reserve = manager.device_stats[device]['reserved_quantum']
    
    # Try to allocate more than available non-quantum memory
    large_size = manager.device_stats[device]['total_memory'] - quantum_reserve + 1
    handle = manager.allocate(large_size, is_quantum=False)
    assert handle is None  # Should fail to preserve quantum reservation
    
    # Quantum allocation should be able to use reserved memory
    quantum_handle = manager.allocate(quantum_reserve - 1024, is_quantum=True)
    assert quantum_handle is not None

def test_error_handling(manager):
    """Test error handling."""
    # Invalid device
    handle = manager.allocate(1024, device=999)
    assert handle is None
    
    # Invalid size
    handle = manager.allocate(-1024)
    assert handle is None
    
    # Invalid handle free
    manager.free(999999)  # Should not raise error

def test_memory_info(manager):
    """Test memory info reporting."""
    # Allocate some memory
    regular_handle = manager.allocate(1024 * 1024)
    quantum_handle = manager.allocate(1024 * 1024, is_quantum=True)
    
    info = manager.get_memory_info()
    
    for device in manager.devices:
        device_info = info[f"device_{device}"]
        assert 'total' in device_info
        assert 'allocated' in device_info
        assert 'cached' in device_info
        assert 'free' in device_info
        assert 'fragmentation' in device_info
        assert 'quantum_reserved' in device_info
        assert 'quantum_blocks' in device_info
        
        if device == manager.memory_blocks[quantum_handle].device:
            assert device_info['quantum_blocks'] == 1

def test_cleanup(manager):
    """Test cleanup on deletion."""
    handles = []
    for _ in range(5):
        handle = manager.allocate(1024 * 1024)
        handles.append(handle)
    
    manager.__del__()
    
    # All blocks should be freed
    assert len(manager.memory_blocks) == 0
    assert len(manager.quantum_allocations) == 0
    for device in manager.devices:
        assert manager.device_stats[device]['allocated'] == 0

@pytest.mark.skipif(not torch.cuda.is_available(), reason="CUDA not available")
def test_real_gpu_allocation():
    """Test allocation on real GPU if available."""
    real_manager = QuantumGPUManager()
    
    # Try small allocation
    handle = real_manager.allocate(1024 * 1024)  # 1MB
    assert handle is not None
    
    # Free memory
    real_manager.free(handle)
    
    # Try quantum allocation
    quantum_handle = real_manager.allocate(1024 * 1024, is_quantum=True)
    assert quantum_handle is not None
    assert quantum_handle in real_manager.quantum_allocations 