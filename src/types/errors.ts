/**
 * Base error class for all Bleu.js errors
 */
export class BleuError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BleuError';
  }
}

/**
 * Custom error class for AI-related errors
 */
export class AIError extends BleuError {
  constructor(message: string) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Custom error class for Quantum-related errors
 */
export class QuantumError extends BleuError {
  constructor(message: string) {
    super(message);
    this.name = 'QuantumError';
  }
}

/**
 * Custom error class for Security-related errors
 */
export class SecurityError extends BleuError {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Custom error class for Performance-related errors
 */
export class PerformanceError extends BleuError {
  constructor(message: string) {
    super(message);
    this.name = 'PerformanceError';
  }
}

/**
 * Custom error class for Monitoring-related errors
 */
export class MonitoringError extends BleuError {
  constructor(message: string) {
    super(message);
    this.name = 'MonitoringError';
  }
}

/**
 * Custom error class for Validation-related errors
 */
export class ValidationError extends BleuError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Custom error class for Configuration-related errors
 */
export class ConfigurationError extends BleuError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Custom error class for Network-related errors
 */
export class NetworkError extends BleuError {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Custom error class for Storage-related errors
 */
export class StorageError extends BleuError {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Custom error class for Authentication-related errors
 */
export class AuthenticationError extends SecurityError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Custom error class for Authorization-related errors
 */
export class AuthorizationError extends SecurityError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Custom error class for Encryption-related errors
 */
export class EncryptionError extends SecurityError {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

/**
 * Custom error class for Decryption-related errors
 */
export class DecryptionError extends SecurityError {
  constructor(message: string) {
    super(message);
    this.name = 'DecryptionError';
  }
}

/**
 * Custom error class for Model-related errors
 */
export class ModelError extends AIError {
  constructor(message: string) {
    super(message);
    this.name = 'ModelError';
  }
}

/**
 * Custom error class for Training-related errors
 */
export class TrainingError extends AIError {
  constructor(message: string) {
    super(message);
    this.name = 'TrainingError';
  }
}

/**
 * Custom error class for Inference-related errors
 */
export class InferenceError extends AIError {
  constructor(message: string) {
    super(message);
    this.name = 'InferenceError';
  }
}

/**
 * Custom error class for Optimization-related errors
 */
export class OptimizationError extends PerformanceError {
  constructor(message: string) {
    super(message);
    this.name = 'OptimizationError';
  }
}

/**
 * Custom error class for Cache-related errors
 */
export class CacheError extends PerformanceError {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}

/**
 * Custom error class for Metrics-related errors
 */
export class MetricsError extends MonitoringError {
  constructor(message: string) {
    super(message);
    this.name = 'MetricsError';
  }
}

/**
 * Custom error class for Alert-related errors
 */
export class AlertError extends MonitoringError {
  constructor(message: string) {
    super(message);
    this.name = 'AlertError';
  }
}

/**
 * Custom error class for Anomaly-related errors
 */
export class AnomalyError extends MonitoringError {
  constructor(message: string) {
    super(message);
    this.name = 'AnomalyError';
  }
}

/**
 * Custom error class for Database-related errors
 */
export class DatabaseError extends StorageError {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Custom error class for FileSystem-related errors
 */
export class FileSystemError extends StorageError {
  constructor(message: string) {
    super(message);
    this.name = 'FileSystemError';
  }
}

/**
 * Custom error class for Connection-related errors
 */
export class ConnectionError extends NetworkError {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
  }
}

/**
 * Custom error class for Timeout-related errors
 */
export class TimeoutError extends NetworkError {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Custom error class for RateLimit-related errors
 */
export class RateLimitError extends NetworkError {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Interface for error context information
 */
export interface ErrorContext {
  code: string;
  details: any;
  timestamp: number;
  source: string;
}

/**
 * Interface for retryable error information
 */
export interface RetryableError {
  retryable: boolean;
  retryCount: number;
  retryDelay: number;
  maxRetries: number;
}

/**
 * Custom error class that includes context and retry information
 */
export class ContextualError extends BleuError implements ErrorContext, RetryableError {
  public code: string;
  public details: any;
  public timestamp: number;
  public source: string;
  public retryable: boolean;
  public retryCount: number;
  public retryDelay: number;
  public maxRetries: number;

  constructor(
    message: string,
    context: ErrorContext,
    retry: RetryableError
  ) {
    super(message);
    this.name = 'ContextualError';
    this.code = context.code;
    this.details = context.details;
    this.timestamp = context.timestamp;
    this.source = context.source;
    this.retryable = retry.retryable;
    this.retryCount = retry.retryCount;
    this.retryDelay = retry.retryDelay;
    this.maxRetries = retry.maxRetries;
  }

  public toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      source: this.source,
      retryable: this.retryable,
      retryCount: this.retryCount,
      retryDelay: this.retryDelay,
      maxRetries: this.maxRetries,
    };
  }
}

export class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Custom error class for Monitor-related errors
 */
export class MonitorError extends BleuError {
  constructor(message: string) {
    super(message);
    this.name = 'MonitorError';
  }
} 