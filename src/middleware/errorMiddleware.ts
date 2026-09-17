import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Handle custom AppError
  if (err instanceof AppError) {
    ApiResponse.error(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      const field = target.length > 0 ? target.join(', ') : 'field';
      ApiResponse.error(res, `A record with this ${field} already exists`, 409);
      return;
    }

    if (err.code === 'P2025') {
      ApiResponse.error(res, 'Record not found or already deleted', 404);
      return;
    }

    ApiResponse.error(res, `Database error: ${err.message}`, 400);
    return;
  }

  // Handle JWT errors if bubbled up
  if (err.name === 'JsonWebTokenError') {
    ApiResponse.error(res, 'Invalid authentication token', 401);
    return;
  }

  // Unhandled internal server errors
  console.error('Unhandled Error:', err);
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred on the server'
      : err.message || 'Internal Server Error';

  ApiResponse.error(res, message, 500);
}
