import request from 'supertest';
import { vi, describe, it, expect } from 'vitest';
import { SignJWT } from 'jose';

import app from '../../src/app.js';
import { matchRepository } from '../../src/repositories/matchRepository.js';
import { userRepository } from '../../src/repositories/userRepository.js';
import { createGame } from '../../src/games/orda/deck.js';
import { baseState } from '../unit/orda/helpers.js';

// Repositorios mocked
vi.mock('../../src/repositories/matchRepository.js', () => ({
  matchRepository: {
    create: vi.fn(),
    findByIdForUser: vi.fn(),
    updateWithVersion: vi.fn(),
    consolidateFinish: vi.fn(),
    findActiveByUser: vi.fn(),
  },
}));

vi.mock('../../src/repositories/userRepository.js', () => ({
  userRepository: { findById: vi.fn() },
}));

// Autenticación JWT
const JWT_KEY = new TextEncoder().encode(process.env.JWT_SECRET);
const userId = crypto.randomUUID();
const token = await new SignJWT({})
  .setProtectedHeader({ alg: 'HS256' })
  .setSubject(userId)
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(JWT_KEY);
const auth = { Authorization: `Bearer ${token}` };

const fakeUser = { id: userId, achievements: [], isActive: true };

// Factoría de partidas (sobreescribible)
const makeMatch = (over = {}) => ({
  id: crypto.randomUUID(),
  userId,
  state: createGame(Math.random, { stairway: false }),
  version: 0,
  status: 'IN_PROGRESS',
  stars: 0,
  moveCount: 0,
  startedAt: new Date(),
  lastMoveAt: new Date(),
  finishedAt: null,
  ...over,
});

afterEach(() => vi.clearAllMocks());

describe('POST /api/v1/matches', () => {
  it('Auth obligatorio: sin token -> 401', async () => {
    const res = await request(app).post('/api/v1/matches');
    expect(res.status).toBe(401);
  });

  it('Crear con éxito: sin partida activa -> 201 con stock oculto (PlayerView)', async () => {
    vi.mocked(userRepository.findById).mockResolvedValueOnce(fakeUser as never);
    vi.mocked(matchRepository.findActiveByUser).mockResolvedValueOnce(null);
    vi.mocked(matchRepository.create).mockResolvedValueOnce(
      makeMatch() as never,
    );

    const res = await request(app).post('/api/v1/matches').set(auth);

    expect(res.status).toBe(201);
    expect(res.body.view.stock).toEqual({ count: expect.any(Number) });
    expect(Array.isArray(res.body.view.stock)).toBe(false);
    expect(res.body.version).toBe(0);
  });

  it('Una sola partida: con partida activa -> 409 sin crear otra', async () => {
    vi.mocked(userRepository.findById).mockResolvedValueOnce(fakeUser as never);
    vi.mocked(matchRepository.findActiveByUser).mockResolvedValueOnce(
      makeMatch() as never,
    );

    const res = await request(app).post('/api/v1/matches').set(auth);

    expect(res.status).toBe(409);
    expect(matchRepository.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/matches/:id', () => {
  it('Partida caducada: supera TTL -> consolida "ABANDONED"', async () => {
    const stale = makeMatch({ lastMoveAt: new Date(Date.now() - 20 * 60_000) });
    vi.mocked(matchRepository.findByIdForUser).mockResolvedValueOnce(
      stale as never,
    );
    vi.mocked(matchRepository.consolidateFinish).mockResolvedValueOnce(1);

    const res = await request(app).get(`/api/v1/matches/${stale.id}`).set(auth);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ABANDONED');
    expect(matchRepository.consolidateFinish).toHaveBeenCalledWith(
      stale.id,
      userId,
      0,
      expect.objectContaining({ status: 'ABANDONED', stars: 0 }), // matchData
      expect.objectContaining({ stars: 0 }), // userDelta
    );
  });

  it('Partida ajena/inexistente -> 404', async () => {
    vi.mocked(matchRepository.findByIdForUser).mockResolvedValueOnce(null);

    const res = await request(app)
      .get(`/api/v1/matches/${crypto.randomUUID()}`)
      .set(auth);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Partida no encontrada');
  });

  it(':id no es UUID -> 400 (Zod)', async () => {
    const matchId = 'no-uuid';

    const res = await request(app).get(`/api/v1/matches/${matchId}`).set(auth);

    expect(res.status).toBe(400);
  });

  it('Partida en curso, no caducada -> 200, status: "IN_PROGRESS"', async () => {
    const match = makeMatch();
    vi.mocked(matchRepository.findByIdForUser).mockResolvedValueOnce(
      match as never,
    );

    const res = await request(app).get(`/api/v1/matches/${match.id}`).set(auth);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_PROGRESS');
  });
});

describe('POST /api/v1/matches/:id/moves', () => {
  it('Conflicto de versión: move con expectedVersion desfasado -> 409 sin escribir', async () => {
    const match = makeMatch({ version: 3 });
    vi.mocked(matchRepository.findByIdForUser).mockResolvedValueOnce(
      match as never,
    );

    const res = await request(app)
      .post(`/api/v1/matches/${match.id}/moves`)
      .set(auth)
      .send({ expectedVersion: 1, move: { type: 'DRAW' } });

    expect(res.status).toBe(409);
    expect(matchRepository.updateWithVersion).not.toHaveBeenCalled();
  });

  it('Movimiento legal -> 200, version + 1, updateWithVersion llamado', async () => {
    const match = makeMatch({ version: 7 });
    vi.mocked(matchRepository.findByIdForUser).mockResolvedValueOnce(
      match as never,
    );
    vi.mocked(matchRepository.updateWithVersion).mockResolvedValueOnce(1);

    const res = await request(app)
      .post(`/api/v1/matches/${match.id}/moves`)
      .set(auth)
      .send({ expectedVersion: 7, move: { type: 'DRAW' } });

    expect(res.status).toBe(200);
    expect(matchRepository.updateWithVersion).toHaveBeenCalled();
    expect(res.body.version).toBe(8);
  });

  it('Movimiento ilegal -> 400 (DomainError)', async () => {
    const match = makeMatch({
      state: baseState({
        cross: [['OROS-3'], [], [], [], []],
        hand: 'OROS-2',
      }),
    });
    vi.mocked(matchRepository.findByIdForUser).mockResolvedValueOnce(
      match as never,
    );

    const res = await request(app)
      .post(`/api/v1/matches/${match.id}/moves`)
      .set(auth)
      .send({
        expectedVersion: 0,
        move: {
          type: 'PLACE',
          from: { zone: 'hand' },
          to: { zone: 'cross', index: 0 },
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('movimiento ilegal');
  });

  it('Body con move inválido (sin type) -> 400 (Zod) sin tocar el repo', async () => {
    const res = await request(app)
      .post(`/api/v1/matches/${crypto.randomUUID()}/moves`)
      .set(auth)
      .send({
        expectedVersion: 0,
        move: {
          from: { zone: 'hand' },
          to: { zone: 'cross', index: 0 },
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Parámetros inválidos');
    expect(matchRepository.findByIdForUser).not.toHaveBeenCalled();
  });

  it('Carrera: updateWithVersion devuelve 0 (cambió la versión) -> 409', async () => {
    const match = makeMatch({ version: 5 });

    vi.mocked(matchRepository.findByIdForUser).mockResolvedValue(
      match as never,
    );
    vi.mocked(matchRepository.updateWithVersion).mockResolvedValueOnce(0);

    const res = await request(app)
      .post(`/api/v1/matches/${match.id}/moves`)
      .set(auth)
      .send({ expectedVersion: 5, move: { type: 'DRAW' } });

    expect(res.status).toBe(409);
  });

  it('Movimiento ganador -> 200, status: "WON", stars > 0', async () => {
    const match = makeMatch({
      state: baseState({
        corners: {
          OROS: 11,
          COPAS: 12,
          BASTOS: 12,
          ESPADAS: 12,
        },
        hand: 'OROS-12',
      }),
      version: 100,
    });
    vi.mocked(matchRepository.findByIdForUser).mockResolvedValueOnce(
      match as never,
    );
    vi.mocked(matchRepository.consolidateFinish).mockResolvedValueOnce(1);

    const res = await request(app)
      .post(`/api/v1/matches/${match.id}/moves`)
      .set(auth)
      .send({
        expectedVersion: 100,
        move: {
          type: 'PLACE',
          from: { zone: 'hand' },
          to: { zone: 'corner', suit: 'OROS' },
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('WON');
    expect(res.body.stars).toBeGreaterThan(0);
  });

  it('Abandono -> 200, status :"ABANDONED"', async () => {
    const match = makeMatch();
    vi.mocked(matchRepository.findByIdForUser).mockResolvedValueOnce(
      match as never,
    );
    vi.mocked(matchRepository.consolidateFinish).mockResolvedValueOnce(1);

    const res = await request(app)
      .post(`/api/v1/matches/${match.id}/moves`)
      .set(auth)
      .send({ expectedVersion: 0, move: { type: 'ABANDON' } });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ABANDONED');
  });
});
