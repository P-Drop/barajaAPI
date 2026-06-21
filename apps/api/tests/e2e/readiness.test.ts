import request from 'supertest';
import { vi, describe, it, expect } from 'vitest';

vi.mock('../../src/db/prisma.js', () => ({
  prisma: { $queryRaw: vi.fn() },
}));

import app from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';

describe('Readiness (/api/health/ready', () => {
  it('200 "ready" cuando BD responde', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ ok: 1 }]);
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });

  it('503 "not ready" cuando la BD falla', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(
      new Error('connection refused'),
    );
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('not ready');
  });
});
