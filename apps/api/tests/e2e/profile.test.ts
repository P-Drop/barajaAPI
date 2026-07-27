import request from 'supertest';
import { vi, describe, it, expect, afterEach } from 'vitest';
import argon2 from 'argon2';

import { userRepository } from '../../src/repositories/userRepository.js';
import app from '../../src/app.js';
import { SignJWT } from 'jose';

vi.mock('../../src/repositories/userRepository.js', () => ({
  userRepository: {
    findByNickname: vi.fn(),
    findById: vi.fn(),
    updateAvatar: vi.fn(),
    deactivate: vi.fn(),
  },
}));

const TEST_PASSWORD = 'contraseñaCorrecta';
const testPasswordHash = await argon2.hash(TEST_PASSWORD);

const fakeUser = {
  id: crypto.randomUUID(),
  nickname: 'userTest',
  nicknameNormalized: 'usertest',
  passwordHash: testPasswordHash,
  avatar: 'avatarTest.jpg',
  stars: 33,
  createdAt: new Date('2026-06-01'),
  totalPlaySeconds: 123450,
  achievements: ['ESCALERA_MECANICA'],
  isActive: true,
};

// Secret token para tests
const JWT_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

const token = await new SignJWT({})
  .setProtectedHeader({ alg: 'HS256' })
  .setSubject(fakeUser.id)
  .setIssuedAt(new Date(Date.now()))
  .setExpirationTime('7d')
  .sign(JWT_KEY);

afterEach(() => vi.clearAllMocks());

describe('GET /profile', () => {
  it('sin token -> 401', async () => {
    const res = await request(app).get('/api/v1/profile');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('usuario activo -> 200 (con achievements, sin password) ', async () => {
    vi.mocked(userRepository.findById).mockResolvedValueOnce(fakeUser);

    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.achievements).toStrictEqual(['ESCALERA_MECANICA']);
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(userRepository.findById).toHaveBeenCalledWith(fakeUser.id);
  });

  it('usuario desactivado (isActive:false) -> 401', async () => {
    const inactiveUser = {
      ...fakeUser,
      isActive: false,
    };
    vi.mocked(userRepository.findById).mockResolvedValueOnce(inactiveUser);

    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });
});

describe('PATCH /profile', () => {
  it('avatar válido -> 200 con avatar nuevo', async () => {
    const userNewAvatar = {
      ...fakeUser,
      avatar: 'newAvatar.png',
    };

    vi.mocked(userRepository.findById).mockResolvedValueOnce(fakeUser);
    vi.mocked(userRepository.updateAvatar).mockResolvedValueOnce(userNewAvatar);

    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatar: 'newAvatar.png' });

    expect(res.status).toBe(200);
    expect(res.body.avatar).toBe('newAvatar.png');
    expect(userRepository.updateAvatar).toHaveBeenCalledWith(
      userNewAvatar.id,
      'newAvatar.png',
    );
  });

  it('body inválido -> 400', async () => {
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ wrongKey: 'newAvatar.png' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Parámetros inválidos');
    expect(userRepository.findById).not.toHaveBeenCalled();
    expect(userRepository.updateAvatar).not.toHaveBeenCalled();
  });

  it('sin token -> 401', async () => {
    const res = await request(app)
      .patch('/api/v1/profile')
      .send({ wrongKey: 'newAvatar.png' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
    expect(userRepository.findById).not.toHaveBeenCalled();
    expect(userRepository.updateAvatar).not.toHaveBeenCalled();
  });
});

describe('DELETE /profile', () => {
  it('contraseña correcta -> 204 (deactivate llamado)', async () => {
    vi.mocked(userRepository.findById).mockResolvedValueOnce(fakeUser);

    const res = await request(app)
      .delete('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(204);
    expect(res.body).toStrictEqual({});
    expect(userRepository.deactivate).toHaveBeenCalled();
  });

  it('contraseña incorrecta -> 401 (deactivate no llamado)', async () => {
    vi.mocked(userRepository.findById).mockResolvedValueOnce(fakeUser);

    const res = await request(app)
      .delete('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'wrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
    expect(userRepository.deactivate).not.toHaveBeenCalled();
  });

  it('sin token -> 401', async () => {
    const res = await request(app)
      .delete('/api/v1/profile')
      .send({ wrongKey: 'newAvatar.png' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
    expect(userRepository.findById).not.toHaveBeenCalled();
    expect(userRepository.deactivate).not.toHaveBeenCalled();
  });
});
