"""
Backend configuration settings.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any, List
import os
from pathlib import Path
import yaml
from dotenv import load_dotenv
import torch

@dataclass
class DatabaseConfig:
    """Database configuration."""
    host: str
    port: int
    username: str
    password: str
    database: str
    pool_size: int = 5
    max_overflow: int = 10
    pool_timeout: int = 30
    pool_recycle: int = 1800

@dataclass
class APIConfig:
    """API configuration."""
    host: str
    port: int
    debug: bool
    workers: int
    cors_origins: List[str]
    rate_limit: int
    rate_limit_window: int
    jwt_secret: str
    jwt_algorithm: str
    jwt_expires_in: int

@dataclass
class CacheConfig:
    """Cache configuration."""
    host: str
    port: int
    password: Optional[str] = None
    db: int = 0
    ttl: int = 3600

@dataclass
class LoggingConfig:
    """Logging configuration."""
    level: str
    format: str
    file: Optional[str] = None
    max_size: int = 10485760  # 10MB
    backup_count: int = 5

@dataclass
class BackendConfig:
    """Main backend configuration."""
    environment: str
    debug: bool
    database: DatabaseConfig
    api: APIConfig
    cache: CacheConfig
    logging: LoggingConfig
    model_path: str
    batch_size: int
    max_sequence_length: int
    device: str
    num_workers: int
    timeout: int
    retry_attempts: int
    retry_delay: int

class Settings:
    """Settings manager for the backend."""
    
    def __init__(self):
        self.config: Optional[BackendConfig] = None
        self._load_env()
        self._load_config()
        
    def _load_env(self):
        """Load environment variables."""
        env_path = Path(__file__).parent.parent.parent.parent / '.env'
        if env_path.exists():
            load_dotenv(env_path)
            
    def _load_config(self):
        """Load configuration from YAML file."""
        config_path = Path(__file__).parent / 'config.yaml'
        if not config_path.exists():
            self._create_default_config(config_path)
            
        with open(config_path, 'r') as f:
            config_data = yaml.safe_load(f)
            
        self.config = self._parse_config(config_data)
        
    def _create_default_config(self, path: Path):
        """Create default configuration file."""
        default_config = {
            'environment': os.getenv('ENVIRONMENT', 'development'),
            'debug': os.getenv('DEBUG', 'False').lower() == 'true',
            'database': {
                'host': os.getenv('DB_HOST', 'localhost'),
                'port': int(os.getenv('DB_PORT', '5432')),
                'username': os.getenv('DB_USER', 'postgres'),
                'password': os.getenv('DB_PASSWORD', ''),
                'database': os.getenv('DB_NAME', 'quantum_db'),
                'pool_size': int(os.getenv('DB_POOL_SIZE', '5')),
                'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', '10')),
                'pool_timeout': int(os.getenv('DB_POOL_TIMEOUT', '30')),
                'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', '1800'))
            },
            'api': {
                'host': os.getenv('API_HOST', '0.0.0.0'),
                'port': int(os.getenv('API_PORT', '8000')),
                'debug': os.getenv('API_DEBUG', 'False').lower() == 'true',
                'workers': int(os.getenv('API_WORKERS', '4')),
                'cors_origins': os.getenv('CORS_ORIGINS', '*').split(','),
                'rate_limit': int(os.getenv('RATE_LIMIT', '100')),
                'rate_limit_window': int(os.getenv('RATE_LIMIT_WINDOW', '60')),
                'jwt_secret': os.getenv('JWT_SECRET', 'your-secret-key'),
                'jwt_algorithm': os.getenv('JWT_ALGORITHM', 'HS256'),
                'jwt_expires_in': int(os.getenv('JWT_EXPIRES_IN', '3600'))
            },
            'cache': {
                'host': os.getenv('CACHE_HOST', 'localhost'),
                'port': int(os.getenv('CACHE_PORT', '6379')),
                'password': os.getenv('CACHE_PASSWORD', None),
                'db': int(os.getenv('CACHE_DB', '0')),
                'ttl': int(os.getenv('CACHE_TTL', '3600'))
            },
            'logging': {
                'level': os.getenv('LOG_LEVEL', 'INFO'),
                'format': os.getenv('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s'),
                'file': os.getenv('LOG_FILE', None),
                'max_size': int(os.getenv('LOG_MAX_SIZE', '10485760')),
                'backup_count': int(os.getenv('LOG_BACKUP_COUNT', '5'))
            },
            'model_path': os.getenv('MODEL_PATH', 'models'),
            'batch_size': int(os.getenv('BATCH_SIZE', '32')),
            'max_sequence_length': int(os.getenv('MAX_SEQUENCE_LENGTH', '512')),
            'device': os.getenv('DEVICE', 'cuda' if torch.cuda.is_available() else 'cpu'),
            'num_workers': int(os.getenv('NUM_WORKERS', '4')),
            'timeout': int(os.getenv('TIMEOUT', '30')),
            'retry_attempts': int(os.getenv('RETRY_ATTEMPTS', '3')),
            'retry_delay': int(os.getenv('RETRY_DELAY', '1'))
        }
        
        with open(path, 'w') as f:
            yaml.dump(default_config, f, default_flow_style=False)
            
    def _parse_config(self, data: Dict[str, Any]) -> BackendConfig:
        """Parse configuration data into BackendConfig object."""
        return BackendConfig(
            environment=data['environment'],
            debug=data['debug'],
            database=DatabaseConfig(**data['database']),
            api=APIConfig(**data['api']),
            cache=CacheConfig(**data['cache']),
            logging=LoggingConfig(**data['logging']),
            model_path=data['model_path'],
            batch_size=data['batch_size'],
            max_sequence_length=data['max_sequence_length'],
            device=data['device'],
            num_workers=data['num_workers'],
            timeout=data['timeout'],
            retry_attempts=data['retry_attempts'],
            retry_delay=data['retry_delay']
        )
        
    def get_config(self) -> BackendConfig:
        """Get the current configuration."""
        if self.config is None:
            raise RuntimeError("Configuration not loaded")
        return self.config
        
    def update_config(self, new_config: Dict[str, Any]):
        """Update configuration with new values."""
        config_path = Path(__file__).parent / 'config.yaml'
        with open(config_path, 'r') as f:
            current_config = yaml.safe_load(f)
            
        # Update with new values
        current_config.update(new_config)
        
        # Save updated config
        with open(config_path, 'w') as f:
            yaml.dump(current_config, f, default_flow_style=False)
            
        # Reload configuration
        self._load_config()

# Create global settings instance
settings = Settings() 