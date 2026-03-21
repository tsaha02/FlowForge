// ============================================
// FlowForge — Express Server Entry Point
// ============================================
// This is the main file that starts the backend server.
//
// WHAT HAPPENS WHEN THE SERVER STARTS:
// 1. Loads environment variables from .env
// 2. Creates an Express app with middleware (CORS, JSON parsing, etc.)
// 3. Sets up Socket.IO for real-time communication
// 4. Registers all API routes
// 5. Starts the BullMQ worker for workflow execution
// 6. Starts listening on the configured port (default: 4000)

import dotenv from 'dotenv';
import path from 'path';

// Load .env from the server directory first, then fall back to root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { initSocketIO } from './lib/socketio';
import { startWorkflowWorker } from './services/workflowExecutor';
import authRoutes from './routes/auth';
import workflowRoutes from './routes/workflows';
import executionRoutes from './routes/executions';
import { credentialsRouter } from './routes/credentials';
import { usersRouter } from './routes/users';
import { workspacesRouter } from './routes/workspaces';
import webhooksRouter from './routes/webhooks';

// ---- Create the Express app ----
const app = express();
const httpServer = createServer(app);

// ---- Socket.IO Setup ----
// Uses our Socket.IO manager (socketio.ts) which provides emit helpers
// that the executor uses to send real-time updates
const io = initSocketIO(httpServer);

// ---- Middleware ----

// Helmet: Adds security headers to protect against common attacks
app.use(helmet());

// CORS: Allows the frontend (localhost:3000) to call the backend (localhost:4000)
app.use(
  cors({
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    credentials: true,
  }),
);

// JSON parser: Converts incoming JSON request bodies to JavaScript objects
app.use(express.json({ limit: '10mb' }));

// URL-encoded parser: Handles form submissions
app.use(express.urlencoded({ extended: true }));

// ---- API Routes ----

// Health check — a simple endpoint to verify the server is running
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Auth routes: /api/auth/register, /api/auth/login
app.use('/api/auth', authRoutes);

// Workflow routes: /api/workflows (CRUD)
app.use('/api/workflows', workflowRoutes);

// Execution routes: /api/workflows/:id/execute, /api/executions
app.use('/api', executionRoutes);

// Credentials routes: /api/credentials (CRUD)
app.use('/api/credentials', credentialsRouter);

// User and Workspace routes
app.use('/api/users', usersRouter);
app.use('/api/workspaces', workspacesRouter);

// Webhook trigger routes (public)
app.use('/api/webhooks', webhooksRouter);

// Make io accessible to routes (for emitting events)
app.set('io', io);

// ---- Error Handler (must be LAST) ----
app.use(errorHandler);

// ---- Start the Server ----
const PORT = parseInt(process.env.PORT || '4000', 10);

httpServer.listen(PORT, () => {
  logger.success(`🚀 FlowForge server running on http://localhost:${PORT}`);
  logger.info(`💾 Database: PostgreSQL via Prisma`);
  logger.info(`📦 Redis: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);

  // Start the BullMQ worker for workflow execution
  startWorkflowWorker();
});

// Export for testing
export { app, io, httpServer };
