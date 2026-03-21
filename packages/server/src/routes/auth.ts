// ============================================
// FlowForge — Auth Routes
// ============================================
// These routes handle user registration and login.
//
// POST /api/auth/register — Create a new account
// POST /api/auth/login    — Log in and get a JWT token

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/validate';
import { registerSchema, loginSchema, googleAuthSchema } from '../schemas/auth';
import { logger } from '../utils/logger';

const router = Router();
const googleClient = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);


// ---- Rate Limiting ----
// Protect authentication endpoints from brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
  message: {
    success: false,
    error: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to all auth routes
router.use(authLimiter);

// Zod schemas imported from ../schemas/auth.ts

// Helper: Generate a JWT token for a user
function generateToken(userId: string, email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
  return jwt.sign({ userId, email }, secret, { expiresIn: '7d' }); // Token lasts 7 days
}

router.post('/register', validateRequest(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('An account with this email already exists.', 409);
    }

    // 3. Hash the password (never store plain text passwords!)
    //    bcrypt adds "salt" (random data) + hashing = secure storage
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Create the user + a default workspace in a single transaction
    //    Transaction = either both succeed or both fail (no partial data)
    const result = await prisma.$transaction(async (tx:any) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      });

      // Create a default workspace for the user
      const workspace = await tx.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      });

      return { user, workspace };
    });

    // 5. Generate a JWT token
    const token = generateToken(result.user.id, result.user.email);

    logger.success(`New user registered: ${email}`);

    // 6. Send the response
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          avatarUrl: result.user.avatarUrl,
        },
        workspace: {
          id: result.workspace.id,
          name: result.workspace.name,
          slug: result.workspace.slug,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', validateRequest(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // 2. Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        ownedWorkspaces: true,
        workspaceMemberships: {
          include: { workspace: true },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('Invalid email or password.', 401);
    }

    // 3. Compare the password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    // 4. Generate a JWT token
    const token = generateToken(user.id, user.email);

    // 5. Get the user's workspaces
    const workspaces = user.workspaceMemberships.map((m:any) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
    }));

    logger.info(`User logged in: ${email}`);

    // 6. Send the response
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        workspaces,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Google Authentication Flow
// ==========================================
// Accepts a Google ID token from the frontend, verifies it,
// and either logs the user in or creates a new account.
router.post('/google', validateRequest(googleAuthSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body;

    // 1. Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AppError('Invalid Google credential', 400);
    }

    const { email, name, sub: googleId, picture: avatarUrl } = payload;
    const displayName = name || email.split('@')[0];

    // 2. Find or Create the User
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        ownedWorkspaces: true,
        workspaceMemberships: {
          include: { workspace: true },
        },
      },
    });

    if (user) {
      // User exists. Update their googleId/avatar if missing
      const typedUser = user as any;
      if (!typedUser.googleId || typedUser.avatarUrl !== avatarUrl) {
        await prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl: avatarUrl || typedUser.avatarUrl } as any,
        });

        // Re-fetch populated user
        user = await prisma.user.findUnique({
          where: { email },
          include: {
            ownedWorkspaces: true,
            workspaceMemberships: {
              include: { workspace: true },
            },
          },
        });
      }
      logger.info(`User logged in via Google: ${email}`);
    } else {
      // User does NOT exist, create them + a default workspace
      const result = await prisma.$transaction(async (tx: any) => {
        const newUser = await tx.user.create({
          data: {
            email,
            name: displayName,
            googleId,
            avatarUrl,
            // Notice: No passwordHash! OAuth-only user.
          },
        });

        // Create default workspace
        const workspace = await tx.workspace.create({
          data: {
            name: `${displayName}'s Workspace`,
            slug: `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
            ownerId: newUser.id,
            members: {
              create: {
                userId: newUser.id,
                role: 'OWNER',
              },
            },
          },
        });

        return { user: newUser, workspace };
      });

      // Fetch the full populated user structure for the response
      user = await prisma.user.findUniqueOrThrow({
        where: { id: result.user.id },
        include: {
          ownedWorkspaces: true,
          workspaceMemberships: { include: { workspace: true } },
        },
      });
      logger.success(`New user registered via Google: ${email}`);
    }

    if (!user) {
      throw new AppError('Auth flow failed to retrieve user', 500);
    }

    // 3. Generate our internal JWT for the session
    const token = generateToken(user.id, user.email);

    const workspaces = user.workspaceMemberships.map((m: any) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
    }));

    // 4. Send the successful login response
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        workspaces,
        token,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Token used too late')) {
      next(new AppError('Google login expired, please try again.', 401));
    } else {
      next(error);
    }
  }
});

export default router;
