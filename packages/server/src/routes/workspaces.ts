import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

const updateWorkspaceSchema = z.object({
  name: z.string().min(2),
});

// Update workspace details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).userId!;
    const parsed = updateWorkspaceSchema.parse(req.body);

    // Verify user is an OWNER of this workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId,
        },
      },
    });

    if (!member || member.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owners can update workspace settings' });
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id },
      data: { name: parsed.name },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    res.json({ success: true, data: updatedWorkspace });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating workspace:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// Delete a workspace
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).userId!;

    // Verify user is an OWNER of this workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId,
        },
      },
    });

    if (!member || member.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only owners can delete workspaces' });
    }

    // Prisma cascade delete will automatically delete workflows, credentials, etc.
    await prisma.workspace.delete({
      where: { id },
    });

    res.json({ success: true, data: { deletedId: id } });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});

export { router as workspacesRouter };
