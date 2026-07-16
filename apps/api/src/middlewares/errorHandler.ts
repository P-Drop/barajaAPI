import type { Request, Response, NextFunction } from 'express';

import { z, ZodError } from 'zod';
import { DomainError } from '../errors/DomainError.js';
import { Sentry } from '../config/sentry.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Error 400: Bad Request
  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: 'Parámetros inválidos', details: z.flattenError(err) });
  }

  // Error 400: body JSON malformado (express.json antes de llegar a Zod)
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    return res.status(400).json({ error: 'JSON del body inválido' });
  }

  // Errores de dominio (Domain error y subclases): responden con el statusCode de la clase
  if (err instanceof DomainError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Error 500 genérico
  Sentry.withScope((scope) => {
    scope.setTag('request_id', String(req.id));
    Sentry.captureException(err);
  });
  req.log?.error({ err }, 'Error no controlado');
  res.status(500).json({
    error: 'Error interno del servidor',
    requestId: req.id,
  });
};
