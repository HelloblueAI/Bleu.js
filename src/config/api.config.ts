import { createLogger } from '../utils/logger.js';

const logger = createLogger('APIConfig');

interface EngineConfig {
  url: string;
  version: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface APIConfig {
  aws: EngineConfig;
  quantum: EngineConfig;
  ai: EngineConfig;
  security: {
    tokenExpiry: number;
    maxRetries: number;
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
  };
}

// Default configuration with non-sensitive values
const defaultConfig: APIConfig = {
  aws: {
    url: process.env.AWS_API_URL ?? 'https://mozxitsnsh.execute-api.us-west-2.amazonaws.com/prod',
    version: 'v1',
    timeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  quantum: {
    url: process.env.QUANTUM_API_URL ?? '${process.env.AWS_API_URL}/quantum',
    version: 'v1',
    timeout: 10000,
    retryAttempts: 2,
    retryDelay: 2000,
  },
  ai: {
    url: process.env.AI_API_URL ?? '${process.env.AWS_API_URL}/ai',
    version: 'v1',
    timeout: 15000,
    retryAttempts: 2,
    retryDelay: 2000,
  },
  security: {
    tokenExpiry: 3600,
    maxRetries: 3,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
  },
};

// Environment-specific configurations
const environments = {
  development: {
    ...defaultConfig,
  },
  test: {
    ...defaultConfig,
    aws: {
      ...defaultConfig.aws,
      timeout: 2000,
      retryAttempts: 1,
    },
    quantum: {
      ...defaultConfig.quantum,
      timeout: 3000,
      retryAttempts: 1,
    },
    ai: {
      ...defaultConfig.ai,
      timeout: 3000,
      retryAttempts: 1,
    },
  },
  production: {
    ...defaultConfig,
    security: {
      ...defaultConfig.security,
      rateLimit: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 50,
      },
    },
  },
};

// Get current environment
const currentEnv = process.env.NODE_ENV || 'development';

// Export configuration based on environment
export const apiConfig = environments[currentEnv as keyof typeof environments];

// Secure headers generator
export const generateSecureHeaders = (engineType: keyof Omit<APIConfig, 'security'>) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Version': apiConfig[engineType].version,
    'X-Request-ID': crypto.randomUUID(),
  };

  // Add authentication headers if available
  if (process.env.API_KEY) {
    headers['x-api-key'] = process.env.API_KEY;
  }

  if (process.env.JWT_SECRET) {
    headers['Authorization'] = `Bearer ${process.env.JWT_SECRET}`;
  }

  return headers;
};

// Endpoint builder
export const buildEndpoint = (engineType: keyof Omit<APIConfig, 'security'>, path: string): string => {
  const config = apiConfig[engineType];
  return `${config.url}/${config.version}${path}`;
};

// Rate limiting check
export const checkRateLimit = (() => {
  const requests = new Map<string, number[]>();
  
  return (clientId: string): boolean => {
    const now = Date.now();
    const windowMs = apiConfig.security.rateLimit.windowMs;
    const maxRequests = apiConfig.security.rateLimit.maxRequests;
    
    // Get existing requests for this client
    let clientRequests = requests.get(clientId) || [];
    
    // Remove old requests outside the window
    clientRequests = clientRequests.filter(time => now - time < windowMs);
    
    // Check if we're over the limit
    if (clientRequests.length >= maxRequests) {
      logger.warn(`Rate limit exceeded for client ${clientId}`);
      return false;
    }
    
    // Add current request
    clientRequests.push(now);
    requests.set(clientId, clientRequests);
    
    return true;
  };
})();

// Secure error messages
export const secureErrorMessages = {
  rateLimitExceeded: 'Too many requests. Please try again later.',
  unauthorized: 'Authentication required.',
  forbidden: 'Access denied.',
  notFound: 'Resource not found.',
  serverError: 'An unexpected error occurred.',
} as const;

export const getApiConfig = (): APIConfig => ({
  baseUrl: process.env.API_BASE_URL ?? 'https://api.bleu.ai',
  timeout: parseInt(process.env.API_TIMEOUT ?? '30000', 10),
  maxRetries: parseInt(process.env.API_MAX_RETRIES ?? '3', 10),
  // ... rest of the config
});

export const getSecurityConfig = (): SecurityConfig => ({
  apiKey: process.env.API_KEY ?? '',
  secretKey: process.env.API_SECRET_KEY ?? '',
  // ... rest of the config
}); 