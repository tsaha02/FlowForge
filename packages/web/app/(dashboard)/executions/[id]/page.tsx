'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, XCircle, Activity, Clock, Calendar,
  Code, GitBranch, Box, AlertTriangle, Zap,
} from 'lucide-react';
import { executionApi, Execution } from '@/lib/api';
import { ReactFlow, Controls, Background, Edge, Node } from '@xyflow/react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '@xyflow/react/dist/style.css';

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  COMPLETED: { color: '#16A34A', bg: 'rgba(22,163,74,0.06)',  border: 'rgba(22,163,74,0.18)',  label: 'Completed' },
  FAILED:    { color: '#DC2626', bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.18)', label: 'Failed'    },
  RUNNING:   { color: '#2563EB', bg: 'rgba(37,99,235,0.06)', border: 'rgba(37,99,235,0.18)', label: 'Running'   },
  PENDING:   { color: '#D97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.18)', label: 'Pending'   },
};

interface FlowReplayNode { id: string; position: { x: number; y: number }; data?: { label?: string } }
interface FlowReplayEdge { id: string; source: string; target: string }

export default function ExecutionDetailPage() {
  const { id: executionId } = useParams() as { id: string };
  const router = useRouter();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hovBack, setHovBack] = useState(false);

  useEffect(() => {
    const load = async () => {
      try { const r = await executionApi.get(executionId); setExecution(r.data || null); }
      catch { /* ignore */ } finally { setIsLoading(false); }
    };
    load();
    const iv = setInterval(() => {
      if (execution?.status === 'RUNNING' || execution?.status === 'PENDING') load();
    }, 3000);
    return () => clearInterval(iv);
  }, [executionId, execution?.status]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-page)', padding: '32px' }}>
        {[180, 500, 80].map((h, i) => (
          <div key={i} className="ff-skeleton" style={{ height: h, borderRadius: 'var(--radius-lg)', marginBottom: 16 }} />
        ))}
      </div>
    );
  }

  if (!execution) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, background: 'var(--surface-subtle)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Box size={22} color="var(--text-muted)" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>Execution not found</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>This execution may have been deleted.</p>
          <button onClick={() => router.push('/executions')} style={{
            padding: '8px 18px', background: 'var(--brand)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            Back to Executions
          </button>
        </div>
      </div>
    );
  }

  const isSuccess = execution.status === 'COMPLETED';
  const isFailed  = execution.status === 'FAILED';
  const isRunning = !isSuccess && !isFailed;
  const cfg = STATUS_CONFIG[execution.status] || STATUS_CONFIG.RUNNING;

  const workflowNodes = Array.isArray(execution.workflow?.nodesJson)
    ? (execution.workflow.nodesJson as FlowReplayNode[]) : [];
  const workflowEdges = Array.isArray(execution.workflow?.edgesJson)
    ? (execution.workflow.edgesJson as FlowReplayEdge[]) : [];

  const rfNodes: Node[] = workflowNodes.map(n => {
    const log = execution.nodeExecutions?.find(ne => ne.nodeId === n.id);
    let borderColor = '#334155'; let bg = '#1E293B';
    if (log?.status === 'SUCCESS') { borderColor = '#16A34A'; bg = 'rgba(22,163,74,0.12)'; }
    if (log?.status === 'FAILED')  { borderColor = '#DC2626'; bg = 'rgba(220,38,38,0.12)'; }
    if (log?.status === 'RUNNING') { borderColor = '#3B82F6'; bg = 'rgba(59,130,246,0.12)'; }
    const isSelected = selectedNode?.id === n.id || selectedNode?.nodeId === n.id;
    return {
      id: n.id, position: n.position, type: 'default',
      data: { label: <div style={{ fontWeight: 600, fontSize: 12, color: '#F1F5F9' }}>{n.data?.label || 'Node'}</div> },
      draggable: false, selectable: true,
      style: {
        background: bg, border: `2px solid ${isSelected ? '#60A5FA' : borderColor}`,
        borderRadius: 10, padding: '10px 18px',
        boxShadow: isSelected ? '0 0 0 3px rgba(96,165,250,0.25)' : '0 2px 6px rgba(0,0,0,0.3)',
        opacity: log ? 1 : 0.35, minWidth: 150, textAlign: 'center', cursor: 'pointer',
        transition: 'all 0.2s',
      },
    };
  });

  const rfEdges: Edge[] = workflowEdges.map(e => {
    const targetLog = execution.nodeExecutions?.find(ne => ne.nodeId === e.target);
    let edgeColor = '#334155'; let animated = false;
    if (targetLog?.status === 'SUCCESS') edgeColor = '#16A34A';
    if (targetLog?.status === 'FAILED')  edgeColor = '#DC2626';
    if (targetLog?.status === 'RUNNING') { edgeColor = '#3B82F6'; animated = true; }
    return { ...e, animated, style: { stroke: edgeColor, strokeWidth: 2 } };
  });

  const handleNodeClick = (_: any, node: Node) => {
    const log = execution.nodeExecutions?.find(ne => ne.nodeId === node.id);
    setSelectedNode(log || { ...node, nodeName: node.data.label, notRun: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Back */}
        <button
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', marginBottom: 20,
            background: hovBack ? 'var(--surface-hover)' : 'transparent',
            border: '1px solid ' + (hovBack ? 'var(--border)' : 'transparent'),
            borderRadius: 'var(--radius-md)', color: hovBack ? 'var(--text-secondary)' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={() => setHovBack(true)}
          onMouseLeave={() => setHovBack(false)}
          onClick={() => router.push('/executions')}
        >
          <ArrowLeft size={14} /> Back to Executions
        </button>

        {/* ── Hero header ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{
            background: 'var(--surface-card)',
            border: `1px solid ${cfg.border}`,
            borderRadius: 'var(--radius-lg)',
            padding: '24px 28px',
            marginBottom: 24,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            {/* Left: title + ID */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)', flexShrink: 0,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isSuccess
                  ? <CheckCircle2 size={24} color={cfg.color} />
                  : isFailed
                  ? <XCircle size={24} color={cfg.color} />
                  : <Activity size={24} color={cfg.color} />}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', margin: 0 }}>
                    {execution.workflow?.name || 'Workflow Run'}
                  </h1>
                  <span style={{
                    padding: '3px 10px', borderRadius: 'var(--radius-full)',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                  }}>
                    {cfg.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    ID: {execution.id}
                  </span>
                  {execution.triggeredBy && (
                    <>
                      <span style={{ color: 'var(--border)' }}>·</span>
                      <span style={{
                        padding: '2px 8px', background: 'var(--surface-subtle)',
                        borderRadius: 'var(--radius-full)', fontSize: 10,
                        fontWeight: 700, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        border: '1px solid var(--border)',
                      }}>
                        {execution.triggeredBy}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: meta chips */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                background: 'var(--surface-subtle)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '10px 16px', minWidth: 110,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 5 }}>Duration</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  <Clock size={13} color="var(--text-muted)" />
                  {execution.duration ? `${execution.duration}ms` : isRunning ? 'Running…' : '—'}
                </div>
              </div>
              <div style={{
                background: 'var(--surface-subtle)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '10px 16px', minWidth: 150,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 5 }}>Started</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <Calendar size={13} color="var(--text-muted)" />
                  {new Date(execution.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {execution.nodeExecutions && (
                <div style={{
                  background: 'var(--surface-subtle)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '10px 16px', minWidth: 100,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 5 }}>Nodes</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    <Zap size={13} color="var(--brand)" />
                    {execution.nodeExecutions.length}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fatal error banner */}
          {isFailed && execution.errorMessage && (
            <div style={{
              marginTop: 20,
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.18)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <AlertTriangle size={15} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Fatal Error</p>
                <p style={{ fontSize: 13, color: '#B91C1C', margin: 0, lineHeight: 1.5 }}>{execution.errorMessage}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Two-column grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

          {/* Left: Visual Graph */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}
            style={{
              background: '#0D1526',
              border: '1px solid #1E293B',
              borderRadius: 'var(--radius-lg)',
              height: 580,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* Overlay label */}
            <div style={{
              position: 'absolute', top: 14, left: 14, zIndex: 10,
              background: 'rgba(13,21,38,0.85)', backdropFilter: 'blur(8px)',
              padding: '7px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid #1E293B',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: 700, color: '#94A3B8',
            }}>
              <GitBranch size={13} color="#3B82F6" /> Visual Graph Replay
            </div>

            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodeClick={handleNodeClick}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              minZoom={0.4}
              maxZoom={2}
            >
              <Background color="#1E293B" gap={28} size={1} />
              <Controls showInteractive={false} style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
            </ReactFlow>
          </motion.div>

          {/* Right: Data Inspector */}
          <motion.div
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.3 }}
            style={{
              background: '#0D1526',
              border: '1px solid #1E293B',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              position: 'sticky', top: 24,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* Inspector header */}
            <div style={{
              background: '#141E33',
              padding: '13px 18px',
              borderBottom: '1px solid #1E293B',
              display: 'flex', alignItems: 'center', gap: 9,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6,
                background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Code size={13} color="#60A5FA" />
              </div>
              <h3 style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>Data Inspector</h3>
              {selectedNode && !selectedNode.notRun && (
                <span style={{
                  marginLeft: 'auto', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  fontSize: 10, fontWeight: 700,
                  background: selectedNode.status === 'SUCCESS' ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)',
                  color: selectedNode.status === 'SUCCESS' ? '#4ADE80' : '#F87171',
                }}>
                  {selectedNode.status}
                </span>
              )}
            </div>

            {/* Inspector body */}
            <div style={{ height: 520, overflowY: 'auto', padding: 16 }}>
              {!selectedNode ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.04)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #1E293B' }}>
                    <Box size={20} color="#475569" />
                  </div>
                  <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.7, margin: 0, maxWidth: 260 }}>
                    Click any node in the graph to inspect its output data and execution details.
                  </p>
                </div>
              ) : selectedNode.notRun ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.04)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #1E293B' }}>
                    <XCircle size={20} color="#475569" />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', margin: '0 0 6px' }}>Node not executed</p>
                    <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, margin: 0, maxWidth: 260 }}>
                      The workflow stopped before reaching this node.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Node info */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', margin: '0 0 6px' }}>Node</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', margin: '0 0 3px' }}>{selectedNode.nodeName}</p>
                    {selectedNode.nodeType && (
                      <p style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', margin: 0 }}>type: {selectedNode.nodeType}</p>
                    )}
                    {selectedNode.duration != null && (
                      <p style={{ fontSize: 11, color: '#64748B', margin: '3px 0 0' }}>{selectedNode.duration}ms</p>
                    )}
                  </div>

                  {/* Error */}
                  {selectedNode.status === 'FAILED' && selectedNode.errorMessage && (
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FCA5A5', margin: '0 0 8px' }}>Error</p>
                      <div style={{
                        background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)',
                        borderRadius: 8, padding: '10px 12px',
                        color: '#FCA5A5', fontSize: 12, lineHeight: 1.6,
                      }}>
                        {selectedNode.errorMessage}
                      </div>
                    </div>
                  )}

                  {/* Output JSON */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', margin: '0 0 8px' }}>Output JSON</p>
                    <pre style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid #1E293B',
                      borderRadius: 8, padding: '12px',
                      fontSize: 11, color: '#93C5FD',
                      fontFamily: '"Fira Code", "Cascadia Code", monospace',
                      overflowX: 'auto', overflowY: 'auto',
                      lineHeight: 1.6, margin: 0,
                      maxHeight: 320,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    }}>
                      {JSON.stringify(selectedNode.outputData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
