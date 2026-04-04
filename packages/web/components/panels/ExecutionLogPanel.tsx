'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, CheckCircle2, XCircle, AlertCircle, Info, ChevronDown } from 'lucide-react';
import { ExecutionLog } from '@/hooks/useExecution';

interface ExecutionLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ExecutionLog[];
  executionStatus: string | null;
}

const LEVEL_ICON: Record<string, React.ReactNode> = {
  info:    <Info        size={11} color="#60A5FA" />,
  warn:    <AlertCircle size={11} color="#FBBF24" />,
  error:   <XCircle    size={11} color="#F87171" />,
  success: <CheckCircle2 size={11} color="#34D399" />,
};
const LEVEL_COLOR: Record<string, string> = {
  info: '#93C5FD', warn: '#FCD34D', error: '#FCA5A5', success: '#6EE7B7',
};
const STATUS_CONFIG: Record<string, { dot: string; label: string; pulse: boolean }> = {
  PENDING:   { dot: '#F59E0B', label: 'Pending',   pulse: false },
  RUNNING:   { dot: '#60A5FA', label: 'Running',   pulse: true  },
  COMPLETED: { dot: '#34D399', label: 'Completed', pulse: false },
  FAILED:    { dot: '#F87171', label: 'Failed',    pulse: false },
};

export default function ExecutionLogPanel({ isOpen, onClose, logs, executionStatus }: ExecutionLogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const statusCfg = executionStatus ? STATUS_CONFIG[executionStatus] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 300 }}
          exit={{ height: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          style={{
            background: '#080F1D',
            borderTop: '1px solid #1A2540',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 16px',
            borderBottom: '1px solid #131D30',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Terminal icon */}
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Terminal size={12} color="#60A5FA" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Execution Log
              </span>

              {/* Status badge */}
              {statusCfg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 1, height: 12, background: '#131D30' }} />
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: statusCfg.dot,
                    boxShadow: statusCfg.pulse ? `0 0 8px ${statusCfg.dot}` : 'none',
                    animation: statusCfg.pulse ? 'ff-pulse 1.5s infinite' : 'none',
                    display: 'inline-block', flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: statusCfg.dot, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {statusCfg.label}
                  </span>
                </div>
              )}

              {/* Log count */}
              {logs.length > 0 && (
                <span style={{
                  padding: '1px 7px', borderRadius: 100, fontSize: 10, fontWeight: 700,
                  background: 'rgba(96,165,250,0.1)', color: '#60A5FA',
                  border: '1px solid rgba(96,165,250,0.15)',
                }}>
                  {logs.length}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Scroll to bottom */}
              <button
                onClick={() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }}
                title="Scroll to bottom"
                style={{
                  width: 24, height: 24, border: 'none', background: 'rgba(255,255,255,0.04)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#2D3F55', borderRadius: 6, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2D3F55'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <ChevronDown size={12} />
              </button>
              {/* Close */}
              <button
                onClick={onClose}
                style={{
                  width: 24, height: 24, border: 'none', background: 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#2D3F55', borderRadius: 6, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2D3F55'; }}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Log entries */}
          <div
            ref={scrollRef}
            className="scrollbar-dark"
            style={{
              flex: 1, overflowY: 'auto',
              padding: '6px 0',
              fontFamily: '"Fira Code", "Cascadia Code", ui-monospace, monospace',
            }}
          >
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#1E2E42', fontSize: 12 }}>
                Waiting for execution to start…
              </div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '3px 16px', borderRadius: 0,
                    transition: 'background 0.1s',
                    borderLeft: `2px solid transparent`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(30,41,59,0.4)';
                    (e.currentTarget as HTMLDivElement).style.borderLeftColor = LEVEL_COLOR[log.level] || '#334155';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: 10, color: '#1E2E42', minWidth: 72, paddingTop: 1, letterSpacing: '0.02em' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span style={{ paddingTop: 1, flexShrink: 0 }}>{LEVEL_ICON[log.level]}</span>
                  <span style={{ fontSize: 11, color: LEVEL_COLOR[log.level] || '#94A3B8', flex: 1, lineHeight: 1.55 }}>
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
