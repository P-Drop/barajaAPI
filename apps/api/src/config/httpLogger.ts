import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { logger } from './logger.js';

const HEALTH_PREFIX = '/api/health';

export const httpLogger = pinoHttp({
  logger,

  // Id por petición: respeta el entrante o genera uno
  // Siempre se devuelve al cliente
  genReqId: (req, res) => {
    const header = req.headers['x-request-id'];
    const id = (Array.isArray(header) ? header[0] : header) ?? randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },

  // Quitar ruido -> cada petición en mínimo útil
  serializers: {
    req: (
      req: IncomingMessage & { id?: string; method?: string; url?: string },
    ) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res: ServerResponse & { statusCode: number }) => ({
      statusCode: res.statusCode,
    }),
  },

  // Salud: éxito → debug (invisible con LOG_LEVEL=info)
  // Fallo → visible
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    const url =
      (req as IncomingMessage & { originalUrl?: string }).originalUrl ??
      req.url;
    if (url?.startsWith(HEALTH_PREFIX)) return 'debug';
    return 'info';
  },
});
