'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Zap, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';

const registerSchema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Invalid email address'),
  password:        z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, loginWithGoogle, isLoading, error: authError } = useAuthStore();
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [hovBtn, setHovBtn] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setGoogleError(null);
    try { await registerUser(data.name, data.email, data.password); router.push('/dashboard'); } catch { /* handled by store */ }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleError(null);
    try {
      if (credentialResponse.credential) { await loginWithGoogle(credentialResponse.credential); router.push('/dashboard'); }
    } catch (err: any) { setGoogleError(err.message || 'Google sign up failed'); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* ── Branding panel ─────────── */}
      <div style={{ width: '50%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', right: '12%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(124,58,237,0.08)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '18%', left: '8%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', filter: 'blur(50px)' }} />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #60A5FA, #2563EB)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(37,99,235,0.4)' }}>
              <Zap size={26} color="#fff" />
            </div>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>FlowForge</span>
          </div>
          <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.65, margin: 0 }}>
            Start automating your workflows in minutes. No coding required.
          </p>

          {/* Feature bullets */}
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            {['Visual drag-and-drop workflow builder', 'Connect APIs and services with ease', 'Real-time execution monitoring'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ArrowRight size={11} color="#60A5FA" />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{f}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Register Form panel ───────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', background: '#fff', overflowY: 'auto' }}>
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} style={{ width: '100%', maxWidth: 420 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Create your account</h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px' }}>Get started with FlowForge for free</p>

          {/* Error banner */}
          {(authError || googleError) && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>
              {authError || googleError}
            </motion.div>
          )}

          {/* Google SSO */}
          <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setGoogleError('Google sign in failed or was cancelled.')} theme="outline" size="large" shape="rectangular" text="signup_with" width="420" />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Or sign up with email</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Full Name"        type="text"     placeholder="John Doe"      icon={<User size={16} />} {...register('name')}            error={errors.name?.message} />
            <Input label="Email"            type="email"    placeholder="you@example.com" icon={<Mail size={16} />} {...register('email')}           error={errors.email?.message} />
            <Input label="Password"         type="password" placeholder="••••••••"        icon={<Lock size={16} />} {...register('password')}        error={errors.password?.message} />
            <Input label="Confirm Password" type="password" placeholder="••••••••"        icon={<Lock size={16} />} {...register('confirmPassword')} error={errors.confirmPassword?.message} />

            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={() => setHovBtn(true)}
              onMouseLeave={() => setHovBtn(false)}
              style={{ height: 52, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: hovBtn ? '#1D4ED8' : '#2563EB', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 14, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, boxShadow: '0 3px 10px rgba(37,99,235,0.35)', transition: 'background 0.15s', marginTop: 6 }}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Switch to login */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#3B82F6', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
