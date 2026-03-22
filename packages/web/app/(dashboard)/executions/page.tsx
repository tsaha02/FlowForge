'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ListFilter, Search, CheckCircle2, XCircle, Activity,
  Calendar, Clock, GitBranch, ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { executionApi, Execution, PaginatedExecutions } from '@/lib/api';

// ─── Style constants ───────────────────────────────────────────
const S = {
  page:      { minHeight: '100vh', background: '#F1F5F9', display: 'flex', flexDirection: 'column' } as React.CSSProperties,
  headerBar: { position: 'sticky' as const, top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  hInner:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' } as React.CSSProperties,
  hTitle:    { fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 } as React.CSSProperties,
  hSub:      { fontSize: 14, color: '#64748B', margin: '3px 0 0' } as React.CSSProperties,
  toolbar:   { display: 'flex', alignItems: 'center', gap: 12, padding: '0 32px 20px' } as React.CSSProperties,
  search:    { display: 'flex', alignItems: 'center', gap: 10, height: 44, background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '0 14px', flex: 1, maxWidth: 480, transition: 'border-color 0.15s, box-shadow 0.15s' } as React.CSSProperties,
  filterBtn: (hov: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 16px', background: hov ? '#F1F5F9' : '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }),
  content:   { flex: 1, padding: '24px 32px' } as React.CSSProperties,
  table:     { width: '100%', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' } as React.CSSProperties,
  thead:     { background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' } as React.CSSProperties,
  th:        { padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#64748B', textAlign: 'left' as const, whiteSpace: 'nowrap' as const, textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  td:        { padding: '16px 20px', fontSize: 14, color: '#374151', borderTop: '1px solid #F1F5F9', whiteSpace: 'nowrap' as const },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  COMPLETED: { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', label: 'Completed' },
  FAILED:    { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Failed' },
  RUNNING:   { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Running' },
  PENDING:   { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Pending' },
};

export default function ExecutionsPage() {
  const router = useRouter();
  const { activeWorkspaceId } = useAuthStore();
  const [data, setData] = useState<PaginatedExecutions | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [hovRow, setHovRow] = useState<string | null>(null);
  const [hov, setHov] = useState<Record<string, boolean>>({});
  const h = (k: string) => ({ onMouseEnter: () => setHov(p => ({...p,[k]:true})), onMouseLeave: () => setHov(p => ({...p,[k]:false})) });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    const load = async () => {
      setError(null);
      try { 
        const r = await executionApi.list(activeWorkspaceId, page, 20); 
        setData(r.data as unknown as PaginatedExecutions); 
      }
      catch (err) { 
        setError(err instanceof Error ? err.message : 'Failed to load executions');
      } finally { setIsLoading(false); }
    };
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [activeWorkspaceId, page]);

  const filtered = (data?.executions || []).filter(e =>
    e.workflow?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.headerBar}>
        <div style={S.hInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, background: '#EFF6FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #BFDBFE' }}>
              <Activity size={20} color="#2563EB" />
            </div>
            <div>
              <h1 style={S.hTitle}>Executions</h1>
              <p style={S.hSub}>Review historical logs and outcomes of your workflow runs</p>
            </div>
          </div>
          {/* Live refresh indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 100, padding: '5px 12px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite' }} />
            Auto-refreshes every 10s
          </div>
        </div>

        {/* Search + filter */}
        <div style={S.toolbar}>
          <div style={{ ...S.search, borderColor: searchFocused ? '#3B82F6' : '#E2E8F0', boxShadow: searchFocused ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none', background: searchFocused ? '#fff' : '#F8FAFC' }}>
            <Search size={15} style={{ color: '#94A3B8', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by workflow name or execution ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#0F172A' }}
            />
          </div>
          <button style={S.filterBtn(!!hov.filter)} {...h('filter')}>
            <ListFilter size={15} /> Filter
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={S.content}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ height: 68, background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 16, opacity: 0.5 }} />
            ))}
          </div>
        ) : error ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '80px 32px', background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 20 }}>
            <XCircle size={36} color="#DC2626" style={{ margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#DC2626', margin: '0 0 8px' }}>Failed to load executions</h3>
            <p style={{ fontSize: 14, color: '#EF4444', maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.6 }}>{error}</p>
            <button onClick={() => window.location.reload()}
              style={{ padding: '8px 20px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Retry
            </button>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '80px 32px', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 20 }}>
            <div style={{ width: 64, height: 64, background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #E2E8F0' }}>
              <Activity size={28} color="#CBD5E1" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>No execution history</h3>
            <p style={{ fontSize: 14, color: '#64748B', maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
              Once you trigger your workflows manually or via webhooks, the results will appear here.
            </p>
          </motion.div>
        ) : (
          <div style={S.table}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={S.thead}>
                <tr>
                  {['Status & ID', 'Workflow', 'Trigger', 'Duration', 'Started At', ''].map(h => (
                    <th key={h} style={{ ...S.th, textAlign: h === '' ? 'right' as const : 'left' as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(exec => {
                  const cfg = STATUS_CONFIG[exec.status] || STATUS_CONFIG.RUNNING;
                  return (
                    <tr
                      key={exec.id}
                      onClick={() => router.push(`/executions/${exec.id}`)}
                      onMouseEnter={() => setHovRow(exec.id)}
                      onMouseLeave={() => setHovRow(null)}
                      style={{ cursor: 'pointer', background: hovRow === exec.id ? '#F8FAFC' : '#fff', transition: 'background 0.12s' }}
                    >
                      {/* Status */}
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {exec.status === 'COMPLETED'
                            ? <CheckCircle2 size={18} color="#16A34A" />
                            : exec.status === 'FAILED'
                            ? <XCircle size={18} color="#DC2626" />
                            : <Activity size={18} color="#2563EB" />}
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                              {cfg.label}
                            </span>
                            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', marginTop: 3 }}>
                              #{exec.id.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Workflow */}
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <GitBranch size={14} color="#94A3B8" />
                          <span style={{ fontWeight: 600, color: '#1E293B' }}>{exec.workflow?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      {/* Trigger */}
                      <td style={S.td}>
                        <span style={{ padding: '3px 10px', background: '#F1F5F9', color: '#475569', borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
                          {exec.triggeredBy}
                        </span>
                      </td>
                      {/* Duration */}
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B' }}>
                          <Clock size={13} color="#94A3B8" />
                          {exec.duration ? `${exec.duration}ms` : '—'}
                        </div>
                      </td>
                      {/* Started At */}
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B' }}>
                          <Calendar size={13} color="#94A3B8" />
                          {new Date(exec.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      {/* View details */}
                      <td style={{ ...S.td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, color: '#2563EB', fontSize: 12, fontWeight: 600, opacity: hovRow === exec.id ? 1 : 0, transition: 'opacity 0.15s' }}>
                          View Details <ArrowRight size={13} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {data && data.pagination.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={page === 1 ? { opacity: 0.5, ...S.filterBtn(false) } : S.filterBtn(false)}
            >
              Previous
            </button>
            <div style={{ fontSize: 13, color: '#64748B' }}>
              Page <strong>{page}</strong> of <strong>{data.pagination.totalPages}</strong>
            </div>
            <button 
              onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
              style={page === data.pagination.totalPages ? { opacity: 0.5, ...S.filterBtn(false) } : S.filterBtn(false)}
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
