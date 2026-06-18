import request from 'supertest';
import app from '../../src/app.js';

describe('Health Check API', () => {
  it('Debería responder con un status 200 y el mensaje Hello World', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'OK',
      message: 'Hello World! API funcionando correctamente.'
    });
  });

  it('Debería devolver 404 para una ruta inexistente', async () => {
    const response = await request(app).get('/api/ruta-inventada');
    
    expect(response.status).toBe(404);
  });
});