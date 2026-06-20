import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { cardResponseSchema } from '../schemas/cardResponseSchema.js';
import { deckQuerySchema } from '../schemas/deckQuerySchema.js';

export const registry = new OpenAPIRegistry();

const errorSchema = z.object({ error: z.string() }).openapi('Error');

// Respuesta 200 común: array de cartas
const okDeck = {
  200: {
    description: 'Lista de cartas',
    content: { 'application/json': { schema: z.array(cardResponseSchema) } },
  },
};

// Decoradores de ruta
registry.registerPath({
  method: 'get',
  path: '/api/v1/deck',
  summary: 'Obtener la baraja (completa o corta)',
  request: { query: deckQuerySchema.pick({ short: true }) },
  responses: okDeck,
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/deck/shuffle',
  summary: 'Obtener la baraja barajada',
  request: { query: deckQuerySchema.pick({ short: true }) },
  responses: okDeck,
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/deck/draw',
  summary: 'Robar N cartas de una baraja barajada',
  request: { query: deckQuerySchema },
  responses: {
    ...okDeck,
    400: {
      description: 'Parámetros inválidos o count mayor que la baraja',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
});
