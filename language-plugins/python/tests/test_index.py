from src.index import PythonProcessor
import ast


def test_parse_code():
    processor = PythonProcessor()
    code = "a = 1"
    tree = processor.parse_code(code)
    assert isinstance(tree, ast.Module)


def test_optimize_code():
    processor = PythonProcessor()
    code = "a = 1"
    tree = processor.parse_code(code)
    optimized_tree = processor.optimizeCode(tree)
    optimized_code = processor.generateCode(optimized_tree)
    assert optimized_code == "a = 1\n"


def test_generate_code():
    processor = PythonProcessor()
    code = "a = 1"
    tree = processor.parse_code(code)
    optimized_tree = processor.optimizeCode(tree)
    generated_code = processor.generateCode(optimized_tree)
    assert generated_code == "a = 1\n"
