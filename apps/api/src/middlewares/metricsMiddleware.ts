import type { Request, Response, NextFunction } from 'express';
import { httpRequestDuration } from '../config/metrics.js';

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    // Plantilla de la ruta (cardinalidad)
    const path = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : 'unmatched';
    // Canónica: sin barra final (salvo la raíz)
    const route =
      path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
    end({ method: req.method, route, status_code: res.statusCode });
  });
  next();
};
