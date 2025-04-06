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

import logging
import os

import requests

logger = logging.getLogger(__name__)


class ClaudeModel:
    def __init__(self, api_key, endpoint):
        self.endpoint = endpoint
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def query(self, prompt):
        """Send query to Claude AI API."""
        data = {"prompt": prompt, "max_tokens": 150}

        return self._make_request(data)

    def _make_request(self, data):
        """Make a request to the Claude API with timeout."""
        try:
            response = requests.post(
                self.endpoint,
                json=data,
                headers=self.headers,  # Use instance headers
                timeout=30,  # 30 second timeout
            )
            return response.json()
        except requests.Timeout:
            logger.error("Request to Claude API timed out")
            raise TimeoutError("Request to Claude API timed out")
        except requests.RequestException as e:
            logger.error(f"Error making request to Claude API: {str(e)}")
            raise


if __name__ == "__main__":
    claude = ClaudeModel(
        os.getenv("CLAUDE_API_KEY"), "https://api.anthropic.com/v1/complete"
    )
    print(claude.query("Explain the importance of AI ethics."))
