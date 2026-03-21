'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Search, MoreVertical, ShieldCheck, Globe, Database, MessageSquare, Mail, Lock, Trash2, Edit2, X, TerminalSquare } from 'lucide-react';
import { toast } from 'sonner';
import { credentialsApi, Credential } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

// ─── Style constants ───────────────────────────────────────────
const S = {
  page:      { minHeight: '100vh', background: '#F1F5F9', display: 'flex', flexDirection: 'column' } as React.CSSProperties,
  headerBar: { position: 'sticky' as const, top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  hInner:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' } as React.CSSProperties,
  hTitle:    { fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 } as React.CSSProperties,
  hSub:      { fontSize: 14, color: '#64748B', margin: '3px 0 0' } as React.CSSProperties,
  addBtn:    (hov: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 22px',
    background: hov ? '#059669' : '#10B981', color: '#fff', fontSize: 14, fontWeight: 700,
    borderRadius: 12, border: 'none', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(16,185,129,0.35)', transition: 'background 0.15s',
  }),
  toolbar:   { display: 'flex', alignItems: 'center', gap: 12, padding: '0 32px 20px' } as React.CSSProperties,
  search:    { display: 'flex', alignItems: 'center', gap: 10, height: 44, background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '0 14px', flex: 1 } as React.CSSProperties,
  content:   { flex: 1, padding: '24px 32px' } as React.CSSProperties,
  card:      (hov: boolean): React.CSSProperties => ({
    background: '#fff', borderRadius: 20, border: hov ? '1.5px solid #6EE7B7' : '1.5px solid #E2E8F0',
    padding: 24, boxShadow: hov ? '0 8px 24px rgba(16,185,129,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
    transform: hov ? 'translateY(-2px)' : 'none', transition: 'all 0.2s ease', cursor: 'default',
  }),
  iconBox:   (hov: boolean): React.CSSProperties => ({
    width: 44, height: 44, borderRadius: 12, border: hov ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
    background: hov ? '#ECFDF5' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s',
  }),
  footer:    { marginTop: 16, paddingTop: 14, borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
  menuBtn:   (active: boolean): React.CSSProperties => ({
    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, border: 'none', background: active ? '#F1F5F9' : 'transparent',
    cursor: 'pointer', color: '#94A3B8', flexShrink: 0,
  }),
  dropdown:  { position: 'absolute' as const, right: 0, top: '100%', marginTop: 4, width: 160, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '6px 0', zIndex: 50 },
  menuItem:  (color?: string): React.CSSProperties => ({ width: '100%', textAlign: 'left' as const, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: color || '#374151', fontWeight: color ? 600 : 400 }),
  label:     { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 } as React.CSSProperties,
  input:     { width: '100%', height: 46, padding: '0 14px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, fontSize: 14, color: '#0F172A', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s' },
};

function getIconForType(type: string) {
  switch (type) {
    case 'API_KEY': return Key;
    case 'OAUTH': return Globe;
    case 'BASIC_AUTH': return Lock;
    case 'CUSTOM': return TerminalSquare;
    default: return Key;
  }
}

function getLabelForType(type: string) {
  switch (type) {
    case 'API_KEY': return 'API Key';
    case 'OAUTH': return 'OAuth 2.0';
    case 'BASIC_AUTH': return 'Basic Auth';
    case 'CUSTOM': return 'Custom';
    default: return type;
  }
}

export default function CredentialsPage() {
  const { activeWorkspaceId } = useAuthStore();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [hovCard, setHovCard] = useState<string | null>(null);
  const [hov, setHov] = useState<Record<string, boolean>>({});
  const h = (k: string) => ({ onMouseEnter: () => setHov(p => ({...p,[k]:true})), onMouseLeave: () => setHov(p => ({...p,[k]:false})) });

  // Add Credential Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('API_KEY');
  const [newSecret, setNewSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeWorkspaceId) {
      loadCredentials();
    }
  }, [activeWorkspaceId]);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const res = await credentialsApi.list(activeWorkspaceId!);
      // `res` is the standard ApiResponse wrapper `{ success: true, data: [] }`
      setCredentials(res.data || []);
    } catch (error) {
      toast.error('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const filtered = credentials.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('Delete this credential? Workflows using it will fail.')) {
      try {
        await credentialsApi.delete(id);
        toast.success('Credential deleted');
        setCredentials(p => p.filter(c => c.id !== id));
      } catch (error) {
        toast.error('Failed to delete credential');
      } finally {
        setOpenDropdownId(null);
      }
    }
  };

  const currentTypeMeta = () => {
    if (newType === 'BASIC_AUTH') return { placeholder: 'username:password', secretLabel: 'Username : Password' };
    if (newType === 'OAUTH') return { placeholder: 'eyJhGcGci...', secretLabel: 'OAuth Bearer Token' };
    return { placeholder: 'sk-...', secretLabel: 'Secret Key / Token' };
  };

  const handleSave = async () => {
    if (!newName.trim() || !newSecret.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (!activeWorkspaceId) {
      toast.error('No active workspace');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        workspaceId: activeWorkspaceId,
        name: newName,
        type: newType,
        data: { secret: newSecret }
      };
      
      const res = await credentialsApi.create(payload);
      toast.success('Credential encrypted and saved');
      if (res.data) {
        setCredentials([res.data as unknown as Credential, ...credentials]);
      }
      
      // Reset form
      setNewName('');
      setNewSecret('');
      setNewType('API_KEY');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to save credential');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={S.page} onClick={() => setOpenDropdownId(null)}>
      {/* Header */}
      <div style={S.headerBar}>
        <div style={S.hInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, background: '#ECFDF5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #A7F3D0' }}>
              <ShieldCheck size={20} color="#10B981" />
            </div>
            <div>
              <h1 style={S.hTitle}>Credentials</h1>
              <p style={S.hSub}>Securely manage API keys, passwords, and tokens used by your workflows</p>
            </div>
          </div>
          <button style={S.addBtn(!!hov.add)} {...h('add')} onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Credential
          </button>
        </div>

        {/* Search */}
        <div style={S.toolbar}>
          <div style={{ ...S.search, borderColor: searchFocused ? '#10B981' : '#E2E8F0', boxShadow: searchFocused ? '0 0 0 3px rgba(16,185,129,0.12)' : 'none', background: searchFocused ? '#fff' : '#F8FAFC' }}>
            <Search size={15} style={{ color: '#94A3B8', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search credentials by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#0F172A' }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={S.content}>
        {/* Security banner */}
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: 20, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.16)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.08)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lock size={22} color="#34D399" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>Bank-grade Encryption</p>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>All credentials are encrypted at rest using AES-256-GCM.</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1 }}>{credentials.length}</p>
            <p style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Active Secrets</p>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: 14 }}>Loading credentials...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#F1F5F9', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Key size={28} color="#94A3B8" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>No credentials found</h3>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px' }}>Securely store API keys and tokens to use in your workflows.</p>
            <button onClick={() => setIsModalOpen(true)} style={S.addBtn(false)}>
              <Plus size={16} /> Add Your First Credential
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            <AnimatePresence>
              {filtered.map((cred, i) => {
                const Icon = getIconForType(cred.type);
                const isHov = hovCard === cred.id;
                return (
                  <motion.div
                    key={cred.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.18, delay: i * 0.04 }}
                    style={S.card(isHov)}
                    onMouseEnter={() => setHovCard(cred.id)}
                    onMouseLeave={() => setHovCard(null)}
                  >
                    {/* Card header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                        <div style={S.iconBox(isHov)}>
                          <Icon size={20} color={isHov ? '#10B981' : '#64748B'} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 700, color: isHov ? '#059669' : '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>
                            {cred.name}
                          </p>
                          <p style={{ fontSize: 12, color: '#94A3B8', margin: '3px 0 0' }}>{getLabelForType(cred.type)}</p>
                        </div>
                      </div>

                      {/* Dropdown */}
                      <div style={{ position: 'relative', flexShrink: 0 }} data-dropdown>
                        <button
                          style={S.menuBtn(openDropdownId === cred.id)}
                          onMouseDown={e => { e.stopPropagation(); setOpenDropdownId(openDropdownId === cred.id ? null : cred.id); }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openDropdownId === cred.id && (
                          <div style={S.dropdown} onClick={e => e.stopPropagation()}>
                            <button style={S.menuItem('#DC2626')} onMouseDown={e => { e.stopPropagation(); handleDelete(cred.id); }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={S.footer}>
                      <span style={{ fontSize: 12, color: '#94A3B8' }}>Added {new Date(cred.createdAt).toLocaleDateString()}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 100, padding: '3px 10px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                        Active
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Credential Modal */}
      {isModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 460, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 24px 48px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, background: '#ECFDF5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #A7F3D0' }}>
                  <Key size={18} color="#10B981" />
                </div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Add Credential</p>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>Connect a new service securely</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} disabled={isSaving} style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={S.label}>Credential Name</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Production DB, OpenAI Key" style={S.input} />
              </div>
              <div>
                <label style={S.label}>Credential Type</label>
                <select value={newType} onChange={e => setNewType(e.target.value)} style={{ ...S.input, appearance: 'none' }}>
                  <option value="API_KEY">API Key</option>
                  <option value="OAUTH">OAuth 2.0</option>
                  <option value="BASIC_AUTH">Basic Auth</option>
                  <option value="CUSTOM">Custom Schema</option>
                </select>
              </div>
              <div>
                <label style={S.label}>{currentTypeMeta().secretLabel}</label>
                <input type="password" value={newSecret} onChange={e => setNewSecret(e.target.value)} placeholder={currentTypeMeta().placeholder} style={{ ...S.input, fontFamily: 'monospace' }} />
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ display: 'flex', gap: 12, padding: '0 24px 24px' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                style={{ flex: 1, height: 44, borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{ flex: 1, height: 44, borderRadius: 12, border: 'none', background: '#10B981', color: '#fff', fontSize: 14, fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.35)', opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving ? 'Saving...' : 'Save Securely'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
