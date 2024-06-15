import swaggerJsdoc from 'swagger-jsdoc';

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
  apis: ['./src/routes/*.mjs'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
