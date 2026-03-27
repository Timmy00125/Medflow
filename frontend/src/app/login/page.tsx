'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getDashboardPath } from '@/context/AuthContext';
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getDashboardPath(user.role));
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        position: 'relative' as const,
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow orbs */}
      <div
        style={{
          position: 'absolute' as const,
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.06) 0%, transparent 70%)',
          top: '-150px',
          right: '-100px',
          pointerEvents: 'none' as const,
        }}
      />
      <div
        style={{
          position: 'absolute' as const,
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.05) 0%, transparent 70%)',
          bottom: '-100px',
          left: '-100px',
          pointerEvents: 'none' as const,
        }}
      />

      <div
        className="glass animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px',
          position: 'relative' as const,
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--accent-dim), var(--accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 20px var(--accent-glow-strong)',
            }}
          >
            <Heart size={24} color="var(--bg-deep)" fill="var(--bg-deep)" />
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            MedFlow
          </h1>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              margin: '6px 0 0',
            }}
          >
            Sign in to your telemedicine dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' as const, gap: '18px' }}>
          {/* Email */}
          <div>
            <label htmlFor="login-email">Email Address</label>
            <div style={{ position: 'relative' as const }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute' as const,
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none' as const,
                }}
              />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' as const }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute' as const,
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none' as const,
                }}
              />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="animate-fade-in-down"
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--error-bg)',
                color: 'var(--error)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                border: '1px solid rgba(248, 113, 113, 0.2)',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !email || !password}
            style={{
              width: '100%',
              marginTop: '4px',
              height: '44px',
              fontSize: '0.9375rem',
            }}
          >
            {submitting ? (
              <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
            ) : (
              <>
                Sign In
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer hint */}
        <p
          style={{
            fontSize: '0.6875rem',
            color: 'var(--text-muted)',
            textAlign: 'center' as const,
            marginTop: '24px',
            lineHeight: 1.6,
          }}
        >
          Don&apos;t have an account? Contact your system administrator.
        </p>
      </div>
    </div>
  );
}
