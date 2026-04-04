'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Undo2, Redo2, Play, Settings, Check, Loader2, Pencil } from 'lucide-react';
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

export default function EditorToolbar({
  onToggleSettings, onRun, isRunning = false, onToggleLog, showLogIndicator = false,
}: EditorToolbarProps) {
  const router = useRouter();
  const { meta, nodes, edges, isDirty, setMeta, markClean, undo, redo, historyIndex, history, validateWorkflow } = useWorkflowStore();
  const [isSaving, setIsSaving]         = useState(false);
  const [saveSuccess, setSaveSuccess]   = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [hov, setHov] = useState<Record<string, boolean>>({});
  const h = (k: string) => ({
    onMouseEnter: () => setHov(p => ({ ...p, [k]: true })),
    onMouseLeave: () => setHov(p => ({ ...p, [k]: false })),
  });

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleSave = useCallback(async () => {
    if (!meta.id) return;
    const v = validateWorkflow();
    if (!v.isValid) { v.errors.forEach(e => toast.error(e)); return; }
    setIsSaving(true); setSaveSuccess(false);
    try {
      const response = await workflowApi.update(meta.id, {
        name: meta.name, description: meta.description, status: meta.status,
        triggerType: meta.triggerType, cronExpression: meta.cronExpression,
        nodesJson: nodes as unknown[], edgesJson: edges as unknown[],
      });
      setMeta({
        webhookPath: response.data?.webhook?.path || null,
        webhookActive: response.data?.webhook?.isActive || false,
      });
      markClean();
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2200);
    } catch { toast.error('Failed to save'); } finally { setIsSaving(false); }
  }, [meta, nodes, edges, validateWorkflow, setMeta, markClean]);

  const iconBtn = (k: string, disabled = false): React.CSSProperties => ({
    width: 32, height: 32,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, border: 'none',
    background: hov[k] && !disabled ? 'rgba(255,255,255,0.07)' : 'transparent',
    color: disabled ? '#2D3F55' : (hov[k] ? '#CBD5E1' : '#4A6080'),
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.14s',
    opacity: disabled ? 0.4 : 1,
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 56, padding: '0 14px',
      background: '#0B1120',
      borderBottom: '1px solid #1A2540',
      flexShrink: 0,
      zIndex: 30,
    }}>

      {/* ── Left ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Back */}
        <button style={iconBtn('back')} {...h('back')} onClick={() => router.push('/workflows')} title="Back to Workflows">
          <ArrowLeft size={15} />
        </button>

        <div style={{ width: 1, height: 20, background: '#1A2540', margin: '0 4px' }} />

        {/* Workflow name */}
        {isEditingName ? (
          <input
            value={meta.name}
            onChange={e => setMeta({ name: e.target.value })}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
            autoFocus
            style={{
              padding: '5px 10px', borderRadius: 8,
              background: 'rgba(37,99,235,0.12)',
              border: '1.5px solid rgba(59,130,246,0.4)',
              outline: 'none', fontSize: 14, fontWeight: 600,
              color: '#E2E8F0', minWidth: 200,
              boxShadow: '0 0 0 3px rgba(37,99,235,0.1)',
            }}
          />
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            title="Rename workflow"
            {...h('name')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '5px 10px', borderRadius: 8, border: 'none',
              background: hov.name ? 'rgba(255,255,255,0.05)' : 'transparent',
              cursor: 'pointer', maxWidth: 260, transition: 'background 0.14s',
            }}
          >
            <span style={{
              fontSize: 14, fontWeight: 600, color: '#CBD5E1',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {meta.name}
            </span>
            <Pencil size={11} color="#2D3F55" style={{ flexShrink: 0 }} />
          </button>
        )}

        {/* Unsaved indicator */}
        {isDirty && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: 10, fontWeight: 700,
              color: '#F59E0B',
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.25)',
              padding: '2px 8px', borderRadius: 100,
              letterSpacing: '0.03em',
            }}
          >
            UNSAVED
          </motion.span>
        )}
      </div>

      {/* ── Center: undo / redo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button style={iconBtn('undo', !canUndo)} {...h('undo')} onClick={undo} disabled={!canUndo} title="Undo">
          <Undo2 size={14} />
        </button>
        <button style={iconBtn('redo', !canRedo)} {...h('redo')} onClick={redo} disabled={!canRedo} title="Redo">
          <Redo2 size={14} />
        </button>
      </div>

      {/* ── Right: actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Settings */}
        <button style={iconBtn('settings')} {...h('settings')} onClick={onToggleSettings} title="Workflow Settings">
          <Settings size={15} />
        </button>

        {/* Logs toggle */}
        {onToggleLog && (
          <button
            {...h('logs')}
            onClick={onToggleLog}
            style={{
              position: 'relative',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              height: 30, padding: '0 11px', borderRadius: 8, border: 'none',
              background: hov.logs ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: hov.logs ? '#94A3B8' : '#4A6080',
              fontSize: 12, fontWeight: 700, fontFamily: '"Fira Code", monospace',
              cursor: 'pointer', transition: 'all 0.14s',
            }}
          >
            {'<Logs>'}
            {showLogIndicator && (
              <span style={{
                position: 'absolute', top: 5, right: 5,
                width: 6, height: 6, borderRadius: '50%',
                background: '#3B82F6',
                boxShadow: '0 0 6px rgba(59,130,246,0.8)',
              }} />
            )}
          </button>
        )}

        <div style={{ width: 1, height: 20, background: '#1A2540' }} />

        {/* Save */}
        <button
          {...h('save')}
          onClick={handleSave}
          disabled={isSaving || isRunning}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 32, padding: '0 14px', borderRadius: 8,
            border: '1px solid ' + (saveSuccess ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.1)'),
            background: saveSuccess
              ? 'rgba(34,197,94,0.12)'
              : hov.save ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
            color: saveSuccess ? '#4ADE80' : '#94A3B8',
            fontSize: 13, fontWeight: 600,
            cursor: isSaving || isRunning ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            transition: 'all 0.15s',
          }}
        >
          {isSaving
            ? <Loader2 size={13} style={{ animation: 'ff-spin 0.8s linear infinite' }} />
            : saveSuccess
            ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={13} /></motion.span>
            : <Save size={13} />}
          <span>{saveSuccess ? 'Saved' : 'Save'}</span>
        </button>

        {/* Run */}
        <button
          {...h('run')}
          disabled={isRunning || isSaving || !meta.id}
          onClick={() => {
            const v = validateWorkflow();
            if (!v.isValid) { v.errors.forEach(e => toast.error(e)); return; }
            onRun?.();
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            height: 32, padding: '0 16px', borderRadius: 8, border: 'none',
            background: isRunning
              ? (hov.run ? '#B45309' : '#D97706')
              : (hov.run ? '#1D4ED8' : '#2563EB'),
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: isRunning || isSaving || !meta.id ? 'not-allowed' : 'pointer',
            opacity: !meta.id ? 0.5 : 1,
            transition: 'background 0.15s',
            boxShadow: isRunning
              ? '0 2px 10px rgba(217,119,6,0.4)'
              : '0 2px 10px rgba(37,99,235,0.45)',
            letterSpacing: '-0.01em',
          }}
        >
          {isRunning
            ? <Loader2 size={13} style={{ animation: 'ff-spin 0.8s linear infinite' }} />
            : <Play size={13} />}
          {isRunning ? 'Running…' : 'Run'}
        </button>
      </div>
    </div>
  );
}
