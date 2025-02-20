import swaggerJSDoc from 'swagger-jsdoc';
import { createRequire } from 'module';

const require = createRequire(import.meta.url); // Needed for JSON import under NodeNext
const packageJson = require('../../package.json'); // Correct way to import JSON

/**
 * Swagger Configuration Interface
 */
interface SwaggerConfig {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name?: string;
      email?: string;
      url?: string;
    };
    license?: {
      name: string;
      url: string;
    };
  };
  servers: { url: string; description?: string }[];
  components?: {
    securitySchemes?: Record<string, any>;
    schemas?: Record<string, any>;
  };
  security?: { [key: string]: string[] }[];
  tags?: { name: string; description?: string }[];
}

/**
 * Base Swagger definition
 */
const swaggerDefinition: SwaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Bleu.js API',
    version: packageJson.version,
    description: 'RESTful API documentation for Bleu.js',
    contact: {
      name: 'API Support',
      email: 'apisupport@helloblue.ai',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.API_URL ?? 'http://localhost:3003',
      description: 'Development server',
    },
    {
      url: 'https://api.bleujs.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT Bearer token',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
        description: 'Enter API key',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          code: { type: 'integer', format: 'int32' },
          message: { type: 'string' },
          details: { type: 'array', items: { type: 'string' } },
        },
      },
      User: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', minLength: 2, maxLength: 50 },
          email: { type: 'string', format: 'email' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Rule: {
        type: 'object',
        required: ['name', 'data', 'createdBy'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', minLength: 2, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          data: { type: 'string' },
          isActive: { type: 'boolean', default: true },
          createdBy: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Rules', description: 'Rule management endpoints' },
  ],
};

/**
 * Swagger options configuration
 */
const swaggerOptions = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/routes/*.js', './dist/routes/*.js'],
  explorer: true,
};

/**
 * Generate Swagger specification
 */
const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;

/**
 * Utility function to serve Swagger UI
 */
export const serveSwaggerUI = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Bleu.js API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true,
  },
};
