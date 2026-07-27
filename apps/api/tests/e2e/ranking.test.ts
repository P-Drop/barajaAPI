import request from 'supertest';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { userRepository } from '../../src/repositories/userRepository.js';
import app from '../../src/app.js';

vi.mock('../../src/repositories/userRepository.js', () => ({
  userRepository: {
    ranking: vi.fn(),
  },
}));

const fakeRanking = {
  total: 4,
  entries: [
    {
      nickname: 'player1',
      avatar: 'avatar1.png',
      stars: 20,
      totalPlaySeconds: 300,
    },
    {
      nickname: 'player2',
      avatar: 'avatar2.png',
      stars: 20,
      totalPlaySeconds: 500,
    },
    {
      nickname: 'player3',
      avatar: 'avatar3.png',
      stars: 10,
      totalPlaySeconds: 300,
    },
    {
      nickname: 'player4',
      avatar: 'avatar4.png',
      stars: 10,
      totalPlaySeconds: 500,
    },
  ],
};

afterEach(() => vi.clearAllMocks());

describe('GET /ranking', () => {
  it('con parámetros -> 200, lista con total/entries y limit/offset (query)', async () => {
    vi.mocked(userRepository.ranking).mockResolvedValueOnce(fakeRanking);

    const res = await request(app).get('/api/v1/ranking?offset=0&limit=4');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(4);
    expect(res.body.offset).toBe(0);
    expect(res.body.limit).toBe(4);
    expect(res.body.entries).toStrictEqual(fakeRanking.entries);
  });

  it('sin parámetros -> defaults limit=20, offset=0', async () => {
    vi.mocked(userRepository.ranking).mockResolvedValueOnce(fakeRanking);

    const res = await request(app).get('/api/v1/ranking');

    expect(res.status).toBe(200);
    expect(res.body.offset).toBe(0);
    expect(res.body.limit).toBe(20);
    expect(userRepository.ranking).toHaveBeenCalledWith(20, 0);
  });

  it('parámetro limit=9999 -> 400 (tope máximo 100)', async () => {
    const res = await request(app).get('/api/v1/ranking?limit=9999');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Parámetros inválidos');
    expect(userRepository.ranking).not.toHaveBeenCalled();
  });
});
