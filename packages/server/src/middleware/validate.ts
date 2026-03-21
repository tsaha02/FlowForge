// ============================================
// FlowForge — Validation Middleware
// ============================================
// Intercepts API requests and validates them against a Zod schema.
// Returns a 400 Bad Request with detailed errors if validation fails.

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../utils/logger';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the request body against the schema.
      // parseAsync strips out any unknown fields not defined in the schema for security.
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format the Zod error into a client-friendly structure
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn(`Validation failed for ${req.method} ${req.url}`);

        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation Error',
            details: formattedErrors,
          },
        });
      }

      next(error);
    }
  };
};
