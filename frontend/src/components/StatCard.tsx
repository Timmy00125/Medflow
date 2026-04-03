'use client';

import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  subtitle,
}: StatCardProps) {
  return (
    <div
      className="card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </span>
        <span style={{ color: 'var(--text)', opacity: 0.6 }}>{icon}</span>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '4rem',
          fontWeight: 700,
          lineHeight: 1,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>

      {subtitle && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
