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
import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
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

// All workflow routes require authentication
router.use(authMiddleware);

// ---- GET /api/workflows ----
// Lists all workflows for a given workspace
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      throw new AppError('workspaceId query parameter is required', 400);
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
      const workflow = await prisma.workflow.findUnique({
        where: { id: req.params.id as string },
        include: {
          createdBy: {
            select: { id: true, name: true, avatarUrl: true },
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
      const existing = await prisma.workflow.findUnique({
        where: { id: req.params.id as string },
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
      });

      // Handle cron job registration dynamically based on status and expression
      if (workflow.status === 'ACTIVE' && workflow.triggerType === 'CRON' && workflow.cronExpression) {
        await registerCronJob(workflow.id, workflow.cronExpression);
      } else {
        await unregisterCronJob(workflow.id);
      }

      res.json({ success: true, data: workflow });
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
      const existing = await prisma.workflow.findUnique({
        where: { id: req.params.id as string },
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
