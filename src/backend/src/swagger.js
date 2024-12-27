/* eslint-env node */
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bleu.ts API',
    version: '1.0.0',
    description: 'Documentation for the Bleu.ts API',
  },
  servers: [
    {
      url: 'http://localhost:3003',
    },
  ],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
