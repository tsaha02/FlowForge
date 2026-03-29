// ============================================
// FlowForge — Execution Routes
// ============================================
// API endpoints for executing workflows and viewing execution history.
//
// POST   /api/workflows/:id/execute  — Trigger workflow execution
// GET    /api/executions             — List execution history
// GET    /api/executions/:id         — Get execution details + node results

import { Router, Response, NextFunction } from 'express';
import { ExecutionStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { workflowQueue } from '../services/workflowExecutor';

const router = Router();

router.use(authMiddleware);

// ---- POST /api/workflows/:id/execute ----
// Triggers a new workflow execution by adding a job to the BullMQ queue
router.post(
  '/workflows/:id/execute',
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
      });

      if (!workflow) {
        throw new AppError('Workflow not found', 404);
      }

      // Create an execution record in the database
      const execution = await prisma.execution.create({
        data: {
          workflowId: workflow.id,
          status: 'PENDING',
          triggeredBy: 'MANUAL',
        },
      });

      // Add job to the BullMQ queue (the worker will pick it up)
      await workflowQueue.add('execute', {
        workflowId: workflow.id,
        executionId: execution.id,
      });

      res.status(201).json({
        success: true,
        data: {
          executionId: execution.id,
          status: 'PENDING',
          message: 'Workflow execution queued',
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ---- GET /api/executions ----
// Lists execution history for a workspace
router.get(
  '/executions',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      const status = req.query.status as ExecutionStatus | undefined;
      const workflowId = req.query.workflowId as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

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

      const where = {
        workflow: { workspaceId },
        ...(status ? { status } : {}),
        ...(workflowId ? { workflowId } : {}),
      };

      const [executions, total] = await Promise.all([
        prisma.execution.findMany({
          where,
          orderBy: { startedAt: 'desc' },
          skip,
          take: limit,
          include: {
            workflow: {
              select: { id: true, name: true },
            },
            _count: {
              select: { nodeExecutions: true },
            },
          },
        }),
        prisma.execution.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          executions,
          pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ---- GET /api/executions/:id ----
// Gets a single execution with all node execution details
router.get(
  '/executions/:id',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const execution = await prisma.execution.findFirst({
        where: {
          id: req.params.id as string,
          workflow: {
            workspace: {
              members: {
                some: { userId: req.userId! },
              },
            },
          },
        },
        include: {
          workflow: {
            select: { id: true, name: true, nodesJson: true, edgesJson: true },
          },
          nodeExecutions: {
            orderBy: { startedAt: 'asc' },
          },
        },
      });

      if (!execution) {
        throw new AppError('Execution not found', 404);
      }

      res.json({ success: true, data: execution });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
