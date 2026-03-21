'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Undo2, Redo2, Play, Settings, Check, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { workflowApi } from '@/lib/api';
import { toast } from 'sonner';

interface EditorToolbarProps {
  onToggleSettings: () => void;
  onRun?: () => void;
  isRunning?: boolean;
  onToggleLog?: () => void;
  showLogIndicator?: boolean;
}

// ─── Inline style constants ───────────────────────────────────────
const S = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    padding: '0 16px',
    background: '#ffffff',
    borderBottom: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    flexShrink: 0,
  } as React.CSSProperties,
  iconBtn: (hov: boolean): React.CSSProperties => ({
    width: 36, height: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 9, border: 'none', background: hov ? '#F1F5F9' : 'transparent',
    color: hov ? '#374151' : '#64748B', cursor: 'pointer', transition: 'all 0.15s',
    flexShrink: 0,
  }),
  divider: { width: 1, height: 24, background: '#E2E8F0', flexShrink: 0 } as React.CSSProperties,
  nameBtn: {
    padding: '6px 12px', borderRadius: 9, border: 'none',
    background: 'transparent', cursor: 'pointer', fontSize: 15,
    fontWeight: 700, color: '#0F172A', maxWidth: 240,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  nameInput: {
    padding: '6px 12px', borderRadius: 9, fontSize: 14, fontWeight: 600,
    color: '#0F172A', background: '#EFF6FF', border: '1.5px solid #3B82F6',
    outline: 'none', minWidth: 200,
  } as React.CSSProperties,
  unsavedBadge: {
    fontSize: 10, fontWeight: 700, color: '#D97706',
    background: '#FFFBEB', border: '1px solid #FDE68A',
    padding: '2px 8px', borderRadius: 100,
  } as React.CSSProperties,
  outlineBtn: (hov: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 34, padding: '0 14px', borderRadius: 9,
    border: `1px solid ${hov ? '#CBD5E1' : '#E2E8F0'}`,
    background: hov ? '#F8FAFC' : '#ffffff',
    color: '#374151', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
  }),
  ghostBtn: (hov: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 34, padding: '0 12px', borderRadius: 9, border: 'none',
    background: hov ? '#F1F5F9' : 'transparent',
    color: '#374151', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.15s', position: 'relative' as const,
  }),
  runBtn: (running: boolean, hov: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 7,
    height: 36, padding: '0 18px', borderRadius: 10, border: 'none',
    background: running
      ? (hov ? '#B45309' : '#D97706')
      : (hov ? '#1D4ED8' : '#2563EB'),
    color: '#fff', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', transition: 'background 0.15s',
    boxShadow: running ? '0 2px 8px rgba(217,119,6,0.35)' : '0 2px 8px rgba(37,99,235,0.35)',
  }),
};

export default function EditorToolbar({
  onToggleSettings, onRun, isRunning = false, onToggleLog, showLogIndicator = false,
}: EditorToolbarProps) {
  const router = useRouter();
  const { meta, nodes, edges, isDirty, setMeta, undo, redo, historyIndex, history, validateWorkflow } = useWorkflowStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [hov, setHov] = useState<Record<string, boolean>>({});
  const h = (k: string) => ({ onMouseEnter: () => setHov(p => ({...p, [k]: true})), onMouseLeave: () => setHov(p => ({...p, [k]: false})) });

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleSave = useCallback(async () => {
    if (!meta.id) return;
    const v = validateWorkflow();
    if (!v.isValid) { v.errors.forEach(e => toast.error(e)); return; }
    setIsSaving(true); setSaveSuccess(false);
    try {
      await workflowApi.update(meta.id, {
        name: meta.name,
        description: meta.description,
        status: meta.status,
        triggerType: meta.triggerType,
        cronExpression: meta.cronExpression,
        nodesJson: nodes as unknown[],
        edgesJson: edges as unknown[]
      });
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2000);
    } catch { toast.error('Failed to save'); } finally { setIsSaving(false); }
  }, [meta, nodes, edges]);

  return (
    <div style={S.bar}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={S.iconBtn(!!hov.back)} {...h('back')} onClick={() => router.push('/workflows')} title="Back">
          <ArrowLeft size={16} />
        </button>

        <div style={S.divider} />

        {isEditingName ? (
          <input
            style={S.nameInput}
            value={meta.name}
            onChange={e => setMeta({ name: e.target.value })}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
            autoFocus
          />
        ) : (
          <button style={S.nameBtn} onClick={() => setIsEditingName(true)} title="Click to rename">
            {meta.name}
          </button>
        )}

        {isDirty && <span style={S.unsavedBadge}>Unsaved</span>}
      </div>

      {/* Center */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button style={{ ...S.iconBtn(!!hov.undo), opacity: canUndo ? 1 : 0.3 }} {...h('undo')} onClick={undo} disabled={!canUndo} title="Undo">
          <Undo2 size={15} />
        </button>
        <button style={{ ...S.iconBtn(!!hov.redo), opacity: canRedo ? 1 : 0.3 }} {...h('redo')} onClick={redo} disabled={!canRedo} title="Redo">
          <Redo2 size={15} />
        </button>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={S.iconBtn(!!hov.settings)} {...h('settings')} onClick={onToggleSettings} title="Settings">
          <Settings size={16} />
        </button>

        <button style={S.outlineBtn(!!hov.save)} {...h('save')} onClick={handleSave} disabled={isSaving || isRunning}>
          {isSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> :
           saveSuccess ? <motion.span initial={{scale:0}} animate={{scale:1}} style={{color:'#16A34A'}}><Check size={14}/></motion.span> :
           <Save size={14} />}
          {saveSuccess ? 'Saved!' : 'Save'}
        </button>

        {onToggleLog && (
          <button style={{ ...S.ghostBtn(!!hov.logs), }} {...h('logs')} onClick={onToggleLog}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>Logs</span>
            {showLogIndicator && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#3B82F6' }} />
            )}
          </button>
        )}

        <button
          style={S.runBtn(isRunning, !!hov.run)}
          {...h('run')}
          disabled={isRunning || isSaving || !meta.id}
          onClick={() => {
            const v = validateWorkflow();
            if (!v.isValid) { v.errors.forEach(e => toast.error(e)); return; }
            onRun?.();
          }}
        >
          {isRunning ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>
    </div>
  );
}
