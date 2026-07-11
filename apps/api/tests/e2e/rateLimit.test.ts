import { describe, it, expect } from 'vitest';
import request from 'supertest';

// e2e sin BD: repositorio mockeado
vi.mock('../../src/repositories/cardRepository.js', () => ({
  cardRepository: {
    findFullDeck: vi
      .fn()
      .mockResolvedValue([
        { id: 1, value: 1, suit: 'OROS', isJoker: false, name: 'As de oros' },
      ]),
    findShortDeck: vi.fn(),
  },
}));

import app from '../../src/app.js';

describe('Rate limiting', () => {
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
