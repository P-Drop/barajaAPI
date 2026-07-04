import request from 'supertest';
import app from '../../src/app.js';

// CORS_ORIGIN fijado en vitest.config.ts (env) al origen del front
const FRONT_ORIGIN = 'https://baraja.pedrorincon.dev';

describe('CORS', () => {
  it('autoriza al origen del front', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', FRONT_ORIGIN);
    expect(res.headers['access-control-allow-origin']).toBe(FRONT_ORIGIN);
  });

  it('omite el header para orígenes no permitidos', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('responde 200 a clientes sin Origin (CORS no es autenticación)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
