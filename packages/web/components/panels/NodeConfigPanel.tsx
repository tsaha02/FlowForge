'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useAuthStore } from '@/stores/authStore';
import { NODE_TYPES } from '@/types/nodes';
import { credentialsApi, Credential } from '@/lib/api';


// ─── Shared input styles ─────────────────────────────────────
const inputBase = (focused: boolean, monospace = false): React.CSSProperties => ({
  width: '100%',
  padding: '8px 11px',
  background: focused ? 'var(--surface-input)' : 'var(--surface-subtle)',
  border: `1.5px solid ${focused ? 'var(--brand)' : 'var(--border)'}`,
  borderRadius: 8,
  fontSize: 13,
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box' as const,
  fontFamily: monospace ? '"Fira Code", ui-monospace, monospace' : 'inherit',
  transition: 'border-color 0.15s, background 0.15s',
  boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
});

const textareaBase = (focused: boolean, dark = false): React.CSSProperties => ({
  width: '100%',
  padding: '8px 11px',
  background: dark ? '#0A0F1E' : (focused ? 'var(--surface-input)' : 'var(--surface-subtle)'),
  border: `1.5px solid ${focused ? 'var(--brand)' : (dark ? '#1E293B' : 'var(--border)')}`,
  borderRadius: 8,
  fontSize: 12,
  color: dark ? '#86EFAC' : 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box' as const,
  fontFamily: '"Fira Code", ui-monospace, monospace',
  resize: 'vertical' as const,
  lineHeight: 1.55,
  transition: 'border-color 0.15s',
  boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
});

/** Wrapper to track focus state on any input */
function FocusField({ children }: { children: (focused: boolean, setFocused: (v: boolean) => void) => React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  return <>{children(focused, setFocused)}</>;
}

export default function NodeConfigPanel() {
  const { nodes, selectedNodeId, setSelectedNode, updateNodeData, deleteNode, addNode, meta } = useWorkflowStore();
  const { activeWorkspaceId } = useAuthStore();
  const [hovClose,  setHovClose]  = useState(false);
  const [hovDupe,   setHovDupe]   = useState(false);
  const [hovDelete, setHovDelete] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const nodeData     = selectedNode?.data as Record<string, unknown> | undefined;
  const typeDef      = nodeData?.nodeType ? NODE_TYPES[nodeData.nodeType as string] : null;

  const handleFieldChange = useCallback(
    (fieldName: string, value: string | number | boolean) => {
      if (!selectedNodeId) return;
      updateNodeData(selectedNodeId, { config: { ...((nodeData?.config as Record<string, unknown>) || {}), [fieldName]: value } });
    },
    [selectedNodeId, nodeData?.config, updateNodeData],
  );

  const handleLabelChange = useCallback(
    (value: string) => { if (selectedNodeId) updateNodeData(selectedNodeId, { label: value }); },
    [selectedNodeId, updateNodeData],
  );

  const handleDelete = useCallback(() => { if (selectedNodeId) deleteNode(selectedNodeId); }, [selectedNodeId, deleteNode]);

  const handleDuplicate = useCallback(() => {
    if (!selectedNode) return;
    const newNode = {
      ...selectedNode,
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      position: { x: selectedNode.position.x + 30, y: selectedNode.position.y + 30 },
      data: JSON.parse(JSON.stringify(selectedNode.data)),
      selected: false,
    };
    addNode(newNode);
    toast.success('Node duplicated');
  }, [selectedNode, addNode]);

  const config = (nodeData?.config as Record<string, unknown>) || {};
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
  const webhookPathInput =
    typeDef?.type === 'webhook-trigger' && typeof config.path === 'string' ? config.path : '';
  const webhookMethod =
    typeDef?.type === 'webhook-trigger' && typeof config.method === 'string' ? config.method : 'POST';
  const webhookSlugPreview = webhookPathInput
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const effectiveWebhookPath = meta.webhookPath || webhookSlugPreview || null;
  const webhookUrl = effectiveWebhookPath ? `${apiBaseUrl}/api/webhooks/${effectiveWebhookPath}` : null;
  const pendingWebhookPathChange =
    typeDef?.type === 'webhook-trigger' &&
    Boolean(webhookSlugPreview) &&
    meta.webhookPath !== null &&
    webhookSlugPreview !== meta.webhookPath;

  useEffect(() => {
    let isMounted = true;

    async function loadCredentials() {
      if (!activeWorkspaceId) {
        if (isMounted) {
          setCredentials([]);
          setIsLoadingCredentials(false);
        }
        return;
      }

      try {
        setIsLoadingCredentials(true);
        const response = await credentialsApi.list(activeWorkspaceId);
        if (isMounted) {
          setCredentials(response.data || []);
        }
      } catch {
        if (isMounted) {
          setCredentials([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCredentials(false);
        }
      }
    }

    loadCredentials();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId]);

  return (
    <AnimatePresence>
      {selectedNode && typeDef && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{ background: 'var(--surface-card)', borderLeft: '1px solid var(--border)', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '-4px 0 20px rgba(0,0,0,0.08)' }}
        >
          {/* ── Header ───────────────────── */}
          <div style={{ flexShrink: 0 }}>
            {/* Color accent bar */}
            <div style={{ height: 3, background: typeDef.color, opacity: 0.8 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: `${typeDef.color}18`,
                  border: `1px solid ${typeDef.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, lineHeight: 1,
                }}>
                  {typeDef.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {typeDef.label}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{typeDef.category}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                onMouseEnter={() => setHovClose(true)}
                onMouseLeave={() => setHovClose(false)}
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, border: 'none', background: hovClose ? 'var(--surface-hover)' : 'transparent', color: hovClose ? 'var(--text-secondary)' : 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* ── Body: scrollable fields ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Node label */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Node Label</label>
              <FocusField>
                {(focused, setFocused) => (
                  <input
                    type="text"
                    value={(nodeData?.label as string) || typeDef.label}
                    onChange={e => handleLabelChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={inputBase(focused)}
                  />
                )}
              </FocusField>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Dynamic fields */}
            {typeDef.fields.map(field => (
              <div key={field.name}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {field.label}
                  {field.required && <span style={{ color: '#EF4444', fontSize: 11 }}>*</span>}
                </label>

                {/* text */}
                {field.type === 'text' && (
                  <FocusField>
                    {(focused, setFocused) => (
                      <input type="text" value={(config[field.name] as string) || ''} onChange={e => handleFieldChange(field.name, e.target.value)} placeholder={field.placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={inputBase(focused)} />
                    )}
                  </FocusField>
                )}

                {/* number */}
                {field.type === 'number' && (
                  <FocusField>
                    {(focused, setFocused) => (
                      <input type="number" value={(config[field.name] as number) ?? field.defaultValue ?? ''} onChange={e => handleFieldChange(field.name, parseFloat(e.target.value))} placeholder={field.placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={inputBase(focused)} />
                    )}
                  </FocusField>
                )}

                {/* select */}
                {field.type === 'select' && (
                  <FocusField>
                    {(focused, setFocused) => (
                      <select value={(config[field.name] as string) || (field.defaultValue as string) || ''} onChange={e => handleFieldChange(field.name, e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ ...inputBase(focused), appearance: 'none' as const, cursor: 'pointer' }}>
                        <option value="">Select...</option>
                        {(field.name === 'credentialId'
                          ? credentials.map((credential) => ({
                              label: `${credential.name} (${credential.type})`,
                              value: credential.id,
                            }))
                          : field.options || []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    )}
                  </FocusField>
                )}
                {field.name === 'credentialId' && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                    {isLoadingCredentials
                      ? 'Loading saved credentials...'
                      : credentials.length > 0
                        ? 'Pick one of your saved workspace credentials.'
                      : 'No saved credentials found in this workspace yet.'}
                  </p>
                )}
                {typeDef.type === 'webhook-trigger' && field.name === 'path' && (
                  <div style={{ marginTop: 10, background: 'var(--surface-subtle)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Public Endpoint
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {webhookUrl
                        ? pendingWebhookPathChange
                          ? 'Save the workflow to apply your updated webhook path.'
                          : meta.webhookActive
                            ? `This is the active trigger URL for the workflow. It currently accepts ${webhookMethod}.`
                            : 'This URL is reserved and will go live when the workflow is ACTIVE.'
                        : 'Save the workflow to generate its public trigger URL.'}
                    </p>
                    {webhookUrl && (
                      <input
                        type="text"
                        readOnly
                        value={webhookUrl}
                        style={{ ...inputBase(false, true), marginTop: 8, fontSize: 12 }}
                      />
                    )}
                  </div>
                )}

                {/* textarea / json */}
                {(field.type === 'textarea' || field.type === 'json') && (
                  <FocusField>
                    {(focused, setFocused) => (
                      <textarea value={(config[field.name] as string) || ''} onChange={e => handleFieldChange(field.name, e.target.value)} placeholder={field.placeholder} rows={3} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={textareaBase(focused)} />
                    )}
                  </FocusField>
                )}

                {/* code */}
                {field.type === 'code' && (
                  <FocusField>
                    {(focused, setFocused) => (
                      <textarea value={(config[field.name] as string) || ''} onChange={e => handleFieldChange(field.name, e.target.value)} placeholder={field.placeholder} rows={5} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={textareaBase(focused, true)} />
                    )}
                  </FocusField>
                )}

                {/* boolean */}
                {field.type === 'boolean' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={(config[field.name] as boolean) ?? field.defaultValue ?? false} onChange={e => handleFieldChange(field.name, e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--brand)', cursor: 'pointer' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{field.placeholder || 'Enabled'}</span>
                  </label>
                )}
              </div>
            ))}
          </div>

          {/* ── Footer ───────────────────── */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleDuplicate}
              onMouseEnter={() => setHovDupe(true)}
              onMouseLeave={() => setHovDupe(false)}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 36, borderRadius: 8, border: `1px solid var(--border)`, background: hovDupe ? 'var(--surface-hover)' : 'var(--surface-card)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <Copy size={13} /> Duplicate
            </button>
            <button
              onClick={handleDelete}
              onMouseEnter={() => setHovDelete(true)}
              onMouseLeave={() => setHovDelete(false)}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 36, borderRadius: 8, border: 'none', background: hovDelete ? '#B91C1C' : '#DC2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
