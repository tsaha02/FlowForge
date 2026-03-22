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

  // Track the pending room to join — needed if startMonitoring is called
  // before the socket has connected (race condition fix)
  const pendingJoinRef = useRef<string | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    console.log(`🔌 [useExecution] Connecting to: ${API_URL}`);
    
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ [useExecution] Connected to Socket.IO');
      setIsConnected(true);
      // If startMonitoring was called before the socket connected, join now
      if (pendingJoinRef.current) {
        console.log(`📡 [useExecution] Joining execution room: ${pendingJoinRef.current}`);
        socket.emit('join-execution', pendingJoinRef.current);
        pendingJoinRef.current = null;
      }
    });

    socket.on('connect_error', (err) => {
      console.error('❌ [useExecution] Socket.IO connection error:', err);
    });

    socket.on('reconnect', (attempt) => {
      console.log(`🔄 [useExecution] Reconnected after ${attempt} attempts`);
      // Re-join the execution room after a reconnect so we don't miss updates
      setExecutionId((currentId) => {
        if (currentId) {
          console.log(`📡 [useExecution] Re-joining execution room: ${currentId}`);
          socket.emit('join-execution', currentId);
        }
        return currentId;
      });
    });

    socket.on('disconnect', (reason) => {
      console.warn(`🔌 [useExecution] Disconnected: ${reason}`);
      setIsConnected(false);
    });

    // Listen for execution status changes
    socket.on('execution:status', (data: { executionId: string; status: string }) => {
      console.log(`📈 [useExecution] Status update: ${data.status}`, data);
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

    const socket = socketRef.current;
    if (socket && socket.connected) {
      // Socket is ready — join immediately
      socket.emit('join-execution', execId);
    } else {
      // Socket not connected yet — queue the join for when it connects
      pendingJoinRef.current = execId;
    }
  }, []);

  // Leave the execution room
  const stopMonitoring = useCallback(() => {
    setExecutionId((currentId) => {
      if (currentId) {
        socketRef.current?.emit('leave-execution', currentId);
      }
      return null;
    });
    pendingJoinRef.current = null;
  }, []);

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
