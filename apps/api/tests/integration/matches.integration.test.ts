import request from 'supertest';
import { describe, it, expect, afterEach, afterAll } from 'vitest';
import app from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { authRateLimitStore } from '../../src/middlewares/authLimiter.js';

const PASSWORD = 'longTestPassword';
const NICKS = ['OrdaTestPlayer1', 'OrdaTestPlayer2'];

const register = (nickname: string) =>
  request(app).post('/api/v1/auth/register').send({
    nickname,
    password: PASSWORD,
    avatar: 'test.png',
  });

const login = async (nickname: string) => {
  const res = await request(app).post('/api/v1/auth/login').send({
    nickname,
    password: PASSWORD,
  });

  return {
    token: res.body.token as string,
    userId: res.body.user.id as string,
  };
};

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

afterEach(async () => {
  const normalized = NICKS.map((n) => n.toLowerCase());
  // Borrar partidas antes que usuarios (FK onDelete: RESTRICT)
  await prisma.match.deleteMany({
    where: { user: { nicknameNormalized: { in: normalized } } },
  });
  await prisma.user.deleteMany({
    where: { nicknameNormalized: { in: normalized } },
  });
});

afterAll(async () => await prisma.$disconnect());

describe('Integración: Partidas Solitario Orda (BD Real)', () => {
  it('crear -> mover -> el estado y las columnas persisten en Postgres', async () => {
    await register(NICKS[0]);
    const { token, userId } = await login(NICKS[0]);

    const created = await request(app)
      .post('/api/v1/matches')
      .set(authHeader(token));

    expect(created.status).toBe(201);
    const { id, version } = created.body;

    const moved = await request(app)
      .post(`/api/v1/matches/${id}/moves`)
      .set(authHeader(token))
      .send({
        expectedVersion: version,
        move: { type: 'DRAW' },
      });

    expect(moved.status).toBe(200);
    expect(moved.body.version).toBe(version + 1);

    // Verificación directa en BD
    const row = await prisma.match.findUnique({ where: { id } });
    expect(row?.version).toBe(1);
    expect(row?.moveCount).toBe(1);
    expect(row?.userId).toBe(userId);
  });

  it('la partida de Player1 es invisible para Player2 -> 404', async () => {
    await register(NICKS[0]);
    await register(NICKS[1]);
    authRateLimitStore.resetAll();
    const player1 = await login(NICKS[0]);
    const player2 = await login(NICKS[1]);

    const created = await request(app)
      .post('/api/v1/matches')
      .set(authHeader(player1.token));
    const id = created.body.id;

    const player2Reads = await request(app)
      .get(`/api/v1/matches/${id}`)
      .set(authHeader(player2.token));
    expect(player2Reads.status).toBe(404);

    const player2Moves = await request(app)
      .post(`/api/v1/matches/${id}/moves`)
      .set(authHeader(player2.token))
      .send({ expectedVersion: 0, move: { type: 'DRAW' } });
    expect(player2Moves.status).toBe(404);
  });

  it('dos movimientos concurrentes con la misma versión -> uno 200, otro 409', async () => {
    await register(NICKS[0]);
    const { token } = await login(NICKS[0]);

    const created = await request(app)
      .post('/api/v1/matches')
      .set(authHeader(token));
    const id = created.body.id;

    const move = { expectedVersion: 0, move: { type: 'DRAW' } };
    const [r1, r2] = await Promise.all([
      request(app)
        .post(`/api/v1/matches/${id}/moves`)
        .set(authHeader(token))
        .send(move),
      request(app)
        .post(`/api/v1/matches/${id}/moves`)
        .set(authHeader(token))
        .send(move),
    ]);

    expect([r1.status, r2.status].sort()).toEqual([200, 409]);
  });

  it('segundo POST /matches con una activa -> 409', async () => {
    await register(NICKS[0]);
    const { token } = await login(NICKS[0]);

    const first = await request(app)
      .post('/api/v1/matches')
      .set(authHeader(token));

    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/matches')
      .set(authHeader(token));

    expect(second.status).toBe(409);
    expect(second.body.error).toBe('Ya tienes una partida en curso');
  });

  it('el índice parcial rechaza un segundo IN_PROGRESS a nivel BD', async () => {
    await register(NICKS[0]);
    const { token, userId } = await login(NICKS[0]);
    await request(app).post('/api/v1/matches').set(authHeader(token));

    // Insert directo a BD -> Postgres rechaza con P2002
    await expect(
      prisma.match.create({
        data: {
          userId,
          state: {} as never,
          status: 'IN_PROGRESS',
        },
      }),
    ).rejects.toThrow();
  });
});
