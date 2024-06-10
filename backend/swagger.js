const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bleu.js API',
    version: '1.0.0',
    description: 'Documentation for the Bleu.js API - A powerful rules-based AI framework',
    contact: {
      name: 'Helloblue, Inc.',
      email: 'info@helloblue.ai',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    termsOfService: 'http://example.com/terms/',
  },
  servers: [
    {
      url: 'http://localhost:3003',
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
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
    {
      apiKeyAuth: [],
    },
  ],
  tags: [
    {
      name: 'General',
      description: 'General API Endpoints',
    },
    {
      name: 'AI',
      description: 'AI-related Endpoints',
    },
    {
      name: 'File',
      description: 'File Handling Endpoints',
    },
  ],
  paths: {
    '/': {
      get: {
        tags: ['General'],
        summary: 'Returns a greeting message',
        description: 'This endpoint returns a simple greeting message.',
        responses: {
          200: {
            description: 'A JSON object containing a greeting message',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Hello, World!',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/data': {
      post: {
        tags: ['General'],
        summary: 'Handle data posting',
        description: 'This endpoint handles data posting and returns a confirmation message.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'string',
                    example: 'sample data',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Data received',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Data received',
                    },
                    data: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad Request',
          },
          500: {
            description: 'Internal Server Error',
          },
        },
      },
    },
    '/upload': {
      post: {
        tags: ['File'],
        summary: 'Handle file upload',
        description: 'This endpoint handles file uploads.',
        consumes: ['multipart/form-data'],
        parameters: [
          {
            in: 'formData',
            name: 'data',
            type: 'file',
            description: 'The file to upload.',
          },
        ],
        responses: {
          201: {
            description: 'Data received',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Data received',
                    },
                    data: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad Request',
          },
        },
      },
    },
    '/ai/rules': {
      post: {
        tags: ['AI'],
        summary: 'Process data using rules-based AI',
        description: 'This endpoint processes data using a rules-based AI engine.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'string',
                    example: 'example',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'AI processing result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    result: {
                      type: 'string',
                      example: 'AI result',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/ai/nlp': {
      post: {
        tags: ['AI'],
        summary: 'Process text using NLP',
        description: 'This endpoint processes text using natural language processing (NLP).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string',
                    example: 'This is a test for NLP processing.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'NLP processing result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tokens: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                      example: ['This', 'is', 'a', 'test', 'for', 'NLP', 'processing'],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./server.js', './backend/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports.swaggerSpec = swaggerSpec;
