// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/crypto_exchange_test';

// Mock logger to prevent console output during tests
jest.mock('../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  stream: {
    write: jest.fn()
  }
}));

// Set Jest timeout
jest.setTimeout(30000);

// Global teardown
afterAll(async () => {
  // Add any cleanup code here if needed
});

