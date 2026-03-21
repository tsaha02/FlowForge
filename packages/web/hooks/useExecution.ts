// ============================================
// FlowForge — useExecution Hook
// ============================================
// Custom React hook that manages Socket.IO connection for
// real-time execution monitoring. It listens for:
// - execution:status — Overall execution status changes
// - execution:node-status — Per-node status updates
// - execution:log — Real-time log entries

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ExecutionLog {
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  nodeId?: string;
  timestamp: string;
}

export interface NodeStatusUpdate {
  nodeId: string;
  status: string;
  duration?: number;
  error?: string;
}

interface UseExecutionReturn {
  isConnected: boolean;
  executionId: string | null;
  executionStatus: string | null;
  nodeStatuses: Map<string, NodeStatusUpdate>;
  logs: ExecutionLog[];
  startMonitoring: (execId: string) => void;
  stopMonitoring: () => void;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export function useExecution(): UseExecutionReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, NodeStatusUpdate>>(new Map());
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for execution status changes
    socket.on('execution:status', (data: { executionId: string; status: string }) => {
      setExecutionStatus(data.status);
    });

    // Listen for node status updates
    socket.on('execution:node-status', (data: NodeStatusUpdate & { executionId: string }) => {
      setNodeStatuses((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.nodeId, {
          nodeId: data.nodeId,
          status: data.status,
          duration: data.duration,
          error: data.error,
        });
        return newMap;
      });
    });

    // Listen for log entries
    socket.on('execution:log', (data: ExecutionLog) => {
      setLogs((prev) => [...prev, data]);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Join an execution room to receive updates
  const startMonitoring = useCallback((execId: string) => {
    setExecutionId(execId);
    setExecutionStatus('PENDING');
    setNodeStatuses(new Map());
    setLogs([]);
    socketRef.current?.emit('join-execution', execId);
  }, []);

  // Leave the execution room
  const stopMonitoring = useCallback(() => {
    if (executionId) {
      socketRef.current?.emit('leave-execution', executionId);
    }
    setExecutionId(null);
  }, [executionId]);

  return {
    isConnected,
    executionId,
    executionStatus,
    nodeStatuses,
    logs,
    startMonitoring,
    stopMonitoring,
  };
}
