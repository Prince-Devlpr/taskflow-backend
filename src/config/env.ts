import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

/**
 * A weak/default secret must never be used to sign real tokens.
 * In production we fail fast; in development we warn loudly.
 */
const WEAK_SECRETS = new Set([
  '',
  'secret',
  'changeme',
  'change_me',
  'taskflow_super_secret_jwt_key_2026_academic_student',
]);

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET || '';

  const isWeak = WEAK_SECRETS.has(secret.toLowerCase()) || secret.length < 32;

  if (isProduction && isWeak) {
    // Never boot a production server with a guessable signing key.
    throw new Error(
      'FATAL: JWT_SECRET is missing or too weak. Set a strong (>=32 char) random JWT_SECRET in the environment before starting in production.'
    );
  }

  if (isWeak) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠️  WARNING: JWT_SECRET is weak or using the default development value. ' +
        'Generate a strong secret (e.g. `openssl rand -hex 32`) before deploying.'
    );
    return secret || 'taskflow_insecure_dev_secret_do_not_use_in_prod';
  }

  return secret;
}

/**
 * Parse a comma-separated allowlist of origins. In development we also
 * permit the common local origins used by Flutter emulators/simulators.
 */
function resolveAllowedOrigins(): string[] {
  const raw = process.env.CLIENT_URL || '';
  const configured = raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0 && o !== '*');

  if (configured.length > 0) return configured;

  // Sensible development defaults (never used when an allowlist is configured).
  if (!isProduction) {
    return [
      'http://localhost:5000',
      'http://localhost:3000',
      'http://127.0.0.1:5000',
      'http://10.0.2.2:5000',
    ];
  }

  return [];
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  isProduction,
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/taskflow_db?schema=public',
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  /**
   * When true (default in development), mobile apps / tools without an
   * `Origin` header (native Flutter, curl, Postman) are allowed. Browser
   * requests are still restricted to the allowlist below.
   */
  allowNoOriginRequests: process.env.ALLOW_NO_ORIGIN !== 'false',
  allowedOrigins: resolveAllowedOrigins(),
};
