"""
Advanced security system for the backend.
"""

import hashlib
import hmac
import logging
import os
import re
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from ipaddress import ip_address, ip_network
from typing import Dict, List

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordBearer

logger = logging.getLogger(__name__)

load_dotenv()


@dataclass
class RateLimitConfig:
    """Rate limiting configuration."""

    requests_per_minute: int = 60
    burst_size: int = 10
    block_duration_minutes: int = 15


@dataclass
class SecurityConfig:
    """Security configuration."""

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    rate_limit: RateLimitConfig = RateLimitConfig()
    allowed_ips: List[str] = None
    blocked_ips: List[str] = None


class SecurityManager:
    """Advanced security management system."""

    def __init__(self, config: SecurityConfig):
        """Initialize security manager."""
        self.config = config
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
        self._setup_rate_limiting()
        self._setup_ip_filtering()

    def _setup_rate_limiting(self):
        """Setup rate limiting."""
        self.rate_limit_data: Dict[str, List[datetime]] = {}
        self.blocked_ips: Dict[str, datetime] = {}

    def _setup_ip_filtering(self):
        """Setup IP filtering."""
        self.allowed_networks = [ip_network(ip) for ip in self.config.allowed_ips or []]
        self.blocked_networks = [ip_network(ip) for ip in self.config.blocked_ips or []]

    def validate_password(self, password: str) -> bool:
        """Validate password strength."""
        if len(password) < 8:
            return False
        if not re.search(r"[A-Z]", password):
            return False
        if not re.search(r"[a-z]", password):
            return False
        if not re.search(r"\d", password):
            return False
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            return False
        return True

    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt."""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode(), salt).decode()

    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash."""
        return bcrypt.checkpw(password.encode(), hashed.encode())

    def create_access_token(self, data: dict) -> str:
        """Create JWT access token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(
            minutes=self.config.access_token_expire_minutes
        )
        to_encode.update({"exp": expire})
        return jwt.encode(
            to_encode, self.config.secret_key, algorithm=self.config.algorithm
        )

    def create_refresh_token(self, data: dict) -> str:
        """Create JWT refresh token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(
            days=self.config.refresh_token_expire_days
        )
        to_encode.update({"exp": expire})
        return jwt.encode(
            to_encode, self.config.secret_key, algorithm=self.config.algorithm
        )

    def verify_token(self, token: str) -> dict:
        """Verify JWT token."""
        try:
            payload = jwt.decode(
                token, self.config.secret_key, algorithms=[self.config.algorithm]
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

    def check_rate_limit(self, client_ip: str) -> bool:
        """Check if request is within rate limits."""
        now = datetime.utcnow()

        # Check if IP is blocked
        if client_ip in self.blocked_ips:
            if now < self.blocked_ips[client_ip]:
                return False
            else:
                del self.blocked_ips[client_ip]

        # Get request history
        requests = self.rate_limit_data.get(client_ip, [])

        # Remove old requests
        requests = [req for req in requests if now - req < timedelta(minutes=1)]

        # Check rate limit
        if len(requests) >= self.config.rate_limit.requests_per_minute:
            if len(requests) >= self.config.rate_limit.burst_size:
                self.blocked_ips[client_ip] = now + timedelta(
                    minutes=self.config.rate_limit.block_duration_minutes
                )
                return False
            return False

        # Update request history
        requests.append(now)
        self.rate_limit_data[client_ip] = requests
        return True

    def validate_ip(self, client_ip: str) -> bool:
        """Validate client IP address."""
        try:
            ip = ip_address(client_ip)

            # Check if IP is in blocked networks
            for network in self.blocked_networks:
                if ip in network:
                    return False

            # Check if IP is in allowed networks
            if self.allowed_networks:
                for network in self.allowed_networks:
                    if ip in network:
                        return True
                return False

            return True
        except ValueError:
            return False

    def sanitize_input(self, input_str: str) -> str:
        """Sanitize user input."""
        # Remove potentially dangerous characters
        sanitized = re.sub(r"[<>]", "", input_str)
        # Escape special characters
        sanitized = sanitized.replace("&", "&amp;")
        sanitized = sanitized.replace('"', "&quot;")
        sanitized = sanitized.replace("'", "&#x27;")
        sanitized = sanitized.replace("/", "&#x2F;")
        return sanitized

    def generate_csrf_token(self) -> str:
        """Generate CSRF token."""
        return hmac.new(
            self.config.secret_key.encode(), str(time.time()).encode(), hashlib.sha256
        ).hexdigest()

    def verify_csrf_token(self, token: str) -> bool:
        """Verify CSRF token."""
        return bool(token and len(token) == 64)


def initialize_security_manager():
    """Initialize the security manager with configuration from environment variables."""
    security_manager = SecurityManager(
        SecurityConfig(
            secret_key=os.getenv("SECRET_KEY", ""),  # Must be set in environment
            rate_limit=RateLimitConfig(),
            allowed_ips=os.getenv("ALLOWED_IPS", "10.0.0.0/8,192.168.0.0/16").split(
                ","
            ),
            blocked_ips=(
                os.getenv("BLOCKED_IPS", "").split(",")
                if os.getenv("BLOCKED_IPS")
                else []
            ),
        )
    )
    return security_manager
