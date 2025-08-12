"""
Quantum-Aware GPU Memory Manager
Implements intelligent GPU memory management with quantum state awareness,
dynamic optimization, and proper cleanup mechanisms.
"""

import logging
import time
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Dict, List, Optional, Set

import torch

logger = logging.getLogger(__name__)


@dataclass
class MemoryBlock:
    """Represents a block of GPU memory with enhanced tracking"""

    handle: int
    size: int
    device: int
    is_quantum: bool
    timestamp: float
    in_use: bool
    allocation_stack: Optional[str] = None
    last_access: float = 0.0
    access_count: int = 0


class MemoryMetrics:
    """Memory usage metrics and statistics"""

    def __init__(self):
        self.total_allocations = 0
        self.total_deallocations = 0
        self.peak_memory_usage = 0
        self.current_memory_usage = 0
        self.fragmentation_events = 0
        self.oom_events = 0
        self.cleanup_cycles = 0

    def record_allocation(self, size: int):
        """Record memory allocation."""
        self.total_allocations += 1
        self.current_memory_usage += size
        self.peak_memory_usage = max(self.peak_memory_usage, self.current_memory_usage)

    def record_deallocation(self, size: int):
        """Record memory deallocation."""
        self.total_deallocations += 1
        self.current_memory_usage = max(0, self.current_memory_usage - size)

    def record_fragmentation(self):
        """Record fragmentation event."""
        self.fragmentation_events += 1

    def record_oom(self):
        """Record out-of-memory event."""
        self.oom_events += 1

    def record_cleanup(self):
        """Record cleanup cycle."""
        self.cleanup_cycles += 1

    def get_stats(self) -> Dict:
        """Get memory statistics."""
        return {
            "total_allocations": self.total_allocations,
            "total_deallocations": self.total_deallocations,
            "peak_memory_usage": self.peak_memory_usage,
            "current_memory_usage": self.current_memory_usage,
            "fragmentation_events": self.fragmentation_events,
            "oom_events": self.oom_events,
            "cleanup_cycles": self.cleanup_cycles,
            "memory_efficiency": (
                self.total_deallocations / max(self.total_allocations, 1)
            )
            * 100,
        }


class QuantumGPUManager:
    """
    Advanced GPU memory manager with quantum state awareness,
    dynamic optimization, and proper cleanup mechanisms.
    """

    def __init__(
        self,
        devices: Optional[List[int]] = None,
        quantum_reserve: float = 0.2,
        cache_size: int = 1024 * 1024 * 1024,  # 1GB default cache
        cleanup_threshold: float = 0.8,
        max_fragmentation: float = 0.3,
    ):
        """Initialize the quantum-aware GPU memory manager."""
        if devices is None:
            self.devices = [0]  # Default to first GPU
        else:
            self.devices = devices

        self.quantum_reserve = quantum_reserve
        self.cache_size = cache_size
        self.cleanup_threshold = cleanup_threshold
        self.max_fragmentation = max_fragmentation

        # Memory tracking
        self.memory_blocks: Dict[int, MemoryBlock] = {}
        self.quantum_allocations: Set[int] = set()
        self.next_handle = 1

        # Metrics and monitoring
        self.metrics = MemoryMetrics()
        self.last_cleanup = time.time()
        self.cleanup_interval = 300  # 5 minutes

        # Initialize device statistics
        self.device_stats = {}
        self._initialize_devices()

        # Start cleanup thread
        self._start_cleanup_monitor()

    def _initialize_devices(self):
        """Initialize device statistics and capabilities."""
        for device in self.devices:
            try:
                if torch.cuda.is_available():
                    props = torch.cuda.get_device_properties(device)
                    total_memory = props.total_memory
                    compute_capability = f"{props.major}.{props.minor}"
                else:
                    # Mock values for testing
                    total_memory = 8 * 1024 * 1024 * 1024  # 8GB
                    compute_capability = "0.0"

                self.device_stats[device] = {
                    "total_memory": total_memory,
                    "reserved_quantum": int(total_memory * self.quantum_reserve),
                    "allocated": 0,
                    "cached": 0,
                    "fragmentation": 0.0,
                    "compute_capability": compute_capability,
                    "last_optimization": time.time(),
                }

                logger.info(
                    f"Initialized device {device}: {total_memory / (1024**3):.1f}GB"
                )

            except Exception as e:
                logger.error(f"Failed to initialize device {device}: {str(e)}")
                # Use mock values for testing
                self.device_stats[device] = {
                    "total_memory": 8 * 1024 * 1024 * 1024,  # 8GB
                    "reserved_quantum": int(
                        8 * 1024 * 1024 * 1024 * self.quantum_reserve
                    ),
                    "allocated": 0,
                    "cached": 0,
                    "fragmentation": 0.0,
                    "compute_capability": "0.0",
                    "last_optimization": time.time(),
                }

    def allocate(
        self, size: int, device: Optional[int] = None, is_quantum: bool = False
    ) -> Optional[int]:
        """Allocate memory block with enhanced error handling and optimization."""
        if size <= 0:
            logger.error("Invalid allocation size")
            return None

        # Check if cleanup is needed
        if self._should_perform_cleanup():
            self._perform_cleanup()

        # Select best device if none specified
        if device is None:
            device = self._select_best_device(size, is_quantum)
            if device is None:
                logger.warning("No suitable device found for allocation")
                return None

        # Validate device
        if device not in self.devices:
            logger.error(f"Invalid device for memory allocation: {device}")
            return None

        # Check if enough memory is available
        available = self._get_available_memory(device, is_quantum)
        if size > available:
            # Try to free some memory
            if self._try_free_memory(device, size - available):
                available = self._get_available_memory(device, is_quantum)

            if size > available:
                logger.warning(f"Not enough memory available on device {device}")
                self.metrics.record_oom()
                return None

        # Create memory block
        handle = self.next_handle
        self.next_handle += 1

        # Get allocation stack trace for debugging
        import traceback

        allocation_stack = "".join(traceback.format_stack())

        memory_block = MemoryBlock(
            handle=handle,
            size=size,
            device=device,
            is_quantum=is_quantum,
            timestamp=time.time(),
            in_use=True,
            allocation_stack=allocation_stack,
            last_access=time.time(),
            access_count=1,
        )

        self.memory_blocks[handle] = memory_block

        # Update device statistics
        self.device_stats[device]["allocated"] += size
        if is_quantum:
            self.quantum_allocations.add(handle)

        # Record metrics
        self.metrics.record_allocation(size)

        logger.debug(f"Allocated {size} bytes on device {device} (handle: {handle})")
        return handle

    def deallocate(self, handle: int) -> bool:
        """Deallocate memory block with proper cleanup."""
        if handle not in self.memory_blocks:
            logger.warning(f"Attempted to deallocate non-existent handle: {handle}")
            return False

        memory_block = self.memory_blocks[handle]
        device = memory_block.device

        # Update device statistics
        self.device_stats[device]["allocated"] -= memory_block.size

        # Remove from quantum allocations if applicable
        if handle in self.quantum_allocations:
            self.quantum_allocations.remove(handle)

        # Record metrics
        self.metrics.record_deallocation(memory_block.size)

        # Remove memory block
        del self.memory_blocks[handle]

        logger.debug(
            f"Deallocated {memory_block.size} bytes on device {device} (handle: {handle})"
        )
        return True

    def _should_perform_cleanup(self) -> bool:
        """Check if cleanup should be performed."""
        current_time = time.time()

        # Time-based cleanup
        if current_time - self.last_cleanup > self.cleanup_interval:
            return True

        # Memory pressure-based cleanup
        for device in self.devices:
            if device in self.device_stats:
                allocated_ratio = (
                    self.device_stats[device]["allocated"]
                    / self.device_stats[device]["total_memory"]
                )
                if allocated_ratio > self.cleanup_threshold:
                    return True

        return False

    def _perform_cleanup(self):
        """Perform comprehensive memory cleanup."""
        try:
            logger.info("Starting memory cleanup cycle")
            start_time = time.time()

            # Free unused memory blocks
            freed_memory = 0
            blocks_to_remove = []

            for handle, block in self.memory_blocks.items():
                if not block.in_use:
                    freed_memory += block.size
                    blocks_to_remove.append(handle)

            # Remove unused blocks
            for handle in blocks_to_remove:
                self.deallocate(handle)

            # Optimize memory layout
            self._optimize_memory_layout()

            # Update cleanup timestamp
            self.last_cleanup = time.time()
            self.metrics.record_cleanup()

            duration = time.time() - start_time
            logger.info(
                f"Memory cleanup completed in {duration:.2f}s, freed {freed_memory} bytes"
            )

        except Exception as e:
            logger.error(f"Memory cleanup failed: {str(e)}")

    def _optimize_memory_layout(self):
        """Optimize memory layout to reduce fragmentation."""
        for device in self.devices:
            if device in self.device_stats:
                try:
                    # Calculate current fragmentation
                    total_allocated = self.device_stats[device]["allocated"]
                    total_memory = self.device_stats[device]["total_memory"]

                    if total_allocated > 0:
                        fragmentation = 1 - (total_allocated / total_memory)
                        self.device_stats[device]["fragmentation"] = fragmentation

                        if fragmentation > self.max_fragmentation:
                            logger.info(
                                f"High fragmentation detected on device {device}: "
                                f"{fragmentation:.2%}"
                            )
                            self.metrics.record_fragmentation()

                            # Trigger garbage collection
                            if torch.cuda.is_available():
                                torch.cuda.empty_cache()

                    self.device_stats[device]["last_optimization"] = time.time()

                except Exception as e:
                    logger.error(
                        f"Failed to optimize memory layout for device {device}: {str(e)}"
                    )

    def _try_free_memory(self, device: int, required_size: int) -> bool:
        """Try to free memory to accommodate required size."""
        try:
            # Find blocks that can be freed
            available_blocks = []
            for handle, block in self.memory_blocks.items():
                if block.device == device and not block.in_use:
                    available_blocks.append((handle, block.size))

            # Sort by size (largest first)
            available_blocks.sort(key=lambda x: x[1], reverse=True)

            freed_size = 0
            for handle, size in available_blocks:
                if freed_size >= required_size:
                    break

                if self.deallocate(handle):
                    freed_size += size

            return freed_size >= required_size

        except Exception as e:
            logger.error(f"Failed to free memory on device {device}: {str(e)}")
            return False

    def _start_cleanup_monitor(self):
        """Start background cleanup monitoring."""
        import threading

        def cleanup_monitor():
            while True:
                try:
                    time.sleep(60)  # Check every minute
                    if self._should_perform_cleanup():
                        self._perform_cleanup()
                except Exception as e:
                    logger.error(f"Cleanup monitor error: {str(e)}")

        cleanup_thread = threading.Thread(target=cleanup_monitor, daemon=True)
        cleanup_thread.start()
        logger.info("Started background cleanup monitor")

    def get_memory_stats(self) -> Dict:
        """Get comprehensive memory statistics."""
        stats = {
            "devices": {},
            "overall": self.metrics.get_stats(),
            "quantum_allocations": len(self.quantum_allocations),
            "total_blocks": len(self.memory_blocks),
            "last_cleanup": self.last_cleanup,
        }

        for device in self.devices:
            if device in self.device_stats:
                device_stats = self.device_stats[device].copy()
                device_stats["utilization"] = (
                    device_stats["allocated"] / device_stats["total_memory"]
                ) * 100
                stats["devices"][f"device_{device}"] = device_stats

        return stats

    @contextmanager
    def memory_context(
        self, size: int, device: Optional[int] = None, is_quantum: bool = False
    ):
        """Context manager for automatic memory management."""
        handle = None
        try:
            handle = self.allocate(size, device, is_quantum)
            if handle is None:
                raise RuntimeError("Failed to allocate memory")
            yield handle
        finally:
            if handle is not None:
                self.deallocate(handle)

    def __del__(self):
        """Cleanup on destruction."""
        try:
            # Deallocate all remaining memory blocks
            for handle in list(self.memory_blocks.keys()):
                self.deallocate(handle)
            logger.info("GPU memory manager destroyed, all memory deallocated")
        except Exception as e:
            logger.error(f"Error during GPU memory manager destruction: {str(e)}")
