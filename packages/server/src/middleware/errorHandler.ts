// ============================================
// FlowForge — Error Handler Middleware
// ============================================
// This middleware catches ALL errors in the app and sends a clean JSON response.
// Without this, Express would send ugly HTML error pages.
//
// HOW IT WORKS:
// When any route throws an error, Express skips all normal middleware
// and jumps to this error handler (because it has 4 params: err, req, res, next).

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error class — lets us throw errors with a status code
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

// The actual middleware function
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Determine the status code
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  // Log the error (full stack trace for 500s, just message for expected errors)
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${message}`, err.stack);
  } else {
    logger.warn(`[${statusCode}] ${message}`);
  }

  // Send a clean JSON response to the frontend
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
