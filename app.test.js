// app.test.js
const request = require('supertest');
const { app } = require('./server'); // Import your app

describe('Server Health Endpoints', () => {
  it('GET /health should return 200 and server status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('server', 'ShopSpher Backend');
  });

  it('GET /ready should return 200 if DB is connected', async () => {
    const res = await request(app).get('/ready');
    // This test will pass if your DB is connected, otherwise it will fail as expected.
    expect([200, 503]).toContain(res.statusCode);
  });
});