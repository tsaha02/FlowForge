// ============================================
// FlowForge — Node Type Definitions
// ============================================
// Defines all the node types available in the workflow builder.
// Each node type has: an id, label, icon, color, category, and
// a list of configurable fields that appear in the config panel.

export type NodeCategory = 'triggers' | 'actions' | 'logic' | 'integrations';

export interface NodeFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'code' | 'json';
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
  defaultValue?: string | number | boolean;
}

export interface NodeTypeDefinition {
  type: string;
  label: string;
  description: string;
  icon: string; // emoji
  color: string; // left border color
  category: NodeCategory;
  fields: NodeFieldConfig[];
  inputs: number; // number of input handles
  outputs: number; // number of output handles
}

// ---- All Node Type Definitions ----

export const NODE_TYPES: Record<string, NodeTypeDefinition> = {
  'webhook-trigger': {
    type: 'webhook-trigger',
    label: 'Webhook Trigger',
    description: 'Receives incoming HTTP requests to start the workflow',
    icon: '🔗',
    color: '#8B5CF6', // purple
    category: 'triggers',
    inputs: 0,
    outputs: 1,
    fields: [
      { name: 'path', label: 'Webhook Path', type: 'text', placeholder: '/my-webhook', required: true },
      { name: 'method', label: 'HTTP Method', type: 'select', options: [
        { label: 'POST', value: 'POST' },
        { label: 'GET', value: 'GET' },
        { label: 'PUT', value: 'PUT' },
      ], defaultValue: 'POST' },
    ],
  },

  'http-request': {
    type: 'http-request',
    label: 'HTTP Request',
    description: 'Make an HTTP request to any API endpoint',
    icon: '🌐',
    color: '#3B82F6', // blue
    category: 'actions',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'method', label: 'Method', type: 'select', options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'PATCH', value: 'PATCH' },
      ], defaultValue: 'GET', required: true },
      { name: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/data', required: true },
      { name: 'headers', label: 'Headers (JSON)', type: 'json', placeholder: '{"Content-Type": "application/json"}' },
      { name: 'body', label: 'Request Body', type: 'textarea', placeholder: '{"key": "value"}' },
    ],
  },

  'email': {
    type: 'email',
    label: 'Send Email',
    description: 'Send an email via SMTP',
    icon: '📧',
    color: '#EC4899', // pink
    category: 'actions',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'to', label: 'To', type: 'text', placeholder: 'user@example.com', required: true },
      { name: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject', required: true },
      { name: 'body', label: 'Body', type: 'textarea', placeholder: 'Hello {{name}}, ...' },
    ],
  },

  'db-query': {
    type: 'db-query',
    label: 'Database Query',
    description: 'Execute a SQL query on a Postgres database',
    icon: '🗄️',
    color: '#F59E0B', // amber
    category: 'actions',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'credentialId', label: 'Database Credential', type: 'select', options: [], required: true },
      { name: 'query', label: 'SQL Query', type: 'code', placeholder: 'SELECT * FROM users WHERE id = $1' },
      { name: 'params', label: 'Parameters (JSON)', type: 'json', placeholder: '["123"]' },
    ],
  },

  'ai-llm': {
    type: 'ai-llm',
    label: 'AI / LLM',
    description: 'Run a prompt through a Groq-hosted AI model',
    icon: '🤖',
    color: '#10B981', // emerald
    category: 'integrations',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'systemPrompt', label: 'System Prompt', type: 'textarea', placeholder: 'You are a helpful assistant that summarizes customer messages.' },
      { name: 'prompt', label: 'Prompt Template', type: 'textarea', placeholder: 'Summarize the following: {input}', required: true },
      { name: 'model', label: 'Model', type: 'select', options: [
        { label: 'Llama 3.1 8B Instant', value: 'llama-3.1-8b-instant' },
        { label: 'Llama 3.3 70B Versatile', value: 'llama-3.3-70b-versatile' },
        { label: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
      ], defaultValue: 'llama-3.1-8b-instant' },
      { name: 'temperature', label: 'Temperature', type: 'number', defaultValue: 0.7 },
      { name: 'outputFormat', label: 'Output Format', type: 'select', options: [
        { label: 'Text', value: 'text' },
        { label: 'JSON', value: 'json' },
      ], defaultValue: 'text' },
    ],
  },

  'delay': {
    type: 'delay',
    label: 'Delay / Timer',
    description: 'Wait up to 60 seconds before continuing',
    icon: '⏱️',
    color: '#6366F1', // indigo
    category: 'logic',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'duration', label: 'Duration', type: 'number', placeholder: '5', required: true, defaultValue: 5 },
      { name: 'unit', label: 'Unit', type: 'select', options: [
        { label: 'Seconds', value: 'seconds' },
        { label: 'Minutes', value: 'minutes' },
      ], defaultValue: 'seconds' },
    ],
  },

  'condition': {
    type: 'condition',
    label: 'Condition',
    description: 'Branch execution based on a condition (if/else)',
    icon: '🔀',
    color: '#F97316', // orange
    category: 'logic',
    inputs: 1,
    outputs: 2, // true and false branches
    fields: [
      { name: 'expression', label: 'Condition Expression', type: 'code', placeholder: 'input.status === "active"', required: true },
    ],
  },

  'router': {
    type: 'router',
    label: 'Router / Switch',
    description: 'Branch execution based on multiple conditions',
    icon: '🛤️',
    color: '#8B5CF6', // purple
    category: 'logic',
    inputs: 1,
    outputs: 0, // dynamic handles drawn in WorkflowNode
    fields: [
      { name: 'branchRules', label: 'Branch Rules (JSON)', type: 'json', placeholder: '[\n  { "branch": "High", "condition": "input.amount > 1000" },\n  { "branch": "Low", "condition": "input.amount <= 1000" }\n]', required: true },
    ],
  },

  'iterator': {
    type: 'iterator',
    label: 'Loop / Iterator',
    description: 'Process an array of items by calling a sub-workflow',
    icon: '🔁',
    color: '#0EA5E9', // light blue
    category: 'logic',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'itemsArray', label: 'Array Map Expression', type: 'code', placeholder: 'return input.users || [];', required: true },
      { name: 'subWorkflowId', label: 'Sub-Workflow ID', type: 'text', placeholder: 'Paste workflow ID here to run for each item', required: true },
    ],
  },

  'data-transform': {
    type: 'data-transform',
    label: 'Data Transform',
    description: 'Transform data between nodes using JavaScript',
    icon: '🔄',
    color: '#14B8A6', // teal
    category: 'logic',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'expression', label: 'Transform Expression', type: 'code', placeholder: 'return input.data.map(item => item.name)', required: true },
    ],
  },

  'code-execute': {
    type: 'code-execute',
    label: 'Code Execute',
    description: 'Run custom JavaScript code using the previous node output as input',
    icon: '💻',
    color: '#64748B', // slate
    category: 'logic',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'code', label: 'JavaScript Code', type: 'code', placeholder: '// Your code here\nconst result = input.value * 2;\nreturn { result };', required: true },
    ],
  },

  'slack-notify': {
    type: 'slack-notify',
    label: 'Slack Notification',
    description: 'Send a message to a Slack channel',
    icon: '💬',
    color: '#E11D48', // rose
    category: 'integrations',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'webhookUrl', label: 'Slack Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/...', required: true },
      { name: 'message', label: 'Message', type: 'textarea', placeholder: 'Workflow completed: {{result}}', required: true },
      { name: 'channel', label: 'Channel (optional)', type: 'text', placeholder: '#general' },
    ],
  },
};

// Group node types by category (for the palette sidebar)
export const NODE_CATEGORIES: { label: string; category: NodeCategory; types: NodeTypeDefinition[] }[] = [
  {
    label: 'Triggers',
    category: 'triggers',
    types: Object.values(NODE_TYPES).filter((n) => n.category === 'triggers'),
  },
  {
    label: 'Actions',
    category: 'actions',
    types: Object.values(NODE_TYPES).filter((n) => n.category === 'actions'),
  },
  {
    label: 'Logic',
    category: 'logic',
    types: Object.values(NODE_TYPES).filter((n) => n.category === 'logic'),
  },
  {
    label: 'Integrations',
    category: 'integrations',
    types: Object.values(NODE_TYPES).filter((n) => n.category === 'integrations'),
  },
];
