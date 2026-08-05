import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Rate limiting de partidas', () => {
  it('responde 429 al superar el límite en /v1/matches', async () => {
    const max = Number(process.env.MATCH_RATE_LIMIT_MAX); // 3 en tests

    // Sin token son 401, pero el limiter va ANTES de requireAuth y cuenta cada petición
    for (let i = 0; i < max; i++) {
      await request(app).get('/api/v1/matches/active');
    }
    const res = await request(app).get('/api/v1/matches/active'); // max + 1

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      error: 'Demasiadas peticiones, inténtalo más tarde.',
    });
    expect(res.headers['ratelimit']).toBeDefined(); // cabecera draft-7
  });
});
