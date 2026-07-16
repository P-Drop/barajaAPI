import request from 'supertest';
import { vi, describe, it, expect } from 'vitest';
import argon2 from 'argon2';
import { SignJWT } from 'jose';

import app from '../../src/app.js';
import { userRepository } from '../../src/repositories/userRepository.js';

vi.mock('../../src/repositories/userRepository.js', () => ({
  userRepository: {
    createUser: vi.fn(),
    findByNickname: vi.fn(),
    findById: vi.fn(),
  },
}));

const TEST_PASSWORD = 'contraseñaCorrecta';
const testPasswordHash = await argon2.hash(TEST_PASSWORD); // Hash REAL

const fakeUser = {
  id: crypto.randomUUID(),
  nickname: 'userTest',
  nicknameNormalized: 'usertest',
  passwordHash: testPasswordHash,
  avatar: 'avatarTest.jpg',
  stars: 0,
  createdAt: new Date('2026-07-15'),
  totalPlaySeconds: 0,
  achievements: [],
  isActive: true,
};

const validLogin = {
  nickname: 'userTest',
  password: TEST_PASSWORD,
};

// Secret token para tests
const JWT_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

afterEach(() => vi.clearAllMocks());

describe('POST /api/v1/auth/login', () => {
  it('credenciales correctas -> 200 con token y usuario proyectado', async () => {
    vi.mocked(userRepository.findByNickname).mockResolvedValueOnce(fakeUser);

    const res = await request(app).post('/api/v1/auth/login').send(validLogin);

    expect(res.status).toBe(200);
    expect(res.body.token.split('.')).toHaveLength(3); // JWT: header.payload.firma
    expect(res.body.user).toEqual({
      id: fakeUser.id,
      nickname: 'userTest',
      avatar: 'avatarTest.jpg',
      stars: 0,
      totalPlaySeconds: 0,
      createdAt: '2026-07-15T00:00:00.000Z',
    });
    expect(userRepository.findByNickname).toHaveBeenCalledWith('usertest'); // normalización
  });

  it('inexistente, contraseña mala y cuenta desactivada -> el MISMO 401', async () => {
    // Escenario 1: el usuario no existe

    vi.mocked(userRepository.findByNickname).mockResolvedValueOnce(null);
    const noUser = await request(app)
      .post('/api/v1/auth/login')
      .send(validLogin);

    // Escenario 2: existe, contraseña incorrecta

    vi.mocked(userRepository.findByNickname).mockResolvedValueOnce(fakeUser);
    const badPass = await request(app)
      .post('/api/v1/auth/login')
      .send({
        ...validLogin,
        password: 'incorrectaPero10+',
      });

    // Escenario 3: existe, contraseña correcta, cuenta desactivada

    vi.mocked(userRepository.findByNickname).mockResolvedValueOnce({
      ...fakeUser,
      isActive: false,
    });
    const inactive = await request(app)
      .post('/api/v1/auth/login')
      .send(validLogin);

    // Contrato: Los tres indistinguibles para el cliente
    expect(noUser.status).toBe(401);
    expect(badPass.status).toBe(401);
    expect(inactive.status).toBe(401);
    expect(badPass.body).toEqual(noUser.body);
    expect(inactive.body).toEqual(noUser.body);
  });

  it('body sin password -> 400 sin tocar la persistencia', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ nickname: 'userTest' });

    expect(res.status).toBe(400);
    expect(userRepository.findByNickname).not.toHaveBeenCalled();
  });

  it('cuarta petición en la ventana -> 429 (anti fuerza bruta)', async () => {
    vi.mocked(userRepository.findByNickname).mockResolvedValueOnce(null);

    for (let i = 0; i < 3; i++) {
      await request(app).post('/api/v1/auth/login').send(validLogin);
    }

    const res = await request(app).post('/api/v1/auth/login').send(validLogin);

    expect(res.status).toBe(429);
  });
});

describe('GET /api/v1/auth/me', () => {
  // Simular login real para conseguir token
  const loginAndGetToken = async () => {
    vi.mocked(userRepository.findByNickname).mockResolvedValueOnce(fakeUser);
    const res = await request(app).post('/api/v1/auth/login').send(validLogin);

    return res.body.token as string;
  };

  it('sin header Authorization -> 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
  });

  it('esquema distinto de Bearer -> 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Basic dXNlcjpwYXNz');

    expect(res.status).toBe(401);
  });

  it('token con la firma manipulada -> 401', async () => {
    const token = await loginAndGetToken();
    const tampered = token.slice(0, -2) + 'xx'; // corrompe final de la firma

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tampered}`);

    expect(res.status).toBe(401);
  });

  it('token expirado -> 401', async () => {
    const expired = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(fakeUser.id)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(JWT_KEY);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
  });

  it('token válido -> 200 con el usuario del token', async () => {
    const token = await loginAndGetToken();
    vi.mocked(userRepository.findById).mockResolvedValueOnce(fakeUser);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(fakeUser.id);
    expect(userRepository.findById).toHaveBeenCalledWith(fakeUser.id);
  });

  it('token válido pero cuenta desactivada después -> 401', async () => {
    const token = await loginAndGetToken();
    vi.mocked(userRepository.findById).mockResolvedValueOnce({
      ...fakeUser,
      isActive: false,
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});
