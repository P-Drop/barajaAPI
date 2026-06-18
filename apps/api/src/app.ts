import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas base
app.use('/api', routes);

// Manejo de rutas no encontradas (404)
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
})

export default app;