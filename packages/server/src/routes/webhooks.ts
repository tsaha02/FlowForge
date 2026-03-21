import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { workflowQueue } from '../services/workflowExecutor';
import { logger } from '../utils/logger';

const router = Router();

// ---- POST /api/webhooks/:path ----
// Public endpoint for triggering workflows globally via webhook
router.post('/:path', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const path = req.params.path as string;

    // 1. Find the active webhook from the slug
    const webhook: any = await prisma.webhook.findUnique({
      where: { path },
      include: { workflow: true },
    });

    if (!webhook || !webhook.isActive || !webhook.workflow) {
      return res.status(404).json({ error: 'Webhook not found or inactive' });
    }

    if (webhook.workflow.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Associated workflow is not ACTIVE' });
    }

    // 2. Extract incoming payload (headers, query, body)
    const triggerPayload: Record<string, unknown> = {
      method: req.method,
      query: req.query,
      body: req.body,
      headers: req.headers,
    };

    // 3. Create execution record
    const execution = await prisma.execution.create({
      data: {
        workflowId: webhook.workflowId,
        status: 'PENDING',
        triggeredBy: 'WEBHOOK',
      },
    });

    // 4. Update last triggering time
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { lastTriggeredAt: new Date() },
    });

    // 5. Add job to BullMQ queue, passing triggerPayload
    await workflowQueue.add('execute', {
      workflowId: webhook.workflowId,
      executionId: execution.id,
      triggerPayload,
    });

    logger.info(`🔗 Webhook triggered workflow ${webhook.workflowId} (Exec: ${execution.id})`);

    // We do NOT return execution history to a public webhook caller for security.
    res.status(202).json({
      success: true,
      executionId: execution.id,
      message: 'Workflow accepted and queued for execution',
    });
  } catch (error) {
    logger.error('Webhook execution failed:', error);
    next(error);
  }
});

// ---- GET /api/webhooks/:path ----
// Allow GET triggers as well (e.g. browser visits or simple GET callbacks)
router.get('/:path', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const path = req.params.path as string;

    const webhook: any = await prisma.webhook.findUnique({
      where: { path },
      include: { workflow: true },
    });

    if (!webhook || !webhook.isActive || !webhook.workflow) {
      return res.status(404).json({ error: 'Webhook not found or inactive' });
    }

    if (webhook.workflow.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Associated workflow is not ACTIVE' });
    }

    const triggerPayload: Record<string, unknown> = {
      method: req.method,
      query: req.query,
      headers: req.headers,
    };

    const execution = await prisma.execution.create({
      data: {
        workflowId: webhook.workflowId,
        status: 'PENDING',
        triggeredBy: 'WEBHOOK',
      },
    });

    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { lastTriggeredAt: new Date() },
    });

    await workflowQueue.add('execute', {
      workflowId: webhook.workflowId,
      executionId: execution.id,
      triggerPayload,
    });

    logger.info(`🔗 Webhook GET triggered workflow ${webhook.workflowId} (Exec: ${execution.id})`);

    res.status(202).json({
      success: true,
      executionId: execution.id,
      message: 'Workflow GET payload accepted',
    });
  } catch (error) {
    logger.error('Webhook GET execution failed:', error);
    next(error);
  }
});

export default router;
