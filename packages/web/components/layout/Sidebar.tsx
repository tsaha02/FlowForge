'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, LayoutDashboard, GitBranch, Play, Key, Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

// ─── Style constants ────────────────────────────────────────
const SIDEBAR_BG   = '#0F172A';
const SIDEBAR_BDR  = 'rgba(255,255,255,0.06)';
const ACTIVE_BG    = 'rgba(59,130,246,0.15)';
const ACTIVE_COLOR = '#60A5FA';
const ACTIVE_BDR   = 'rgba(59,130,246,0.3)';
const MUTED_COLOR  = '#64748B';
const NAV_W_EXP    = 260;
const NAV_W_COL    = 72;

const navItems = [
  { label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Workflows',   href: '/workflows',   icon: GitBranch },
  { label: 'Executions',  href: '/executions',  icon: Play },
  { label: 'Credentials', href: '/credentials', icon: Key },
  { label: 'Settings',    href: '/settings',    icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [logoutHover, setLogoutHover] = useState(false);

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <motion.aside
      animate={{ width: collapsed ? NAV_W_COL : NAV_W_EXP }}
      transition={{ duration: 0.28, ease: 'easeInOut' }}
      style={{
        height: '100vh',
        background: SIDEBAR_BG,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${SIDEBAR_BDR}`,
        position: 'relative',
        flexShrink: 0,
        overflow: 'visible',
        boxShadow: '4px 0 20px rgba(0,0,0,0.25)',
        zIndex: 40,
      }}
    >
      {/* ── Logo Row ─────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: collapsed ? '0 12px' : '0 20px',
        height: 68,
        borderBottom: `1px solid ${SIDEBAR_BDR}`,
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Zap icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: 'linear-gradient(135deg, #60A5FA, #2563EB)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
        }}>
          <Zap size={18} color="#fff" />
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                FlowForge
              </div>
              <div style={{ fontSize: 11, color: MUTED_COLOR, marginTop: 1 }}>
                Automation Platform
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Collapse toggle ───────────────────── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute', top: 80, right: -13, zIndex: 30,
          width: 26, height: 26, borderRadius: '50%',
          background: '#1E293B', border: '1px solid #334155',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#94A3B8', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* ── Nav label ────────────────────────── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: '20px 20px 8px', flexShrink: 0 }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#334155', textTransform: 'uppercase' }}>
              Navigation
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation items ─────────────────── */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: collapsed ? '12px 8px' : '4px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {navItems.map(item => {
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
                gap: 12,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '11px 0' : '11px 14px',
                borderRadius: 12,
                border: isActive ? `1px solid ${ACTIVE_BDR}` : '1px solid transparent',
                background: isActive ? ACTIVE_BG : (isHov ? 'rgba(255,255,255,0.05)' : 'transparent'),
                color: isActive ? ACTIVE_COLOR : (isHov ? '#CBD5E1' : '#64748B'),
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ fontSize: 14, fontWeight: isActive ? 600 : 500, flex: 1 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active dot */}
              {isActive && !collapsed && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACTIVE_COLOR, flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── User Profile ─────────────────────── */}
      <div style={{
        borderTop: `1px solid ${SIDEBAR_BDR}`,
        padding: collapsed ? '14px 8px' : '14px 16px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          {/* Avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 15,
            boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED_COLOR, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                    {user?.email || ''}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  onMouseEnter={() => setLogoutHover(true)}
                  onMouseLeave={() => setLogoutHover(false)}
                  title="Logout"
                  style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: logoutHover ? 'rgba(239,68,68,0.12)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    color: logoutHover ? '#F87171' : MUTED_COLOR,
                    transition: 'all 0.15s',
                  }}
                >
                  <LogOut size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
