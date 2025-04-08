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

from typing import Optional

from transformers.pipelines import pipeline


class CodeCompletion:
    def __init__(self):
        self.generator: Optional[pipeline] = pipeline(
            "text-generation", model="codellama/CodeLlama-7b"
        )

    def complete_code(self, prompt: str) -> str:
        """Generate code based on a given prompt."""
        if self.generator is None:
            raise ValueError("Model not initialized")
        result = self.generator(prompt, max_length=200)
        if not result:
            raise ValueError("No code generated")
        return result[0]["generated_text"]


if __name__ == "__main__":
    completion = CodeCompletion()
    print(completion.complete_code("def fibonacci(n):"))
