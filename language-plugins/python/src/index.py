import ast
import astor

class PythonProcessor:
    def parse_code(self, code):
        try:
            return ast.parse(code)
        except SyntaxError as e:
            raise SyntaxError(f"Error parsing code: {e}")

    def optimize_code(self, tree):
        class Optimizer(ast.NodeTransformer):
            def visit_Name(self, node):
                if node.id == 'x':
                    node.id = 'y'
                return node
        
        try:
            return Optimizer().visit(tree)
        except Exception as e:
            raise RuntimeError(f"Error optimizing code: {e}")

    def generate_code(self, tree):
        try:
            return astor.to_source(tree)
        except Exception as e:
            raise RuntimeError(f"Error generating code: {e}")

    def process_code(self, code):
        tree = self.parse_code(code)
        optimized_tree = self.optimize_code(tree)
        return self.generate_code(optimized_tree)

if __name__ == "__main__":
    processor = PythonProcessor()
    sample_code = """
def example():
    x = 10
    return x
"""
    optimized_code = processor.process_code(sample_code)
    print(optimized_code)
