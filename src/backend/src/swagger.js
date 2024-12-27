/* eslint-env node */
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bleu.js API',
    version: '1.0.0',
    description: 'Documentation for the Bleu.js API',
  },
  servers: [
    {
      url: 'http://localhost:3003',
    },
  ],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
