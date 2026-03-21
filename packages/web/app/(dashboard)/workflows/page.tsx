'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, GitBranch, Clock, Play, MoreVertical, Search, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { workflowApi, executionApi, Workflow } from '@/lib/api';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  DRAFT:     { background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' },
  ACTIVE:    { background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' },
  PAUSED:    { background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' },
  ARCHIVED:  { background: '#F1F5F9', color: '#94A3B8', border: '1px solid #E2E8F0' },
};
const TRIGGER_LABELS: Record<string, string> = {
  MANUAL: '🖱 Manual', CRON: '⏰ Scheduled', WEBHOOK: '🔗 Webhook',
};

// --- Reusable style constants ---
const S = {
  page: { minHeight: '100vh', background: '#F1F5F9', display: 'flex', flexDirection: 'column' } as React.CSSProperties,
  headerBar: { position: 'sticky', top: 0, zIndex: 20, background: '#ffffff', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } as React.CSSProperties,
  headerInner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px' } as React.CSSProperties,
  pageTitle: { fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 } as React.CSSProperties,
  pageSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4 } as React.CSSProperties,
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 22px', background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.35)', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  searchWrap: { display: 'flex', alignItems: 'center', gap: 10, height: 48, background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: '0 16px', margin: '0 32px 20px' } as React.CSSProperties,
  searchInput: { flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#0F172A' } as React.CSSProperties,
  content: { flex: 1, padding: '28px 32px' } as React.CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 } as React.CSSProperties,
  card: { background: '#ffffff', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '24px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s ease', position: 'relative' as const },
  cardIcon: { width: 48, height: 48, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as React.CSSProperties,
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  cardDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700 } as React.CSSProperties,
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#94A3B8' } as React.CSSProperties,
  menuBtn: { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', flexShrink: 0 } as React.CSSProperties,
  dropdown: { position: 'absolute' as const, right: 0, top: '100%', marginTop: 4, width: 200, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '6px 0', zIndex: 50 },
  menuItem: { width: '100%', textAlign: 'left' as const, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#374151' } as React.CSSProperties,
  menuItemDanger: { width: '100%', textAlign: 'left' as const, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#DC2626', fontWeight: 600 } as React.CSSProperties,
  divider: { height: 1, background: '#F1F5F9', margin: '4px 12px' } as React.CSSProperties,
};

export default function WorkflowsPage() {
  const router = useRouter();
  const { activeWorkspaceId } = useAuthStore();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    workflowApi.list(activeWorkspaceId).then(r => setWorkflows(r.data || [])).catch(() => {}).finally(() => setIsLoading(false));
  }, [activeWorkspaceId]);

  const handleCreate = async () => {
    if (!activeWorkspaceId) return;
    try {
      const r = await workflowApi.create({ name: 'Untitled Workflow', workspaceId: activeWorkspaceId });
      if (r.data) router.push(`/editor/${r.data.id}`);
    } catch { toast.error('Failed to create workflow'); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); setOpenDropdownId(null);
    if (!confirm('Delete this workflow?')) return;
    try { await workflowApi.delete(id); setWorkflows(p => p.filter(w => w.id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const handleRun = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); setOpenDropdownId(null);
    try { toast.loading('Starting...', { id }); await executionApi.execute(id); toast.success('Started!', { id }); }
    catch (err: any) { toast.error(err.message || 'Failed', { id }); }
  };

  // Close dropdown when clicking outside — use mousedown so it fires
  // before the click event, letting stopPropagation on the button work correctly.
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = workflows.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={S.page}>
      {/* Sticky header */}
      <div style={S.headerBar}>
        <div style={S.headerInner}>
          <div>
            <h1 style={S.pageTitle}>Workflows</h1>
            <p style={S.pageSubtitle}>Build and manage your automated workflows</p>
          </div>
          <button
            style={S.addBtn}
            onClick={handleCreate}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1D4ED8'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2563EB'; }}
          >
            <Plus size={16} /> New Workflow
          </button>
        </div>

        {/* Search bar */}
        <div style={S.searchWrap}>
          <Search size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search workflows by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={S.searchInput}
          />
        </div>
      </div>

      {/* Content */}
      <div style={S.content}>
        {isLoading ? (
          <div style={S.grid}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ ...S.card, height: 160, opacity: 0.4 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
            <div style={{ width: 80, height: 80, background: '#EFF6FF', borderRadius: 24, border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitBranch size={36} color="#3B82F6" />
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0 }}>No workflows yet</p>
            <p style={{ fontSize: 14, color: '#64748B', maxWidth: 300, textAlign: 'center', margin: 0 }}>Create your first workflow to start automating tasks.</p>
            <button style={S.addBtn} onClick={handleCreate}><Plus size={16} /> Create Workflow</button>
          </div>
        ) : (
          <div style={S.grid}>
            {filtered.map(wf => (
              <div
                key={wf.id}
                style={{
                  ...S.card,
                  border: hoveredCard === wf.id ? '1.5px solid #93C5FD' : '1.5px solid #E2E8F0',
                  boxShadow: hoveredCard === wf.id ? '0 8px 24px rgba(59,130,246,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                  transform: hoveredCard === wf.id ? 'translateY(-2px)' : 'none',
                }}
                onClick={() => router.push(`/editor/${wf.id}`)}
                onMouseEnter={() => setHoveredCard(wf.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                    <div style={{ ...S.cardIcon, background: hoveredCard === wf.id ? '#DBEAFE' : '#EFF6FF' }}>
                      <GitBranch size={22} color="#3B82F6" />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ ...S.cardTitle, color: hoveredCard === wf.id ? '#2563EB' : '#0F172A' }}>
                        {wf.name}
                      </div>
                      {wf.description && <div style={S.cardDesc}>{wf.description}</div>}
                    </div>
                  </div>

                  {/* Dropdown button — onClick on the wrapper blocks card navigation */}
                  <div
                    style={{ position: 'relative', flexShrink: 0 }}
                    data-dropdown
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      style={{ ...S.menuBtn, background: openDropdownId === wf.id ? '#F1F5F9' : 'transparent' }}
                      onClick={e => { e.stopPropagation(); setOpenDropdownId(openDropdownId === wf.id ? null : wf.id); }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openDropdownId === wf.id && (
                      <div style={S.dropdown}>
                        <button style={S.menuItem} onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          onMouseDown={e => { e.stopPropagation(); router.push(`/editor/${wf.id}`); }}>
                          <Pencil size={14} color="#94A3B8" /> Edit Workflow
                        </button>
                        <button style={S.menuItem} onMouseEnter={e => (e.currentTarget.style.background = '#F0FDF4')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          onMouseDown={e => handleRun(e, wf.id)}>
                          <Play size={14} color="#16A34A" /> Run Now
                        </button>
                        <div style={S.divider} />
                        <button style={S.menuItemDanger} onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          onMouseDown={e => handleDelete(e, wf.id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ ...S.badge, ...STATUS_STYLES[wf.status] }}>{wf.status}</span>
                  <span style={{ ...S.badge, background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>
                    {TRIGGER_LABELS[wf.triggerType] || wf.triggerType}
                  </span>
                </div>

                {/* Footer */}
                <div style={S.footer}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={13} /> {new Date(wf.updatedAt).toLocaleDateString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Play size={13} /> {wf._count?.executions || 0} runs
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
