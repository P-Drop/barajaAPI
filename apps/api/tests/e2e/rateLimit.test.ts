import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

// Reutiliza el Mock del repositorio del resto de test e2e
describe('Rate limitng', () => {
  it('responde 429 al superar el límite', async () => {
    const max = Number(process.env.RATE_LIMIT_MAX); // 3
    for (let i = 0; i < max; i++) {
      await request(app).get('/api/v1/deck').expect(200);
    }
    const res = await request(app).get('/api/v1/deck').expect(429);
    expect(res.body).toEqual({
      error: 'Demasiadas peticiones, inténtalo más tarde.',
    });
    expect(res.headers['ratelimit']).toBeDefined();
  });

  it('no aplica límite a /api/health', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).get('/api/health').expect(200);
    }
  });
});
