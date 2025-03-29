import { BleuConfig } from '../types';

export const DEFAULT_CONFIG: BleuConfig = {
  apiKey: '',
  version: '1.1.2',
  server: {
    port: 3000,
    host: 'localhost',
    cors: {
      allowedOrigins: ['*'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    },
    middleware: {
      compression: true,
      bodyParser: true,
      requestLogging: true
    }
  },
  model: {
    name: 'default',
    version: '1.0.0',
    architecture: 'transformer',
    maxSequenceLength: 512,
    temperature: 0.7,
    maxTokens: 2000,
    quantumEnabled: false
  },
  security: {
    encryption: {
      algorithm: 'AES-256-GCM',
      keySize: 256,
      quantumResistant: false
    },
    authentication: {
      type: 'jwt',
      jwtSecret: undefined,
      tokenExpiration: 3600
    },
    authorization: {
      roles: ['user', 'admin'],
      permissions: {
        user: ['read'],
        admin: ['read', 'write', 'delete']
      }
    },
    audit: {
      enabled: true,
      logLevel: 'info',
      retention: 30
    }
  },
  monitoring: {
    metrics: {
      enabled: true,
      interval: 60000,
      customMetrics: ['latency', 'throughput', 'errorRate']
    },
    logging: {
      level: 'info',
      format: 'json',
      destination: 'console'
    },
    alerts: {
      enabled: true,
      thresholds: {
        cpu: 80,
        memory: 90,
        errorRate: 0.1
      },
      channels: ['email', 'slack']
    }
  },
  deployment: {
    environment: 'development',
    region: 'us-east-1',
    scaling: {
      minInstances: 1,
      maxInstances: 5,
      targetCPUUtilization: 70
    },
    resources: {
      cpu: '1',
      memory: '2Gi',
      gpu: undefined
    }
  },
  performance: {
    enableGPU: false,
    enableTPU: false,
    enableDistributedTraining: false,
    batchSize: 32,
    cacheSize: 1000,
    optimizations: ['tensorflowjs', 'webgl']
  }
}; 