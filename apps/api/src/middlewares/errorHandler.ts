import type { Request, Response, NextFunction } from 'express';

import { z, ZodError } from 'zod';
import { DomainError } from '../errors/DomainError.js';

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

  // Error 400: Bad Request por count > tamaño baraja
  if (err instanceof DomainError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Error genérico
  req.log.error({ err }, 'Error no controlado');
  res.status(500).json({
    error: 'Error interno del servidor',
  });
};
