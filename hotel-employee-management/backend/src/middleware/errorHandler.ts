import { Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from './response';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join(', ');
    return sendError(res, message, 400);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        if (target.includes('employeeNumber')) {
          return sendError(res, 'Employee number already exists.', 409);
        }
        if (target.includes('email')) {
          return sendError(res, 'Employee email already exists.', 409);
        }
        if (target.includes('employeeId') && target.includes('date')) {
          return sendError(res, 'Attendance already exists for this employee on this date.', 409);
        }
        if (target.includes('name')) {
          return sendError(res, 'Name already exists.', 409);
        }
        return sendError(res, 'A record with this value already exists.', 409);
      }
      case 'P2003':
        return sendError(res, 'Related record not found.', 400);
      case 'P2025':
        return sendError(res, 'Record not found.', 404);
      default:
        break;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  return sendError(res, 'Internal server error.', 500);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function notFoundHandler(_req: Request, res: Response) {
  return sendError(res, 'Route not found.', 404);
}
