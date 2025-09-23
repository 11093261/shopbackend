// jest.setup.js
// Global test setup to handle async operations and silence logs

jest.setTimeout(30000);

// Silence console logs during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = (...args) => {
  if (process.env.NODE_ENV !== 'test') {
    originalConsoleLog(...args);
  }
};

console.error = (...args) => {
  if (process.env.NODE_ENV !== 'test') {
    originalConsoleError(...args);
  }
};

console.warn = (...args) => {
  if (process.env.NODE_ENV !== 'test') {
    originalConsoleWarn(...args);
  }
};

// Global teardown
afterAll(async () => {
  // Add any global cleanup here
});