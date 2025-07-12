import os
import sys

# Add src directory to Python path
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "src"))
sys.path.insert(0, src_path)

# Import test fixtures

# Override settings for testing
os.environ["TESTING"] = "True"
