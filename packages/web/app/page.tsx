'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Play, Layers, BarChart3, ShieldCheck, Globe, ArrowRight, Github } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('flowforge-token') : null;
    setIsLoggedIn(!!token);
  }, []);

  const features = [
    { icon: <Layers size={22} />, title: "Visual Editor", desc: "Build complex DAG workflows with a performant React Flow canvas." },
    { icon: <Zap size={22} />, title: "Real-time Engine", desc: "Execute multi-node pipelines with live log streaming via Socket.IO." },
    { icon: <BarChart3 size={22} />, title: "History & Replay", desc: "Deep forensic visual replays of every past execution." },
    { icon: <ShieldCheck size={22} />, title: "Secure Vault", desc: "AES-256 encrypted storage for your sensitive API keys." },
    { icon: <Globe size={22} />, title: "Webhook Triggers", desc: "Unique HTTP endpoints to trigger flows from any external app." },
    { icon: <Play size={22} />, title: "Cron Scheduling", desc: "Native recurring task scheduling with BullMQ & Redis." },
  ];

  return (
    <div style={{ background: '#0F172A', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      {/* Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} fill="white" color="white" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>FlowForge</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="#" style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8', textDecoration: 'none' }}>Docs</a>
          <a href="https://github.com" style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Github size={16} /> GitHub
          </a>
          {isLoggedIn ? (
            <button onClick={() => router.push('/dashboard')} style={{ background: '#3B82F6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Dashboard
            </button>
          ) : (
            <button onClick={() => router.push('/login')} style={{ background: 'transparent', color: '#fff', border: '1px solid #334155', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ maxWidth: 1200, margin: '80px auto 0', padding: '0 40px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#3B82F6', background: 'rgba(59,130,246,0.1)', padding: '6px 16px', borderRadius: 100, marginBottom: 24, display: 'inline-block' }}>
            Production Ready v1.0
          </span>
          <h1 style={{ fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 24px' }}>
            Automate your <span style={{ background: 'linear-gradient(to right, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>work-life balance</span>
          </h1>
          <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Build, ship, and scale complex internal automations without writing a single line of boilerplate. The open-source powerhouse for visual workflows.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <button onClick={() => router.push(isLoggedIn ? '/dashboard' : '/register')} style={{ background: '#3B82F6', color: '#fff', border: 'none', padding: '16px 32px', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 25px -5px rgba(59,130,246,0.4)' }}>
              Get Started for Free <ArrowRight size={18} />
            </button>
            {!isLoggedIn && (
              <button onClick={() => router.push('/login')} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 32px', borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
                View Demo
              </button>
            )}
          </div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
          style={{ marginTop: 80, position: 'relative', borderRadius: '24px 24px 0 0', overflow: 'hidden', border: '1px solid #334155', background: '#020617', padding: 20 }}>
          <div style={{ height: 400, width: '100%', background: 'linear-gradient(to bottom, #1E293B, #020617)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#334155', textAlign: 'center' }}>
              <Layers size={48} strokeWidth={1} style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 14, fontWeight: 500 }}>Interactive Flow Editor Preview</p>
            </div>
          </div>
          {/* Decorative glow */}
          <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '40%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: -1 }} />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section style={{ maxWidth: 1200, margin: '140px auto', padding: '0 40px' }}>
        <div style={{ textAlign: 'left', marginBottom: 60 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Engineered for Reliability.</h2>
          <p style={{ fontSize: 16, color: '#94A3B8', maxWidth: 500 }}>Everything you need to build mission-critical automations with confidence.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
          {features.map((f, i) => (
            <motion.div key={i} whileHover={{ y: -5 }} style={{ padding: 32, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section style={{ maxWidth: 1000, margin: '0 auto 100px', padding: '80px 40px', borderRadius: 32, background: 'linear-gradient(135deg, #1D4ED8 0%, #7E22CE 100%)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 40, fontWeight: 900, marginBottom: 20 }}>Ready to Forge?</h2>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
          Join early adopters and start building your next automation in minutes. Open source, self-hosted, and free forever.
        </p>
        <button onClick={() => router.push('/register')} style={{ background: '#fff', color: '#1D4ED8', border: 'none', padding: '18px 40px', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}>
          Create Your First Workflow
        </button>
      </section>

      {/* Simple Footer */}
      <footer style={{ borderTop: '1px solid #1E293B', padding: '40px 0', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
        <p>© 2026 FlowForge Technologies Inc. Built with ❤️ for Automators.</p>
      </footer>
    </div>
  );
}
