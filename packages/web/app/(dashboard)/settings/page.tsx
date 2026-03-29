'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Building, Palette, Bell,
  Save, Moon, Sun, Monitor, ShieldAlert, LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { usersApi, workspacesApi, NotificationPreferences } from '@/lib/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

// ─── Style constants ─────────────────────────────────────────
const C = {
  page:    { minHeight: '100vh', background: '#F1F5F9', display: 'flex', flexDirection: 'column' } as React.CSSProperties,
  header:  { position: 'sticky' as const, top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  hInner:  { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 32px' } as React.CSSProperties,
  hTitle:  { fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 } as React.CSSProperties,
  hSub:    { fontSize: 14, color: '#64748B', margin: '3px 0 0' } as React.CSSProperties,
  body:    { flex: 1, padding: '28px 32px', display: 'flex', gap: 24, alignItems: 'flex-start' } as React.CSSProperties,
  tabList: { width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column' as const, gap: 4 },
  card:    { flex: 1, background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' } as React.CSSProperties,
  section: { padding: '28px 32px' } as React.CSSProperties,
  secTitle:{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' } as React.CSSProperties,
  secSub:  { fontSize: 13, color: '#64748B', margin: 0 } as React.CSSProperties,
  divider: { borderTop: '1px solid #F1F5F9', margin: '28px 0' } as React.CSSProperties,
  label:   { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 } as React.CSSProperties,
  input:   { width: '100%', height: 48, padding: '0 16px', background: '#fff', border: '1.5px solid #CBD5E1', borderRadius: 12, fontSize: 14, color: '#0F172A', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s' },
  inputDis:{ width: '100%', height: 48, padding: '0 16px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, fontSize: 14, color: '#94A3B8', cursor: 'not-allowed', boxSizing: 'border-box' as const },
  saveBtn: (hov: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 22px',
    background: hov ? '#1D4ED8' : '#2563EB', color: '#fff', fontSize: 14, fontWeight: 700,
    borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)', transition: 'background 0.15s',
  }),
  dangerBtn: (hov: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px',
    background: hov ? '#B91C1C' : '#DC2626', color: '#fff', fontSize: 13, fontWeight: 700,
    borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'background 0.15s',
    flexShrink: 0,
  }),
  avatarBtn: (hov: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px',
    background: hov ? '#F1F5F9' : '#fff', color: '#374151', fontSize: 13, fontWeight: 600,
    borderRadius: 10, border: '1.5px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.15s',
  }),
};

const TABS = [
  { id: 'profile',       label: 'My Profile', icon: User },
  { id: 'workspace',     label: 'Workspace',  icon: Building },
  { id: 'appearance',    label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const THEMES = [
  { id: 'light',  label: 'Light Mode', sub: 'Clean and bright',  icon: Sun },
  { id: 'dark',   label: 'Dark Mode',  sub: 'For night owls',    icon: Moon },
  { id: 'system', label: 'System',     sub: 'Matches your OS',   icon: Monitor },
];

const NOTIFICATION_OPTIONS: Array<{
  id: keyof NotificationPreferences;
  title: string;
  desc: string;
}> = [
  { id: 'email', title: 'Email Alerts', desc: 'Receive important updates and security notices' },
  { id: 'failed', title: 'Workflow Failures', desc: 'Get notified immediately if a workflow fails' },
  { id: 'digest', title: 'Weekly Digest', desc: 'A summary of your workspace activity' },
];

export default function SettingsPage() {
  const { user, workspaces, activeWorkspaceId, logout, updateUser, updateWorkspace, removeWorkspace } = useAuthStore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileName, setProfileName] = useState(user?.name || '');
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name || '');
  
  // Appearance and Notifications state
  const { theme, setTheme } = useTheme();
  
  // Default fallback if user has no notifications configured yet
  const defaultAlerts: NotificationPreferences = { email: true, failed: true, digest: false };
  const [alerts, setAlerts] = useState<NotificationPreferences>(defaultAlerts);

  // Sync state if store updates from elsewhere
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      if (user.notifications) {
        setAlerts(user.notifications);
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeWorkspace) setWorkspaceName(activeWorkspace.name);
  }, [activeWorkspace]);

  const toggleAlert = async (key: keyof NotificationPreferences) => {
    const next: NotificationPreferences = { ...alerts, [key]: !alerts[key] };
    setAlerts(next); // Optimistic UI update
    try {
      const res = await usersApi.updateMe({ notifications: next });
      updateUser(res.data!);
      toast.success('Notification preferences updated');
    } catch (err: any) {
      // Revert if failed
      setAlerts(alerts);
      toast.error('Failed to update notifications');
    }
  };

  const [hov, setHov] = useState<Record<string, boolean>>({});
  const h = (k: string) => ({ onMouseEnter: () => setHov(p => ({...p,[k]:true})), onMouseLeave: () => setHov(p => ({...p,[k]:false})) });

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error('Image must be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      try {
        setIsUploadingAvatar(true);
        const res = await usersApi.updateMe({ name: profileName, avatarUrl: base64String });
        updateUser(res.data!);
        toast.success('Avatar updated successfully');
      } catch (err: any) {
        toast.error(err.message || 'Failed to update avatar');
      } finally {
        setIsUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await usersApi.updateMe({ name: profileName });
      updateUser(res.data!);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveWorkspace = async () => {
    if (!workspaceName.trim() || !activeWorkspaceId) {
      toast.error('Workspace name cannot be empty');
      return;
    }
    setIsSavingWorkspace(true);
    try {
      const res = await workspacesApi.update(activeWorkspaceId, { name: workspaceName });
      updateWorkspace(activeWorkspaceId, res.data!);
      toast.success('Workspace updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update workspace');
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspaceId) return;
    if (confirm('Are you absolutely sure you want to delete this workspace? This action cannot be undone and will delete all workflows.')) {
      try {
        await workspacesApi.delete(activeWorkspaceId);
        removeWorkspace(activeWorkspaceId);
        toast.success('Workspace deleted');
        
        // If that was the last workspace, log them out or redirect
        if (workspaces.length <= 1) {
          logout();
          router.push('/login');
        } else {
          router.push('/dashboard'); // Go back to dashboard with the fallback workspace
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete workspace');
      }
    }
  };

  return (
    <div style={C.page}>
      {/* Header */}
      <div style={C.header}>
        <div style={C.hInner}>
          <div style={{ width: 44, height: 44, background: '#EEF2FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #C7D2FE' }}>
            <SettingsIcon size={20} color="#6366F1" />
          </div>
          <div>
            <h1 style={C.hTitle}>Settings</h1>
            <p style={C.hSub}>Manage your account preferences and workspace configurations</p>
          </div>
        </div>
      </div>

      {/* Body: sidebar tabs + content card */}
      <div style={C.body}>
        {/* Tab list */}
        <div style={C.tabList}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const hovKey = `tab-${tab.id}`;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                {...h(hovKey)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: active ? '#EEF2FF' : (hov[hovKey] ? '#F8FAFC' : 'transparent'),
                  color: active ? '#4F46E5' : (hov[hovKey] ? '#374151' : '#64748B'),
                  fontSize: 14, fontWeight: active ? 700 : 500,
                  textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <Icon size={18} style={{ flexShrink: 0, color: active ? '#6366F1' : (hov[hovKey] ? '#374151' : '#94A3B8') }} />
                {tab.label}
              </button>
            );
          })}

          {/* Logout button */}
          <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
            <button
              onClick={() => { logout(); router.push('/login'); }}
              {...h('logout')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', width: '100%',
                background: hov.logout ? '#FEF2F2' : 'transparent',
                color: hov.logout ? '#DC2626' : '#94A3B8',
                fontSize: 14, fontWeight: 500, textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <LogOut size={16} style={{ flexShrink: 0 }} />
              Sign out
            </button>
          </div>
        </div>

        {/* Content card */}
        <div style={C.card}>
          <AnimatePresence mode="wait">
            {/* ── Profile ── */}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <div style={C.section}>
                  <h2 style={C.secTitle}>Public Profile</h2>
                  <p style={C.secSub}>This information will be displayed to your workspace members.</p>
                </div>

                <div style={{ padding: '0 32px' }}>
                  {/* Avatar row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #818CF8, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 28, flexShrink: 0, boxShadow: '0 4px 12px rgba(129,140,248,0.35)', overflow: 'hidden' }}>
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        user?.name?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <input type="file" accept="image/png, image/jpeg, image/gif" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                      <button style={{ ...C.avatarBtn(!!hov.avatar), opacity: isUploadingAvatar ? 0.7 : 1 }} disabled={isUploadingAvatar} {...h('avatar')} onClick={handleAvatarClick}>
                        {isUploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                      </button>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>JPG, GIF or PNG. 1MB max.</p>
                    </div>
                  </div>

                  {/* Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                    <div>
                      <label style={C.label}>Full Name</label>
                      <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} style={C.input} />
                    </div>
                    <div>
                      <label style={C.label}>Email Address</label>
                      <input type="email" value={user?.email || ''} disabled style={C.inputDis} />
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px 32px 28px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ ...C.saveBtn(!!hov.saveProfile), opacity: isSavingProfile ? 0.7 : 1 }} disabled={isSavingProfile} {...h('saveProfile')} onClick={handleSaveProfile}>
                    <Save size={16} /> {isSavingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Workspace ── */}
            {activeTab === 'workspace' && (
              <motion.div key="workspace" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <div style={C.section}>
                  <h2 style={C.secTitle}>Workspace Settings</h2>
                  <p style={C.secSub}>Manage your team and project defaults.</p>
                </div>

                <div style={{ padding: '0 32px 28px' }}>
                  <div style={{ maxWidth: 420, marginBottom: 28 }}>
                    <label style={C.label}>Workspace Name</label>
                    <input type="text" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} style={C.input} />
                    <button style={{ ...C.saveBtn(!!hov.saveWorkspace), marginTop: 16, height: 40, opacity: isSavingWorkspace ? 0.7 : 1 }} disabled={isSavingWorkspace} {...h('saveWorkspace')} onClick={handleSaveWorkspace}>
                      <Save size={14} /> {isSavingWorkspace ? 'Saving...' : 'Save Workspace'}
                    </button>
                  </div>

                  {/* Danger zone */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <ShieldAlert size={16} color="#DC2626" />
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#DC2626', margin: 0 }}>Danger Zone</h3>
                    </div>
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#991B1B', margin: 0 }}>Delete Workspace</p>
                        <p style={{ fontSize: 13, color: '#B91C1C', margin: '4px 0 0', opacity: 0.8 }}>Permanently delete this workspace and all its workflows.</p>
                      </div>
                      <button style={C.dangerBtn(!!hov.del)} {...h('del')} onClick={handleDeleteWorkspace}>Delete Workspace</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Appearance ── */}
            {activeTab === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <div style={C.section}>
                  <h2 style={C.secTitle}>Appearance</h2>
                  <p style={C.secSub}>Customize how FlowForge looks on your device.</p>
                </div>

                <div style={{ padding: '0 32px 32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {THEMES.map(t => {
                    const Icon = t.icon;
                    const active = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        style={{
                          padding: '20px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                          border: active ? '2px solid #6366F1' : '2px solid #E2E8F0',
                          background: active ? '#EEF2FF' : '#F8FAFC',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Icon size={24} style={{ color: active ? '#6366F1' : '#94A3B8', marginBottom: 12, display: 'block' }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: active ? '#4338CA' : '#374151', margin: '0 0 4px' }}>{t.label}</p>
                        <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{t.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Notifications ── */}
            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <div style={C.section}>
                  <h2 style={C.secTitle}>Notification Preferences</h2>
                  <p style={C.secSub}>Control how and when you receive alerts from your workflows.</p>
                </div>

                <div style={{ padding: '0 32px 32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 540 }}>
                    {NOTIFICATION_OPTIONS.map(opt => {
                      const isActive = alerts[opt.id];
                      return (
                        <div key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', border: '1px solid #E2E8F0', borderRadius: 14, background: '#F8FAFC' }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 2px' }}>{opt.title}</p>
                            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{opt.desc}</p>
                          </div>
                          <button
                            onClick={() => toggleAlert(opt.id)}
                            style={{
                              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                              background: isActive ? '#2563EB' : '#CBD5E1', transition: 'background 0.2s', padding: 0
                            }}
                          >
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
                              left: isActive ? 22 : 2, transition: 'left 0.2s',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
