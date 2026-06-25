import express from 'express';

import type { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './docs/openapi.js';

import { pinoHttp } from 'pino-http';
import { logger } from './config/logger.js';

import routes from './routes/index.js';

import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { env } from './config/env.js';

const app: Application = express();

// Rate Limiting
app.set('trust proxy', 1);

// Seguridad
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN,
  }),
);
// Parseo body
app.use(express.json());

// Logger
app.use(pinoHttp({ logger }));

// Documentación OpenAPI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get('/api/docs.json', (_req, res) => res.json(openApiDocument));

// Rutas
app.use('/api', routes);

// Manejo de rutas no encontradas (404)
app.use(notFound);

// Manejo de errores generícos (500)
app.use(errorHandler);

export default app;
