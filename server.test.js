const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('./server');

describe('Server Health Check', () => {
  beforeAll(async () => {
    // Silence console.log during tests
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(async () => {
    // Close server and database connection
    if (server) {
      await server.close();
    }
    await mongoose.connection.close();
  });

  test('Server should respond to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('healthy');
  });

  test('Healthz endpoint should return OK', async () => {
    const response = await request(app).get('/healthz');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('OK');
  });

  test('Ready endpoint should return correct status', async () => {
    const response = await request(app).get('/ready');
    expect(response.statusCode).toBe(503); // Database should be disconnected in tests
    expect(response.body.database).toBe('disconnected');
  });
});