import type { Request, Response, NextFunction } from 'express';

import { z, ZodError } from 'zod';
import { DomainError } from '../errors/DomainError.js';
import { Prisma } from '../generated/prisma/client.js';
import { Sentry } from '../config/sentry.js';

// Fallos transitorios de BD (conexión/pool): resolver reintentando
const TRANSIENT_DB_CODES = new Set([
  'P2024',
  'P1001',
  'P1002',
  'P1008',
  'P1017',
]);

function isTransientDbError(err: Error): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_DB_CODES.has(err.code);
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    // Fallo al conectar/inicializar => conectividad. P1000 (auth) no es transitorio
    return err.errorCode === undefined || TRANSIENT_DB_CODES.has(err.errorCode);
  }
  return false;
}

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

  // Fallo transitorio de BD: 503 retryable, log warn y SIN Sentry
  if (isTransientDbError(err)) {
    req.log?.warn({ err }, 'Fallo transitorio de BD');
    res.setHeader('Retry-After', '2');
    return res.status(503).json({
      error:
        'Servicio no disponible temporalmente, reinténtalo en unos segundos',
    });
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
