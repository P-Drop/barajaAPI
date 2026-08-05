import request from 'supertest';
import { describe, it, expect, afterEach, afterAll } from 'vitest';
import app from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import argon2 from 'argon2';
import { baseState } from '../unit/orda/helpers.js';
import { matchRepository } from '../../src/repositories/matchRepository.js';
import { rateLimitStore } from '../../src/middlewares/rateLimiter.js';

const PASSWORD = 'longTestPassword';
const PASSWORD_HASH = await argon2.hash(PASSWORD);
const NICKS = ['TestPlayer1', 'TestPlayer2', 'TestPlayer3'];

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

const winnableMatch = (over = {}) =>
  baseState({
    corners: {
      OROS: 12,
      COPAS: 11,
      ESPADAS: 12,
      BASTOS: 12,
    },
    hand: 'COPAS-12',
    ...over,
  });

const playWinningMove = (matchId: string, token: string, version: number) =>
  request(app)
    .post(`/api/v1/matches/${matchId}/moves`)
    .set(authHeader(token))
    .send({
      expectedVersion: version,
      move: {
        type: 'PLACE',
        from: { zone: 'hand' },
        to: { zone: 'corner', suit: 'COPAS' },
      },
    });

const seedUser = async (
  nickname: string,
  stars: number,
  totalPlaySeconds: number,
) => {
  await prisma.user.create({
    data: {
      nickname,
      nicknameNormalized: nickname.toLowerCase(),
      passwordHash: PASSWORD_HASH,
      avatar: `avatar_${nickname}.png`,
      stars,
      totalPlaySeconds,
    },
  });
};

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

describe('Integración: perfil de jugador y ranking público (BD real)', () => {
  it('consolidación transaccional -> acumula tiempo, estrellas y logro tras partida', async () => {
    // Registro
    await register(NICKS[0]);

    // Login
    const { token, userId } = await login(NICKS[0]);

    // Perfil de usuario inicial: sin estrellas, tiempo ni logro
    const initProfile = await request(app)
      .get('/api/v1/profile')
      .set(authHeader(token));

    expect(initProfile.status).toBe(200);
    expect(initProfile.body.stars).toBe(0);
    expect(initProfile.body.totalPlaySeconds).toBe(0);
    expect(initProfile.body.achievements).not.toContain('ESCALERA_MECANICA');

    // Fabricar partida a un movimiento de victoria y logro conseguido
    const nearWinState = winnableMatch({ stairwayUnlocked: true });
    const match = await matchRepository.create(userId, nearWinState);

    // 5 minutos de partida
    await prisma.match.update({
      where: { id: match.id },
      data: {
        startedAt: new Date(Date.now() - 300000),
      },
    });

    // Ganar partida
    const won = await playWinningMove(match.id, token, match.version);

    // Comprobar partida ganada
    expect(won.status).toBe(200);
    expect(won.body.status).toBe('WON');
    expect(won.body.finishedAt).not.toBeNull();

    // Comprobar acumulado en perfil: tiempo, estrellas y logro
    const profile = await request(app)
      .get('/api/v1/profile')
      .set(authHeader(token));

    expect(profile.status).toBe(200);
    expect(profile.body.stars).toBeGreaterThan(0);
    expect(profile.body.totalPlaySeconds).toBeGreaterThan(0);
    expect(profile.body.achievements).toContain('ESCALERA_MECANICA');
  });

  it('consolidación via expire (TTL/abandono) -> acumula tiempo, estrellas(0) y logro conseguido', async () => {
    // Registro
    await register(NICKS[0]);

    // Login
    const { token, userId } = await login(NICKS[0]);

    // Perfil de usuario inicial: sin estrellas, tiempo ni logro
    const initProfile = await request(app)
      .get('/api/v1/profile')
      .set(authHeader(token));

    expect(initProfile.status).toBe(200);
    expect(initProfile.body.stars).toBe(0);
    expect(initProfile.body.totalPlaySeconds).toBe(0);
    expect(initProfile.body.achievements).not.toContain('ESCALERA_MECANICA');

    // Fabricar partida a un movimiento de victoria y logro conseguido
    const nearWinState = winnableMatch({ stairwayUnlocked: true });
    const match = await matchRepository.create(userId, nearWinState);

    // Partida comenzó hace 30 minutos
    // 10 minutos de duración de partida
    // Último movimiento hace 20 minutos -> Supera TTL
    const startDate = new Date(Date.now() - 30 * 60000);
    const lastMoveDate = new Date(Date.now() - 20 * 60000);
    const matchDuration = Math.floor(
      (lastMoveDate.getTime() - startDate.getTime()) / 1000,
    );

    await prisma.match.update({
      where: { id: match.id },
      data: {
        startedAt: startDate,
        lastMoveAt: lastMoveDate,
      },
    });

    // Movimiento para ganar partida -> ABANDONADA
    const notWon = await playWinningMove(match.id, token, match.version);

    expect(notWon.status).toBe(409);
    expect(notWon.body.error).toBe('La partida ha expirado por inactividad');

    const res = await request(app)
      .get(`/api/v1/matches/${match.id}`)
      .set(authHeader(token));

    // Comprobar partida abandonada
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ABANDONED');
    expect(res.body.finishedAt).not.toBeNull();

    // Comprobar acumulado en perfil: tiempo, estrellas y logro
    rateLimitStore.resetAll();
    const profile = await request(app)
      .get('/api/v1/profile')
      .set(authHeader(token));

    expect(profile.status).toBe(200);
    expect(profile.body.stars).toBe(0);
    expect(profile.body.totalPlaySeconds).toBe(matchDuration);
    expect(profile.body.achievements).toContain('ESCALERA_MECANICA');
  });

  it('atomicidad del logro -> ESCALERA_MECANICA se añade 1 sola vez', async () => {
    // Registro
    await register(NICKS[0]);

    // Login
    const { token, userId } = await login(NICKS[0]);

    // Perfil de usuario inicial: logro conseguido
    await prisma.user.update({
      where: { id: userId },
      data: {
        achievements: ['ESCALERA_MECANICA'],
      },
    });

    const initProfile = await request(app)
      .get('/api/v1/profile')
      .set(authHeader(token));

    expect(initProfile.status).toBe(200);
    expect(initProfile.body.stars).toBe(0);
    expect(initProfile.body.achievements).toContain('ESCALERA_MECANICA');

    // Fabricar partida a un movimiento de victoria y logro conseguido
    const nearWinState = winnableMatch({ stairwayUnlocked: true });
    const match = await matchRepository.create(userId, nearWinState);

    // Ganar partida
    await playWinningMove(match.id, token, match.version);

    // Comprobar idempotencia del logro
    const profile = await request(app)
      .get('/api/v1/profile')
      .set(authHeader(token));

    expect(profile.status).toBe(200);
    expect(profile.body.stars).toBeGreaterThan(0);
    expect(profile.body.achievements).toStrictEqual(['ESCALERA_MECANICA']);
  });

  it('doble envío concurrente del movimiento ganador -> el perfil no se acumula dos veces', async () => {
    // Registro y login
    await register(NICKS[0]);
    const { token, userId } = await login(NICKS[0]);

    // Partida a un movimiento de ganar
    const match = await matchRepository.create(userId, winnableMatch());

    // Dos envíos concurrentes de la MISMA jugada ganadora, con la misma versión
    const [r1, r2] = await Promise.all([
      playWinningMove(match.id, token, match.version),
      playWinningMove(match.id, token, match.version),
    ]);

    // El candado optimista deja pasar solo uno: 200 (gana) + 409 (pierde la carrera)
    expect([r1.status, r2.status].sort()).toStrictEqual([200, 409]);

    // El ganador consolidó; el perdedor hizo rollback (count 0 -> no tocó el perfil)
    const winner = r1.status === 200 ? r1.body : r2.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Las estrellas se acumularon UNA sola vez (no el doble)
    expect(user!.stars).toBe(winner.stars);
  });

  it('desactivar usuarios -> desaparecen del ranking', async () => {
    // Simular usuarios con estadísticas deterministas
    for (const [i, nick] of NICKS.entries()) {
      await seedUser(nick, (i + 1) * 10, (i + 1) * 100);
    }

    // Visualizar ranking (contiene Player1)
    const res = await request(app).get('/api/v1/ranking');

    expect(res.status).toBe(200);
    expect(
      res.body.entries.map((e: { nickname: string }) => e.nickname),
    ).toContain(NICKS[0]);

    // Login y desactivar usuario
    const { token } = await login(NICKS[0]);

    await request(app)
      .delete('/api/v1/profile')
      .set(authHeader(token))
      .send({ password: PASSWORD });

    // Visualizar ranking sin usuario
    const updatedRanking = await request(app).get('/api/v1/ranking');

    expect(updatedRanking.status).toBe(200);
    expect(
      updatedRanking.body.entries.map((e: { nickname: string }) => e.nickname),
    ).not.toContain(NICKS[0]);
  });

  it('orden del ranking -> según estrellas y tiempos', async () => {
    // Simular estadísticas de usuarios
    await seedUser(NICKS[0], 20, 300); // 2º
    await seedUser(NICKS[1], 40, 300); // 1º
    await seedUser(NICKS[2], 20, 500); // 3º

    // Visualizar ranking ordenado
    const res = await request(app).get('/api/v1/ranking');

    expect(res.status).toBe(200);

    // Se filtran solo usuarios de esta suite
    const order = res.body.entries
      .map((e: { nickname: string }) => e.nickname)
      .filter((n: string) => NICKS.includes(n));
    expect(order).toStrictEqual([NICKS[1], NICKS[0], NICKS[2]]);
  });

  it('paginación real -> limit/offset recortan y total refleja el conjunto', async () => {
    await seedUser(NICKS[0], 9003, 300); // 1º
    await seedUser(NICKS[1], 9002, 300); // 2º
    await seedUser(NICKS[2], 9001, 300); // 3º

    const page1 = await request(app).get('/api/v1/ranking?limit=2&offset=0');
    expect(
      page1.body.entries.map((e: { nickname: string }) => e.nickname),
    ).toStrictEqual([NICKS[0], NICKS[1]]);

    const page2 = await request(app).get('/api/v1/ranking?limit=2&offset=2');
    expect(page2.body.entries[0].nickname).toBe(NICKS[2]);
  });
});
