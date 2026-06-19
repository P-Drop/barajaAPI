import express from 'express';

import type { Application } from 'express';
import cors from 'cors';

import routes from './routes/index.js';

import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas base
app.use('/api', routes);

// Manejo de rutas no encontradas (404)
app.use(notFound)

// Manejo de errores generícos (500)
app.use(errorHandler)

export default app;