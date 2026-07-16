import request from 'supertest';
import { vi, describe, it, expect } from 'vitest';

import app from '../../src/app.js';
import { userRepository } from '../../src/repositories/userRepository.js';

vi.mock('../../src/repositories/userRepository.js', () => ({
  userRepository: {
    createUser: vi.fn(),
  },
}));

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
});
