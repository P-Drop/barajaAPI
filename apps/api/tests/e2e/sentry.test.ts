import request from 'supertest';
import { vi, describe, it, expect } from 'vitest';

const { fakeScope } = vi.hoisted(() => ({
  fakeScope: { setTag: vi.fn() },
}));

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  withScope: vi.fn((callback: (scope: typeof fakeScope) => void) =>
    callback(fakeScope),
  ),
}));

vi.mock('../../src/repositories/cardRepository.js', () => ({
  cardRepository: {
    findFullDeck: vi.fn(),
    findShorDeck: vi.fn(),
  },
}));

import app from '../../src/app.js';
import { captureException } from '@sentry/node';
import { cardRepository } from '../../src/repositories/cardRepository.js';

const mockCapture = vi.mocked(captureException);
const mockFindFullDeck = vi.mocked(cardRepository.findFullDeck);

describe('Senty (política de reporte de errores)', () => {
  it('un error no contolado (500) se reporta con el request-id como tag', async () => {
    mockFindFullDeck.mockRejectedValue(new Error('boom'));

    const res = await request(app).get('/api/v1/deck');

    expect(res.status).toBe(500);
    expect(mockCapture).toHaveBeenCalledOnce();
    expect(mockCapture).toHaveBeenCalledWith(expect.any(Error));
    expect(fakeScope.setTag).toHaveBeenCalledWith(
      'request_id',
      res.headers['x-request-id'],
    );
  });

  it('un DomainError(400) NO se reporta', async () => {
    mockFindFullDeck.mockResolvedValue([
      {
        id: 1,
        value: 1,
        suit: 'OROS' as const,
        isJoker: false,
        name: 'As de oros',
      },
    ]);

    const res = await request(app).get('/api/v1/deck/draw?count=100');

    expect(res.status).toBe(400);
    expect(mockCapture).not.toHaveBeenCalled();
  });
});
