// e2e del registro con repositorio mockeado (sin BD):
// cubre HTTP, validación Zod, proyección de respuesta y mapeo de errores
// El cableado real con Postgres vive en tests/integration/auth.integration.test.ts

import request from 'supertest';
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';

import app from '../../src/app.js';
import { userRepository } from '../../src/repositories/userRepository.js';
import { ConflictError } from '../../src/errors/ConflictError.js';

vi.mock('../../src/repositories/userRepository.js', () => ({
  userRepository: {
    createUser: vi.fn(),
  },
}));

const fakeUser = {
  id: crypto.randomUUID(),
  nickname: 'userTest',
  nicknameNormalized: 'usertest',
  passwordHash: 'passwordHashTooHard',
  avatar: 'avatarTest.jpg',
  stars: 0,
  createdAt: new Date('2026-07-13'),
  totalPlaySeconds: 0,
  achievements: [],
  isActive: true,
};

const validBody = {
  nickname: 'userTest',
  password: 'randompassword',
  avatar: 'avatarTest.jpg',
};

// Respuesta fakeUser para 201
beforeEach(() =>
  vi.mocked(userRepository.createUser).mockResolvedValue(fakeUser),
);

// Limpiar mock después de cada test
afterEach(() => vi.clearAllMocks());

describe('POST /api/v1/auth/register', () => {
  it('registro correcto -> 201', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: fakeUser.id,
      nickname: validBody.nickname,
      avatar: validBody.avatar,
      stars: 0,
      totalPlaySeconds: 0,
      createdAt: '2026-07-13T00:00:00.000Z',
    });
    // Redundante con .toEqual, pero asegura que el password no se envía
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(userRepository.createUser).toHaveBeenCalledTimes(1);
    expect(userRepository.createUser).toHaveBeenCalledWith({
      nickname: validBody.nickname,
      nicknameNormalized: validBody.nickname.toLowerCase(),
      avatar: validBody.avatar,
      passwordHash: expect.stringMatching(/^\$argon2id\$/),
    });
  });

  // Se ignoran los parámetros no incluidos en el esquema de registro
  it('claves no declaradas -> 201 con valores por defecto', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validBody, stars: 9999 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: fakeUser.id,
      nickname: validBody.nickname,
      avatar: validBody.avatar,
      stars: 0,
      totalPlaySeconds: 0,
      createdAt: '2026-07-13T00:00:00.000Z',
    });
  });

  // Edge cases -> Zod

  it.each([
    ['nickname corto', { nickname: 'ab' }],
    ['nickname largo', { nickname: 'a'.repeat(21) }],
    ['nickname con símbolo', { nickname: 'anon^mo' }],
    ['password corta', { password: 'corta' }],
    ['avatar vacío', { avatar: '' }],
    ['sin password', { password: undefined }],
    ['password larga', { password: 'a'.repeat(129) }],
  ])('%s -> 400', async (_name, override) => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validBody, ...override });
    expect(res.status).toBe(400);
    expect(userRepository.createUser).not.toHaveBeenCalled();
  });

  // Conflict Error -> 409
  it('nickname duplicado -> ConflictError : 409', async () => {
    vi.mocked(userRepository.createUser).mockRejectedValueOnce(
      new ConflictError('El nickname ya está en uso'),
    );

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validBody, nickname: 'userDuplicated' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('El nickname ya está en uso');
    expect(userRepository.createUser).toHaveBeenCalledTimes(1);
  });

  // Error 500 de proyección
  it('fila corrupta en BD (id no UUID) -> 500 sin filtrar internals', async () => {
    vi.mocked(userRepository.createUser).mockResolvedValueOnce({
      ...fakeUser,
      id: 'no-es-uuid',
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validBody);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error interno del servidor');
  });
});
