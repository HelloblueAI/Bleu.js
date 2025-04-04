import os
import sys
import pytest

# Add src directory to Python path
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "src"))
sys.path.insert(0, src_path)

# Import test fixtures
from tests.config import (
    settings,
    engine,
    db_session,
    test_user,
    test_subscription_plan,
    test_subscription,
    test_api_token,
    test_rate_limit,
)

# Override settings for testing
os.environ["TESTING"] = "True" 