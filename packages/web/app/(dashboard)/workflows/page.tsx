'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, GitBranch, Clock, Play, MoreHorizontal,
  Search, Pencil, Trash2, Activity,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { workflowApi, executionApi, Workflow } from '@/lib/api';
import { toast } from 'sonner';

// ── Helpers ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  ACTIVE:   { label: 'Active',   dot: '#22C55E', text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  DRAFT:    { label: 'Draft',    dot: '#94A3B8', text: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
  PAUSED:   { label: 'Paused',   dot: '#F59E0B', text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  ARCHIVED: { label: 'Archived', dot: '#CBD5E1', text: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0' },
};

const TRIGGER_CONFIG: Record<string, { label: string; icon: string }> = {
  MANUAL:  { label: 'Manual',    icon: '▶' },
  CRON:    { label: 'Scheduled', icon: '⏰' },
  WEBHOOK: { label: 'Webhook',   icon: '🔗' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 'var(--radius-full)',
      fontSize: 'var(--text-xs)', fontWeight: 600,
      color: s.text, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function TriggerBadge({ type }: { type: string }) {
  const t = TRIGGER_CONFIG[type] || TRIGGER_CONFIG.MANUAL;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 'var(--radius-full)',
      fontSize: 'var(--text-xs)', fontWeight: 500,
      color: 'var(--text-tertiary)', background: 'var(--n-100)', border: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 10 }}>{t.icon}</span>
      {t.label}
    </span>
  );
}

// ── Workflow Card ─────────────────────────────────────────────
function WorkflowCard({
  wf, onEdit, onRun, onDelete,
}: {
  wf: Workflow;
  onEdit: () => void;
  onRun: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const [hov, setHov]     = useState(false);
  const [ddOpen, setDdOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); }}
      onClick={onEdit}
      style={{
        background: 'var(--surface-card)',
        border: `1px solid ${hov ? 'var(--brand-border)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '20px',
        cursor: 'pointer',
        boxShadow: hov
          ? '0 4px 16px rgba(37,99,235,0.08), var(--shadow-md)'
          : 'var(--shadow-sm)',
        transition: 'all 0.18s ease',
        transform: hov ? 'translateY(-2px)' : 'none',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Top row — icon + title + menu */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 42, height: 42, flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          background: hov ? 'var(--brand-subtle)' : 'var(--n-100)',
          border: `1px solid ${hov ? 'var(--brand-border)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s',
        }}>
          <GitBranch size={18} color={hov ? 'var(--brand)' : 'var(--text-muted)'} strokeWidth={1.75} />
        </div>

        {/* Title + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--text-base)', fontWeight: 700,
            color: hov ? 'var(--brand)' : 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            transition: 'color 0.15s',
            letterSpacing: '-0.01em',
          }}>
            {wf.name}
          </div>
          <div style={{
            fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
            marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {wf.description || 'No description'}
          </div>
        </div>

        {/* 3-dot menu */}
        <div
          data-dropdown
          style={{ position: 'relative', flexShrink: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={e => { e.stopPropagation(); setDdOpen(o => !o); }}
            style={{
              width: 30, height: 30, borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: ddOpen ? 'var(--n-200)' : (hov ? 'var(--n-100)' : 'transparent'),
              border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'background 0.14s',
            }}
          >
            <MoreHorizontal size={15} />
          </button>

          <AnimatePresence>
            {ddOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="ff-dropdown"
                style={{ minWidth: 180 }}
              >
                <button
                  className="ff-dropdown-item"
                  onMouseDown={e => { e.stopPropagation(); setDdOpen(false); onEdit(); }}
                >
                  <Pencil size={13} /> Open Editor
                </button>
                <button
                  className="ff-dropdown-item"
                  onMouseDown={e => { setDdOpen(false); onRun(e); }}
                >
                  <Play size={13} /> Run Now
                </button>
                <div className="ff-dropdown-divider" />
                <button
                  className="ff-dropdown-item danger"
                  onMouseDown={e => { setDdOpen(false); onDelete(e); }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
        <StatusBadge status={wf.status} />
        <TriggerBadge type={wf.triggerType} />
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 14, borderTop: '1px solid var(--border)',
        fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} />
          {new Date(wf.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Activity size={11} />
          {wf._count?.executions ?? 0} runs
        </span>
      </div>
    </motion.div>
  );
}

// ── Empty State ───────────────────────────────────────────────
function EmptyState({ query, onCreate }: { query: string; onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 400, gap: 16, textAlign: 'center',
      }}
    >
      <div style={{
        width: 64, height: 64, borderRadius: 'var(--radius-xl)',
        background: 'var(--brand-subtle)', border: '1px solid var(--brand-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <GitBranch size={28} color="var(--brand)" strokeWidth={1.5} />
      </div>
      <div>
        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          {query ? `No results for "${query}"` : 'No workflows yet'}
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', maxWidth: 300, margin: 0, lineHeight: 1.6 }}>
          {query
            ? 'Try a different search term or clear the filter.'
            : 'Build your first automation to start saving time on repetitive tasks.'}
        </p>
      </div>
      {!query && (
        <button className="ff-btn ff-btn-primary ff-btn-lg" onClick={onCreate}>
          <Plus size={16} /> Create Workflow
        </button>
      )}
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} style={{
          borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)',
          padding: '20px', background: 'var(--surface-card)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="ff-skeleton" style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="ff-skeleton" style={{ height: 14, width: '65%', marginBottom: 8 }} />
              <div className="ff-skeleton" style={{ height: 11, width: '40%' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            <div className="ff-skeleton" style={{ height: 22, width: 60, borderRadius: 'var(--radius-full)' }} />
            <div className="ff-skeleton" style={{ height: 22, width: 72, borderRadius: 'var(--radius-full)' }} />
          </div>
          <div className="ff-skeleton" style={{ height: 1, marginBottom: 14 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="ff-skeleton" style={{ height: 11, width: 80 }} />
            <div className="ff-skeleton" style={{ height: 11, width: 50 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function WorkflowsPage() {
  const router = useRouter();
  const { activeWorkspaceId } = useAuthStore();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    workflowApi.list(activeWorkspaceId)
      .then(r => setWorkflows(r.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [activeWorkspaceId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-dropdown]')) {
        // trigger re-render via a no-op (dropdowns manage own state)
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleCreate = async () => {
    if (!activeWorkspaceId) return;
    try {
      const r = await workflowApi.create({ name: 'Untitled Workflow', workspaceId: activeWorkspaceId });
      if (r.data) router.push(`/editor/${r.data.id}`);
    } catch { toast.error('Failed to create workflow'); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this workflow? This cannot be undone.')) return;
    try {
      await workflowApi.delete(id);
      setWorkflows(p => p.filter(w => w.id !== id));
      toast.success('Workflow deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleRun = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      toast.loading('Starting execution...', { id });
      await executionApi.execute(id);
      toast.success('Execution started', { id });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to run';
      toast.error(msg, { id });
    }
  };

  const filtered = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = workflows.filter(w => w.status === 'ACTIVE').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ──────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 32px',
        }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em', margin: 0 }}>
              Workflows
            </h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '3px 0 0' }}>
              {isLoading ? 'Loading...' : `${workflows.length} total · ${activeCount} active`}
            </p>
          </div>

          <button className="ff-btn ff-btn-primary" onClick={handleCreate}>
            <Plus size={14} strokeWidth={2.5} /> New Workflow
          </button>
        </div>

        {/* Search bar */}
        <div style={{ padding: '0 32px 16px' }}>
          <div
            className="ff-search-wrap"
            style={{
              maxWidth: 400,
              borderColor: searchFocused ? 'var(--brand)' : 'var(--border)',
              boxShadow: searchFocused ? '0 0 0 3px rgba(37,99,235,0.10)' : 'none',
              background: searchFocused ? 'var(--n-0)' : 'var(--n-50)',
            }}
          >
            <Search size={14} color={searchFocused ? 'var(--brand)' : 'var(--text-muted)'} style={{ flexShrink: 0, transition: 'color 0.15s' }} />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', padding: '0 2px' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────── */}
      <div style={{ flex: 1, padding: '24px 32px' }}>
        {isLoading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <EmptyState query={searchQuery} onCreate={handleCreate} />
        ) : (
          <>
            {/* Stats bar */}
            {!searchQuery && (
              <div style={{
                display: 'flex', gap: 24, marginBottom: 20,
                padding: '12px 18px',
                background: 'var(--surface-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xs)',
              }}>
                {[
                  { label: 'Total', value: workflows.length, color: 'var(--text-primary)' },
                  { label: 'Active', value: activeCount, color: 'var(--success)' },
                  { label: 'Draft', value: workflows.filter(w => w.status === 'DRAFT').length, color: 'var(--text-muted)' },
                  { label: 'Paused', value: workflows.filter(w => w.status === 'PAUSED').length, color: 'var(--warning)' },
                ].map(stat => (
                  <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: stat.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {stat.value}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {stat.label}
                    </span>
                    <div style={{ width: 1, height: 18, background: 'var(--border)', marginLeft: 16 }} />
                  </div>
                )).slice(0, 3).concat(
                  <div key="paused" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--warning)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {workflows.filter(w => w.status === 'PAUSED').length}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>Paused</span>
                  </div>
                )}
              </div>
            )}

            {/* Search result label */}
            {searchQuery && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 16 }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for <strong style={{ color: 'var(--text-primary)' }}>"{searchQuery}"</strong>
              </p>
            )}

            {/* Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 18,
            }}>
              {filtered.map((wf, i) => (
                <motion.div
                  key={wf.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                >
                  <WorkflowCard
                    wf={wf}
                    onEdit={() => router.push(`/editor/${wf.id}`)}
                    onRun={e => handleRun(e, wf.id)}
                    onDelete={e => handleDelete(e, wf.id)}
                  />
                </motion.div>
              ))}

              {/* New workflow card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: filtered.length * 0.04, duration: 0.2 }}
                onClick={handleCreate}
                style={{
                  borderRadius: 'var(--radius-xl)',
                  border: '1.5px dashed var(--border)',
                  padding: '20px',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 10, minHeight: 160,
                  transition: 'all 0.18s',
                  color: 'var(--text-muted)',
                }}
                whileHover={{
                  borderColor: 'var(--brand)',
                  background: 'var(--brand-subtle)',
                  color: 'var(--brand)',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: 'currentColor',
                  opacity: 0.1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} />
                <Plus size={20} style={{ marginTop: -46 }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>New Workflow</span>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
