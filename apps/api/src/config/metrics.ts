import client from 'prom-client';

export const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const deckOperations = new client.Counter({
  name: 'deck_operations_total',
  help: 'Operaciones de baraja servidas',
  labelNames: ['operation'],
  registers: [register],
});
