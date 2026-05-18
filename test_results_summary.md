# BleuJS Test Results Summary

**Generated:** 2026-05-18

## Mypy Type Checking Results

**Command:** `mypy src --config-file mypy.ini`

**Result:** Found 13 type errors in 6 files (checked 253 source files)

### Type Errors Found:

1. **src/bleu_ai/distributed/training_manager.py:277**
   - Error: "await" outside coroutine ("async def")

2. **src/python/ml/deep_learning/uncertainty_handler.py:346, 359**
   - Error: Redundant cast to "T" (2 occurrences)

3. **src/bleu_ai/benchmarks/benchmark_suite.py:250, 270, 274, 278**
   - Error: Missing return statement (4 occurrences)

4. **src/benchmarks/performance_benchmark.py:258, 312**
   - Error: List item 0 has incompatible type "floating[Any]"; expected "float" (2 occurrences)

5. **src/quantum_py/quantum/processor.py:149**
   - Error: Return type "bool" of "initialize" incompatible with return type "None" in supertype

6. **src/quantum_py/core/quantum_processor.py:632, 649, 666**
   - Error: Missing return statement (3 occurrences)

### Notes:
- Multiple annotation-unchecked notes for untyped functions (informational, not errors)
- Configuration uses relaxed type checking with many error codes disabled

---

## Pytest Test Results

**Command:** `pytest tests/ --forked --tb=no -q`

**Summary:** 8 failed, 69 passed, 9 skipped, 2 errors in 44.69s

### Test Statistics:
- ✅ **Passed:** 69 tests
- ❌ **Failed:** 8 tests
- ⊘ **Skipped:** 9 tests
- ⚠️  **Errors:** 2 tests
- **Total Runtime:** 44.69 seconds

### Failed Tests:
- tests/ml/optimization/test_adaptive_learning.py::test_invalid_metrics
- (7 more failures before stopping at failure limit)

### Error Tests:
- tests/ml/optimization/test_gpu_memory_manager.py::test_initialization
- tests/ml/optimization/test_gpu_memory_manager.py::test_device_initialization

### Notes:
- Test run stopped after 10 failures (default maxfail limit)
- Used `--forked` option to run tests in separate processes (avoids segfault issues with ML libraries)
- 391 total tests were collected

---

## Recommendations

### Mypy Issues:
1. Fix async/await issue in training_manager.py
2. Remove redundant type casts in uncertainty_handler.py
3. Add return statements or adjust return type annotations in benchmark and quantum processor files
4. Ensure numeric types are consistent (float vs floating[Any])

### Pytest Issues:
1. Investigate ML optimization test failures (adaptive learning and GPU memory manager)
2. Run full test suite without maxfail limit to see all failures: `pytest tests/ --forked`
3. Fix GPU-related tests or mark them as requiring specific hardware

### Environment Setup:
- Python version: 3.12.3
- All required dependencies from requirements.txt installed successfully
- Mypy version: 2.1.0
- Pytest version: 9.0.3
