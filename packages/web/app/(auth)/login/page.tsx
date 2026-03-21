'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Zap, ArrowRight } from 'lucide-react';
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

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isLoading, error: authError } = useAuthStore();
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [hovBtn, setHovBtn] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: LoginFormValues) => {
    setGoogleError(null);
    try { await login(data.email, data.password); router.push('/dashboard'); } catch { /* handled by store */ }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleError(null);
    try {
      if (credentialResponse.credential) { await loginWithGoogle(credentialResponse.credential); router.push('/dashboard'); }
    } catch (err: any) { setGoogleError(err.message || 'Google sign in failed'); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* ── Branding panel ─────────── */}
      <div style={{ width: '50%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden' }}>
        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 360, height: 360, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(124,58,237,0.08)', filter: 'blur(50px)' }} />

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #60A5FA, #2563EB)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(37,99,235,0.4)' }}>
              <Zap size={28} color="#fff" />
            </div>
            <span style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>FlowForge</span>
          </div>
          <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.65, margin: '0 0 40px' }}>
            Welcome back. Let's get your automations flowing.
          </p>

          {/* Status badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '8px 18px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Systems Operational</span>
          </div>
        </motion.div>
      </div>

      {/* ── Login Form panel ───────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', background: '#fff' }}>
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} style={{ width: '100%', maxWidth: 420 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Sign in</h2>
          <p style={{ fontSize: 15, color: '#64748B', margin: '0 0 28px' }}>Enter your details to access your workspace</p>

          {/* Error banner */ }
          {(authError || googleError) && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>
              {authError || googleError}
            </motion.div>
          )}

          {/* Google SSO */}
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setGoogleError('Google sign in failed or was cancelled.')} theme="outline" size="large" shape="rectangular" text="continue_with" width="420" />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Or continue with email</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Input label="Email address" type="email" placeholder="you@example.com" icon={<Mail size={16} />} {...register('email')} error={errors.email?.message} />
            <div>
              <Input label="Password" type="password" placeholder="••••••••" icon={<Lock size={16} />} {...register('password')} error={errors.password?.message} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <Link href="#" style={{ fontSize: 13, fontWeight: 600, color: '#3B82F6', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={() => setHovBtn(true)}
              onMouseLeave={() => setHovBtn(false)}
              style={{ height: 52, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: hovBtn ? '#1D4ED8' : '#2563EB', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 14, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, boxShadow: '0 3px 10px rgba(37,99,235,0.35)', transition: 'background 0.15s', marginTop: 4 }}
            >
              {isLoading ? 'Signing in...' : <><span>Sign in to Dashboard</span><ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Switch to register */}
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              Don't have an account?{' '}
              <Link href="/register" style={{ color: '#3B82F6', fontWeight: 700, textDecoration: 'none' }}>Create one now</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
