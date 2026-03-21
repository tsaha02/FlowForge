// ============================================
// FlowForge — Dashboard Layout
// ============================================
// This layout wraps all dashboard pages (workflows, executions, etc.).
// It shows the sidebar on the left + the page content on the right.
//
// WHY (auth) and (dashboard) groups?
// Next.js "route groups" (folders with parentheses) share layouts but
// don't appear in the URL. So /workflows uses this layout, /login doesn't.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loadFromStorage } = useAuthStore();

  // On mount, try to load user from localStorage
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // If no user after loading, redirect to login
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('flowforge-token') : null;
    if (!token) {
      router.push('/login');
    }
  }, [user, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
