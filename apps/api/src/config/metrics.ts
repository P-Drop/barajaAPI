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

// Usuarios
export const authRegistrations = new client.Counter({
  name: 'auth_registrations_total',
  help: 'Usuarios registrados',
  registers: [register],
});

// Métricas Orda
export const ordaMatchesStarted = new client.Counter({
  name: 'orda_matches_started_total',
  help: 'Partidas iniciadas',
  registers: [register],
});

export const ordaMatchesFinished = new client.Counter({
  name: 'orda_matches_finished_total',
  help: 'Partidas finalizadas',
  labelNames: ['outcome'],
  registers: [register],
});

export const ordaMatchDurationSeconds = new client.Histogram({
  name: 'orda_match_duration_seconds',
  help: 'Duración de las partidas terminadas',
  buckets: [60, 120, 300, 600, 900, 1200, 1800, 3600],
  labelNames: ['outcome'],
  registers: [register],
});
