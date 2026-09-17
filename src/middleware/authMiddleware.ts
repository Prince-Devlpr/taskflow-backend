import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from '../utils/appError';
import { prisma } from '../config/database';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface JwtPayload {
  userId: string;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a valid Bearer token', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Session expired. Please log in again', 401);
      }
      throw new AppError('Invalid authentication token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new AppError('User belonging to this token no longer exists', 401);
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
