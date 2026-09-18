import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../utils/apiResponse';

// In the automated test environment, use very high limits so functional
// security assertions are not throttled. Rate-limit behaviour itself is
// covered by a dedicated test that builds its own limiter.
const isTest = process.env.NODE_ENV === 'test';

/**
 * General API rate limiter — applied to every /api route.
 * Protects against application-level DoS and abusive clients.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 100000 : 300, // 300 requests / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(res, 'Too many requests. Please slow down and try again later.', 429);
  },
});

/**
 * Strict limiter for authentication endpoints (login / register / me).
 * Blunts brute-force and credential-stuffing attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 100000 : 10, // 10 attempts / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  // Only failed requests count toward the limit so legitimate users are not locked out.
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      'Too many authentication attempts. Please wait a few minutes before trying again.',
      429
    );
  },
});

/**
 * Limiter for write-heavy endpoints (task creation) to prevent flooding.
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isTest ? 100000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(res, 'You are creating tasks too quickly. Please slow down.', 429);
  },
});
