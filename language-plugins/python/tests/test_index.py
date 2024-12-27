import pytest
from src.index import PythonProcessor
import ast


@pytest.fixture
def processor():
    """Fixture to provide a PythonProcessor instance."""
    return PythonProcessor()


def test_parse_code(processor):
    """Test that valid Python code is parsed correctly."""
    code = "x = 42"
    tree = processor.parse_code(code)
    assert isinstance(tree, ast.Module)


def test_optimize_code(processor):
    """Test that the optimizer works as expected."""
    code = "x = 42"
    tree = processor.parse_code(code)
    optimized_tree = processor.optimize_code(tree)
    optimized_code = processor.generate_code(optimized_tree)
    assert optimized_code == "x = 42\n"


def test_generate_code(processor):
    """Test that code generation works as expected."""
    code = "y = 24"
    tree = processor.parse_code(code)
    generated_code = processor.generate_code(tree)
    assert generated_code == "y = 24\n"


def test_invalid_code(processor):
    """Test that the processor raises an appropriate error for invalid code."""
    invalid_code = "def ()"
    with pytest.raises(ValueError, match="Error parsing code:"):
        processor.parse_code(invalid_code)


def test_complex_code(processor):
    """Test parsing, optimizing, and generating more complex code."""
    code = """
def foo(x):
    return x * 2
"""
    tree = processor.parse_code(code)
    optimized_tree = processor.optimize_code(tree)
    generated_code = processor.generate_code(optimized_tree)
    assert generated_code == code.strip() + "\n"
