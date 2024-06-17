import ast
import astor

class PythonProcessor:
    def parse_code(self, code):
        try:
            return ast.parse(code)
        except Exception as e:
            raise ValueError(f"Error parsing code: {str(e)}")

    def optimizeCode(self, tree):
        for node in ast.walk(tree):
            if isinstance(node, ast.Name) and node.id == 'var':
                node.id = 'let'
        return tree

    def generateCode(self, tree):
        try:
            return astor.to_source(tree)
        except Exception as e:
            raise ValueError(f"Error generating code: {str(e)}")
