import { createLogger } from '../../utils/logger';
import { SecurityManager } from '../../security/securityManager';
import { ProcessingError } from '../../types/errors';

interface RequestOptions {
  headers?: Record<string, string>;
  body?: any;
}

interface APIResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
}

interface APIRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
}

const secureErrorMessages = {
  rateLimitExceeded: 'Too many requests. Please try again later.',
  invalidToken: 'Invalid token',
  invalidApiKey: 'Invalid API key',
  invalidOrigin: 'Invalid origin',
  resourceNotFound: 'Resource not found'
};

class BaseEngine {
  protected logger = createLogger('APITestHelper');
  protected securityManager: SecurityManager;
  public mockResponses: Map<string, APIResponse>;

  constructor(securityManager: SecurityManager) {
    this.securityManager = securityManager;
    this.mockResponses = new Map();
  }

  setupMockResponse(response: APIResponse) {
    const key = this.getResponseKey();
    this.mockResponses.set(key, response);
  }

  protected async request(method: string, path: string, options: RequestOptions = {}): Promise<APIResponse> {
    try {
      // Add default headers
      const headers = {
        'x-api-key': 'test-key',
        'authorization': 'Bearer test-token',
        'x-request-id': 'test-request-id',
        ...options.headers
      };

      // Validate request
      const validationResult = await this.securityManager.validateRequest({
        method,
        path,
        headers,
        ...options
      });

      if (!validationResult.isValid) {
        return {
          status: 401,
          data: { error: validationResult.error },
          headers: {
            'content-type': 'application/json',
            ...headers
          }
        };
      }

      // Return mock response if set
      const key = this.getResponseKey();
      const mockResponse = this.mockResponses.get(key);
      if (mockResponse) {
        return {
          ...mockResponse,
          headers: {
            ...headers,
            ...mockResponse.headers
          }
        };
      }

      // Default response
      return {
        status: 200,
        data: { message: 'Success' },
        headers: {
          'content-type': 'application/json',
          ...headers
        }
      };
    } catch (error) {
      this.logger.error('Request failed:', error);
      return {
        status: 500,
        data: { error: 'Internal server error' },
        headers: {
          'content-type': 'application/json',
          ...options.headers
        }
      };
    }
  }

  protected getResponseKey(): string {
    return 'default';
  }
}

class AWSEngine extends BaseEngine {
  constructor() {
    super(new SecurityManager({
      apiKeys: ['test-key'],
      jwtSecret: 'test-secret',
      rateLimits: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100
      },
      cors: {
        allowedOrigins: ['http://localhost:3000'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    }));
  }

  async get(path: string, options?: RequestOptions): Promise<APIResponse> {
    return this.request('GET', path, options);
  }

  async post(path: string, data: any, options?: RequestOptions): Promise<APIResponse> {
    return this.request('POST', path, { ...options, body: data });
  }

  protected getResponseKey(): string {
    return 'aws';
  }
}

class QuantumEngine extends BaseEngine {
  constructor() {
    super(new SecurityManager({
      apiKeys: ['test-key'],
      jwtSecret: 'test-secret',
      rateLimits: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100
      },
      cors: {
        allowedOrigins: ['http://localhost:3000'],
        allowedMethods: ['GET', 'POST']
      }
    }));
  }

  async get(path: string, options?: RequestOptions): Promise<APIResponse> {
    return this.request('GET', path, options);
  }

  async execute(circuit: any): Promise<APIResponse> {
    return this.request('POST', '/execute', { body: circuit });
  }

  async measure(qubit: number): Promise<APIResponse> {
    return this.request('GET', `/measure/${qubit}`);
  }

  protected getResponseKey(): string {
    return 'quantum';
  }
}

class AIEngine extends BaseEngine {
  constructor() {
    super(new SecurityManager({
      apiKeys: ['test-key'],
      jwtSecret: 'test-secret',
      rateLimits: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100
      },
      cors: {
        allowedOrigins: ['http://localhost:3000'],
        allowedMethods: ['GET', 'POST']
      }
    }));
  }

  async get(path: string, options?: RequestOptions): Promise<APIResponse> {
    return this.request('GET', path, options);
  }

  async predict(data: any): Promise<APIResponse> {
    return this.request('POST', '/predict', { body: data });
  }

  async train(dataset: any): Promise<APIResponse> {
    return this.request('POST', '/train', { body: dataset });
  }

  protected getResponseKey(): string {
    return 'ai';
  }
}

export class APITestHelper {
  static aws = {
    mockResponses: new Map(),
    mockError: null,
    setMockResponse(operation: string, response: any) {
      this.mockResponses.set(operation, response);
    },
    setMockError(error: Error) {
      this.mockError = error;
    },
    clear() {
      this.mockResponses.clear();
      this.mockError = null;
    }
  };

  static quantum = {
    mockResponses: new Map(),
    mockError: null,
    setMockResponse(operation: string, response: any) {
      this.mockResponses.set(operation, response);
    },
    setMockError(error: Error) {
      this.mockError = error;
    },
    clear() {
      this.mockResponses.clear();
      this.mockError = null;
    }
  };

  static ai = {
    mockResponses: new Map(),
    mockError: null,
    setMockResponse(operation: string, response: any) {
      this.mockResponses.set(operation, response);
    },
    setMockError(error: Error) {
      this.mockError = error;
    },
    clear() {
      this.mockResponses.clear();
      this.mockError = null;
    }
  };

  static clearMocks() {
    this.aws.clear();
    this.quantum.clear();
    this.ai.clear();
  }
}

// Custom matchers for Jest
expect.extend({
  toBeValidAPIResponse(received: any) {
    const pass = received &&
      typeof received === 'object' &&
      typeof received.status === 'number' &&
      received.data !== undefined &&
      typeof received.headers === 'object';

    return {
      pass,
      message: () =>
        pass
          ? 'Expected response not to be a valid API response'
          : 'Expected response to be a valid API response with status, data, and headers'
    };
  }
}); 