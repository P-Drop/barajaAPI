import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { cardResponseSchema } from '../schemas/cardResponseSchema.js';
import { deckQuerySchema } from '../schemas/deckQuerySchema.js';
import { registerSchema } from '../schemas/registerSchema.js';
import { userResponseSchema } from '../schemas/userResponseSchema.js';

export const registry = new OpenAPIRegistry();

// Esquemas
const errorSchema = z.object({ error: z.string() }).openapi('Error');
const userSchema = registry.register('User', userResponseSchema);

// Respuesta 200 común: array de cartas
const okDeck = {
  200: {
    description: 'Lista de cartas',
    content: { 'application/json': { schema: z.array(cardResponseSchema) } },
  },
};

// Respuesta de error común
const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorSchema } },
});

// Baraja API: Deck
registry.registerPath({
  method: 'get',
  path: '/api/v1/deck',
  summary: 'Obtener la baraja (completa o corta)',
  tags: ['Deck'],
  request: { query: deckQuerySchema.pick({ short: true }) },
  responses: okDeck,
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/deck/shuffle',
  summary: 'Obtener la baraja barajada',
  tags: ['Deck'],
  request: { query: deckQuerySchema.pick({ short: true }) },
  responses: okDeck,
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/deck/draw',
  summary: 'Robar N cartas de una baraja barajada',
  tags: ['Deck'],
  request: { query: deckQuerySchema },
  responses: {
    ...okDeck,
    400: errorResponse('Parámetros inválidos o count mayor que la baraja'),
  },
});

// Usuarios
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  summary: 'Registrar un nuevo usuario',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': { schema: registerSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Nuevo usuario registrado',
      content: { 'application/json': { schema: userSchema } },
    },
    400: errorResponse('Parámetros inválidos'),
    409: errorResponse('El nickname ya está en uso'),
  },
});
