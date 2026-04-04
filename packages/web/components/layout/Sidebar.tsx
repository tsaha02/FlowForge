'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, LayoutDashboard, GitBranch, Play, Key, Settings,
  LogOut, ChevronLeft, ChevronRight, BookOpen,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

const W_EXP = 252;
const W_COL = 64;

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
      { label: 'Workflows',   href: '/workflows',   icon: GitBranch },
      { label: 'Executions',  href: '/executions',  icon: Play },
      { label: 'Credentials', href: '/credentials', icon: Key },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'Manual',    href: '/manual',    icon: BookOpen },
      { label: 'Settings',  href: '/settings',  icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed]     = useState(false);
  const [hoveredNav, setHoveredNav]   = useState<string | null>(null);
  const [logoutHov, setLogoutHov]     = useState(false);

  const handleLogout = () => { logout(); router.push('/login'); };

  // First letter of name for avatar
  const initials = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <motion.aside
      animate={{ width: collapsed ? W_COL : W_EXP }}
      transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
      style={{
        height: '100vh',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--sidebar-border)',
        position: 'relative',
        flexShrink: 0,
        overflow: 'visible',
        zIndex: 40,
      }}
    >
      {/* ── Logo ─────────────────────────────────────── */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '0 14px' : '0 18px',
        borderBottom: '1px solid var(--sidebar-border)',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Logo mark */}
        <div style={{
          width: 34, height: 34,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}>
          <Zap size={16} color="#fff" strokeWidth={2.5} />
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.16 }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                FlowForge
              </div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 1, letterSpacing: '0.01em' }}>
                Automation Platform
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Collapse toggle ───────────────────────────── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute', top: 76, right: -12, zIndex: 50,
          width: 24, height: 24, borderRadius: '50%',
          background: '#1E293B',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#64748B', cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          transition: 'color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
          (e.currentTarget as HTMLButtonElement).style.background = '#334155';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.color = '#64748B';
          (e.currentTarget as HTMLButtonElement).style.background = '#1E293B';
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* ── Nav ──────────────────────────────────────── */}
      <nav
        className="scrollbar-dark"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: collapsed ? '12px 8px' : '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 20 : 0 }}>

            {/* Group label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#2D3F55',
                    padding: '0 10px',
                    marginBottom: 4,
                  }}
                >
                  {group.label}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Nav items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(item => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const isHov    = hoveredNav === item.href;
                const Icon     = item.icon;

                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    onMouseEnter={() => setHoveredNav(item.href)}
                    onMouseLeave={() => setHoveredNav(null)}
                    title={collapsed ? item.label : undefined}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      padding: collapsed ? '10px 0' : '9px 10px',
                      borderRadius: 8,
                      border: '1px solid transparent',
                      background: isActive
                        ? 'var(--sidebar-active)'
                        : isHov
                          ? 'var(--sidebar-hover)'
                          : 'transparent',
                      borderColor: isActive ? 'var(--sidebar-active-border)' : 'transparent',
                      color: isActive
                        ? 'var(--sidebar-text-active)'
                        : isHov
                          ? 'var(--sidebar-text-hover)'
                          : 'var(--sidebar-text)',
                      cursor: 'pointer',
                      transition: 'all 0.14s ease',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* Active left bar */}
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        left: 0, top: '25%', bottom: '25%',
                        width: 3,
                        borderRadius: '0 2px 2px 0',
                        background: 'var(--sidebar-text-active)',
                      }} />
                    )}

                    <Icon
                      size={16}
                      style={{ flexShrink: 0, marginLeft: isActive ? 4 : 0, transition: 'margin 0.14s' }}
                      strokeWidth={isActive ? 2.5 : 2}
                    />

                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.14 }}
                          style={{
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 500,
                            flex: 1,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User footer ──────────────────────────────── */}
      <div style={{
        borderTop: '1px solid var(--sidebar-border)',
        padding: collapsed ? '12px 8px' : '12px 10px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '8px 0' : '8px 10px',
          borderRadius: 8,
          cursor: 'default',
        }}>
          {/* Avatar */}
          <div style={{
            width: 30, height: 30,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 13,
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(79,70,229,0.4)',
            letterSpacing: 0,
          }}>
            {initials}
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600,
                    color: '#CBD5E1',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                  }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{
                    fontSize: 10, color: '#334155',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginTop: 1,
                  }}>
                    {user?.email || ''}
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  onMouseEnter={() => setLogoutHov(true)}
                  onMouseLeave={() => setLogoutHov(false)}
                  title="Sign out"
                  style={{
                    width: 28, height: 28,
                    borderRadius: 7,
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: logoutHov ? 'rgba(239,68,68,0.12)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    color: logoutHov ? '#F87171' : '#334155',
                    transition: 'all 0.14s',
                  }}
                >
                  <LogOut size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
