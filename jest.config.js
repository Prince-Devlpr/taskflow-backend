/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  // Security tests are designed to exercise middleware/validation paths that
  // return before any database access, so no live PostgreSQL is required.
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  testTimeout: 20000,
};
