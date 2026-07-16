// Integración contra BD real (docker compose): cubre el cableado
// service -> repository -> Prisma -> Postgres que los e2e mockean

import request from 'supertest';
import { describe, it, expect, afterAll, afterEach } from 'vitest';
import app from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';

const testUser = {
  nickname: 'P_Drop',
  password: 'longTestPassword',
  avatar: 'avatar.png',
};

const normalizedNickname = testUser.nickname.toLowerCase();

afterEach(async () => {
  await prisma.user.deleteMany({
    where: { nicknameNormalized: normalizedNickname },
  });
});

afterAll(async () => await prisma.$disconnect());

describe('POST /api/v1/auth/register (BD real)', () => {
  it('alta correcta -> 201 y fila en BD con hash argon2id', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('passwordHash');

    const user = await prisma.user.findUnique({
      where: { nicknameNormalized: normalizedNickname },
    });

    expect(user).not.toBeNull();
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it('nickname duplicado (case insensitive) -> 409 (unique sobre nicknameNormalized)', async () => {
    const firstRegister = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);
    expect(firstRegister.status).toBe(201);

    const duplicateRegister = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, nickname: 'p_DROP' });

    expect(duplicateRegister.status).toBe(409);
    expect(duplicateRegister.body.error).toBe('El nickname ya está en uso');
  });
});

describe('Login y /me (BD real)', () => {
  it('cadena completa: register -> login -> me', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);

    const login = await request(app).post('/api/v1/auth/login').send({
      nickname: testUser.nickname,
      password: testUser.password,
    });

    expect(login.status).toBe(200);

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(me.status).toBe(200);
    expect(me.body.nickname).toBe(testUser.nickname);
  });

  it('contraseña incorrecta -> 401', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);
    const res = await request(app).post('/api/v1/auth/login').send({
      nickname: testUser.nickname,
      password: 'otraDistinta1234',
    });

    expect(res.status).toBe(401);
  });
});
