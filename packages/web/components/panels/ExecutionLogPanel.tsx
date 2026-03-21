'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { ExecutionLog } from '@/hooks/useExecution';

interface ExecutionLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ExecutionLog[];
  executionStatus: string | null;
}

const LEVEL_ICON: Record<string, React.ReactNode> = {
  info:    <Info    size={13} color="#60A5FA" />,
  warn:    <AlertCircle size={13} color="#FBBF24" />,
  error:   <XCircle  size={13} color="#F87171" />,
  success: <CheckCircle2 size={13} color="#34D399" />,
};
const LEVEL_COLOR: Record<string, string> = {
  info: '#93C5FD', warn: '#FCD34D', error: '#FCA5A5', success: '#6EE7B7',
};
const STATUS_DOT: Record<string, { bg: string; pulse: boolean }> = {
  PENDING:   { bg: '#FBBF24', pulse: false },
  RUNNING:   { bg: '#60A5FA', pulse: true  },
  COMPLETED: { bg: '#34D399', pulse: false },
  FAILED:    { bg: '#F87171', pulse: false },
};

export default function ExecutionLogPanel({ isOpen, onClose, logs, executionStatus }: ExecutionLogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const dot = executionStatus ? STATUS_DOT[executionStatus] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 280 }}
          exit={{ height: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{ background: '#0F172A', borderTop: '1px solid #1E293B', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(51,65,85,0.5)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Terminal size={14} color="#64748B" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Execution Log</span>
              {dot && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot.bg, animation: dot.pulse ? 'pulse 1.5s infinite' : 'none' }} />
                  <span style={{ fontSize: 9, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{executionStatus}</span>
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94A3B8')} onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
              <X size={13} />
            </button>
          </div>

          {/* Log entries */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', fontFamily: 'ui-monospace, monospace' }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#334155', fontSize: 12 }}>
                Waiting for execution...
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '4px 6px', borderRadius: 6, transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,41,59,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 10, color: '#334155', minWidth: 65, marginTop: 1.5 }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {LEVEL_ICON[log.level]}
                  <span style={{ fontSize: 12, color: LEVEL_COLOR[log.level] || '#94A3B8', flex: 1, lineHeight: 1.5 }}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
