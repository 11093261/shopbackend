// jest.env-setup.js - Runs BEFORE tests
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-jwt-secret-for-ci-cd-pipeline';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-for-ci-cd-pipeline';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
process.env.PORT = '3200';