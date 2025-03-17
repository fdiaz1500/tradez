module.exports = {
    testEnvironment: 'node',
    verbose: true,
    coveragePathIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.js'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    setupFilesAfterEnv: ['./tests/setup.js']
  };

