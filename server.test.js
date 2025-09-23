const request = require('supertest');
const app = require('./server'); // Your Express app

describe('Server Health Check', () => {
  test('Server should respond to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
  });
});