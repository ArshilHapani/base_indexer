import yaml from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const swaggerSpec = yaml.load('./docs/openapi.yaml');

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger docs available at http://localhost:5000/api-docs');
};
