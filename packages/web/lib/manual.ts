import { NODE_CATEGORIES, NODE_TYPES } from '@/types/nodes';

export interface ManualWorkflowExample {
  id: string;
  title: string;
  summary: string;
  nodes: string[];
  steps: string[];
  result: string;
}

export interface ManualNodeGuide {
  purpose: string;
  bestFor: string[];
  setup: string[];
  configExample: string;
  inputExample: string;
  outputExample: string;
  notes: string[];
  warnings?: string[];
}

export interface NodeTeachingGuide {
  businessUseCase: string;
  useItWhen: string[];
  notIdealWhen: string[];
  firstTest: string[];
  beginnerMistakes: string[];
}

export const manualSections = [
  { id: 'platform-tour', label: 'Platform Tour' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'choose-trigger', label: 'Choose the Right Trigger' },
  { id: 'webhook-explained', label: 'Webhook in Simple Language' },
  { id: 'credentials-and-settings', label: 'Credentials and Settings' },
  { id: 'build-workflow', label: 'Build a Workflow' },
  { id: 'example-workflows', label: 'Example Workflows' },
  { id: 'node-reference', label: 'Node Reference' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
];

export const platformTour = [
  {
    title: 'Dashboard',
    description: 'See your overall activity, recent executions, and a quick summary of workflow health.',
    whyItMatters: 'This is the best place to check whether your automations are actively being used.',
  },
  {
    title: 'Workflows',
    description: 'Create new workflows, open existing ones, run them manually, and check whether they are draft, active, paused, or archived.',
    whyItMatters: 'This is the home for all automations in your workspace.',
  },
  {
    title: 'Editor',
    description: 'Build the workflow visually by dragging nodes, connecting them, configuring each step, and viewing execution logs.',
    whyItMatters: 'This is where you design the actual automation logic.',
  },
  {
    title: 'Executions',
    description: 'View each run of a workflow, including success or failure, node-by-node progress, and output details.',
    whyItMatters: 'This is where you debug and confirm real business outcomes.',
  },
  {
    title: 'Credentials',
    description: 'Store API keys, tokens, and secrets safely so workflows can use them without hardcoding sensitive information.',
    whyItMatters: 'This keeps your automations reusable and more secure.',
  },
  {
    title: 'Settings',
    description: 'Manage your profile, workspace name, appearance, and notification preferences.',
    whyItMatters: 'This controls how you and your team use the platform day to day.',
  },
];

export const gettingStartedChecklist = [
  'Open the Workflows page and create a new workflow.',
  'Give the workflow a name that explains the business task, not just the tool it uses.',
  'Pick one trigger type first: manual, webhook, or cron.',
  'Drag nodes from the left palette into the canvas and connect them from left to right.',
  'Click each node to configure it in the right-side panel.',
  'Save before you run so the workflow definition is stored and reusable.',
  'Use the execution log panel when testing so you can see which node passed or failed.',
];

export const editorBasics = [
  {
    title: 'Canvas flow',
    body: 'Every node receives the previous node output as input. Most text-based integrations can inject that value with the {input} placeholder.',
  },
  {
    title: 'Triggers start workflows',
    body: 'A workflow should begin with a trigger node or a manual run. Webhook and cron workflows need to be saved before they become active.',
  },
  {
    title: 'Connections control order',
    body: 'Connect nodes in the order you want them to run. Condition and router nodes create branches. Iterator dispatches a sub-workflow for each item in an array.',
  },
  {
    title: 'Credentials live outside the node',
    body: 'Store reusable secrets in Credentials whenever possible. Some nodes can also use fallback values from the server environment.',
  },
  {
    title: 'Executions tell the real story',
    body: 'After you test a workflow, open Executions to see what actually happened. The execution view is the fastest way to understand success, failure, and data flow.',
  },
];

export const triggerGuide = [
  {
    title: 'Manual',
    useWhen: 'You want to test a workflow yourself or run it only when a person clicks Run.',
    plainEnglish: 'Manual means: I will start this workflow by hand.',
    example: 'A manager clicks Run to generate a report when needed.',
  },
  {
    title: 'Cron / Scheduled',
    useWhen: 'You want the workflow to run on a timetable such as every hour, every morning, or every Monday.',
    plainEnglish: 'Cron means: FlowForge starts the workflow automatically on a schedule.',
    example: 'Every morning at 9:00 AM, send the daily sales summary.',
  },
  {
    title: 'Webhook',
    useWhen: 'Another system should start the workflow the moment an event happens.',
    plainEnglish: 'Webhook means: another app sends a message to FlowForge and that message starts the workflow.',
    example: 'A shopping website sends new order details to FlowForge right after checkout.',
  },
];

export const webhookExplainer = [
  {
    title: '1. You choose a simple path',
    body: 'In the Webhook Trigger node, you choose a path such as /new-order or /customer-intake-demo. You are only choosing the last part of the URL.',
  },
  {
    title: '2. FlowForge places that path under your backend server',
    body: 'If your backend domain is https://flowforge-api.onrender.com and your path is /new-order, then the final webhook URL becomes https://flowforge-api.onrender.com/api/webhooks/new-order.',
  },
  {
    title: '3. Another system sends data to that URL',
    body: 'That system could be your shopping website, a form tool, Shopify, Stripe, Zapier, or a custom app. The sender pushes data into FlowForge.',
  },
  {
    title: '4. FlowForge starts the workflow immediately',
    body: 'The webhook data becomes the first real input for the workflow. Downstream nodes can then transform it, email it, save it, or route it.',
  },
  {
    title: '5. You inspect the real result in Executions',
    body: 'The webhook endpoint only confirms that the workflow was accepted. To see the real step-by-step result, open Executions inside FlowForge.',
  },
];

export const webhookBusinessExamples = [
  {
    title: 'Shopping website',
    story: 'A customer places an order. Your website sends order details to FlowForge. FlowForge sends an internal Slack alert, checks if the order is high value, and sends a customer email.',
  },
  {
    title: 'Lead form',
    story: 'Someone fills out a contact form. The form tool sends the lead to FlowForge. FlowForge cleans the data, pushes it to your CRM, and notifies sales.',
  },
  {
    title: 'Payment system',
    story: 'A successful payment event is sent by Stripe or another gateway. FlowForge creates follow-up actions such as notifications, fulfillment checks, or customer messaging.',
  },
];

export const webhookIfNoApiGuide = [
  'If your business can already send data out, webhook is a good trigger.',
  'If your business uses Shopify, WooCommerce plugins, Stripe, form tools, or automation tools, webhook is usually easy to use.',
  'If your website is custom-built, your developer can send order or customer data to the FlowForge webhook URL.',
  'If your business cannot send any data out at all, use Manual or Cron instead of Webhook.',
];

export const credentialsGuide = [
  {
    title: 'What credentials are for',
    body: 'Credentials store sensitive values such as API keys, bearer tokens, database secrets, or Slack webhooks. Instead of hardcoding those values into a workflow, you store them once and reuse them safely.',
  },
  {
    title: 'When to create one',
    body: 'Create a credential when a node needs a secret value that you do not want visible inside the workflow design itself.',
  },
  {
    title: 'Credential types in simple language',
    body: 'API Key is for simple secret tokens. OAuth is for bearer-style tokens. Basic Auth is for username:password values. Custom is for anything else you want to store as a secret.',
  },
  {
    title: 'How to add one',
    body: 'Open Credentials, click Add Credential, choose the type, give it a clear business name such as "Production CRM API Key", then paste the secret value and save it.',
  },
];

export const settingsGuide = [
  {
    title: 'Profile',
    body: 'Change your display name and avatar. This helps your team identify who created or manages workflows.',
  },
  {
    title: 'Workspace',
    body: 'Rename your workspace or delete it if needed. Be careful: deleting a workspace removes its workflows too.',
  },
  {
    title: 'Appearance',
    body: 'Choose the theme that feels best for you. This does not change workflow behavior; it only changes how the app looks.',
  },
  {
    title: 'Notifications',
    body: 'Control whether FlowForge should send email alerts, failure notices, or a digest summary. This matters if multiple people operate the workspace.',
  },
];

export const dayOneChecklist = [
  'Log in and confirm your active workspace is correct.',
  'Open Credentials and add any secrets you know you will need, such as Slack webhook, database token, or API key.',
  'Open Settings and make sure your name, workspace name, and notifications are configured.',
  'Create one small workflow with only 2 or 3 nodes.',
  'Test it once and read the execution details before building a larger workflow.',
];

export const buildWorkflowSteps = [
  {
    title: '1. Start with the trigger',
    body: 'Use Webhook Trigger when another app should call FlowForge, or run manually while you are still designing the flow.',
  },
  {
    title: '2. Add one step at a time',
    body: 'Build the happy path first. For example: Webhook Trigger -> HTTP Request -> Data Transform -> Send Email.',
  },
  {
    title: '3. Test with simple data',
    body: 'Use a small JSON payload first so it is easy to inspect in logs. Once the basic shape works, add more fields.',
  },
  {
    title: '4. Add branching only after the core path works',
    body: 'Condition and Router are easier to debug after you know the incoming data shape from previous steps.',
  },
  {
    title: '5. Save, run, inspect, refine',
    body: 'Treat workflow building like iterative debugging. Run it, inspect node outputs, then improve the next node config.',
  },
];

export const workflowExamples: ManualWorkflowExample[] = [
  {
    id: 'lead-alert',
    title: 'Lead Intake Alert',
    summary: 'Receive a lead form payload, enrich it, and notify the team.',
    nodes: ['Webhook Trigger', 'HTTP Request', 'Data Transform', 'Slack Notification'],
    steps: [
      'Webhook Trigger receives the form submission from your website.',
      'HTTP Request sends the lead email to an enrichment API or CRM endpoint.',
      'Data Transform reshapes the response into a short summary for humans.',
      'Slack Notification posts the summary into the sales channel.',
    ],
    result: 'Every new lead becomes a structured team alert within seconds.',
  },
  {
    id: 'approval-followup',
    title: 'Approval and Follow-up',
    summary: 'Check an input value, wait, then send a response email.',
    nodes: ['Webhook Trigger', 'Condition', 'Delay / Timer', 'Send Email'],
    steps: [
      'Webhook Trigger receives an order or request payload.',
      'Condition checks a rule such as input.total > 500.',
      'Delay / Timer pauses for a short review window.',
      'Send Email sends the approval or follow-up message using the previous data.',
    ],
    result: 'Time-sensitive workflows can branch and still keep a human-friendly response.',
  },
  {
    id: 'content-processing',
    title: 'Content Processing Pipeline',
    summary: 'Fetch data, summarize it with AI, and store or share the result.',
    nodes: ['HTTP Request', 'AI / LLM', 'Code Execute', 'Database Query or Slack Notification'],
    steps: [
      'HTTP Request fetches raw content from an API.',
      'AI / LLM creates a summary or classification.',
      'Code Execute shapes the final payload into exactly what the next system expects.',
      'Database Query or Slack Notification stores or broadcasts the result.',
    ],
    result: 'FlowForge turns external data into a reusable AI-assisted automation pipeline.',
  },
];

export const nodeManual: Record<string, ManualNodeGuide> = {
  'webhook-trigger': {
    purpose: 'Starts a workflow when another system sends an HTTP request to FlowForge.',
    bestFor: [
      'Incoming form submissions',
      'Webhook-based SaaS integrations',
      'Triggering automations from another app or script',
    ],
    setup: [
      'Add Webhook Trigger as the first node.',
      'Set a short path such as /new-lead or /support-ticket.',
      'Choose the HTTP method expected by the external system.',
      'Save the workflow so FlowForge can generate the live webhook URL.',
      'Send a test request from Postman, curl, or the external app.',
    ],
    configExample: '{\n  "path": "/new-lead",\n  "method": "POST"\n}',
    inputExample: 'This node starts the workflow, so it does not require a previous node input.',
    outputExample:
      '{\n  "method": "POST",\n  "path": "/new-lead",\n  "body": {\n    "name": "Ava",\n    "email": "ava@example.com"\n  },\n  "headers": {\n    "content-type": "application/json"\n  },\n  "timestamp": "2026-03-29T09:30:00.000Z"\n}',
    notes: [
      'The request body becomes the main payload for downstream nodes.',
      'Save the workflow again after changing the webhook path so the live endpoint updates.',
    ],
  },
  'http-request': {
    purpose: 'Calls an external API and returns the response payload to the next node.',
    bestFor: [
      'CRM updates',
      'REST API lookups',
      'Sending data to another internal service',
    ],
    setup: [
      'Choose the method such as GET or POST.',
      'Enter the target URL.',
      'Add headers as JSON if the API needs authorization or content type overrides.',
      'For POST, PUT, or PATCH, use {input} in the request body to inject previous output.',
    ],
    configExample:
      '{\n  "method": "POST",\n  "url": "https://api.example.com/leads",\n  "headers": {\n    "Authorization": "Bearer YOUR_TOKEN"\n  },\n  "body": "{\\"payload\\": {input}}"\n}',
    inputExample:
      '{\n  "name": "Ava",\n  "email": "ava@example.com",\n  "company": "Northwind"\n}',
    outputExample:
      '{\n  "status": 201,\n  "statusText": "Created",\n  "url": "https://api.example.com/leads",\n  "method": "POST",\n  "data": {\n    "id": "lead_123",\n    "status": "created"\n  }\n}',
    notes: [
      'FlowForge reads JSON responses automatically and falls back to plain text for non-JSON responses.',
      'Use {input}, not {{input}}, when inserting previous output into the request body.',
    ],
  },
  email: {
    purpose: 'Sends an email through SMTP and returns a delivery summary.',
    bestFor: [
      'Status updates',
      'Approval notifications',
      'Customer-facing follow-up emails',
    ],
    setup: [
      'Enter the recipient email, subject, and body.',
      'Configure SMTP credentials in the environment or credential source.',
      'Use {input} inside the body to include the previous node output.',
    ],
    configExample:
      '{\n  "to": "ops@example.com",\n  "subject": "New lead received",\n  "body": "A new lead arrived:\\n\\n{input}"\n}',
    inputExample:
      '{\n  "name": "Ava",\n  "email": "ava@example.com",\n  "score": 92\n}',
    outputExample:
      '{\n  "sent": true,\n  "to": "ops@example.com",\n  "subject": "New lead received",\n  "messageId": "<abc123@example.com>",\n  "accepted": ["ops@example.com"],\n  "timestamp": "2026-03-29T09:31:00.000Z"\n}',
    notes: [
      'Gmail usually requires an App Password instead of your normal account password.',
      'The email body is sent as both plain text and HTML for compatibility.',
    ],
  },
  'db-query': {
    purpose: 'Runs a SQL query against an external Postgres database.',
    bestFor: [
      'Reading application data',
      'Updating records in an internal database',
      'Adding data lookups to a workflow',
    ],
    setup: [
      'Create or select a database credential in Credentials.',
      'Paste the SQL query into the node.',
      'Run the workflow and inspect the returned rows in the execution log.',
    ],
    configExample:
      '{\n  "credentialId": "cred_123",\n  "query": "SELECT id, email, status FROM users WHERE status = \'active\'"\n}',
    inputExample:
      '{\n  "team": "sales"\n}',
    outputExample:
      '{\n  "rowCount": 2,\n  "rows": [\n    { "id": 1, "email": "ava@example.com", "status": "active" },\n    { "id": 2, "email": "leo@example.com", "status": "active" }\n  ],\n  "fields": ["id", "email", "status"],\n  "query": "SELECT id, email, status FROM users WHERE status = \'active\'"\n}',
    notes: [
      'Use this for external business data, not for FlowForge internal tables.',
      'Keep your query explicit and readable so failures are easy to debug.',
    ],
    warnings: [
      'The Parameters field is not currently applied by the executor, so write the full SQL query you want to run.',
    ],
  },
  'ai-llm': {
    purpose: 'Sends the incoming data to an AI model and returns the model response.',
    bestFor: [
      'Summaries',
      'Classification',
      'Structured text generation',
    ],
    setup: [
      'Write a prompt template and insert {input} where the previous output should appear.',
      'Set the model and temperature.',
      'Connect this node after a node that provides the content you want the model to process.',
    ],
    configExample:
      '{\n  "prompt": "Summarize this support ticket in 3 bullets:\\n\\n{input}",\n  "model": "llama-3.1-8b-instant",\n  "temperature": 0.2\n}',
    inputExample:
      '{\n  "ticketId": "SUP-42",\n  "message": "Customer reports duplicate invoices after plan upgrade."\n}',
    outputExample:
      '{\n  "model": "llama-3.1-8b-instant",\n  "provider": "groq",\n  "prompt": "Summarize this support ticket in 3 bullets...",\n  "response": "- Customer sees duplicate invoices...\\n- Issue started after upgrade...\\n- Billing review required.",\n  "usage": { "totalTokens": 312 }\n}',
    notes: [
      'Short, explicit prompts are easier to debug than overly clever prompts.',
      'Keep temperature low for deterministic business workflows.',
    ],
  },
  delay: {
    purpose: 'Pauses the workflow for a short amount of time and then passes data through.',
    bestFor: [
      'Waiting before a follow-up message',
      'Rate-limiting a downstream action',
      'Adding a review window between steps',
    ],
    setup: [
      'Enter the duration.',
      'Choose seconds or minutes.',
      'Place it between the step that creates the waiting condition and the next action.',
    ],
    configExample: '{\n  "duration": 10,\n  "unit": "seconds"\n}',
    inputExample:
      '{\n  "customerEmail": "ava@example.com",\n  "ticketStatus": "pending-review"\n}',
    outputExample:
      '{\n  "delayed": true,\n  "duration": 10,\n  "unit": "seconds",\n  "waitedMs": 10000,\n  "passedData": {\n    "customerEmail": "ava@example.com",\n    "ticketStatus": "pending-review"\n  }\n}',
    notes: [
      'The node passes the original input forward after the wait.',
    ],
    warnings: [
      'Delay is capped to 60 seconds in the current executor, even if you enter a larger value.',
    ],
  },
  condition: {
    purpose: 'Evaluates a JavaScript expression and chooses a true or false branch.',
    bestFor: [
      'Approval thresholds',
      'Presence or absence checks',
      'Simple if/else routing',
    ],
    setup: [
      'Write a JavaScript expression that returns true or false.',
      'Reference the incoming value as input.',
      'Connect the true and false outputs to different next steps.',
    ],
    configExample: '{\n  "expression": "input.total > 500"\n}',
    inputExample:
      '{\n  "orderId": "ORD-100",\n  "total": 725\n}',
    outputExample:
      '{\n  "condition": "input.total > 500",\n  "result": true,\n  "branch": "true",\n  "passedData": {\n    "orderId": "ORD-100",\n    "total": 725\n  }\n}',
    notes: [
      'Use this when you only need two paths.',
      'You can inspect the returned branch in execution logs to confirm your rule behaved as expected.',
    ],
  },
  router: {
    purpose: 'Chooses the first matching branch from a list of rules.',
    bestFor: [
      'Multi-path workflows',
      'Tiered business rules',
      'Category-based routing',
    ],
    setup: [
      'Enter branchRules as a JSON array.',
      'Each rule must contain branch and condition.',
      'Wire each named branch to the correct next node.',
    ],
    configExample:
      '{\n  "branchRules": [\n    { "branch": "high", "condition": "input.amount > 1000" },\n    { "branch": "medium", "condition": "input.amount > 200" },\n    { "branch": "low", "condition": "input.amount <= 200" }\n  ]\n}',
    inputExample:
      '{\n  "invoiceId": "INV-44",\n  "amount": 340\n}',
    outputExample:
      '{\n  "branch": "medium",\n  "passedData": {\n    "invoiceId": "INV-44",\n    "amount": 340\n  }\n}',
    notes: [
      'Put your most specific rules first.',
      'This is useful when Condition would become too nested or hard to read.',
    ],
    warnings: [
      'The router stops at the first matching rule, so rule order matters.',
    ],
  },
  iterator: {
    purpose: 'Evaluates an array expression and triggers a sub-workflow once for each item.',
    bestFor: [
      'Processing records in batches',
      'Fan-out automations',
      'Running the same logic for each item in a list',
    ],
    setup: [
      'Provide a JavaScript expression that returns an array from input.',
      'Paste the destination sub-workflow ID.',
      'Build the sub-workflow separately and make sure it can accept the item payload.',
    ],
    configExample:
      '{\n  "itemsArray": "return input.users || [];",\n  "subWorkflowId": "cm123subworkflow"\n}',
    inputExample:
      '{\n  "users": [\n    { "email": "ava@example.com" },\n    { "email": "leo@example.com" }\n  ]\n}',
    outputExample:
      '{\n  "itemsProcessed": 2,\n  "subExecutions": ["exec_1", "exec_2"]\n}',
    notes: [
      'Use this when each item should be handled by the same reusable sub-flow.',
      'The item payload becomes the trigger payload for the sub-workflow execution.',
    ],
    warnings: [
      'Iterator requires a saved sub-workflow ID. It will fail if the target workflow does not exist.',
    ],
  },
  'data-transform': {
    purpose: 'Transforms incoming data with JavaScript and returns the result.',
    bestFor: [
      'Reshaping API responses',
      'Picking fields for a later node',
      'Formatting data for notifications',
    ],
    setup: [
      'Write JavaScript that returns the exact value you want the next node to receive.',
      'Reference the incoming payload as input.',
      'Keep the output small and purposeful so downstream nodes stay easy to configure.',
    ],
    configExample:
      '{\n  "expression": "return { name: input.data.name, email: input.data.email, summary: `${input.data.name} signed up` };"\n}',
    inputExample:
      '{\n  "data": {\n    "name": "Ava",\n    "email": "ava@example.com",\n    "status": "new"\n  }\n}',
    outputExample:
      '{\n  "name": "Ava",\n  "email": "ava@example.com",\n  "summary": "Ava signed up"\n}',
    notes: [
      'This is usually the safest place to clean up noisy API responses before branching or notifying.',
    ],
  },
  'code-execute': {
    purpose: 'Runs custom JavaScript against the incoming payload and returns whatever your code returns.',
    bestFor: [
      'Custom business logic',
      'Complex calculations',
      'Cases where Data Transform is too limited',
    ],
    setup: [
      'Write JavaScript code in the editor.',
      'Use input as the incoming payload.',
      'Return the final value you want downstream nodes to receive.',
    ],
    configExample:
      '{\n  "code": "const total = input.items.reduce((sum, item) => sum + item.price, 0);\\nreturn { total, itemCount: input.items.length };\"\n}',
    inputExample:
      '{\n  "items": [\n    { "price": 50 },\n    { "price": 75 }\n  ]\n}',
    outputExample:
      '{\n  "total": 125,\n  "itemCount": 2\n}',
    notes: [
      'Use this only when simpler nodes cannot express the logic cleanly.',
      'Keep code short and focused so it remains maintainable for non-developers.',
    ],
  },
  'slack-notify': {
    purpose: 'Posts a message to Slack using an incoming webhook.',
    bestFor: [
      'Team alerts',
      'Incident notifications',
      'Workflow completion summaries',
    ],
    setup: [
      'Create an Incoming Webhook in Slack.',
      'Paste the webhook URL into the node or credential.',
      'Write a short message and insert {input} if you want the previous payload included.',
    ],
    configExample:
      '{\n  "webhookUrl": "https://hooks.slack.com/services/XXX/YYY/ZZZ",\n  "message": "Workflow finished successfully.\\n\\n{input}",\n  "channel": "#ops"\n}',
    inputExample:
      '{\n  "workflow": "Lead Intake",\n  "status": "completed",\n  "leadEmail": "ava@example.com"\n}',
    outputExample:
      '{\n  "sent": true,\n  "channel": "#ops",\n  "message": "Workflow finished successfully...",\n  "timestamp": "2026-03-29T09:35:00.000Z"\n}',
    notes: [
      'Use Slack for fast operational visibility while email is better for formal communication.',
    ],
  },
};

export const troubleshootingItems = [
  {
    title: 'A workflow saves but does not behave as expected',
    body: 'Open the execution log and inspect the output of each node. Most issues come from an unexpected input shape or a placeholder typo such as using {{input}} instead of {input}.',
  },
  {
    title: 'Webhook did not trigger',
    body: 'Confirm the workflow is saved, active, and using the latest generated webhook path. If you changed the path in the node, save again before testing.',
  },
  {
    title: 'Email failed',
    body: 'Verify SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM on the backend. For Gmail, use an App Password, not your normal account password.',
  },
  {
    title: 'AI node failed',
    body: 'Check GROQ_API_KEY and keep the prompt short until the base workflow works. Large noisy inputs are harder to debug.',
  },
  {
    title: 'Router or Condition took the wrong path',
    body: 'Log or transform the input before the branch so you can inspect the exact payload and rewrite the condition using the real field names.',
  },
];

export const nodeTeachingGuides: Record<string, NodeTeachingGuide> = {
  'webhook-trigger': {
    businessUseCase: 'Use this when another system should wake up FlowForge instantly. Example: your shopping website sends new order details right after checkout.',
    useItWhen: [
      'Another app, website, or service can send data to a URL.',
      'You want the workflow to start immediately after an event.',
      'You are integrating FlowForge with Shopify, Stripe, forms, or your own backend.',
    ],
    notIdealWhen: [
      'Nothing in your business can send data outward.',
      'You only need a workflow to run every hour or every day. In that case, Cron is simpler.',
      'You are still learning and just want to click Run yourself. Manual is simpler.',
    ],
    firstTest: [
      'Set the path to something simple like /hello-flowforge.',
      'Save the workflow and copy the generated public webhook URL.',
      'Send a POST request from Postman or curl with a tiny JSON body like { "name": "Ava" }.',
      'Open Executions and confirm the webhook body appears in the first node output.',
    ],
    beginnerMistakes: [
      'Forgetting to save after changing the webhook path.',
      'Trying to use the frontend domain instead of the backend API domain.',
      'Expecting the webhook to return the final workflow result instead of only an accepted response.',
    ],
  },
  'http-request': {
    businessUseCase: 'Use this when FlowForge needs to talk to another service. Example: after a lead arrives, send it to your CRM or fetch customer information from another API.',
    useItWhen: [
      'You need to send data to another system.',
      'You need to fetch information before the next node can decide what to do.',
      'You want FlowForge to act as the bridge between two tools.',
    ],
    notIdealWhen: [
      'The data already exists in the previous node output and does not need another API call.',
      'You only need to reformat data. Data Transform is simpler.',
    ],
    firstTest: [
      'Choose POST.',
      'Use a public echo endpoint such as postman-echo.com/post for testing.',
      'Send {input} in the body so you can see the previous output come back.',
      'Open the execution result and inspect response.status and response.data.',
    ],
    beginnerMistakes: [
      'Using {{input}} instead of {input}.',
      'Forgetting required API headers such as Authorization.',
      'Sending invalid JSON text in the body field.',
    ],
  },
  email: {
    businessUseCase: 'Use this when the workflow should notify a real person by email. Example: send a high-value order alert to operations or send a follow-up message to a customer.',
    useItWhen: [
      'A human needs to read the result in an inbox.',
      'The workflow should create a formal or customer-facing message.',
      'You already have SMTP details configured.',
    ],
    notIdealWhen: [
      'The message is only for your internal team and Slack would be faster.',
      'You have not set up SMTP yet.',
    ],
    firstTest: [
      'Enter your own email address as the recipient.',
      'Set a short subject like FlowForge Test Email.',
      'Use a small body with {input} so you can confirm the payload arrived.',
      'Run the workflow and check both Executions and your inbox.',
    ],
    beginnerMistakes: [
      'Using a normal Gmail password instead of an App Password.',
      'Forgetting SMTP_FROM or SMTP_USER on the backend.',
      'Expecting FlowForge to send email with no SMTP configuration.',
    ],
  },
  'db-query': {
    businessUseCase: 'Use this when your workflow needs to read or write business data in an external database. Example: look up a customer record before routing a support ticket.',
    useItWhen: [
      'Your next decision depends on information stored in a database.',
      'You need to log or enrich workflow data with your own application data.',
      'You have a real external Postgres database available.',
    ],
    notIdealWhen: [
      'You are trying to query FlowForge internal tables.',
      'You only need a temporary value from the previous node.',
      'You do not yet have a database connection string or credential.',
    ],
    firstTest: [
      'Create a database credential first.',
      'Run a harmless query like SELECT NOW() AS checked_at;.',
      'Confirm rowCount and rows appear in the execution output.',
      'Only then move on to business queries.',
    ],
    beginnerMistakes: [
      'Trying to use this node without credentials.',
      'Writing a destructive SQL query before testing with a read-only query.',
      'Assuming the Parameters field is active when the executor currently runs the raw query text.',
    ],
  },
  'ai-llm': {
    businessUseCase: 'Use this when the workflow needs language understanding. Example: summarize a support ticket, classify customer intent, or draft a short response.',
    useItWhen: [
      'The next step needs a summary, classification, or generated text.',
      'You want to convert messy text into a cleaner human-readable result.',
      'You already have the important input data prepared.',
    ],
    notIdealWhen: [
      'The task is a simple rule such as amount > 500. Condition is better.',
      'You only need to move or rename fields. Data Transform is better.',
    ],
    firstTest: [
      'Use a very small prompt first.',
      'Insert {input} so the previous payload is visible to the model.',
      'Keep temperature low, such as 0.2, for predictable behavior.',
      'Inspect the response field in the execution output.',
    ],
    beginnerMistakes: [
      'Giving the model a huge noisy payload before testing a small prompt.',
      'Expecting deterministic rules from AI when a Condition node would be better.',
      'Forgetting to configure GROQ_API_KEY.',
    ],
  },
  delay: {
    businessUseCase: 'Use this when the workflow should wait before the next step. Example: wait 5 minutes before sending a reminder or giving someone time to respond.',
    useItWhen: [
      'Timing matters between two actions.',
      'You want to slow down a follow-up.',
      'You need a short pause in the middle of a workflow.',
    ],
    notIdealWhen: [
      'You need a workflow to run tomorrow morning or next week. Cron is better for scheduled starts.',
      'You expect multi-hour or multi-day waiting in the current runtime.',
    ],
    firstTest: [
      'Set 5 seconds.',
      'Run the workflow manually.',
      'Watch Executions and confirm the next node starts after the wait.',
    ],
    beginnerMistakes: [
      'Expecting the delay to handle very long waiting periods.',
      'Using delay when the real need is a scheduled workflow start.',
    ],
  },
  condition: {
    businessUseCase: 'Use this when the workflow should choose between two paths. Example: if order amount is high, notify a manager; otherwise continue normally.',
    useItWhen: [
      'You only need a yes/no decision.',
      'The rule is clear and easy to express in JavaScript.',
      'The workflow should split into exactly two outcomes.',
    ],
    notIdealWhen: [
      'You need 3 or more different paths. Router is usually better.',
      'The decision is based on vague text understanding. AI may be better.',
    ],
    firstTest: [
      'Use a simple rule like input.amount > 100.',
      'Run the workflow once with amount 50 and once with amount 200.',
      'Confirm each run takes the expected branch.',
    ],
    beginnerMistakes: [
      'Writing the rule against the wrong field name.',
      'Forgetting that the incoming object may be nested under another key.',
      'Making the expression too complicated too early.',
    ],
  },
  router: {
    businessUseCase: 'Use this when the workflow should choose among several paths. Example: send VIP customers one way, bulk orders another way, and normal customers a third way.',
    useItWhen: [
      'You have more than two outcomes.',
      'The branching logic is easier to read as an ordered list of rules.',
      'You want one node to control several possible next steps.',
    ],
    notIdealWhen: [
      'You only need yes or no. Condition is simpler.',
      'You do not yet know the input shape well enough to write multiple rules.',
    ],
    firstTest: [
      'Create three obvious branches such as high, medium, and low.',
      'Test one payload for each case.',
      'Watch which branch name appears in the router output.',
    ],
    beginnerMistakes: [
      'Putting a broad rule first and blocking all later rules.',
      'Forgetting that router stops at the first match.',
      'Using invalid JSON in branchRules.',
    ],
  },
  iterator: {
    businessUseCase: 'Use this when one incoming event contains many items that should each run through the same sub-workflow. Example: a bulk order contains 20 line items and each item should trigger the same follow-up logic.',
    useItWhen: [
      'Your input contains an array of items.',
      'The same logic should be repeated for each item.',
      'You already built a reusable sub-workflow.',
    ],
    notIdealWhen: [
      'You only have one item and no array.',
      'You have not created the sub-workflow yet.',
      'A simple transform would be enough without separate executions.',
    ],
    firstTest: [
      'Create a tiny sub-workflow first.',
      'Use an array with just two items.',
      'Run the main workflow and confirm two sub-executions are created.',
    ],
    beginnerMistakes: [
      'Forgetting to save the sub-workflow and copy its ID.',
      'Returning something other than an array from itemsArray.',
      'Trying to use Iterator before understanding normal single-path flows.',
    ],
  },
  'data-transform': {
    businessUseCase: 'Use this when the workflow already has the data it needs, but the shape is messy. Example: keep only name, email, and order amount from a large API response.',
    useItWhen: [
      'You need to reshape, filter, rename, or simplify data.',
      'The next node only needs a small part of the current payload.',
      'You want cleaner logs and easier downstream conditions.',
    ],
    notIdealWhen: [
      'You need a complex algorithm. Code Execute may be better.',
      'You need to call another system. HTTP Request is better.',
    ],
    firstTest: [
      'Return a very small object with 2 or 3 fields.',
      'Run the workflow and confirm the next node sees only those fields.',
      'Gradually add more fields only if needed.',
    ],
    beginnerMistakes: [
      'Returning too much data and making downstream nodes harder to configure.',
      'Forgetting to return a value.',
      'Trying to write full application logic here instead of simple reshaping.',
    ],
  },
  'code-execute': {
    businessUseCase: 'Use this when you truly need custom logic that simpler nodes cannot express. Example: calculate totals, score a lead, or build a complex object for the next system.',
    useItWhen: [
      'You need custom calculations or branching prep.',
      'Data Transform is too limited for the logic you need.',
      'A developer or technical operator is comfortable writing small JavaScript snippets.',
    ],
    notIdealWhen: [
      'A plain transform or condition would solve it more simply.',
      'Non-technical users will have to maintain very complex custom code.',
    ],
    firstTest: [
      'Start with tiny code like return { hello: "world", input };',
      'Run it once and inspect the output.',
      'Only then add real business logic.',
    ],
    beginnerMistakes: [
      'Writing too much code in one node.',
      'Forgetting to return a value.',
      'Using Code Execute as the default for every problem when simpler nodes already exist.',
    ],
  },
  'slack-notify': {
    businessUseCase: 'Use this when the workflow should notify your internal team quickly. Example: alert sales about a hot lead or notify operations about a failed fulfillment step.',
    useItWhen: [
      'Your team already uses Slack.',
      'The message is operational and should be seen quickly.',
      'You want fast internal visibility into workflow results.',
    ],
    notIdealWhen: [
      'The audience is external customers. Email is usually better.',
      'You do not have a Slack incoming webhook set up.',
    ],
    firstTest: [
      'Create a Slack incoming webhook.',
      'Use a short message like FlowForge test: {input}.',
      'Trigger the workflow and confirm the message appears in the target channel.',
    ],
    beginnerMistakes: [
      'Using a normal Slack URL instead of a real incoming webhook URL.',
      'Posting huge unreadable payloads instead of a short formatted summary.',
      'Expecting the optional channel field to override every Slack webhook configuration.',
    ],
  },
};

export const orderedNodeTypes = NODE_CATEGORIES.flatMap((category) => category.types).map((node) => node.type);

export const nodeCategoryLabelByType = Object.fromEntries(
  Object.values(NODE_TYPES).map((node) => [node.type, NODE_CATEGORIES.find((category) => category.category === node.category)?.label || node.category])
);
