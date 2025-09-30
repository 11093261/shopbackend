
jest.setTimeout(30000);
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

afterAll(async () => {
});