import express from 'express';

import type { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import routes from './routes/index.js';

import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { env } from './config/env.js';

const app: Application = express();

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

// Rutas
app.use('/api', routes);

// Manejo de rutas no encontradas (404)
app.use(notFound);

// Manejo de errores generícos (500)
app.use(errorHandler);

export default app;
