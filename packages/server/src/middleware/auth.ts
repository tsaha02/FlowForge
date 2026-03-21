// ============================================
// FlowForge — Auth Middleware
// ============================================
// This middleware checks if the user is logged in before allowing API access.
//
// HOW IT WORKS:
// 1. The frontend sends a JWT token in the "Authorization" header
// 2. This middleware verifies the token is valid
// 3. If valid → attaches the user info to the request and allows it through
// 4. If invalid → sends a 401 Unauthorized response
//
// JWT = JSON Web Token — it's like a digital passport. When you log in,
// you get a token. Every subsequent request includes this token to prove
// who you are.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

// Extend Express Request type to include our user data
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

interface JwtPayload {
  userId: string;
  email: string;
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    // Get the token from the "Authorization: Bearer <token>" header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication token is missing.', 401);
    }

    // Verify the token using our secret key
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Attach user info to the request so routes can access it
    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    // Allow the request to continue to the route handler
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired authentication token.', 401));
    }
  }
}
