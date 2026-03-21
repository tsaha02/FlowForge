'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GitBranch, Play, CheckCircle2, XCircle, Activity, ArrowRight, Clock, Zap, MoreVertical } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { workflowApi, executionApi, Workflow, Execution } from '@/lib/api';

// ─── Style helpers ────────────────────────────────────────────
const S = {
  page:    { minHeight: '100vh', background: '#F1F5F9', display: 'flex', flexDirection: 'column' } as React.CSSProperties,
  hBar:    { position: 'sticky' as const, top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  hInner:  { padding: '20px 32px' } as React.CSSProperties,
  hTitle:  { fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 } as React.CSSProperties,
  hSub:    { fontSize: 14, color: '#64748B', margin: '3px 0 0' } as React.CSSProperties,
  content: { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column' as const, gap: 28 } as React.CSSProperties,
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 } as React.CSSProperties,
  kpiCard: (hov: boolean, accentBorder: string): React.CSSProperties => ({ background: '#fff', border: hov ? `1.5px solid ${accentBorder}` : '1.5px solid #E2E8F0', borderRadius: 20, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.04)', transition: 'all 0.2s ease', cursor: 'default' }),
  kpiIcon: (bg: string, border: string): React.CSSProperties => ({ width: 48, height: 48, borderRadius: 14, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
  kpiNum:  { fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1, margin: 0 } as React.CSSProperties,
  kpiLbl:  { fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 4px' } as React.CSSProperties,
  section: { background: '#fff', borderRadius: 20, border: '1.5px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' } as React.CSSProperties,
  secHdr:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' } as React.CSSProperties,
  secTitle:{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 } as React.CSSProperties,
  viewAll: (hov: boolean): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: hov ? '#1D4ED8' : '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }),
  th:      { padding: '11px 20px', fontSize: 11, fontWeight: 700, color: '#64748B', textAlign: 'left' as const, background: '#F8FAFC', textTransform: 'uppercase' as const, letterSpacing: '0.06em', borderBottom: '1px solid #E2E8F0' },
  td:      { padding: '14px 20px', fontSize: 13, color: '#374151', borderTop: '1px solid #F8FAFC', whiteSpace: 'nowrap' as const },
  statusPill: (s: string): React.CSSProperties => {
    const m: Record<string, [string, string, string]> = {
      COMPLETED: ['#16A34A', '#F0FDF4', '#BBF7D0'],
      FAILED:    ['#DC2626', '#FEF2F2', '#FECACA'],
      RUNNING:   ['#2563EB', '#EFF6FF', '#BFDBFE'],
    };
    const [c, bg, bd] = m[s] || m.RUNNING;
    return { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, color: c, background: bg, border: `1px solid ${bd}` };
  },
  wfItem: (hov: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', background: hov ? '#F8FAFC' : 'transparent', cursor: 'pointer', transition: 'background 0.12s', borderTop: '1px solid #F8FAFC' }),
  dropMenu: { position: 'absolute' as const, right: 0, top: '100%', marginTop: 4, width: 160, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '6px 0', zIndex: 50 },
  dropItem: (danger?: boolean): React.CSSProperties => ({ width: '100%', textAlign: 'left' as const, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: danger ? '#DC2626' : '#374151', fontWeight: danger ? 600 : 400 }),
};

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { activeWorkspaceId } = useAuthStore();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [hovCard, setHovCard] = useState<string | null>(null);
  const [hovRow, setHovRow] = useState<string | null>(null);
  const [hovWf, setHovWf] = useState<string | null>(null);
  const [hov, setHov] = useState<Record<string, boolean>>({});
  const h = (k: string) => ({ onMouseEnter: () => setHov(p => ({...p,[k]:true})), onMouseLeave: () => setHov(p => ({...p,[k]:false})) });

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    Promise.all([workflowApi.list(activeWorkspaceId), executionApi.list(activeWorkspaceId)])
      .then(([wRes, eRes]) => { setWorkflows(wRes.data || []); setExecutions(eRes.data?.executions || []); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [activeWorkspaceId]);

  const activeCount = workflows.filter(w => w.status === 'ACTIVE').length;
  const totalExec   = executions.length;
  const successExec = executions.filter(e => e.status === 'COMPLETED').length;
  const successRate = totalExec > 0 ? Math.round((successExec / totalExec) * 100) : 0;
  const recent = [...executions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, 5);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); setOpenDropdownId(null);
    if (!confirm('Delete this workflow?')) return;
    try { await workflowApi.delete(id); setWorkflows(p => p.filter(w => w.id !== id)); } catch { /* ignore */ }
  };
  const handleRun = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); setOpenDropdownId(null);
    try { await executionApi.execute(id); } catch { /* ignore */ }
  };

  const KPI_CARDS = [
    { key: 'wf',  label: 'Total Workflows',   value: workflows.length, sub: `${activeCount} Active · ${workflows.length - activeCount} Draft`, iconBg: '#EFF6FF', iconBd: '#BFDBFE', accentBd: '#93C5FD', icon: <GitBranch size={22} color="#2563EB" /> },
    { key: 'ex',  label: 'Total Executions',  value: totalExec,         sub: 'All time runs across workspace', iconBg: '#F5F3FF', iconBd: '#DDD6FE', accentBd: '#C4B5FD', icon: <Play size={22} color="#7C3AED" /> },
    { key: 'sr',  label: 'Success Rate',       value: `${successRate}%`, sub: `${successExec} passed · ${totalExec - successExec} failed`, iconBg: '#F0FDF4', iconBd: '#BBF7D0', accentBd: '#86EFAC', icon: <Activity size={22} color="#16A34A" /> },
  ];

  return (
    <div style={S.page} onClick={() => setOpenDropdownId(null)}>
      {/* Header */}
      <div style={S.hBar}>
        <div style={S.hInner}>
          <h1 style={S.hTitle}>Dashboard</h1>
          <p style={S.hSub}>Monitor your automation metrics and recent workflow activity</p>
        </div>
      </div>

      <div style={S.content}>
        {isLoading ? (
          <div style={S.kpiGrid}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 120, background: '#fff', borderRadius: 20, border: '1.5px solid #E2E8F0', opacity: 0.5 }} />)}
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' as const }}>
              {KPI_CARDS.map(card => (
                <div key={card.key} style={{ ...S.kpiCard(hovCard === card.key, card.accentBd), flex: '1 1 200px' }} onMouseEnter={() => setHovCard(card.key)} onMouseLeave={() => setHovCard(null)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={S.kpiIcon(card.iconBg, card.iconBd)}>{card.icon}</div>
                    <div>
                      <p style={S.kpiLbl}>{card.label}</p>
                      <p style={S.kpiNum}>{card.value}</p>
                    </div>
                  </div>
                  {card.key === 'sr' ? (
                    <div>
                      <div style={{ height: 6, background: '#F1F5F9', borderRadius: 100, overflow: 'hidden', marginBottom: 6 }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${successRate}%` }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }} style={{ height: '100%', background: '#22C55E', borderRadius: 100 }} />
                      </div>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{card.sub}</p>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{card.sub}</p>
                  )}
                </div>
              ))}

              {/* Quick start card */}
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)', borderRadius: 20, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 4px 16px rgba(37,99,235,0.3)', cursor: 'pointer' }} onClick={() => router.push('/workflows')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={20} color="#fff" />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Quick Start</p>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>Automate your next idea with our visual builder.</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                  Go to Workflows <ArrowRight size={14} />
                </div>
              </div>
            </div>

            {/* Bottom two-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
              {/* Recent executions */}
              <div style={S.section}>
                <div style={S.secHdr}>
                  <h2 style={S.secTitle}>Recent Executions</h2>
                  <button style={S.viewAll(!!hov.viewEx)} {...h('viewEx')} onClick={() => router.push('/executions')}>
                    View All <ArrowRight size={13} />
                  </button>
                </div>
                {recent.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                    <Activity size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', margin: '0 0 6px' }}>No executions yet</p>
                    <p style={{ fontSize: 13, margin: 0 }}>Run a workflow to see results here.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{['Workflow', 'Status', 'Date', 'Duration'].map(c => <th key={c} style={{ ...S.th, textAlign: c === 'Duration' ? 'right' as const : 'left' as const }}>{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {recent.map(exec => (
                        <tr key={exec.id} onClick={() => router.push(`/executions/${exec.id}`)} onMouseEnter={() => setHovRow(exec.id)} onMouseLeave={() => setHovRow(null)} style={{ cursor: 'pointer', background: hovRow === exec.id ? '#F8FAFC' : '#fff', transition: 'background 0.12s' }}>
                          <td style={{ ...S.td, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <GitBranch size={14} color="#94A3B8" /> <span style={{ fontWeight: 600, color: '#1E293B' }}>{exec.workflow?.name || 'Unknown'}</span>
                          </td>
                          <td style={S.td}>
                            <span style={S.statusPill(exec.status)}>
                              {exec.status === 'COMPLETED' ? <CheckCircle2 size={11} /> : exec.status === 'FAILED' ? <XCircle size={11} /> : <Activity size={11} />}
                              {exec.status === 'COMPLETED' ? 'Success' : exec.status === 'FAILED' ? 'Failed' : exec.status}
                            </span>
                          </td>
                          <td style={{ ...S.td, color: '#64748B' }}>{new Date(exec.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td style={{ ...S.td, textAlign: 'right', color: '#64748B' }}>{exec.duration ? `${exec.duration}ms` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Workflow mini list */}
              <div style={S.section}>
                <div style={S.secHdr}>
                  <h2 style={S.secTitle}>Your Workflows</h2>
                  <button style={S.viewAll(!!hov.viewWf)} {...h('viewWf')} onClick={() => router.push('/workflows')}>View All</button>
                </div>
                {workflows.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No workflows yet.</div>
                ) : (
                  <>
                    {workflows.slice(0, 4).map(w => (
                      <div key={w.id} style={S.wfItem(hovWf === w.id)} onClick={() => router.push(`/editor/${w.id}`)} onMouseEnter={() => setHovWf(w.id)} onMouseLeave={() => setHovWf(null)}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: hovWf === w.id ? '#2563EB' : '#1E293B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>{w.name}</p>
                          <p style={{ fontSize: 11, color: '#94A3B8', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {new Date(w.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <div
                          style={{ position: 'relative', flexShrink: 0 }}
                          data-dropdown
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={e => { e.stopPropagation(); setOpenDropdownId(openDropdownId === w.id ? null : w.id); }}
                            style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: openDropdownId === w.id ? '#F1F5F9' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}
                          >
                            <MoreVertical size={14} />
                          </button>
                          {openDropdownId === w.id && (
                            <div style={S.dropMenu}>
                              <button style={S.dropItem()} onClick={e => { e.stopPropagation(); router.push(`/editor/${w.id}`); }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>Edit</button>
                              <button style={S.dropItem()} onClick={e => handleRun(e, w.id)}
                                onMouseEnter={e => (e.currentTarget.style.background = '#F0FDF4')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                <Play size={12} color="#16A34A" /> Run Now
                              </button>
                              <div style={{ height: 1, background: '#F1F5F9', margin: '4px 10px' }} />
                              <button style={S.dropItem(true)} onClick={e => handleDelete(e, w.id)}
                                onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {workflows.length > 4 && (
                      <button onClick={() => router.push('/workflows')} style={{ width: '100%', padding: '12px 20px', background: 'none', border: 'none', color: '#64748B', fontSize: 13, cursor: 'pointer', borderTop: '1px solid #F8FAFC', textAlign: 'center' as const }}>
                        View all {workflows.length} workflows
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
