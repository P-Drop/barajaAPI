import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { cardResponseSchema } from '../schemas/cardResponseSchema.js';
import { deckQuerySchema } from '../schemas/deckQuerySchema.js';
import { registerSchema } from '../schemas/registerSchema.js';
import { userResponseSchema } from '../schemas/userResponseSchema.js';
import { loginSchema } from '../schemas/loginSchema.js';
import { matchViewSchema } from '../schemas/matchViewSchema.js';
import { matchIdParamSchema } from '../schemas/matchIdParamSchema.js';
import { moveRequestSchema } from '../schemas/moveSchema.js';
import { profileResponseSchema } from '../schemas/profileResponseSchema.js';
import { profileUpdateSchema } from '../schemas/profileUpdateSchema.js';
import { deactivateSchema } from '../schemas/deactivateSchema.js';
import { rankingQuerySchema } from '../schemas/rankingQuerySchema.js';

export const registry = new OpenAPIRegistry();

// Esquemas
const errorSchema = z.object({ error: z.string() }).openapi('Error');
const userSchema = registry.register('User', userResponseSchema);
const matchView = registry.register('MatchView', matchViewSchema);
const profile = registry.register('Profile', profileResponseSchema);

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

// Registro de Usuarios
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  summary: 'Registrar un nuevo usuario',
  tags: ['Auth'],
  request: {
    body: {
      required: true,
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

// Token
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// Login
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  summary: 'Iniciar sesión',
  tags: ['Auth'],
  request: {
    body: {
      required: true,
      content: {
        'application/json': { schema: loginSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Login correcto',
      content: {
        'application/json': {
          schema: z.object({
            token: z.string(),
            user: userSchema,
          }),
        },
      },
    },
    400: errorResponse('Parametrós inválidos'),
    401: errorResponse('Credenciales inválidas'),
    429: errorResponse('Demasiadas peticiones'),
  },
});

// Me
registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/me',
  summary: 'Usuario autenticado actual',
  tags: ['Auth'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Usuario del token',
      content: { 'application/json': { schema: userSchema } },
    },
    401: errorResponse('Credenciales inválidas'),
  },
});

// Crear partida
registry.registerPath({
  method: 'post',
  path: '/api/v1/matches',
  summary: 'Crear una partida de Solitario Orda (el servidor baraja)',
  tags: ['Matches'],
  security: [{ bearerAuth: [] }],
  responses: {
    201: {
      description: 'Partida creada',
      content: { 'application/json': { schema: matchView } },
    },
    401: errorResponse('Credenciales inválidas'),
    409: errorResponse('Ya tienes una partida en curso'),
  },
});

// Consultar partida
registry.registerPath({
  method: 'get',
  path: '/api/v1/matches/{id}',
  summary: 'Obtener la vista de una partida propia',
  tags: ['Matches'],
  security: [{ bearerAuth: [] }],
  request: { params: matchIdParamSchema },
  responses: {
    200: {
      description: 'Vista de la partida',
      content: { 'application/json': { schema: matchView } },
    },
    400: errorResponse('Parámetros inválidos'),
    401: errorResponse('Credenciales inválidas'),
    404: errorResponse('Partida no encontrada'),
  },
});

// Aplicar movimiento
registry.registerPath({
  method: 'post',
  path: '/api/v1/matches/{id}/moves',
  summary: 'Aplicar un movimiento y obtener la vista actualizada',
  tags: ['Matches'],
  security: [{ bearerAuth: [] }],
  request: {
    params: matchIdParamSchema,
    body: { 
      required: true,
      content: { 'application/json': { schema: moveRequestSchema } }
    },
  },
  responses: {
    200: {
      description: 'Movimiento aplicado',
      content: { 'application/json': { schema: matchView } },
    },
    400: errorResponse('Movimiento o parámetros inválidos'),
    401: errorResponse('Credenciales inválidas'),
    404: errorResponse('Partida no encontrada'),
    409: errorResponse('Conflicto de versión o partida expirada'),
  },
});

// GET /profile
registry.registerPath({
  method: 'get',
  path: '/api/v1/profile',
  summary: 'Perfil propio',
  tags: ['Profile'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Perfil',
      content: { 'application/json': { schema: profile } },
    },
    401: errorResponse('Credenciales inválidas'),
  },
});

// PATCH /profile
registry.registerPath({
  method: 'patch',
  path: '/api/v1/profile',
  summary: 'Editar avatar',
  tags: ['Profile'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        'application/json': { schema: profileUpdateSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Perfil actualizado',
      content: { 'application/json': { schema: profile } },
    },
    400: errorResponse('Parámetros inválidos'),
    401: errorResponse('Credenciales inválidas'),
  },
});

// DELETE /profile
registry.registerPath({
  method: 'delete',
  path: '/api/v1/profile',
  summary: 'Desactivar cuenta (reconfirma contraseña)',
  tags: ['Profile'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        'application/json': { schema: deactivateSchema },
      },
    },
  },
  responses: {
    204: { description: 'Cuenta desactivada' },
    400: errorResponse('Parámetros inválidos'),
    401: errorResponse('Credenciales inválidas'),
  },
});

// GET /ranking
registry.registerPath({
  method: 'get',
  path: '/api/v1/ranking',
  summary: 'Ranking público de jugadores',
  tags: ['Ranking'],
  request: { query: rankingQuerySchema },
  responses: {
    200: {
      description: 'Página del ranking',
      content: {
        'application/json': {
          schema: z.object({
            total: z.number(),
            limit: z.number(),
            offset: z.number(),
            entries: z.array(
              z.object({
                nickname: z.string(),
                avatar: z.string(),
                stars: z.number(),
                totalPlaySeconds: z.number(),
              }),
            ),
          }),
        },
      },
    },
    400: errorResponse('Parámetros inválidos'),
  },
});
