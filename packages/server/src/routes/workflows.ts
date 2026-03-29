// ============================================
// FlowForge — Workflow Routes
// ============================================
// CRUD endpoints for workflows (Create, Read, Update, Delete).
// All routes require authentication (authMiddleware).
//
// GET    /api/workflows          — List all workflows in a workspace
// POST   /api/workflows          — Create a new workflow
// GET    /api/workflows/:id      — Get a single workflow
// PUT    /api/workflows/:id      — Update a workflow (name, nodes, edges, etc.)
import { randomBytes } from 'crypto';
import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/validate';
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  getWorkflowSchema,
  deleteWorkflowSchema,
} from '../schemas/workflow';
import { registerCronJob, unregisterCronJob } from '../services/workflowExecutor';

const router = Router();
const WEBHOOK_SLUG_REGEX = /[^a-z0-9-]/g;

// All workflow routes require authentication
router.use(authMiddleware);

function sanitizeWebhookPath(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/\s+/g, '-')
    .replace(WEBHOOK_SLUG_REGEX, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractWebhookPath(nodesJson: unknown): string | null {
  if (!Array.isArray(nodesJson)) {
    return null;
  }

  for (const rawNode of nodesJson) {
    if (!rawNode || typeof rawNode !== 'object') {
      continue;
    }

    const node = rawNode as {
      data?: {
        nodeType?: string;
        config?: Record<string, unknown>;
      };
    };

    if (node.data?.nodeType !== 'webhook-trigger') {
      continue;
    }

    const configuredPath = node.data.config?.path;
    if (typeof configuredPath === 'string' && configuredPath.trim()) {
      return sanitizeWebhookPath(configuredPath);
    }
  }

  return null;
}

async function buildUniqueWebhookPath(basePath: string, workflowId: string) {
  const fallbackPath = `workflow-${workflowId.slice(-8)}`;
  const normalizedBasePath = sanitizeWebhookPath(basePath) || fallbackPath;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate =
      attempt === 0
        ? normalizedBasePath
        : `${normalizedBasePath}-${randomBytes(2).toString('hex')}`;

    const existing = await prisma.webhook.findUnique({
      where: { path: candidate },
      select: { workflowId: true },
    });

    if (!existing || existing.workflowId === workflowId) {
      return candidate;
    }
  }

  return `${fallbackPath}-${randomBytes(3).toString('hex')}`;
}

async function syncWebhookForWorkflow(workflow: {
  id: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  triggerType: 'MANUAL' | 'CRON' | 'WEBHOOK';
  nodesJson: unknown;
}) {
  if (workflow.triggerType !== 'WEBHOOK') {
    await prisma.webhook.deleteMany({
      where: { workflowId: workflow.id },
    });
    return;
  }

  const requestedPath =
    extractWebhookPath(workflow.nodesJson) ||
    sanitizeWebhookPath(workflow.name) ||
    `workflow-${workflow.id.slice(-8)}`;
  const uniquePath = await buildUniqueWebhookPath(requestedPath, workflow.id);

  await prisma.webhook.upsert({
    where: { workflowId: workflow.id },
    update: {
      path: uniquePath,
      isActive: workflow.status === 'ACTIVE',
    },
    create: {
      workflowId: workflow.id,
      path: uniquePath,
      secret: randomBytes(24).toString('hex'),
      isActive: workflow.status === 'ACTIVE',
    },
  });
}

// ---- GET /api/workflows ----
// Lists all workflows for a given workspace
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      throw new AppError('workspaceId query parameter is required', 400);
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: req.userId!,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new AppError('Workspace not found', 404);
    }

    const workflows = await prisma.workflow.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        triggerType: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: { id: true, name: true, avatarUrl: true },
        },
        _count: {
          select: { executions: true },
        },
        webhook: {
          select: { path: true, isActive: true, lastTriggeredAt: true },
        },
      },
    });

    res.json({ success: true, data: workflows });
  } catch (error) {
    next(error);
  }
});

// Validation schemas imported from ../schemas/workflow.ts

// ---- POST /api/workflows ----
// Creates a new workflow
router.post(
  '/',
  validateRequest(createWorkflowSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, description, workspaceId } = req.body;

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: req.userId!,
          },
        },
        select: { id: true },
      });

      if (!membership) {
        throw new AppError('Workspace not found', 404);
      }

      const workflow = await prisma.workflow.create({
        data: {
          name,
          description,
          workspaceId,
          triggerType: 'MANUAL',
          createdById: req.userId!,
          nodesJson: [],
          edgesJson: [],
        },
      });

      res.status(201).json({ success: true, data: workflow });
    } catch (error) {
      next(error);
    }
  }
);

// ---- GET /api/workflows/:id ----
// Gets a single workflow with all its data (including nodes and edges)
router.get(
  '/:id',
  validateRequest(getWorkflowSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const workflow = await prisma.workflow.findFirst({
        where: {
          id: req.params.id as string,
          workspace: {
            members: {
              some: { userId: req.userId! },
            },
          },
        },
        include: {
          createdBy: {
            select: { id: true, name: true, avatarUrl: true },
          },
          webhook: {
            select: { path: true, isActive: true, lastTriggeredAt: true },
          },
        },
      });

      if (!workflow) {
        throw new AppError('Workflow not found', 404);
      }

      res.json({ success: true, data: workflow });
    } catch (error) {
      next(error);
    }
});

// ---- PUT /api/workflows/:id ----
// Updates a workflow (used when saving the canvas)
router.put(
  '/:id',
  validateRequest(updateWorkflowSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.workflow.findFirst({
        where: {
          id: req.params.id as string,
          workspace: {
            members: {
              some: { userId: req.userId! },
            },
          },
        },
      });

      if (!existing) {
        throw new AppError('Workflow not found', 404);
      }

      const workflow = await prisma.workflow.update({
        where: { id: req.params.id as string },
        data: {
          name: req.body.name ?? existing.name,
          description: req.body.description ?? existing.description,
          status: req.body.status ?? existing.status,
          triggerType: req.body.triggerType ?? existing.triggerType,
          cronExpression: req.body.cronExpression ?? existing.cronExpression,
          nodesJson: req.body.nodesJson ?? existing.nodesJson,
          edgesJson: req.body.edgesJson ?? existing.edgesJson,
        },
        include: {
          webhook: {
            select: { path: true, isActive: true, lastTriggeredAt: true },
          },
        },
      });

      // Handle cron job registration dynamically based on status and expression
      if (workflow.status === 'ACTIVE' && workflow.triggerType === 'CRON' && workflow.cronExpression) {
        await registerCronJob(workflow.id, workflow.cronExpression);
      } else {
        await unregisterCronJob(workflow.id);
      }

      await syncWebhookForWorkflow({
        id: workflow.id,
        name: workflow.name,
        status: workflow.status,
        triggerType: workflow.triggerType,
        nodesJson: workflow.nodesJson,
      });

      const refreshedWorkflow = await prisma.workflow.findUnique({
        where: { id: workflow.id },
        include: {
          webhook: {
            select: { path: true, isActive: true, lastTriggeredAt: true },
          },
        },
      });

      res.json({ success: true, data: refreshedWorkflow });
    } catch (error) {
      next(error);
    }
});

// ---- DELETE /api/workflows/:id ----
// Deletes a workflow and all related data (cascading)
router.delete(
  '/:id',
  validateRequest(deleteWorkflowSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.workflow.findFirst({
        where: {
          id: req.params.id as string,
          workspace: {
            members: {
              some: { userId: req.userId! },
            },
          },
        },
      });

      if (!existing) {
        throw new AppError('Workflow not found', 404);
      }

      // Ensure any running cron job is removed before deleting
      await unregisterCronJob(req.params.id as string);

      await prisma.workflow.delete({
        where: { id: req.params.id as string },
      });

      res.json({ success: true, message: 'Workflow deleted successfully' });
    } catch (error) {
      next(error);
    }
});

export default router;
