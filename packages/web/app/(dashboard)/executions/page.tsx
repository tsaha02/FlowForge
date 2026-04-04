'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search, Activity, Clock, Calendar,
  GitBranch, ArrowRight, RefreshCw, ChevronLeft, ChevronRight,
  Play, AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { executionApi, PaginatedExecutions } from '@/lib/api';

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; label: string }> = {
  COMPLETED: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)',  dot: '#22C55E', label: 'Completed' },
  FAILED:    { color: '#DC2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)', dot: '#EF4444', label: 'Failed'    },
  RUNNING:   { color: '#2563EB', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)', dot: '#3B82F6', label: 'Running'   },
  PENDING:   { color: '#D97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)', dot: '#F59E0B', label: 'Pending'   },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.RUNNING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1,2,3,4,5,6,7].map(i => (
        <tr key={i}>
          {[140, 200, 90, 80, 120, 70].map((w, j) => (
            <td key={j} style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <div className="ff-skeleton" style={{ height: 14, width: w, borderRadius: 4 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function ExecutionsPage() {
  const router = useRouter();
  const { activeWorkspaceId } = useAuthStore();
  const [data, setData]           = useState<PaginatedExecutions | null>(null);
  const [page, setPage]           = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [hovRow, setHovRow]       = useState<string | null>(null);
  const [hovPrev, setHovPrev]     = useState(false);
  const [hovNext, setHovNext]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!activeWorkspaceId) return;
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const r = await executionApi.list(activeWorkspaceId, page, 20);
      setData(r.data as unknown as PaginatedExecutions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load executions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [activeWorkspaceId, page]);
  useEffect(() => {
    const iv = setInterval(() => load(true), 10000);
    return () => clearInterval(iv);
  }, [activeWorkspaceId, page]);

  const filtered = (data?.executions || []).filter(e =>
    e.workflow?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalExec   = data?.pagination.total ?? 0;
  const completedEx = (data?.executions || []).filter(e => e.status === 'COMPLETED').length;
  const failedEx    = (data?.executions || []).filter(e => e.status === 'FAILED').length;
  const runningEx   = (data?.executions || []).filter(e => e.status === 'RUNNING').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Sticky header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 'var(--radius-md)',
              background: 'rgba(37,99,235,0.1)',
              border: '1px solid rgba(37,99,235,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={19} color="var(--brand)" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', margin: 0 }}>
                Executions
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Live history of all workflow runs
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Live indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 'var(--radius-full)',
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              fontSize: 11, fontWeight: 600, color: '#16A34A', letterSpacing: '0.02em',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'ff-pulse 2s infinite' }} />
              Auto-refresh
            </div>
            {/* Manual refresh */}
            <button
              onClick={() => load(true)}
              style={{
                width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                background: 'transparent', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
            >
              <RefreshCw size={14} style={{ animation: isRefreshing ? 'ff-spin 0.8s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 1, padding: '0 32px 16px' }}>
          {[
            { label: 'Total',     value: totalExec,   color: 'var(--text-secondary)' },
            { label: 'Completed', value: completedEx, color: '#16A34A' },
            { label: 'Failed',    value: failedEx,    color: '#DC2626' },
            { label: 'Running',   value: runningEx,   color: '#2563EB' },
          ].map((s, i) => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              paddingRight: 16, marginRight: 16,
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Search row */}
        <div style={{ padding: '0 32px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            height: 40, flex: 1, maxWidth: 460,
            background: 'var(--surface-input)',
            border: `1.5px solid ${searchFocused ? 'var(--brand)' : 'var(--border)'}`,
            boxShadow: searchFocused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
            borderRadius: 'var(--radius-md)',
            padding: '0 12px',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}>
            <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by workflow name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 13, color: 'var(--text-primary)',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)', lineHeight: 1 }}>
                ×
              </button>
            )}
          </div>
          {searchQuery && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: '24px 32px' }}>

        {error ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '64px 32px', background: 'var(--surface-card)',
              border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
            }}>
            <div style={{ width: 52, height: 52, background: 'rgba(220,38,38,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <AlertCircle size={24} color="#DC2626" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>Failed to load executions</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.6 }}>{error}</p>
            <button onClick={() => load()} style={{
              padding: '8px 20px', background: 'var(--brand)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              Retry
            </button>
          </motion.div>

        ) : (
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border)' }}>
                  {[
                    { label: 'Status',      w: 'auto' },
                    { label: 'Workflow',    w: 'auto' },
                    { label: 'Trigger',     w: 100 },
                    { label: 'Duration',    w: 110 },
                    { label: 'Started At',  w: 160 },
                    { label: '',            w: 100 },
                  ].map(col => (
                    <th key={col.label} style={{
                      padding: '12px 20px', fontSize: 11, fontWeight: 700,
                      color: 'var(--text-muted)', textAlign: col.label === '' ? 'right' : 'left',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      whiteSpace: 'nowrap', width: col.w || undefined,
                    }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '80px 32px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 52, height: 52, background: 'var(--surface-subtle)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                          <Play size={22} color="var(--text-muted)" />
                        </div>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>No executions yet</p>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 340, lineHeight: 1.6, margin: 0 }}>
                            {searchQuery
                              ? 'No executions match your search.'
                              : 'Trigger a workflow manually or via webhook to see execution history here.'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((exec, i) => {
                    const isHov = hovRow === exec.id;
                    return (
                      <motion.tr
                        key={exec.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02, duration: 0.15 }}
                        onClick={() => router.push(`/executions/${exec.id}`)}
                        onMouseEnter={() => setHovRow(exec.id)}
                        onMouseLeave={() => setHovRow(null)}
                        style={{
                          cursor: 'pointer',
                          background: isHov ? 'var(--surface-hover)' : 'transparent',
                          transition: 'background 0.12s',
                        }}
                      >
                        {/* Status */}
                        <td style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <StatusBadge status={exec.status} />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              #{exec.id.substring(0, 8)}
                            </span>
                          </div>
                        </td>

                        {/* Workflow */}
                        <td style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                              background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <GitBranch size={12} color="var(--brand)" />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {exec.workflow?.name || 'Unknown'}
                            </span>
                          </div>
                        </td>

                        {/* Trigger */}
                        <td style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                          <span style={{
                            padding: '3px 9px', background: 'var(--surface-subtle)',
                            color: 'var(--text-secondary)', borderRadius: 'var(--radius-full)',
                            fontSize: 11, fontWeight: 600, border: '1px solid var(--border)',
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                          }}>
                            {exec.triggeredBy}
                          </span>
                        </td>

                        {/* Duration */}
                        <td style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                            <Clock size={12} color="var(--text-muted)" />
                            {exec.duration ? `${exec.duration}ms` : '—'}
                          </div>
                        </td>

                        {/* Started At */}
                        <td style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                            <Calendar size={12} color="var(--text-muted)" />
                            {new Date(exec.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Arrow */}
                        <td style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 12, fontWeight: 600, color: 'var(--brand)',
                            opacity: isHov ? 1 : 0, transition: 'opacity 0.15s',
                          }}>
                            View <ArrowRight size={13} />
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && data && data.pagination.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              onMouseEnter={() => setHovPrev(true)}
              onMouseLeave={() => setHovPrev(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 36, padding: '0 14px',
                background: hovPrev && page > 1 ? 'var(--surface-hover)' : 'var(--surface-card)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                color: page === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.5 : 1, transition: 'all 0.15s',
              }}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Page</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{page}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>of {data.pagination.totalPages}</span>
            </div>

            <button
              onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
              onMouseEnter={() => setHovNext(true)}
              onMouseLeave={() => setHovNext(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 36, padding: '0 14px',
                background: hovNext && page < data.pagination.totalPages ? 'var(--surface-hover)' : 'var(--surface-card)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                color: page === data.pagination.totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600,
                cursor: page === data.pagination.totalPages ? 'not-allowed' : 'pointer',
                opacity: page === data.pagination.totalPages ? 0.5 : 1, transition: 'all 0.15s',
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
