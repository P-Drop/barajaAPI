import { vi, describe, it, expect } from 'vitest';
import request from 'supertest';
import { SignJWT } from 'jose';
import app from '../../src/app.js';

// El limiter por jugador va DESPUÉS de requireAuth.
// Peticiones CON token -> service
vi.mock('../../src/repositories/matchRepository.js', () => ({
  matchRepository: {
    findActiveByUser: vi.fn().mockResolvedValue(null),
    findByIdForUser: vi.fn(),
    create: vi.fn(),
    updateWithVersion: vi.fn(),
    consolidateFinish: vi.fn(),
    countActive: vi.fn(),
  },
}));

const JWT_KEY = new TextEncoder().encode(process.env.JWT_SECRET);
const authFor = async (sub: string) => ({
  Authorization: `Bearer ${await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(JWT_KEY)}`,
});

const ipMax = Number(process.env.MATCH_IP_RATE_LIMIT_MAX); // 10 en tests
const userMax = Number(process.env.MATCH_RATE_LIMIT_MAX); // 3 en tests

describe('Rate limiting de partidas: capa por IP (antes de auth)', () => {
  it('sin token: al superar el límite de la IP -> 429', async () => {
    // Sin token -> 401, pero el limiter va antes de requireAuth y los cuenta
    for (let i = 0; i < ipMax; i++) {
      const res = await request(app).get('/api/v1/matches/active');
      expect(res.status).toBe(401);
    }

    const res = await request(app).get('/api/v1/matches/active'); // ipMax + 1

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      error: 'Demasiadas peticiones, inténtalo más tarde.',
    });
    expect(res.headers['ratelimit']).toBeDefined(); // cabecera draft-7
  });
});

describe('Rate limiting de partidas: capa por jugador (tras auth)', () => {
  it('con token: al agotar la cuota del jugador -> 429', async () => {
    const auth = await authFor(crypto.randomUUID());

    // Sin partida activa -> 404: se mide CUANDO aparece 429
    for (let i = 0; i < userMax; i++) {
      const res = await request(app).get('/api/v1/matches/active').set(auth);
      expect(res.status).toBe(404);
    }

    const res = await request(app).get('/api/v1/matches/active').set(auth);

    expect(res.status).toBe(429);
  });

  it('la cuota es POR jugador: A agotado no bloquea a B desde la misma IP', async () => {
    const authA = await authFor(crypto.randomUUID());
    const authB = await authFor(crypto.randomUUID());

    for (let i = 0; i < userMax; i++) {
      await request(app).get('/api/v1/matches/active').set(authA);
    }

    const blocked = await request(app).get('/api/v1/matches/active').set(authA);
    expect(blocked.status).toBe(429);

    // Misma IP, distinto jugador -> no bloquea
    const other = await request(app).get('/api/v1/matches/active').set(authB);
    expect(other.status).toBe(404);
  });
});
