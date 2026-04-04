'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Zap, ArrowRight, GitBranch, Play, Activity } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';

const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

// Floating node preview — purely decorative
function NodePreview() {
  const nodes = [
    { label: 'Webhook Trigger', icon: '🔗', x: 40,  y: 60,  color: '#3B82F6' },
    { label: 'AI / LLM',        icon: '🤖', x: 200, y: 30,  color: '#7C3AED' },
    { label: 'Send Email',      icon: '📧', x: 200, y: 140, color: '#EC4899' },
    { label: 'HTTP Request',    icon: '🌐', x: 360, y: 85,  color: '#10B981' },
  ];
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480, height: 200 }}>
      {/* SVG edges */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        <path d="M 130 80 C 165 80, 165 50, 200 50"   stroke="rgba(96,165,250,0.3)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
        <path d="M 130 80 C 165 80, 165 160, 200 160" stroke="rgba(96,165,250,0.3)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
        <path d="M 290 50 C 325 50, 325 105, 360 105"  stroke="rgba(96,165,250,0.3)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
        <path d="M 290 160 C 325 160, 325 105, 360 105" stroke="rgba(96,165,250,0.3)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
      </svg>
      {/* Nodes */}
      {nodes.map((n, i) => (
        <motion.div
          key={n.label}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.12, duration: 0.4, ease: 'easeOut' }}
          style={{
            position: 'absolute', left: n.x, top: n.y,
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid rgba(255,255,255,0.1)`,
            borderLeft: `3px solid ${n.color}`,
            borderRadius: 8, padding: '7px 12px',
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 13 }}>{n.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{n.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isLoading, error: authError } = useAuthStore();
  const [googleError, setGoogleError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: LoginFormValues) => {
    setGoogleError(null);
    try { await login(data.email, data.password); router.push('/dashboard'); } catch { /* handled by store */ }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    setGoogleError(null);
    try {
      if (credentialResponse.credential) {
        await loginWithGoogle(credentialResponse.credential);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setGoogleError(err instanceof Error ? err.message : 'Google sign in failed');
    }
  };

  const displayError = authError || googleError;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Left — Branding panel ───────────────────────────── */}
      <div style={{
        width: '50%', flexShrink: 0,
        background: '#060D1F',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
        padding: '48px 56px',
      }}>
        {/* Background gradients */}
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 2 }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
          }}>
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.02em' }}>FlowForge</span>
        </motion.div>

        {/* Main copy */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2, maxWidth: 420 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(96,165,250,0.25)',
            borderRadius: 'var(--radius-full)', padding: '4px 12px',
            marginBottom: 20, width: 'fit-content',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em' }}>SYSTEMS OPERATIONAL</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800,
            color: '#F1F5F9', letterSpacing: '-0.03em', lineHeight: 1.15,
            margin: '0 0 16px',
          }}>
            Automate anything.<br />
            <span style={{ color: '#60A5FA' }}>Ship faster.</span>
          </h1>

          <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, margin: '0 0 40px' }}>
            Build powerful multi-step automations with a visual drag-and-drop editor. No code required.
          </p>

          {/* Feature stats */}
          <div style={{ display: 'flex', gap: 28, marginBottom: 48 }}>
            {[
              { icon: <GitBranch size={14} />, label: '12 Node Types' },
              { icon: <Play size={14} />, label: 'Real-time Execution' },
              { icon: <Activity size={14} />, label: 'Live Monitoring' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: 12, fontWeight: 500 }}>
                <span style={{ color: '#3B82F6' }}>{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>

          {/* Node preview */}
          <NodePreview />
        </motion.div>

        {/* Bottom quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}
        >
          <p style={{ fontSize: 12, color: '#334155', margin: 0 }}>
            Trusted by engineers building production-grade automation pipelines.
          </p>
        </motion.div>
      </div>

      {/* ── Right — Form panel ──────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 56px',
        background: '#fff',
        overflowY: 'auto',
      }}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', margin: '0 0 6px' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              Sign in to your workspace to continue
            </p>
          </div>

          {/* Error */}
          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: 20, padding: '11px 14px',
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 'var(--radius-md)',
                fontSize: 13, color: '#B91C1C', fontWeight: 500,
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}
            >
              <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
              {displayError}
            </motion.div>
          )}

          {/* Google SSO */}
          <div style={{ marginBottom: 20 }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setGoogleError('Google sign in failed or was cancelled.')}
              theme="outline" size="large" shape="rectangular"
              text="continue_with" width="400"
            />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
              or with email
            </span>
            <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              icon={<Mail size={15} />}
              {...register('email')}
              error={errors.email?.message}
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={15} />}
                {...register('password')}
                error={errors.password?.message}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <Link href="#" style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 6,
                height: 44, width: '100%',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: isLoading ? '#93C5FD' : 'var(--brand)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-brand)',
                transition: 'all 0.15s',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand-hover)'; }}
              onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand)'; }}
            >
              {isLoading
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="ff-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block' }} /> Signing in...</span>
                : <><span>Sign in to Dashboard</span><ArrowRight size={15} /></>
              }
            </button>
          </form>

          {/* Footer link */}
          <div style={{ marginTop: 28, textAlign: 'center', paddingTop: 24, borderTop: '1px solid #F8FAFC' }}>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
              Don't have an account?{' '}
              <Link href="/register" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>
                Create one free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
