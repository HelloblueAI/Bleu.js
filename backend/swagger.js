const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./server.js', './src/routes.js'], // Add other files as needed
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports.swaggerSpec = swaggerSpec;
