'use client';

import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export default function DashboardShell({
  children,
  title,
  subtitle,
  headerActions,
}: DashboardShellProps) {
  const { user } = useAuth();
  const { isConnected } = useSocket();

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <main
        style={{
          flex: 1,
          marginLeft: '220px',
          minHeight: '100vh',
          background: 'var(--bg)',
        }}
      >
        <header
          style={{
            position: 'sticky' as const,
            top: 0,
            zIndex: 20,
            padding: '16px 24px',
            background: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text)',
                margin: 0,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.625rem',
                  color: 'var(--text-muted)',
                  margin: '4px 0 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.625rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isConnected ? 'var(--text)' : 'var(--text-muted)',
              }}
              title={isConnected ? 'Real-time connected' : 'WebSocket disconnected'}
            >
              <span
                className={`status-dot ${!isConnected ? 'offline' : ''}`}
              />
              {isConnected ? 'Live' : 'Offline'}
            </div>

            {headerActions}
          </div>
        </header>

        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          main {
            margin-left: 0 !important;
          }
          header {
            padding: 16px !important;
            padding-left: 52px !important;
          }
        }
      `}</style>
    </div>
  );
}
