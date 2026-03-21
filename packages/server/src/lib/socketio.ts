// ============================================
// FlowForge — Socket.IO Manager
// ============================================
// Manages Socket.IO connections and provides a way to emit
// real-time events from anywhere in the backend.
//
// HOW IT WORKS:
// When a workflow executes, each node's status is emitted via Socket.IO
// so the frontend can update the UI in real-time.

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';

let io: SocketIOServer | null = null;

// Initialize Socket.IO with the HTTP server
export function initSocketIO(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`🔌 Client connected: ${socket.id}`);

    // Join a room for a specific execution (so we can target updates)
    socket.on('join-execution', (executionId: string) => {
      socket.join(`execution:${executionId}`);
      logger.info(`📡 ${socket.id} joined execution:${executionId}`);
    });

    // Leave execution room
    socket.on('leave-execution', (executionId: string) => {
      socket.leave(`execution:${executionId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  logger.info('📡 Socket.IO ready for connections');
  return io;
}

// Get the Socket.IO instance (used by the executor to emit events)
export function getIO(): SocketIOServer | null {
  return io;
}

// ---- Emit helpers ----

// Emit execution status update (running, completed, failed)
export function emitExecutionStatus(
  executionId: string,
  status: string,
  data?: Record<string, unknown>,
) {
  if (io) {
    io.to(`execution:${executionId}`).emit('execution:status', {
      executionId,
      status,
      ...data,
    });
  }
}

// Emit individual node status (pending → running → completed → failed)
export function emitNodeStatus(
  executionId: string,
  nodeId: string,
  status: string,
  data?: Record<string, unknown>,
) {
  if (io) {
    io.to(`execution:${executionId}`).emit('execution:node-status', {
      executionId,
      nodeId,
      status,
      ...data,
    });
  }
}

// Emit a log entry (for the real-time log panel)
export function emitExecutionLog(
  executionId: string,
  level: 'info' | 'warn' | 'error' | 'success',
  message: string,
  nodeId?: string,
) {
  if (io) {
    io.to(`execution:${executionId}`).emit('execution:log', {
      executionId,
      level,
      message,
      nodeId,
      timestamp: new Date().toISOString(),
    });
  }
}
