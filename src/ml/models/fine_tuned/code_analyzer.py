#  Copyright (c) 2025, Helloblue Inc.
#  Open-Source Community Edition

#  Permission is hereby granted, free of charge, to any person obtaining a copy
#  of this software and associated documentation files (the "Software"), to use,
#  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
#  the Software, subject to the following conditions:

#  1. The above copyright notice and this permission notice shall be included in
#     all copies or substantial portions of the Software.
#  2. Contributions to this project are welcome and must adhere to the project's
#     contribution guidelines.
#  3. The name "Helloblue Inc." and its contributors may not be used to endorse
#     or promote products derived from this software without prior written consent.

#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
#  THE SOFTWARE.

import ast
import os
import re
from collections import defaultdict

import joblib


class CodeAnalyzer:
    def __init__(self, model_path=None):
        self.model = None
        if model_path and os.path.exists(model_path):
            self.model = joblib.load(model_path)  # Load pre-trained ML model

    def analyze_code(self, code):
        """Analyze Python code structure using AST."""
        tree = ast.parse(code)
        node_types = defaultdict(int)

        for node in ast.walk(tree):
            node_types[type(node).__name__] += 1

        return node_types

    def detect_bad_practices(self, code):
        """Detect common bad practices using regex + AST."""
        issues = []
        if re.search(r"eval\s*\(", code):  # Detect dangerous eval usage
            issues.append("⚠️ `eval()` detected! Avoid using eval for security reasons.")

        return issues

    def predict_code_quality(self, code):
        """Use ML model (if available) to predict code quality."""
        if not self.model:
            return "🔍 ML model not loaded. Skipping prediction."

        features = list(self.analyze_code(code).values())[
            :10
        ]  # Convert AST stats to ML input
        return self.model.predict([features])[0]


if __name__ == "__main__":
    analyzer = CodeAnalyzer()
    sample_code = "x = eval('5 + 2')"
    print("📊 Code Structure:", analyzer.analyze_code(sample_code))
    print("🚨 Issues:", analyzer.detect_bad_practices(sample_code))
