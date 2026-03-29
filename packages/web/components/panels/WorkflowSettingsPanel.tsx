'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Save, CheckCircle2, Copy } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { toast } from 'sonner';

const CRON_REGEX = /^(\*|([0-9]|[1-5][0-9])|\*\/([0-9]|[1-5][0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|[12][0-9]|3[01])|\*\/([1-9]|[12][0-9]|3[01])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|[0-6]|\*\/[0-6])$/;

const TRIGGER_OPTIONS = [
  { value: 'MANUAL',  emoji: '🖱', label: 'Manual',    desc: 'Run on demand' },
  { value: 'CRON',    emoji: '⏰', label: 'Scheduled', desc: 'Run on schedule' },
  { value: 'WEBHOOK', emoji: '🔗', label: 'Webhook',   desc: 'HTTP trigger' },
];

const S = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 } as React.CSSProperties,
  input: (err?: boolean): React.CSSProperties => ({ width: '100%', padding: '10px 14px', background: '#F8FAFC', border: `1.5px solid ${err ? '#F87171' : '#E2E8F0'}`, borderRadius: 12, fontSize: 14, color: '#0F172A', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }),
  textarea: { width: '100%', padding: '10px 14px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, fontSize: 14, color: '#0F172A', outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.55, boxSizing: 'border-box' as const },
  select: { width: '100%', padding: '10px 14px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, fontSize: 14, color: '#0F172A', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' as const },
};

interface Props { isOpen: boolean; onClose: () => void; }

export default function WorkflowSettingsPanel({ isOpen, onClose }: Props) {
  const { meta, setMeta } = useWorkflowStore();
  const [saved, setSaved] = useState(false);
  const webhookUrl = meta.webhookPath
    ? `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '')}/api/webhooks/${meta.webhookPath}`
    : null;
  const cronError =
    meta.triggerType !== 'CRON'
      ? null
      : !meta.cronExpression
        ? 'Cron expression is required'
        : !CRON_REGEX.test(meta.cronExpression)
          ? 'Invalid cron format (e.g. "0 9 * * *")'
          : null;

  const handleDone = () => {
    if (cronError) { toast.error(cronError); return; }
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  const handleCopyWebhook = async () => {
    if (!webhookUrl) {
      toast.error('Save the workflow first to generate a webhook URL');
      return;
    }

    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success('Webhook URL copied');
    } catch {
      toast.error('Failed to copy webhook URL');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: '#0F172A', zIndex: 40 }}
            onClick={onClose}
          />

          {/* Slide-in panel */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 384, background: '#fff', zIndex: 50, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #E2E8F0', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Workflow Settings</h2>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: '3px 0 0' }}>Configure name, trigger, and status</p>
              </div>
              <button onClick={onClose} style={{ width: 30, height: 30, border: 'none', background: '#F1F5F9', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                <X size={15} />
              </button>
            </div>

            {/* Fields */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Name */}
              <div>
                <label style={S.label}>Workflow Name</label>
                <input type="text" value={meta.name} onChange={e => setMeta({ name: e.target.value })} style={S.input()} onFocus={e => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')} />
              </div>

              {/* Description */}
              <div>
                <label style={S.label}>Description</label>
                <textarea value={meta.description} onChange={e => setMeta({ description: e.target.value })} placeholder="What does this workflow do?" rows={3} style={S.textarea} onFocus={e => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')} />
              </div>

              {/* Status */}
              <div>
                <label style={S.label}>Status</label>
                <select value={meta.status} onChange={e => setMeta({ status: e.target.value as typeof meta.status })} style={S.select} onFocus={e => (e.currentTarget.style.borderColor = '#3B82F6')} onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>ACTIVE workflows will trigger automatically. Scheduled workflows also need the backend worker and Redis online.</p>
              </div>

              {/* Trigger type */}
              <div>
                <label style={S.label}>Trigger Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {TRIGGER_OPTIONS.map(t => {
                    const sel = meta.triggerType === t.value;
                    return (
                      <button key={t.value} onClick={() => setMeta({ triggerType: t.value as typeof meta.triggerType })}
                        style={{ padding: '12px 8px', borderRadius: 12, border: `1.5px solid ${sel ? '#3B82F6' : '#E2E8F0'}`, background: sel ? '#EFF6FF' : '#F8FAFC', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{t.emoji}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: sel ? '#2563EB' : '#374151' }}>{t.label}</div>
                        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{t.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cron expression */}
              {meta.triggerType === 'CRON' && (
                <div>
                  <label style={S.label}>Cron Expression</label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" value={meta.cronExpression} onChange={e => setMeta({ cronExpression: e.target.value })} placeholder="0 9 * * *" style={{ ...S.input(!!cronError), fontFamily: 'ui-monospace, monospace', paddingRight: cronError ? 40 : 14 }} onFocus={e => (e.currentTarget.style.borderColor = cronError ? '#F87171' : '#3B82F6')} onBlur={e => (e.currentTarget.style.borderColor = cronError ? '#F87171' : '#E2E8F0')} />
                    {cronError && (
                      <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                        <AlertCircle size={16} color="#EF4444" />
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: cronError ? '#EF4444' : '#94A3B8', marginTop: 6, fontWeight: cronError ? 600 : 400 }}>
                    {cronError || 'Format: minute hour day month weekday (e.g. "0 9 * * 1-5" = 9am weekdays)'}
                  </p>
                </div>
              )}

              {/* Webhook info */}
              {meta.triggerType === 'WEBHOOK' && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#15803D', margin: '0 0 6px' }}>Webhook Trigger</p>
                  <p style={{ fontSize: 12, color: '#16A34A', margin: 0, lineHeight: 1.5 }}>
                    {webhookUrl
                      ? meta.webhookActive
                        ? 'Use this endpoint to trigger the workflow via the HTTP method selected on the Webhook Trigger node.'
                        : 'This webhook URL is reserved, but it will only accept traffic while the workflow is ACTIVE.'
                      : 'Save this workflow to generate a dedicated webhook URL.'}
                  </p>
                  {webhookUrl && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        readOnly
                        value={webhookUrl}
                        style={{ ...S.input(), flex: 1, fontFamily: 'ui-monospace, monospace', fontSize: 12, background: '#fff' }}
                      />
                      <button
                        onClick={handleCopyWebhook}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 12px', borderRadius: 10, border: '1px solid #86EFAC', background: '#DCFCE7', color: '#15803D', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                      >
                        <Copy size={14} /> Copy
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #F1F5F9', flexShrink: 0 }}>
              <button onClick={handleDone} style={{ width: '100%', height: 46, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: saved ? '#16A34A' : '#2563EB', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                {saved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> Save &amp; Close</>}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
