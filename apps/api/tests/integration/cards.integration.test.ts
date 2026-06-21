import request from 'supertest';
import { describe, it, expect, afterAll } from 'vitest';
import app from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';

// Cerrar la conexión al terminar Tests
afterAll(async () => {
  await prisma.$disconnect();
});

describe('Integración: API de la baraja (BD real)', () => {
  it('GET /api/v1/deck devuelve las 50 cartas sembradas', async () => {
    const res = await request(app).get('/api/v1/deck');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(50);
  });

  it('GET /api/v1/deck?short=true devuelve la baraja de 40', async () => {
    const res = await request(app).get('/api/v1/deck?short=true');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(40);
  });

  it('GET /api/v1/deck/draw?count=5 roba 5 cartas reales', async () => {
    const res = await request(app).get('/api/v1/deck/draw?count=5');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
  });
});
