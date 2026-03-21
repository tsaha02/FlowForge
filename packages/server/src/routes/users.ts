import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().optional(),
  notifications: z.any().optional(),
});

// Update the authenticated user's profile
router.put('/me', async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const parsed = updateProfileSchema.parse(req.body);

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(parsed.avatarUrl !== undefined && { avatarUrl: parsed.avatarUrl }),
        ...(parsed.notifications !== undefined && { notifications: parsed.notifications })
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        notifications: true,
      },
    });

    res.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export { router as usersRouter };
