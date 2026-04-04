'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Zap, ArrowRight, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';

const registerSchema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Invalid email address'),
  password:        z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const FEATURES = [
  { title: 'Visual workflow builder',      desc: 'Drag-and-drop canvas to build complex multi-step automations.' },
  { title: '12+ integration node types',   desc: 'HTTP, Email, AI/LLM, Database, Slack, webhooks and more.' },
  { title: 'Real-time execution logs',     desc: 'Watch every node run live with Socket.IO streaming.' },
  { title: 'Encrypted credential vault',   desc: 'Store API keys and secrets with AES-256 encryption.' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, loginWithGoogle, isLoading, error: authError } = useAuthStore();
  const [googleError, setGoogleError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setGoogleError(null);
    try { await registerUser(data.name, data.email, data.password); router.push('/dashboard'); } catch { /* handled by store */ }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    setGoogleError(null);
    try {
      if (credentialResponse.credential) {
        await loginWithGoogle(credentialResponse.credential);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setGoogleError(err instanceof Error ? err.message : 'Google sign up failed');
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
        <div style={{ position: 'absolute', top: '5%', right: '-5%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

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
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}>FREE TO GET STARTED</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800,
            color: '#F1F5F9', letterSpacing: '-0.03em', lineHeight: 1.15,
            margin: '0 0 14px',
          }}>
            Build automations<br />
            <span style={{ color: '#60A5FA' }}>in minutes.</span>
          </h1>

          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: '0 0 40px' }}>
            Join engineers and teams who use FlowForge to automate repetitive tasks and connect their stack.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.35 }}
                style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  background: 'rgba(37,99,235,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={11} color="#60A5FA" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3, marginBottom: 2 }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
                    {f.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}
        >
          <p style={{ fontSize: 12, color: '#334155', margin: 0 }}>
            Open-source · Self-hostable · MIT License
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
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', margin: '0 0 6px' }}>
              Create your account
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              Get started with FlowForge — it's free
            </p>
          </div>

          {/* Error */}
          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: 18, padding: '11px 14px',
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
          <div style={{ marginBottom: 18 }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setGoogleError('Google sign in failed or was cancelled.')}
              theme="outline" size="large" shape="rectangular"
              text="signup_with" width="400"
            />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
              or with email
            </span>
            <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Full Name"
              type="text"
              placeholder="Jane Smith"
              icon={<User size={15} />}
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="Work Email"
              type="email"
              placeholder="jane@company.com"
              icon={<Mail size={15} />}
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              icon={<Lock size={15} />}
              {...register('password')}
              error={errors.password?.message}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={15} />}
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 8,
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
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="ff-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block' }} /> Creating account...</span>
                : <><span>Create Account</span><ArrowRight size={15} /></>
              }
            </button>
          </form>

          {/* Terms note */}
          <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center' as const, marginTop: 14, lineHeight: 1.6 }}>
            By creating an account you agree to our{' '}
            <Link href="#" style={{ color: '#64748B', textDecoration: 'underline' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link href="#" style={{ color: '#64748B', textDecoration: 'underline' }}>Privacy Policy</Link>.
          </p>

          {/* Footer link */}
          <div style={{ marginTop: 20, textAlign: 'center', paddingTop: 20, borderTop: '1px solid #F8FAFC' }}>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
