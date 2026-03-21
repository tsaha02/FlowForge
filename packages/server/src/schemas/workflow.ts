// ============================================
// FlowForge — Workflow Zod Schemas
// ============================================

import { z } from 'zod';

// We allow TriggerType to map to what the database enum accepts
const TriggerTypeEnum = z.enum(['MANUAL', 'CRON', 'WEBHOOK']);
const WorkflowStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']);

export const createWorkflowSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Workflow name is required')
      .max(100, 'Workflow name is too long'),
    description: z.string().max(500, 'Description is too long').optional(),
    workspaceId: z.string().cuid('Invalid workspace ID'),
  }),
});

export const updateWorkflowSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid workflow ID'),
  }),
  body: z.object({
    name: z.string().min(1, 'Workflow name is required').max(100).optional(),
    description: z.string().max(500).optional(),
    status: WorkflowStatusEnum.optional(),
    triggerType: TriggerTypeEnum.optional(),
    cronExpression: z
      .string()
      .regex(
        /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
        'Invalid cron expression',
      )
      .optional()
      .nullable(),
    nodesJson: z.array(z.any()).optional(), // React Flow nodes array
    edgesJson: z.array(z.any()).optional(), // React Flow edges array
  }),
});

export const getWorkflowSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid workflow ID'),
  }),
});

export const deleteWorkflowSchema = getWorkflowSchema;
