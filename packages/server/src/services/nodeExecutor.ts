// ============================================
// FlowForge — Node Executor Service
// ============================================
// Real implementations for every node type.
// Each handler performs the actual action —
// no more simulations.

import nodemailer from 'nodemailer';
import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { logger } from '../utils/logger';

export interface NodeExecutionInput {
  nodeId: string;
  nodeType: string;
  label: string;
  config: Record<string, unknown>;
  previousOutput: unknown;
  credentials?: Record<string, string>;
}

export interface NodeExecutionResult {
  success: boolean;
  output: unknown;
  error?: string;
  duration: number;
}

// ============================================
// Main Dispatch Function
// ============================================
export async function executeNode(input: NodeExecutionInput): Promise<NodeExecutionResult> {
  const startTime = Date.now();

  try {
    let output: unknown;

    switch (input.nodeType) {
      case 'webhook-trigger':
        output = await executeWebhookTrigger(input);
        break;
      case 'http-request':
        output = await executeHttpRequest(input);
        break;
      case 'email':
        output = await executeEmail(input);
        break;
      case 'db-query':
        output = await executeDbQuery(input);
        break;
      case 'ai-llm':
        output = await executeAiLlm(input);
        break;
      case 'delay':
        output = await executeDelay(input);
        break;
      case 'condition':
        output = await executeCondition(input);
        break;
      case 'data-transform':
        output = await executeDataTransform(input);
        break;
      case 'code-execute':
        output = await executeCodeExecute(input);
        break;
      case 'slack-notify':
        output = await executeSlackNotify(input);
        break;
      case 'router':
        output = await executeRouter(input);
        break;
      case 'iterator':
        output = await executeIterator(input);
        break;
      default:
        throw new Error(`Unknown node type: ${input.nodeType}`);
    }

    return {
      success: true,
      output,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ Node "${input.label}" failed: ${errMsg}`);
    return {
      success: false,
      output: null,
      error: errMsg,
      duration,
    };
  }
}

// ============================================
// Individual Node Handlers
// ============================================

// ---- Webhook Trigger ----
// Pass-through: the actual trigger data comes from the HTTP request that fired the workflow.
async function executeWebhookTrigger(input: NodeExecutionInput): Promise<unknown> {
  logger.info(`🔗 [${input.label}] Webhook trigger activated`);
  return {
    method: input.config.method || 'POST',
    path: input.config.path || '/webhook',
    body: input.previousOutput || { message: 'Webhook triggered' },
    headers: { 'content-type': 'application/json' },
    timestamp: new Date().toISOString(),
  };
}

// ---- HTTP Request ----
// Makes a REAL HTTP request to the configured URL.
async function executeHttpRequest(input: NodeExecutionInput): Promise<unknown> {
  const method = ((input.config.method as string) || 'GET').toUpperCase();
  const url = (input.config.url as string) || '';
  const customHeaders = (input.config.headers as Record<string, string>) || {};
  const bodyTemplate = input.config.body as string | undefined;

  if (!url) {
    throw new Error('HTTP Request node is missing a URL. Please configure the URL in the node settings.');
  }

  logger.info(`🌐 [${input.label}] ${method} → ${url}`);

  // Interpolate {input} with previous node output
  let body: string | undefined;
  if (['POST', 'PUT', 'PATCH'].includes(method) && bodyTemplate) {
    const inputStr = typeof input.previousOutput === 'object'
      ? JSON.stringify(input.previousOutput)
      : String(input.previousOutput || '');
    body = bodyTemplate.replace(/\{input\}/g, inputStr);
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
    ...(body ? { body } : {}),
    signal: AbortSignal.timeout(30000),
  });

  let data: unknown;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  logger.info(`🌐 [${input.label}] Response: HTTP ${response.status}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} from ${url}`);
  }

  return {
    status: response.status,
    statusText: response.statusText,
    url,
    method,
    data,
  };
}

// ---- Email ----
// Sends a REAL email using Nodemailer + SMTP credentials from .env.
// Supports Gmail App Passwords (SMTP_USER + SMTP_PASS).
async function executeEmail(input: NodeExecutionInput): Promise<unknown> {
  const to = (input.config.to as string) || '';
  const subject = (input.config.subject as string) || 'No Subject';
  const bodyTemplate = (input.config.body as string) || '';

  if (!to) {
    throw new Error('Email node is missing a recipient address. Please configure "To" in the node settings.');
  }

  const smtpUser = input.credentials?.SMTP_USER || process.env.SMTP_USER;
  const smtpPass = input.credentials?.SMTP_PASS || process.env.SMTP_PASS;
  const smtpHost = input.credentials?.SMTP_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(input.credentials?.SMTP_PORT || process.env.SMTP_PORT || '587', 10);
  const smtpFrom = input.credentials?.SMTP_FROM || process.env.SMTP_FROM || smtpUser;

  if (!smtpUser || !smtpPass) {
    throw new Error(
      'Email node requires SMTP credentials. ' +
      'Add SMTP_USER and SMTP_PASS to packages/server/.env. ' +
      'For Gmail, create an App Password at myaccount.google.com/apppasswords'
    );
  }

  // Interpolate {input} placeholder in the body
  const inputStr = typeof input.previousOutput === 'object'
    ? JSON.stringify(input.previousOutput, null, 2)
    : String(input.previousOutput || '');
  const htmlBody = bodyTemplate.replace(/\{input\}/g, inputStr);

  logger.info(`📧 [${input.label}] Sending email via ${smtpHost} to "${to}"`);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 10000, // 10s to connect
    greetingTimeout: 10000,   // 10s for greeting
    socketTimeout: 20000,     // 20s for data
  });

  const info = await transporter.sendMail({
    from: `"FlowForge" <${smtpFrom}>`,
    to,
    subject,
    text: htmlBody.replace(/<[^>]+>/g, ''),
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
             ${htmlBody.replace(/\n/g, '<br>')}
             <hr style="margin-top:32px;border-color:#e2e8f0">
             <p style="color:#94a3b8;font-size:12px">Sent by FlowForge Automation</p>
           </div>`,
  });

  logger.info(`📧 [${input.label}] Email sent! Message ID: ${info.messageId}`);

  return {
    sent: true,
    to,
    subject,
    messageId: info.messageId,
    accepted: info.accepted,
    timestamp: new Date().toISOString(),
  };
}

// ---- DB Query ----
// Executes SQL against a user-provided external Postgres database.
// Requires DB_QUERY_CONNECTION_STRING env var.
async function executeDbQuery(input: NodeExecutionInput): Promise<unknown> {
  const query = (input.config.query as string) || '';

  if (!query) {
    throw new Error('DB Query node is missing a SQL query string.');
  }

  const connectionString = input.credentials?.secret || input.credentials?.DB_QUERY_CONNECTION_STRING || process.env.DB_QUERY_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error(
      'DB Query node requires a connection string. ' +
      'Add a "DB Query" credential in the UI or set DB_QUERY_CONNECTION_STRING in packages/server/.env.'
    );
  }

  // Use eval-based require to avoid TypeScript resolving the optional "pg" package at compile time.
  // eslint-disable-next-line no-eval
  let Pool: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Pool = eval("require")('pg').Pool;
  } catch {
    throw new Error('The "pg" package is not installed. Run: cd packages/server && npm install pg');
  }
  const pool = new Pool({ connectionString });
  logger.info(`🗄️ [${input.label}] Executing query: ${query.slice(0, 80)}...`);

  try {
    const result = await pool.query(query);
    await pool.end();
    logger.info(`🗄️ [${input.label}] Query returned ${result.rowCount} rows`);
    return {
      rowCount: result.rowCount,
      rows: result.rows,
      fields: result.fields.map((f: { name: string }) => f.name),
      query,
    };
  } catch (err) {
    await pool.end();
    throw err;
  }
}

// ---- AI LLM (Groq via LangChain) ----
async function executeAiLlm(input: NodeExecutionInput): Promise<unknown> {
  const modelName = (input.config.model as string) || 'llama-3.1-8b-instant';
  const promptTemplate = (input.config.prompt as string) || 'Process this input: {input}';
  const systemPrompt = (input.config.systemPrompt as string) || 'You are a helpful assistant integrated into an automated workflow.';
  const temperature = (input.config.temperature as number) ?? 0.7;

  const apiKey = input.credentials?.secret || input.credentials?.GROQ_API_KEY || process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set. Add a "Groq Key" credential in the UI or set it in packages/server/.env.');
  }

  logger.info(`🤖 [${input.label}] Calling Groq model: ${modelName}`);

  const chatModel = new ChatGroq({
    apiKey: apiKey,
    model: modelName,
    temperature,
  });

  const inputDataStr = typeof input.previousOutput === 'object'
    ? JSON.stringify(input.previousOutput, null, 2)
    : String(input.previousOutput || '');
  const finalPrompt = promptTemplate.replace(/\{input\}/g, inputDataStr);

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(finalPrompt),
  ];

  const response = await chatModel.invoke(messages);
  logger.info(`🤖 [${input.label}] Groq response received`);

  return {
    model: modelName,
    provider: 'groq',
    prompt: finalPrompt,
    response: response.content,
    usage: response.response_metadata?.tokenUsage || { totalTokens: 0 },
  };
}

// ---- Delay ----
// Real timed wait.
async function executeDelay(input: NodeExecutionInput): Promise<unknown> {
  const duration = (input.config.duration as number) || 1;
  const unit = (input.config.unit as string) || 'seconds';
  let ms = duration * 1000;
  if (unit === 'minutes') ms = duration * 60000;
  if (unit === 'ms') ms = duration;
  ms = Math.min(ms, 60000); // Hard cap at 60s to prevent job timeouts

  logger.info(`⏱️ [${input.label}] Waiting ${duration} ${unit} (${ms}ms)`);
  await new Promise((resolve) => setTimeout(resolve, ms));

  return {
    delayed: true,
    duration,
    unit,
    waitedMs: ms,
    passedData: input.previousOutput,
  };
}

// ---- Condition ----
// Evaluates a logical JS expression and determines the branch.
async function executeCondition(input: NodeExecutionInput): Promise<unknown> {
  const expression = (input.config.expression as string) || 'true';
  logger.info(`🔀 [${input.label}] Evaluating: ${expression}`);

  let result = true;
  try {
    const func = new Function('input', `return Boolean(${expression})`);
    result = func(input.previousOutput);
  } catch {
    result = true;
  }

  logger.info(`🔀 [${input.label}] → ${result ? 'true' : 'false'} branch`);

  return {
    condition: expression,
    result,
    branch: result ? 'true' : 'false',
    passedData: input.previousOutput,
  };
}

// ---- Data Transform ----
// Runs a JS function expression to transform the incoming data.
async function executeDataTransform(input: NodeExecutionInput): Promise<unknown> {
  const expression = (input.config.expression as string) || 'return input';
  logger.info(`🔄 [${input.label}] Transforming data`);

  try {
    const func = new Function('input', expression);
    const result = func(input.previousOutput);
    logger.info(`🔄 [${input.label}] Transform succeeded`);
    return result;
  } catch (err) {
    throw new Error(`Data transform error: ${err instanceof Error ? err.message : err}`);
  }
}

// ---- Code Execute ----
// Runs user-provided JavaScript code with the previous node's output as `input`.
async function executeCodeExecute(input: NodeExecutionInput): Promise<unknown> {
  const code = (input.config.code as string) || 'return { result: "executed" }';
  logger.info(`💻 [${input.label}] Executing custom code`);

  try {
    const func = new Function('input', code);
    const result = func(input.previousOutput);
    logger.info(`💻 [${input.label}] Code executed successfully`);
    return result;
  } catch (err) {
    throw new Error(`Code execution failed: ${err instanceof Error ? err.message : err}`);
  }
}

// ---- Slack Notify ----
// POSTs a REAL message to Slack via an Incoming Webhook URL.
// Users configure their webhookUrl in the node's config panel.
// Get a webhook at: api.slack.com/apps → Incoming Webhooks
async function executeSlackNotify(input: NodeExecutionInput): Promise<unknown> {
  const webhookUrl = input.credentials?.secret || input.credentials?.webhookUrl || (input.config.webhookUrl as string) || '';
  const channelDisplay = (input.config.channel as string) || '#general';
  const messageTemplate = (input.config.message as string) || 'Workflow notification from FlowForge';

  if (!webhookUrl) {
    throw new Error(
      'Slack node requires a Webhook URL. ' +
      'Create one at api.slack.com/apps → Your App → Incoming Webhooks, ' +
      'then paste it in the node config panel under "Webhook URL".'
    );
  }

  if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
    throw new Error('Invalid Slack Webhook URL. It must start with https://hooks.slack.com/');
  }

  const inputStr = typeof input.previousOutput === 'object'
    ? JSON.stringify(input.previousOutput, null, 2)
    : String(input.previousOutput || '');
  const finalMessage = messageTemplate.replace(/\{input\}/g, inputStr);

  logger.info(`💬 [${input.label}] Posting to Slack channel: ${channelDisplay}`);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: finalMessage,
      username: 'FlowForge',
      icon_emoji: ':zap:',
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Slack API error ${response.status}: ${body}`);
  }

  logger.info(`💬 [${input.label}] Slack message delivered to ${channelDisplay}`);

  return {
    sent: true,
    channel: channelDisplay,
    message: finalMessage,
    timestamp: new Date().toISOString(),
  };
}

// ---- Router ----
// Evaluates an array of JSON rules to decide which branch to take.
async function executeRouter(input: NodeExecutionInput): Promise<unknown> {
  const rulesRaw = input.config.branchRules;
  let rules: Array<{ branch: string; condition: string }> = [];
  
  try {
    rules = typeof rulesRaw === 'string' ? JSON.parse(rulesRaw) : rulesRaw;
    if (!Array.isArray(rules)) rules = [];
  } catch {
    throw new Error('Router node has invalid JSON for branchRules');
  }

  logger.info(`🛤️ [${input.label}] Evaluating ${rules.length} routes`);

  let matchedBranch: string | null = null;

  for (const rule of rules) {
    if (!rule.branch || !rule.condition) continue;
    try {
      const func = new Function('input', `return Boolean(${rule.condition})`);
      if (func(input.previousOutput)) {
        matchedBranch = rule.branch;
        break; // Take the FIRST matching route!
      }
    } catch {
      // ignore eval error and try next
    }
  }

  if (!matchedBranch) {
    logger.info(`🛤️ [${input.label}] No branches matched`);
    return { branch: 'no_match', passedData: input.previousOutput };
  }

  logger.info(`🛤️ [${input.label}] → ${matchedBranch} branch selected`);
  return {
    branch: matchedBranch,
    passedData: input.previousOutput,
  };
}

// ---- Iterator ----
// Takes an array map expression, evaluates it into an array, and triggers \`subWorkflowId\` for each item.
// Uses dynamic import to avoid circular dependencies with workflowExecutor.ts
async function executeIterator(input: NodeExecutionInput): Promise<unknown> {
  const mapExpr = (input.config.itemsArray as string) || 'return []';
  const subWorkflowId = (input.config.subWorkflowId as string) || '';

  if (!subWorkflowId) {
    throw new Error('Iterator needs a Sub-Workflow ID to trigger');
  }

  let items: any[] = [];
  try {
    const func = new Function('input', mapExpr);
    const result = func(input.previousOutput);
    if (!Array.isArray(result)) throw new Error('Expression did not return an array. Iterator requires an array.');
    items = result;
  } catch (err) {
    throw new Error(`Iterator array evaluation failed: ${err instanceof Error ? err.message : err}`);
  }

  logger.info(`🔁 [${input.label}] Iterating over ${items.length} items to trigger sub-workflow ${subWorkflowId}`);
  
  const { workflowQueue } = await import('./workflowExecutor');
  const { prisma } = await import('../lib/prisma');
  
  const dispatchedIds = [];
  for (const item of items) {
     const execution = await prisma.execution.create({
        data: {
          workflowId: subWorkflowId,
          status: 'PENDING',
          triggeredBy: 'WEBHOOK',
        }
     });
     await workflowQueue.add('execute', {
        workflowId: subWorkflowId,
        executionId: execution.id,
        triggerPayload: item
     });
     dispatchedIds.push(execution.id);
  }

  logger.info(`🔁 [${input.label}] Dispatched ${dispatchedIds.length} sub-workflows`);

  return {
    itemsProcessed: items.length,
    subExecutions: dispatchedIds,
  };
}
