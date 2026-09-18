import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { config } from '../config/env';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Handle custom AppError (operational, safe to surface).
  if (err instanceof AppError) {
    if (err.statusCode === 401 || err.statusCode === 403) {
      logger.security('access_denied', {
        path: req.originalUrl,
        method: req.method,
        status: err.statusCode,
      });
    }
    ApiResponse.error(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Handle known Prisma errors with SAFE, generic messages — never leak the
  // raw error text, query, or schema details to the client.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      ApiResponse.error(res, 'A record with these details already exists', 409);
      return;
    }
    if (err.code === 'P2025') {
      ApiResponse.error(res, 'Record not found', 404);
      return;
    }
    logger.error('prisma_known_error', { code: err.code });
    ApiResponse.error(res, 'The request could not be processed', 400);
    return;
  }

  // Prisma validation / initialization errors — never expose internals.
  if (
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    logger.error('prisma_internal_error', { name: err.name });
    ApiResponse.error(res, 'The request could not be processed', 400);
    return;
  }

  // JWT errors if bubbled up here.
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    ApiResponse.error(res, 'Invalid or expired authentication token', 401);
    return;
  }

  // Unhandled internal server errors: log full detail server-side only,
  // return a generic message to the client in every environment.
  logger.error('unhandled_error', {
    name: err.name,
    // Message is logged server-side only, never sent to the client in prod.
    message: err.message,
  });

  const message = config.isProduction
    ? 'An unexpected error occurred on the server'
    : err.message || 'Internal Server Error';

  ApiResponse.error(res, message, 500);
}
