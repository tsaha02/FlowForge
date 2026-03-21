import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { encryptData, decryptData } from '../utils/encryption';
import { CredentialType } from '@prisma/client';
import { z } from 'zod';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

const createSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1),
  type: z.nativeEnum(CredentialType),
  data: z.record(z.string()), // The actual secrets payload
});

// List credentials (metadata only, NO secrets)
router.get('/', async (req, res) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId || typeof workspaceId !== 'string') {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    const credentials = await prisma.credential.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true,
        workspaceId: true,
        createdById: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: credentials });
  } catch (error) {
    console.error('Error listing credentials:', error);
    res.status(500).json({ error: 'Failed to list credentials' });
  }
});

// Create a new credential
router.post('/', async (req, res) => {
  try {
    const parsed = createSchema.parse(req.body);
    const userId = (req as AuthRequest).userId!;

    // Verify workspace membership
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: parsed.workspaceId,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    // Encrypt the secrets payload
    const encryptedData = encryptData(JSON.stringify(parsed.data));

    const credential = await prisma.credential.create({
      data: {
        name: parsed.name,
        type: parsed.type,
        encryptedData,
        workspaceId: parsed.workspaceId,
        createdById: userId,
      },
      select: {
        // Return metadata only
        id: true,
        name: true,
        type: true,
        createdAt: true,
        workspaceId: true,
        createdById: true,
      },
    });

    res.status(201).json({ success: true, data: credential });
  } catch (error: any) {
    console.error('Error creating credential:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create credential' });
  }
});

// Delete a credential
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).userId!;

    // First, verify the user has access to the credential's workspace
    const credential = await prisma.credential.findUnique({
      where: { id },
      select: { workspaceId: true },
    });

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: credential.workspaceId,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not authorized to delete this credential' });
    }

    await prisma.credential.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting credential:', error);
    res.status(500).json({ error: 'Failed to delete credential' });
  }
});

export { router as credentialsRouter };
