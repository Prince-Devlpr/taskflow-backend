// Force a safe test environment BEFORE any app module loads.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET_TEST || 'test_only_secret_0123456789_0123456789_abcdef';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.ALLOW_NO_ORIGIN = 'true';
