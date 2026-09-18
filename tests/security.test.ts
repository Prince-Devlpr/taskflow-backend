import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import app from '../src/app';

/**
 * Security test suite.
 *
 * These tests deliberately target middleware, validation, authentication and
 * authorization paths that resolve BEFORE any database query, so they run
 * without a live PostgreSQL instance and remain deterministic in CI.
 */

describe('Security headers (Helmet)', () => {
  it('sets protective HTTP headers and hides the framework fingerprint', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    // Helmet defaults
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
  });
});

describe('Authentication middleware', () => {
  it('rejects protected routes with no token (401)', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects a malformed Bearer token (401)', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('rejects an expired token (401)', async () => {
    const expired = jwt.sign(
      { userId: 'abc' },
      process.env.JWT_SECRET as string,
      { expiresIn: -10 }
    );
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret (401)', async () => {
    const forged = jwt.sign({ userId: 'abc' }, 'a-different-secret-entirely');
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });
});

describe('Input validation (register)', () => {
  it('rejects an invalid email (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'not-an-email', password: 'Password123' });
    expect(res.status).toBe(400);
  });

  it('rejects a weak password (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'a@b.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('rejects unexpected/extra fields — mass assignment (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test',
        email: 'a@b.com',
        password: 'Password123',
        isAdmin: true,
        id: 'hijacked',
      });
    expect(res.status).toBe(400);
  });

  it('rejects missing required fields (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('Request hardening', () => {
  it('rejects malformed JSON with a generic 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "a@b.com", ');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/malformed json/i);
  });

  it('rejects an oversized request body (413)', async () => {
    const huge = 'x'.repeat(11 * 1024); // > 10kb limit
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: huge });
    expect(res.status).toBe(413);
  });

  it('returns 404 for unknown routes without leaking internals', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Rate limiting behaviour', () => {
  it('returns 429 once the configured limit is exceeded', async () => {
    const miniApp = express();
    miniApp.use(
      rateLimit({
        windowMs: 60_000,
        max: 3,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) => res.status(429).json({ success: false }),
      })
    );
    miniApp.get('/', (_req, res) => res.json({ ok: true }));

    const agent = request(miniApp);
    await agent.get('/').expect(200);
    await agent.get('/').expect(200);
    await agent.get('/').expect(200);
    await agent.get('/').expect(429);
  });
});
