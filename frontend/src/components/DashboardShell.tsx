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

      {/* Main content area — offset by sidebar width */}
      <main
        style={{
          flex: 1,
          marginLeft: '240px',
          minHeight: '100vh',
          position: 'relative' as const,
          zIndex: 1,
        }}
      >
        {/* Header bar */}
        <header
          style={{
            position: 'sticky' as const,
            top: 0,
            zIndex: 20,
            padding: '16px 32px',
            background: 'rgba(6, 10, 20, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
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
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  margin: '2px 0 0',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* WebSocket status indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.6875rem',
                color: isConnected ? 'var(--success)' : 'var(--text-muted)',
                fontWeight: 500,
              }}
              title={isConnected ? 'Real-time connected' : 'WebSocket disconnected'}
            >
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>

            {headerActions}
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding: '24px 32px', maxWidth: '1400px' }}>
          {children}
        </div>
      </main>

      {/* Responsive override for mobile */}
      <style>{`
        @media (max-width: 768px) {
          main { margin-left: 0 !important; }
          header { padding: 16px !important; padding-left: 52px !important; }
          main > div:last-child { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}
