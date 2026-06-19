import request from 'supertest';
import app from '../../src/app.js';

describe('Health Check API', () => {
  it('Debería responder con un status 200, el mensaje Hello World y el timestamp', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'OK',
      message: 'Hello World! API funcionando correctamente.',
      timestamp: expect.any(String),
    });
    expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  it('Debería devolver 404 para una ruta inexistente', async () => {
    const response = await request(app).get('/api/ruta-inventada');
    
    expect(response.status).toBe(404);
  });
});