'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, Activity, Clock, Calendar, Box, Code, GitBranch } from 'lucide-react';
import { executionApi, Execution } from '@/lib/api';
import { ReactFlow, Controls, Background, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ─── Style constants ────────────────────────────────────────
const S = {
  page:      { minHeight: '100vh', background: '#F1F5F9' } as React.CSSProperties,
  backBtn:   (hov: boolean): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: 'none', background: hov ? '#F1F5F9' : 'transparent', color: hov ? '#0F172A' : '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', marginBottom: 20 }),
  heroBox:   (color: string, bg: string, border: string): React.CSSProperties => ({ background: bg, border: `1.5px solid ${border}`, borderRadius: 20, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' as const }),
  metaChip:  { background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '10px 16px', border: '1px solid rgba(255,255,255,0.6)', minWidth: 120 } as React.CSSProperties,
  metaLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#64748B', marginBottom: 4 },
  metaValue: { fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 } as React.CSSProperties,
  grid:      { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' } as React.CSSProperties,
  sectionH:  { fontSize: 15, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as React.CSSProperties,
  nodeCard:  (sel: boolean, hov: boolean): React.CSSProperties => ({ background: '#fff', borderRadius: 16, border: sel ? '1.5px solid #3B82F6' : (hov ? '1.5px solid #CBD5E1' : '1.5px solid #E2E8F0'), padding: '16px 20px', cursor: 'pointer', boxShadow: sel ? '0 0 0 3px rgba(59,130,246,0.12)' : (hov ? '0 2px 8px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)'), transition: 'all 0.15s', marginBottom: 10 }),
  statusDot: (success: boolean, failed: boolean): React.CSSProperties => ({ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${success ? '#BBF7D0' : failed ? '#FECACA' : '#BFDBFE'}`, background: success ? '#F0FDF4' : failed ? '#FEF2F2' : '#EFF6FF' }),
  inspector: { background: '#0F172A', borderRadius: 20, border: '1px solid #1E293B', overflow: 'hidden', position: 'sticky' as const, top: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.24)' } as React.CSSProperties,
  inspHdr:   { background: '#1E293B', padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 } as React.CSSProperties,
  inspBody:  { padding: 16, height: 560, overflowY: 'auto' as const } as React.CSSProperties,
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  COMPLETED: { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
  FAILED:    { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  RUNNING:   { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  PENDING:   { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
};

export default function ExecutionDetailPage() {
  const { id: executionId } = useParams() as { id: string };
  const router = useRouter();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hovBack, setHovBack] = useState(false);
  const [hovNode, setHovNode] = useState<string | null>(null);

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
      <div style={{ ...S.page, padding: '32px' }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 80, background: '#fff', borderRadius: 16, border: '1.5px solid #E2E8F0', marginBottom: 16, opacity: 0.5 }} />)}
      </div>
    );
  }
  if (!execution) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 14 }}>Execution not found.</div>;
  }

  const isSuccess = execution.status === 'COMPLETED';
  const isFailed  = execution.status === 'FAILED';
  const isRunning = !isSuccess && !isFailed;
  const cfg = STATUS_CONFIG[execution.status] || STATUS_CONFIG.RUNNING;

  // Compute Read-Only Flow graph
  const rfNodes: Node[] = (execution.workflow?.nodesJson || []).map((n: any) => {
    const log = execution.nodeExecutions?.find(ne => ne.nodeId === n.id);
    let borderColor = '#E2E8F0';
    let bg = '#ffffff';
    let opacity = log ? 1 : 0.4;
    
    if (log?.status === 'SUCCESS')   { borderColor = '#16A34A'; bg = '#F0FDF4'; }
    if (log?.status === 'FAILED')    { borderColor = '#DC2626'; bg = '#FEF2F2'; }
    if (log?.status === 'RUNNING')   { borderColor = '#2563EB'; bg = '#EFF6FF'; }

    const isSelected = selectedNode?.id === n.id || selectedNode?.nodeId === n.id;

    return {
      id: n.id,
      position: n.position,
      type: 'default', // Fallback to safe default renderer
      data: { label: <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>{n.data?.label || 'Node'}</div> },
      draggable: false,
      selectable: true,
      style: {
        background: bg,
        border: `2.5px solid ${borderColor}`,
        borderRadius: 12,
        padding: '12px 20px',
        boxShadow: isSelected ? `0 0 0 4px ${borderColor}30` : '0 1px 4px rgba(0,0,0,0.06)',
        opacity,
        minWidth: 160,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }
    };
  });

  const rfEdges: Edge[] = (execution.workflow?.edgesJson || []).map((e: any) => {
    // Determine target node status to color the edge
    const targetLog = execution.nodeExecutions?.find(ne => ne.nodeId === e.target);
    let edgeColor = '#94A3B8';
    let animated = false;
    if (targetLog?.status === 'SUCCESS') edgeColor = '#16A34A';
    if (targetLog?.status === 'FAILED')  edgeColor = '#DC2626';
    if (targetLog?.status === 'RUNNING') { edgeColor = '#2563EB'; animated = true; }

    return {
      ...e,
      animated,
      style: { stroke: edgeColor, strokeWidth: 2.5 },
    };
  });

  const handleNodeClick = (_: any, node: Node) => {
    const log = execution.nodeExecutions?.find(ne => ne.nodeId === node.id);
    setSelectedNode(log || { ...node, nodeName: node.data.label, notRun: true });
  };

  return (
    <div style={S.page}>
      <div style={{ padding: '28px 32px' }}>
        {/* Back */}
        <button style={S.backBtn(hovBack)} onMouseEnter={() => setHovBack(true)} onMouseLeave={() => setHovBack(false)} onClick={() => router.push('/executions')}>
          <ArrowLeft size={15} /> Back to Executions
        </button>

        {/* Hero header */}
        <div style={S.heroBox(cfg.color, cfg.bg, cfg.border)}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              {isSuccess ? <CheckCircle2 size={32} color="#16A34A" /> : isFailed ? <XCircle size={32} color="#DC2626" /> : <Activity size={32} color="#2563EB" />}
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', margin: 0 }}>{execution.workflow?.name || 'Workflow Run'}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748B' }}>ID: {execution.id}</span>
              <span style={{ color: '#CBD5E1' }}>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.7)', color: cfg.color, border: `1px solid ${cfg.border}` }}>
                {execution.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={S.metaChip}>
              <div style={S.metaLabel}>Duration</div>
              <div style={S.metaValue}><Clock size={13} color="#94A3B8" /> {execution.duration ? `${execution.duration}ms` : 'Running...'}</div>
            </div>
            <div style={S.metaChip}>
              <div style={S.metaLabel}>Started</div>
              <div style={S.metaValue}><Calendar size={13} color="#94A3B8" /> {new Date(execution.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {isFailed && execution.errorMessage && (
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '12px 16px', border: '1px solid #FECACA' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Fatal Error</p>
              <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>{execution.errorMessage}</p>
            </div>
          )}
        </div>

        {/* Two column grid */}
        <div style={S.grid}>
          {/* Left: Visual Graph Replay */}
          <div style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 20, height: 600, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', padding: '8px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <GitBranch size={16} color="#3B82F6" /> Visual Graph Replay
            </div>
            
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodeClick={handleNodeClick}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.5}
              maxZoom={1.5}
            >
              <Background color="#CBD5E1" gap={24} size={1.5} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>

          {/* Right: Data Inspector */}
          <div style={S.inspector}>
            <div style={S.inspHdr}>
              <Code size={15} color="#60A5FA" />
              <h3 style={{ color: '#F1F5F9', fontSize: 13, fontWeight: 700, margin: 0 }}>Data Inspector</h3>
            </div>
            <div style={S.inspBody}>
              {!selectedNode ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 12, color: '#475569' }}>
                  <Box size={32} style={{ opacity: 0.25 }} />
                  <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>Click any node on the Visual Graph to inspect its raw JSON payload and execution logs.</p>
                </div>
              ) : selectedNode.notRun ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 12, color: '#94A3B8' }}>
                  <XCircle size={32} style={{ opacity: 0.25 }} />
                  <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>This node <strong>({selectedNode.nodeName})</strong> was never executed. The workflow failed or stopped before reaching it.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748B', marginBottom: 4 }}>Node</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>{selectedNode.nodeName}</p>
                        <p style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', margin: '4px 0 0' }}>Type: {selectedNode.nodeType}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: selectedNode.status === 'SUCCESS' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)', color: selectedNode.status === 'SUCCESS' ? '#4ADE80' : '#F87171' }}>
                          {selectedNode.status}
                        </span>
                        <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '6px 0 0' }}>{selectedNode.duration ? `${selectedNode.duration}ms` : '—'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedNode.status === 'FAILED' && selectedNode.errorMessage && (
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FCA5A5', marginBottom: 8 }}>Error Message</p>
                      <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '12px', color: '#FCA5A5', fontSize: 12, lineHeight: 1.5 }}>
                        {selectedNode.errorMessage}
                      </div>
                    </div>
                  )}

                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748B', marginBottom: 8 }}>Output JSON</p>
                    <pre style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: '12px 14px', fontSize: 12, color: '#93C5FD', fontFamily: 'monospace', overflowX: 'auto', border: '1px solid #1E293B', lineHeight: 1.6, margin: 0, maxHeight: 300 }}>
                      {JSON.stringify(selectedNode.outputData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
