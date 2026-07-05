import request from 'supertest';
import app from '../../src/app.js';

describe('X-Request-Id', () => {
  it('toda respuesta incluye un request-id gnerado (formato uuid)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('respeta el X-Request-Id entrante (correlación extremo a extremo)', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('X-Request-Id', 'id-de-mi-proxy-123');
    expect(res.headers['x-request-id']).toBe('id-de-mi-proxy-123');
  });
});
