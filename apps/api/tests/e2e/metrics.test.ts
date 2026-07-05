import request from 'supertest';
import { vi, describe, it, expect } from 'vitest';

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

describe('GET /metrics', () => {
  it('expone métricas en formato Prometheus (default de Node incluidas)', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('process_cpu_user_seconds_total');
  });

  it('registra la duración con la ruta plantilla (no la URL cruda)', async () => {
    await request(app).get('/api/health');
    const res = await request(app).get('/metrics');
    expect(res.text).toMatch(
      /http_request_duration_seconds_count\{[^}]*route="\/api\/health"[^}]*\}/,
    );
  });

  it('cuenta las operaciones de baraja', async () => {
    await request(app).get('/api/v1/deck');
    const res = await request(app).get('/metrics');
    expect(res.text).toMatch(/deck_operations_total\{operation="get"\} [1-9]/);
  });
});
