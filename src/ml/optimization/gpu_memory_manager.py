"""
Quantum-Aware GPU Memory Manager
Implements intelligent GPU memory management with quantum state awareness
and dynamic optimization.
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Set

import torch

logger = logging.getLogger(__name__)


@dataclass
class MemoryBlock:
    """Represents a block of GPU memory"""

    handle: int
    size: int
    device: int
    is_quantum: bool
    timestamp: float
    in_use: bool


class QuantumGPUManager:
    """
    Advanced GPU memory manager with quantum state awareness
    and dynamic optimization.
    """

    def __init__(
        self,
        devices: Optional[List[int]] = None,
        quantum_reserve: float = 0.2,
        cache_size: int = 1024 * 1024 * 1024,  # 1GB default cache
    ):
        """Initialize the quantum-aware GPU memory manager."""
        if devices is None:
            self.devices = [0]  # Default to first GPU
        else:
            self.devices = devices

        self.quantum_reserve = quantum_reserve
        self.cache_size = cache_size
        self.memory_blocks: Dict[int, MemoryBlock] = {}
        self.quantum_allocations: Set[int] = set()
        self.next_handle = 1

        # Initialize device statistics
        self.device_stats = {}
        for device in self.devices:
            try:
                total_memory = torch.cuda.get_device_properties(device).total_memory
                self.device_stats[device] = {
                    "total_memory": total_memory,
                    "reserved_quantum": int(total_memory * quantum_reserve),
                    "allocated": 0,
                    "cached": 0,
                    "fragmentation": 0.0,
                }
            except Exception as e:
                logger.error(f"Failed to initialize device {device}: {str(e)}")
                # Use mock values for testing
                self.device_stats[device] = {
                    "total_memory": 8 * 1024 * 1024 * 1024,  # 8GB
                    "reserved_quantum": int(8 * 1024 * 1024 * 1024 * quantum_reserve),
                    "allocated": 0,
                    "cached": 0,
                    "fragmentation": 0.0,
                }

    def allocate(
        self, size: int, device: Optional[int] = None, is_quantum: bool = False
    ) -> Optional[int]:
        """Allocate memory block."""
        if size <= 0:
            logger.error("Invalid allocation size")
            return None

        # Select best device if none specified
        if device is None:
            device = self._select_best_device(size, is_quantum)
            if device is None:
                logger.warning("No suitable device found for allocation")
                return None

        # Validate device
        if device not in self.devices:
            logger.error(f"Memory allocation failed: {device}")
            return None

        # Check if enough memory is available
        available = self._get_available_memory(device, is_quantum)
        if size > available:
            logger.warning(f"Not enough memory available on device {device}")
            return None

        # Create memory block
        handle = self._generate_handle()
        block = MemoryBlock(
            handle=handle, size=size, device=device, is_quantum=is_quantum
        )

        # Update device stats
        self.device_stats[device]["allocated"] += size
        self.memory_blocks[handle] = block

        if is_quantum:
            self.quantum_allocations.add(handle)

        return handle

    def free(self, handle: int) -> None:
        """Free allocated memory block."""
        if handle in self.memory_blocks:
            block = self.memory_blocks[handle]
            self.device_stats[block.device]["allocated"] -= block.size

            if block.is_quantum:
                self.quantum_allocations.remove(handle)

            del self.memory_blocks[handle]

    def _select_best_device(self, size: int, is_quantum: bool) -> Optional[int]:
        """Select the best device for allocation."""
        best_device = None
        max_available = 0

        for device in self.devices:
            available = self._get_available_memory(device, is_quantum)
            if available > max_available:
                max_available = available
                best_device = device

        return best_device if max_available >= size else None

    def _get_available_memory(self, device: int, is_quantum: bool) -> int:
        """Get available memory on device."""
        stats = self.device_stats[device]
        total = stats["total_memory"]
        allocated = stats["allocated"]

        if is_quantum:
            # Quantum allocations can use reserved memory
            return total - allocated
        else:
            # Non-quantum allocations must preserve quantum reservation
            return total - allocated - stats["reserved_quantum"]

    def _generate_handle(self) -> int:
        """Generate unique handle for memory block."""
        handle = self.next_handle
        self.next_handle += 1
        return handle

    def _compact_memory(self, device: int) -> None:
        """Compact memory to reduce fragmentation."""
        blocks = [b for b in self.memory_blocks.values() if b.device == device]
        blocks.sort(key=lambda x: x.size)

        total_allocated = sum(block.size for block in blocks)
        if total_allocated == 0:
            self.device_stats[device]["fragmentation"] = 0.0
            return

        # Calculate fragmentation
        max_block = max(block.size for block in blocks)
        fragmentation = 1.0 - (max_block / total_allocated)
        self.device_stats[device]["fragmentation"] = fragmentation

    def get_memory_info(self) -> Dict[str, Dict]:
        """Get detailed memory usage information."""
        info = {}

        for device in self.devices:
            stats = self.device_stats[device]
            quantum_blocks = len(
                [
                    h
                    for h in self.quantum_allocations
                    if self.memory_blocks[h].device == device
                ]
            )

            info[f"device_{device}"] = {
                "total": stats["total_memory"],
                "allocated": stats["allocated"],
                "cached": stats["cached"],
                "free": stats["total_memory"] - stats["allocated"],
                "fragmentation": stats["fragmentation"],
                "quantum_reserved": stats["reserved_quantum"],
                "quantum_blocks": quantum_blocks,
            }

        return info

    def __del__(self):
        """Cleanup on deletion."""
        # Free all allocated blocks
        for handle in list(self.memory_blocks.keys()):
            self.free(handle)

        # Reset device stats
        for device in self.devices:
            self.device_stats[device]["allocated"] = 0
            self.device_stats[device]["cached"] = 0
            self.device_stats[device]["fragmentation"] = 0.0
