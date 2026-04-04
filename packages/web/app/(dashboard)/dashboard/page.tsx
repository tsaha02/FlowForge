'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  GitBranch, Play, Activity,
  ArrowRight, Clock, Zap, MoreHorizontal, TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { workflowApi, executionApi, Workflow, Execution } from '@/lib/api';

// ── Status helpers ────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { dot: string; text: string; bg: string; border: string; label: string }> = {
    COMPLETED: { dot: '#22C55E', text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', label: 'Success' },
    FAILED:    { dot: '#EF4444', text: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Failed' },
    RUNNING:   { dot: '#3B82F6', text: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Running' },
    PENDING:   { dot: '#F59E0B', text: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Pending' },
  };
  const s = map[status] || map.PENDING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 'var(--radius-full)',
      fontSize: 'var(--text-xs)', fontWeight: 600,
      color: s.text, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0,
        boxShadow: status === 'RUNNING' ? `0 0 0 2px ${s.border}` : 'none',
      }} />
      {s.label}
    </span>
  );
}

function WorkflowStatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: '#22C55E', DRAFT: '#94A3B8', PAUSED: '#F59E0B', ARCHIVED: '#CBD5E1',
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 'var(--text-xs)', fontWeight: 600,
      color: status === 'ACTIVE' ? '#16A34A' : status === 'PAUSED' ? '#D97706' : '#94A3B8',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors[status] || '#CBD5E1', flexShrink: 0 }} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ── KPI card ──────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon, iconBg, iconColor, accentColor, progress,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ReactNode; iconBg: string; iconColor: string;
  accentColor: string; progress?: number;
}) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        flex: '1 1 180px',
        background: 'var(--surface-card)',
        border: `1px solid ${hov ? accentColor : 'var(--border)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: hov ? `var(--shadow-md), 0 0 0 1px ${accentColor}20` : 'var(--shadow-sm)',
        transition: 'all 0.18s ease',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle accent glow on hover */}
      {hov && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(circle at 20% 20%, ${accentColor}08 0%, transparent 70%)`,
        }} />
      )}

      {/* Icon + label row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
          {label}
        </span>
      </div>

      {/* Value */}
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value}
        </div>
        {progress !== undefined ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 4, background: 'var(--n-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                style={{ height: '100%', background: iconColor, borderRadius: 'var(--radius-full)' }}
              />
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 5 }}>{sub}</div>
          </div>
        ) : (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 5 }}>{sub}</div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function DashboardOverviewPage() {
  const router = useRouter();
  const { activeWorkspaceId, user } = useAuthStore();
  const [workflows, setWorkflows]   = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [openDd, setOpenDd]         = useState<string | null>(null);
  const [hovWf, setHovWf]           = useState<string | null>(null);
  const [hov, setHov]               = useState<Record<string, boolean>>({});
  const h = (k: string) => ({
    onMouseEnter: () => setHov(p => ({ ...p, [k]: true })),
    onMouseLeave: () => setHov(p => ({ ...p, [k]: false })),
  });

  // Close dropdown on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-dd]')) setOpenDd(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    Promise.all([workflowApi.list(activeWorkspaceId), executionApi.list(activeWorkspaceId)])
      .then(([wRes, eRes]) => {
        setWorkflows(wRes.data || []);
        setExecutions(eRes.data?.executions || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [activeWorkspaceId]);

  const activeCount = workflows.filter(w => w.status === 'ACTIVE').length;
  const totalExec   = executions.length;
  const successExec = executions.filter(e => e.status === 'COMPLETED').length;
  const failedExec  = executions.filter(e => e.status === 'FAILED').length;
  const successRate = totalExec > 0 ? Math.round((successExec / totalExec) * 100) : 0;
  const recent      = [...executions]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 6);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); setOpenDd(null);
    if (!confirm('Delete this workflow?')) return;
    try { await workflowApi.delete(id); setWorkflows(p => p.filter(w => w.id !== id)); } catch { /* ignore */ }
  };
  const handleRun = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); setOpenDd(null);
    try { await executionApi.execute(id); } catch { /* ignore */ }
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  // ── Skeleton ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
        <div style={{ background: 'var(--surface-card)', borderBottom: '1px solid var(--border)', padding: '20px 32px' }}>
          <div className="ff-skeleton" style={{ width: 220, height: 22, marginBottom: 6 }} />
          <div className="ff-skeleton" style={{ width: 160, height: 14 }} />
        </div>
        <div style={{ padding: '28px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="ff-skeleton" style={{ flex: '1 1 180px', height: 120, borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', display: 'flex', flexDirection: 'column' }} onClick={() => setOpenDd(null)}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em', margin: 0 }}>
              {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: '3px 0 0' }}>
              Here's what's happening with your automations today.
            </p>
          </div>

          <button
            className="ff-btn ff-btn-primary"
            onClick={() => router.push('/workflows')}
            style={{ gap: 7 }}
          >
            <Zap size={14} />
            New Workflow
          </button>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* KPI row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
          <KpiCard
            label="Workflows"
            value={workflows.length}
            sub={`${activeCount} active · ${workflows.length - activeCount} draft`}
            icon={<GitBranch size={18} />}
            iconBg="#EFF6FF" iconColor="#2563EB" accentColor="#3B82F6"
          />
          <KpiCard
            label="Executions"
            value={totalExec}
            sub="All time across workspace"
            icon={<Play size={18} />}
            iconBg="#F5F3FF" iconColor="#7C3AED" accentColor="#8B5CF6"
          />
          <KpiCard
            label="Success Rate"
            value={`${successRate}%`}
            sub={`${successExec} passed · ${failedExec} failed`}
            icon={<TrendingUp size={18} />}
            iconBg="#F0FDF4" iconColor="#16A34A" accentColor="#22C55E"
            progress={successRate}
          />

          {/* CTA card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push('/workflows')}
            style={{
              flex: '1 1 180px',
              background: 'linear-gradient(135deg, #2563EB 0%, #4338CA 100%)',
              borderRadius: 'var(--radius-xl)',
              padding: '20px 22px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(37,99,235,0.3)',
              transition: 'transform 0.18s, box-shadow 0.18s',
              position: 'relative', overflow: 'hidden',
            }}
            whileHover={{ scale: 1.015, boxShadow: '0 8px 28px rgba(37,99,235,0.4)' }}
          >
            {/* Background orb */}
            <div style={{
              position: 'absolute', right: -20, top: -20,
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              pointerEvents: 'none',
            }} />
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                Build a Workflow
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                Automate your next idea with the visual builder.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.85)', fontSize: 'var(--text-xs)', fontWeight: 600, marginTop: 10 }}>
                Open Workflows <ArrowRight size={12} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* Recent executions table */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={14} color="#2563EB" />
                </div>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Recent Executions
                </span>
              </div>
              <button
                {...h('viewEx')}
                onClick={() => router.push('/executions')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 'var(--text-sm)', fontWeight: 600,
                  color: hov.viewEx ? 'var(--brand-hover)' : 'var(--brand)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  transition: 'color 0.14s',
                }}
              >
                View all <ArrowRight size={12} />
              </button>
            </div>

            {recent.length === 0 ? (
              <div className="ff-empty">
                <div className="ff-empty-icon"><Activity size={22} /></div>
                <div className="ff-empty-title">No executions yet</div>
                <div className="ff-empty-sub">Run a workflow to see execution results here.</div>
              </div>
            ) : (
              <table className="ff-table">
                <thead>
                  <tr>
                    <th>Workflow</th>
                    <th>Status</th>
                    <th>Triggered</th>
                    <th style={{ textAlign: 'right' as const }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(exec => (
                    <tr
                      key={exec.id}
                      onClick={() => router.push(`/executions/${exec.id}`)}
                      onMouseEnter={() => setHov(p => ({ ...p, [`row_${exec.id}`]: true }))}
                      onMouseLeave={() => setHov(p => ({ ...p, [`row_${exec.id}`]: false }))}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--n-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <GitBranch size={12} color="var(--text-muted)" />
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                            {exec.workflow?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td><StatusBadge status={exec.status} /></td>
                      <td style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(exec.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ textAlign: 'right' as const, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                        {exec.duration ? `${exec.duration}ms` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Workflows sidebar list */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 18px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GitBranch size={14} color="#2563EB" />
                </div>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Workflows
                </span>
              </div>
              <button
                {...h('viewWf')}
                onClick={() => router.push('/workflows')}
                style={{
                  fontSize: 'var(--text-sm)', fontWeight: 600,
                  color: hov.viewWf ? 'var(--brand-hover)' : 'var(--brand)',
                  background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.14s',
                }}
              >
                View all
              </button>
            </div>

            {workflows.length === 0 ? (
              <div className="ff-empty" style={{ padding: '32px 16px' }}>
                <div className="ff-empty-title">No workflows yet</div>
                <div className="ff-empty-sub">Create your first automation to get started.</div>
              </div>
            ) : (
              <>
                {workflows.slice(0, 5).map(w => (
                  <div
                    key={w.id}
                    onMouseEnter={() => setHovWf(w.id)}
                    onMouseLeave={() => setHovWf(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 18px',
                      background: hovWf === w.id ? 'var(--n-50)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                      borderTop: '1px solid var(--border)',
                      position: 'relative',
                    }}
                    onClick={() => router.push(`/editor/${w.id}`)}
                  >
                    {/* Icon */}
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--n-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <GitBranch size={13} color="var(--text-muted)" />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 'var(--text-sm)', fontWeight: 600,
                        color: hovWf === w.id ? 'var(--brand)' : 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'color 0.14s',
                      }}>
                        {w.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <WorkflowStatusDot status={w.status} />
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={9} />
                          {new Date(w.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Dropdown trigger */}
                    <div
                      data-dd
                      style={{ position: 'relative', flexShrink: 0 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={e => { e.stopPropagation(); setOpenDd(openDd === w.id ? null : w.id); }}
                        style={{
                          width: 26, height: 26, borderRadius: 6,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: openDd === w.id ? 'var(--n-200)' : 'transparent',
                          border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)',
                          opacity: hovWf === w.id || openDd === w.id ? 1 : 0,
                          transition: 'opacity 0.14s, background 0.14s',
                        }}
                      >
                        <MoreHorizontal size={13} />
                      </button>

                      {openDd === w.id && (
                        <div className="ff-dropdown">
                          <button className="ff-dropdown-item" onClick={e => { e.stopPropagation(); router.push(`/editor/${w.id}`); }}>
                            <GitBranch size={12} /> Open Editor
                          </button>
                          <button className="ff-dropdown-item" onClick={e => handleRun(e, w.id)}>
                            <Play size={12} /> Run Now
                          </button>
                          <div className="ff-dropdown-divider" />
                          <button className="ff-dropdown-item danger" onClick={e => handleDelete(e, w.id)}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {workflows.length > 5 && (
                  <button
                    onClick={() => router.push('/workflows')}
                    style={{
                      width: '100%', padding: '11px 18px',
                      background: 'none', border: 'none',
                      color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)',
                      cursor: 'pointer', borderTop: '1px solid var(--border)',
                      textAlign: 'center' as const,
                      transition: 'color 0.14s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >
                    +{workflows.length - 5} more workflows
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Alert banner if high failure rate */}
        {totalExec >= 5 && successRate < 70 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px',
              background: 'var(--warning-subtle)',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-sm)',
              color: 'var(--warning)',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>High failure rate detected.</strong> {100 - successRate}% of your recent executions failed.{' '}
              <span
                onClick={() => router.push('/executions')}
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
              >
                Review executions
              </span>
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
