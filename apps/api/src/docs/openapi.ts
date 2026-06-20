import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry.js';

export const openApiDocument = new OpenApiGeneratorV31(
  registry.definitions,
).generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'barajaAPI',
    version: '1.0.0',
    description: 'API REST de la baraja española',
  },
  servers: [{ url: 'http://localhost:3000' }],
});
