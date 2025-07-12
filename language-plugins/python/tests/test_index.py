import ast

from src.index import PythonProcessor


def test_parse_code():
    processor = PythonProcessor()
    code = "a = 1"
    tree = processor.parse_code(code)
    assert isinstance(tree, ast.Module)


def test_optimize_code():
    processor = PythonProcessor()
    code = "a = 1"
    tree = processor.parse_code(code)
    optimized_tree = processor.optimize_code(tree)
    optimized_code = processor.generate_code(optimized_tree)
    assert optimized_code == "a = 1\n"


def test_generate_code():
    processor = PythonProcessor()
    code = "a = 1"
    tree = processor.parse_code(code)
    optimized_tree = processor.optimize_code(tree)
    generated_code = processor.generate_code(optimized_tree)
    assert generated_code == "a = 1\n"
