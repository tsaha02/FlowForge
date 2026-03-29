import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { workflowQueue } from '../services/workflowExecutor';
import { logger } from '../utils/logger';

const router = Router();

function getConfiguredWebhookMethod(nodesJson: unknown): 'GET' | 'POST' | 'PUT' {
  if (!Array.isArray(nodesJson)) {
    return 'POST';
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

    const configuredMethod = node.data.config?.method;
    if (configuredMethod === 'GET' || configuredMethod === 'POST' || configuredMethod === 'PUT') {
      return configuredMethod;
    }
  }

  return 'POST';
}

async function handleWebhookRequest(req: Request, res: Response, next: NextFunction) {
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

    const configuredMethod = getConfiguredWebhookMethod(webhook.workflow.nodesJson);
    if (configuredMethod !== req.method) {
      res.setHeader('Allow', configuredMethod);
      return res.status(405).json({
        error: `This webhook only accepts ${configuredMethod} requests.`,
      });
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
}

// ---- POST /api/webhooks/:path ----
// Public endpoint for triggering workflows globally via webhook
router.post('/:path', handleWebhookRequest);

// ---- GET /api/webhooks/:path ----
// Allow GET triggers as well (e.g. browser visits or simple GET callbacks)
router.get('/:path', handleWebhookRequest);
router.put('/:path', handleWebhookRequest);

export default router;
