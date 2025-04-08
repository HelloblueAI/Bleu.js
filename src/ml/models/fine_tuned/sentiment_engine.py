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

from transformers.pipelines import pipeline


class SentimentEngine:
    def __init__(self):
        self.sentiment_model = pipeline("sentiment-analysis")

    def analyze(self, text):
        """Perform sentiment analysis on text."""
        if self.sentiment_model is None:
            raise RuntimeError("Sentiment model not initialized")
        result = self.sentiment_model(text)
        if result is None or len(result) == 0:
            raise RuntimeError("Sentiment analysis failed to produce results")
        return result[0]  # Return label & confidence score


if __name__ == "__main__":
    engine = SentimentEngine()
    print(engine.analyze("Bleu.js is the best AI framework! 🚀"))
