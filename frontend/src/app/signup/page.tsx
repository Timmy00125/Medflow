'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getDashboardPath } from '@/context/AuthContext';
import { signupPatient } from '@/lib/api';
import { Heart, User, Mail, Lock, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getDashboardPath(user.role));
    }
  }, [user, isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await signupPatient({ name, email, password });
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

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
      <div
        style={{
          position: 'absolute' as const,
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.06) 0%, transparent 70%)',
          top: '-160px',
          right: '-100px',
          pointerEvents: 'none' as const,
        }}
      />
      <div
        style={{
          position: 'absolute' as const,
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.05) 0%, transparent 70%)',
          bottom: '-120px',
          left: '-100px',
          pointerEvents: 'none' as const,
        }}
      />

      <div
        className="glass animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '430px',
          padding: '40px',
          position: 'relative' as const,
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            marginBottom: '28px',
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
            Create Patient Account
          </h1>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              margin: '6px 0 0',
            }}
          >
            Register to track your consultation and queue status
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
          <div>
            <label htmlFor="signup-name">Full Name</label>
            <div style={{ position: 'relative' as const }}>
              <User
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
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                autoFocus
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-email">Email Address</label>
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
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-password">Password</label>
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
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a secure password"
                required
                minLength={8}
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

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

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !name || !email || !password}
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
                Create Account
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textAlign: 'center' as const,
            marginTop: '22px',
            lineHeight: 1.6,
          }}
        >
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
