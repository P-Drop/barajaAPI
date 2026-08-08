import type { Request, Response, NextFunction } from 'express';
import { httpRequestDuration } from '../config/metrics.js';

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    // req.baseUrl NO es fiable aquí (Express lo restaura al propagar errores):
    // se usa el prefijo congelado por tagRoutePrefix. req.route sí sobrevive.
    const prefix = req.routePrefix ?? '';
    const path = req.route?.path
      ? `${prefix}${req.route.path}`
      : prefix || 'unmatched';
    // Canónica: sin barra final (salvo la raíz)
    const route =
      path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
    end({ method: req.method, route, status_code: res.statusCode });
  });
  next();
};
