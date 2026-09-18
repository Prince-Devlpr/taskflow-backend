import express, { Application, Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorMiddleware';
import { generalLimiter } from './middleware/rateLimiters';
import { logger } from './utils/logger';

const app: Application = express();

// Trust the first proxy (needed for correct client IPs behind Render/Heroku/Nginx,
// which makes rate limiting per-IP accurate). Kept to a single hop to avoid spoofing.
app.set('trust proxy', 1);

// Remove the framework fingerprint header.
app.disable('x-powered-by');

// ----------------------------------------------------------------------------
// Security headers (Helmet) — clickjacking, MIME sniffing, referrer leakage, etc.
// ----------------------------------------------------------------------------
app.use(
  helmet({
    // This is a JSON API consumed by a native mobile app, not a web page that
    // loads cross-origin resources, so the default strict CSP/CORP is fine.
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);

// ----------------------------------------------------------------------------
// CORS — explicit allowlist. Never reflect an arbitrary origin with credentials.
// ----------------------------------------------------------------------------
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Native mobile apps / server-to-server / curl send no Origin header.
    if (!origin) {
      return callback(null, config.allowNoOriginRequests);
    }
    if (config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    logger.security('cors_blocked', { origin });
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};
app.use(cors(corsOptions));

// ----------------------------------------------------------------------------
// Body parsing with strict size limits (mitigates memory-exhaustion / DoS).
// ----------------------------------------------------------------------------
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Global API rate limiting.
app.use('/api', generalLimiter);

// Lightweight request logging (development only, no sensitive data).
if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    logger.info('request', { method: req.method, path: req.originalUrl });
    next();
  });
}

// ----------------------------------------------------------------------------
// API Routes
// ----------------------------------------------------------------------------
app.use('/api', routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Malformed-JSON guard (express.json throws a SyntaxError with `type`).
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err && err.type === 'entity.too.large') {
    res.status(413).json({ success: false, message: 'Request payload too large' });
    return;
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ success: false, message: 'Malformed JSON in request body' });
    return;
  }
  next(err);
});

// Centralized error handling
app.use(errorHandler);

export default app;
