import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { fakeScope } = vi.hoisted(() => ({
  fakeScope: { setTag: vi.fn() },
}));

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  withScope: vi.fn((cb: (s: typeof fakeScope) => void) => cb(fakeScope)),
}));

vi.mock('../../src/repositories/userRepository.js', () => ({
  userRepository: {
    createUser: vi.fn(),
    ranking: vi.fn(),
  },
}));

import app from '../../src/app.js';
import { userRepository } from '../../src/repositories/userRepository.js';
import { captureException } from '@sentry/node';
import { Prisma } from '../../src/generated/prisma/client.js';

const mockCapture = vi.mocked(captureException);
const mockRanking = vi.mocked(userRepository.ranking);

beforeEach(() => vi.clearAllMocks());

describe('Manejo de errores', () => {
  it('body con JSON malformado -> 400 JSON (sin HTML internals)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Content-type', 'application/json')
      .send('{"nickname": "whatever",}'); // coma final incorrecta

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.error).toBe('JSON del body inválido');
    expect(userRepository.createUser).not.toHaveBeenCalled();
  });

  it('transitorio de BD (P2024, KnownRequestError) -> 503 retryable y sin Sentry', async () => {
    mockRanking.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('pool timeout', {
        code: 'P2024',
        clientVersion: '6.19.3',
      }),
    );

    const res = await request(app).get('/api/v1/ranking');

    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/temporalmente/i);
    expect(res.headers['retry-after']).toBe('2');
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it('transitorio de BD (InitializationError, P1001) -> 503', async () => {
    mockRanking.mockRejectedValue(
      new Prisma.PrismaClientInitializationError(
        'cannot reach database',
        '6.19.3',
        'P1001',
      ),
    );

    const res = await request(app).get('/api/v1/ranking');

    expect(res.status).toBe(503);
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it('error de BD NO transitorio (P2002) -> 500 y sí reporta a Sentry', async () => {
    mockRanking.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique constraint', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );

    const res = await request(app).get('/api/v1/ranking');

    expect(res.status).toBe(500);
    expect(mockCapture).toHaveBeenCalledOnce();
  });
});
